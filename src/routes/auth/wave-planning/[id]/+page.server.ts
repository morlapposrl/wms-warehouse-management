import type { PageServerLoad } from './$types';
import db from '$lib/server/database';
import { wavePlanningRepository } from '$lib/server/repositories/wavePlanningRepository';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const wave_id = parseInt(params.id);
    
    if (isNaN(wave_id)) {
      throw error(400, 'ID wave non valido');
    }

    // Carica dati wave principale
    const wave = wavePlanningRepository.getWaveById(wave_id);
    
    if (!wave) {
      throw error(404, 'Wave non trovata');
    }

    // Carica ordini della wave
    const ordini = wavePlanningRepository.getWaveOrders(wave_id);

    // Carica pick tasks della wave
    const pickTasks = wavePlanningRepository.getPickTasks(wave_id);

    // Statistiche wave
    const statistiche = wavePlanningRepository.getWaveStatistics(wave_id);

    // Dettagli prodotti per i pick tasks
    const prodotti_dettaglio = db.prepare(`
      SELECT DISTINCT
        p.id,
        p.codice,
        p.descrizione,
        COALESCE(um.codice, 'PZ') as unita_misura,
        COUNT(wpt.id) as tasks_count,
        SUM(wpt.quantita_richiesta) as quantita_totale,
        SUM(wpt.quantita_prelevata) as quantita_prelevata
      FROM wave_pick_tasks wpt
      JOIN prodotti p ON wpt.prodotto_id = p.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE wpt.wave_id = ?
      GROUP BY p.id, p.codice, p.descrizione, um.codice
      ORDER BY p.descrizione
    `).all(wave_id);

    // Ubicazioni coinvolte
    const ubicazioni_coinvolte = db.prepare(`
      SELECT DISTINCT
        u.id,
        u.codice_ubicazione,
        u.zona,
        COUNT(wpt.id) as picks_count,
        SUM(wpt.quantita_richiesta) as quantita_totale
      FROM wave_pick_tasks wpt
      JOIN ubicazioni u ON wpt.ubicazione_id = u.id
      WHERE wpt.wave_id = ?
      GROUP BY u.id, u.codice_ubicazione, u.zona
      ORDER BY u.zona, u.codice_ubicazione
    `).all(wave_id);

    // Progress tracking
    const progress = {
      ordini_totali: ordini.length,
      ordini_completati: ordini.filter(o => o.stato === 'COMPLETATO').length,
      picks_totali: pickTasks.length,
      picks_completati: pickTasks.filter(p => p.stato === 'COMPLETATO').length,
      picks_in_corso: pickTasks.filter(p => p.stato === 'IN_CORSO').length,
      picks_errore: pickTasks.filter(p => p.stato === 'ERRORE').length
    };

    // Timeline wave (tracking cambi stato)
    const timeline = db.prepare(`
      SELECT 
        stato_nuovo as stato,
        data_cambio,
        operatore_id,
        u.nome as operatore_nome,
        note
      FROM ordini_tracking ot
      LEFT JOIN utenti u ON ot.operatore_id = u.id
      WHERE ot.ordine_id IN (
        SELECT wo.ordine_id 
        FROM wave_ordini wo 
        WHERE wo.wave_id = ?
      )
      ORDER BY data_cambio DESC
      LIMIT 20
    `).all(wave_id);

    return {
      wave,
      ordini,
      pickTasks,
      statistiche,
      prodotti_dettaglio,
      ubicazioni_coinvolte,
      progress,
      timeline
    };

  } catch (err) {
    console.error('Errore caricamento dettaglio wave:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Errore interno del server');
  }
};