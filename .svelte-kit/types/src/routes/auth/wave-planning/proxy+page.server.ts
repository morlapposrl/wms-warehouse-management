// @ts-nocheck
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';
import { wavePlanningRepository } from '$lib/server/repositories/wavePlanningRepository';
import { WaveOptimizationService } from '$lib/server/services/waveOptimizationService';
import { fail } from '@sveltejs/kit';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Filtri dalla query string
    const committente_filter = url.searchParams.get('committente') || '';
    const stato_filter = url.searchParams.get('stato') || '';

    // Carica tutte le wave con filtri
    const waves = wavePlanningRepository.getAllWaves(
      committente_filter ? parseInt(committente_filter) : undefined
    );

    // Filtra per stato se specificato
    const filteredWaves = stato_filter 
      ? waves.filter(w => w.stato === stato_filter)
      : waves;

    // Carica committenti per filtro
    const committenti = db.prepare(`
      SELECT id, ragione_sociale, codice 
      FROM committenti 
      WHERE stato = 'attivo'
      ORDER BY ragione_sociale
    `).all();

    // Carica operatori per assegnazione
    const operatori = db.prepare(`
      SELECT id, nome, email 
      FROM utenti 
      WHERE attivo = 1 
      ORDER BY nome
    `).all();

    // Statistiche globali wave
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totale_waves,
        COUNT(CASE WHEN stato = 'PIANIFICATA' THEN 1 END) as pianificate,
        COUNT(CASE WHEN stato = 'IN_CORSO' THEN 1 END) as in_corso,
        COUNT(CASE WHEN stato = 'COMPLETATA' THEN 1 END) as completate,
        COUNT(CASE WHEN stato = 'ANNULLATA' THEN 1 END) as annullate,
        SUM(totale_ordini) as ordini_totali,
        SUM(totale_picks) as picks_totali,
        AVG(tempo_stimato_minuti) as tempo_medio_minuti,
        SUM(distanza_stimata_metri) as distanza_totale_metri
      FROM wave_planning
      ${committente_filter ? 'WHERE (committente_id = ? OR committente_id IS NULL)' : ''}
    `);

    const statistics = committente_filter 
      ? stats.get(parseInt(committente_filter))
      : stats.get();

    // Ordini disponibili per nuove wave (solo quelli pronti)
    const ordiniDisponibili = wavePlanningRepository.getOrdersForWaveCreation({
      committente_id: committente_filter ? parseInt(committente_filter) : undefined,
      priorita_minima: 1,
      stato: ['NUOVO', 'CONFERMATO']
    });

    return {
      waves: filteredWaves,
      committenti,
      operatori,
      statistics,
      ordiniDisponibili,
      filters: {
        committente_filter,
        stato_filter
      }
    };

  } catch (error) {
    console.error('Errore caricamento wave planning:', error);
    throw error;
  }
};

export const actions = {
  createWave: async ({ request, cookies }: import('./$types').RequestEvent) => {
    try {
      const formData = await request.formData();
      
      const committente_id = formData.get('committente_id')?.toString();
      const tipo_wave = formData.get('tipo_wave')?.toString() || 'BATCH_PICKING';
      const max_ordini = parseInt(formData.get('max_ordini')?.toString() || '20');
      const priorita_minima = parseInt(formData.get('priorita_minima')?.toString() || '1');
      const data_da = formData.get('data_da')?.toString();
      const data_a = formData.get('data_a')?.toString();
      const operatore_id = formData.get('operatore_id')?.toString();
      
      // Gestione ordini selezionati manualmente
      const selected_orders = formData.getAll('selected_orders');
      const selected_order_ids = selected_orders
        .map(id => parseInt(id.toString()))
        .filter(id => !isNaN(id));

      // Validazione
      if (!['BATCH_PICKING', 'ZONE_PICKING', 'DISCRETE_PICKING', 'WAVE_PICKING'].includes(tipo_wave)) {
        return fail(400, {
          error: 'Tipo wave non valido'
        });
      }

      // Validazione operatore obbligatorio
      if (!operatore_id) {
        return fail(400, {
          error: 'Operatore obbligatorio per l\'assegnazione della wave'
        });
      }

      // Validazione ordini selezionati (se presenti)
      if (selected_order_ids.length === 0) {
        return fail(400, {
          error: 'Seleziona almeno un ordine per creare la wave'
        });
      }

      // Crea wave ottimizzata con ordini specifici
      const result = await WaveOptimizationService.createOptimizedWave({
        committente_id: committente_id ? parseInt(committente_id) : undefined,
        tipo_wave: tipo_wave as any,
        max_ordini,
        priorita_minima,
        data_da: data_da || undefined,
        data_a: data_a || undefined,
        operatore_id: parseInt(operatore_id),
        selected_order_ids: selected_order_ids.length > 0 ? selected_order_ids : undefined
      });

      // Log audit per creazione wave
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'wave_planning',
          operation: 'CREATE',
          description: `Creata wave ${result.wave_number} con ${result.ordini_selezionati} ordini`,
          module: 'WAVE_PLANNING',
          functionality: 'create_wave',
          importance: 'ALTA',
          entities_involved: { 
            wave_number: result.wave_number,
            wave_id: result.wave_id,
            committente_id: committente_id ? parseInt(committente_id) : undefined,
            operatore_id: parseInt(operatore_id),
            ordini_count: result.ordini_selezionati
          },
          data_after: {
            tipo_wave,
            max_ordini,
            priorita_minima,
            selected_order_ids
          }
        });
      }

      return {
        success: `Wave ${result.wave_number} creata con successo! ${result.ordini_selezionati} ordini inclusi.`
      };

    } catch (error) {
      console.error('Errore creazione wave:', error);
      return fail(500, {
        error: error instanceof Error ? error.message : 'Errore nella creazione della wave'
      });
    }
  },

  updateWaveStatus: async ({ request, cookies }: import('./$types').RequestEvent) => {
    try {
      const formData = await request.formData();
      
      const wave_id = parseInt(formData.get('wave_id')?.toString() || '0');
      const nuovo_stato = formData.get('nuovo_stato')?.toString();

      if (!wave_id || !nuovo_stato) {
        return fail(400, {
          error: 'Dati mancanti per aggiornamento'
        });
      }

      // Recupera dati precedenti per audit
      const oldWave = wavePlanningRepository.getWaveById(wave_id);
      if (!oldWave) {
        return fail(404, { error: 'Wave non trovata' });
      }

      // Determina timestamp in base al nuovo stato
      let data_inizio: string | undefined;
      let data_fine: string | undefined;

      if (nuovo_stato === 'IN_CORSO') {
        data_inizio = new Date().toISOString();
      } else if (nuovo_stato === 'COMPLETATA' || nuovo_stato === 'ANNULLATA') {
        data_fine = new Date().toISOString();
      }

      // Aggiorna stato
      wavePlanningRepository.updateWaveStatus(wave_id, nuovo_stato as any, data_inizio, data_fine);

      // Log audit per aggiornamento wave
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'wave_planning',
          operation: 'UPDATE',
          description: `Aggiornato stato wave ${oldWave.numero_wave}: ${oldWave.stato} → ${nuovo_stato}`,
          module: 'WAVE_PLANNING',
          functionality: 'update_wave_status',
          importance: 'ALTA',
          entities_involved: { 
            wave_id: wave_id,
            wave_number: oldWave.numero_wave
          },
          data_before: {
            stato: oldWave.stato,
            data_inizio: oldWave.data_inizio,
            data_fine: oldWave.data_fine
          },
          data_after: {
            stato: nuovo_stato,
            data_inizio: data_inizio,
            data_fine: data_fine
          }
        });
      }

      return {
        success: `Wave aggiornata a stato: ${nuovo_stato}`
      };

    } catch (error) {
      console.error('Errore aggiornamento wave:', error);
      return fail(500, {
        error: 'Errore nell\'aggiornamento della wave'
      });
    }
  }
};;null as any as Actions;