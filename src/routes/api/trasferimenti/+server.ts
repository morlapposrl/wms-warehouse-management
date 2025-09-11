import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import database from '$lib/server/database';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validazione dati base
    if (!data.prodotto_id || !data.committente_id || !data.causale_id) {
      return json({ error: 'Dati obbligatori mancanti' }, { status: 400 });
    }

    // Inizia transazione
    const transaction = database.transaction(() => {
      // 1. Verifica causale esistente
      const causale = database.prepare(`
        SELECT * FROM causali_trasferimento WHERE id = ?
      `).get(data.causale_id);
      
      if (!causale) {
        throw new Error('Causale non trovata');
      }

      // 2. Verifica giacenza disponibile se trasferimento per quantità
      if (data.tipo_trasferimento === 'QUANTITA') {
        const giacenza = database.prepare(`
          SELECT quantita FROM giacenze 
          WHERE prodotto_id = ? AND committente_id = ?
        `).get(data.prodotto_id, data.committente_id);
        
        if (!giacenza || giacenza.quantita < data.quantita) {
          throw new Error('Giacenza insufficiente');
        }
      }

      // 3. Determina stato trasferimento basato su autorizzazione
      const stato = causale.richiede_autorizzazione ? 'IN_ATTESA_AUTORIZZAZIONE' : 'CONFERMATO';

      // 4. Inserisce record trasferimento
      const trasferimentoId = database.prepare(`
        INSERT INTO movimenti (
          tipo_movimento,
          prodotto_id,
          committente_id,
          quantita,
          causale_id,
          ubicazione_origine,
          ubicazione_destinazione,
          udc_origine_id,
          udc_destinazione_id,
          note,
          stato,
          autorizzazione_richiesta,
          data_movimento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        'TRASFERIMENTO',
        data.prodotto_id,
        data.committente_id,
        data.quantita || null,
        data.causale_id,
        data.udc_origine || null,
        data.ubicazione_destinazione,
        data.udc_origine || null,
        data.udc_destinazione || null,
        data.note || null,
        stato,
        causale.richiede_autorizzazione ? 1 : 0
      ).lastInsertRowid;

      // 5. Se confermato e per quantità, aggiorna giacenze
      if (stato === 'CONFERMATO' && data.tipo_trasferimento === 'QUANTITA') {
        // Decrementa giacenza origine (se specificata ubicazione origine)
        // Incrementa giacenza destinazione
        // TODO: Implementare logica di aggiornamento giacenze basata su ubicazioni
      }

      return {
        id: trasferimentoId,
        stato: stato,
        richiede_autorizzazione: causale.richiede_autorizzazione
      };
    });

    const result = transaction();
    
    return json({
      success: true,
      trasferimento: result,
      message: result.richiede_autorizzazione ? 
        'Trasferimento creato e messo in attesa di autorizzazione' : 
        'Trasferimento eseguito con successo'
    });

  } catch (error) {
    console.error('Errore trasferimento:', error);
    return json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Errore interno del server' 
    }, { status: 500 });
  }
};