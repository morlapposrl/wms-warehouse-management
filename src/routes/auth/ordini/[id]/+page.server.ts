import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
  try {
    const ordine_id = parseInt(params.id);
    const committente_id = parseInt(url.searchParams.get('committente') || '1');
    
    if (!ordine_id) {
      throw error(400, 'ID ordine non valido');
    }

    // Carica ordine principale
    const ordine = db.prepare(`
      SELECT 
        o.id,
        o.committente_id,
        o.numero_ordine,
        o.tipo_ordine,
        o.stato,
        o.data_ordine,
        o.data_richiesta,
        o.data_spedizione,
        o.cliente_fornitore,
        o.indirizzo_destinazione,
        o.contatti_destinazione,
        o.corriere,
        o.tracking_number,
        o.note_spedizione,
        o.totale_colli,
        o.totale_peso_kg,
        o.totale_valore,
        o.created_at,
        o.updated_at,
        c.ragione_sociale as committente_nome,
        c.codice as committente_codice
      FROM ordini o
      JOIN committenti c ON o.committente_id = c.id
      WHERE o.id = ? AND o.committente_id = ?
    `).get(ordine_id, committente_id);

    if (!ordine) {
      throw error(404, 'Ordine non trovato');
    }

    // Carica righe ordine
    const righe = db.prepare(`
      SELECT 
        od.id,
        od.prodotto_id,
        od.quantita_ordinata,
        od.quantita_evasa,
        od.prezzo_unitario,
        od.note_riga,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria,
        um.descrizione as unita_misura,
        (od.quantita_ordinata * od.prezzo_unitario) as subtotale
      FROM ordini_dettaglio_new od
      JOIN prodotti p ON od.prodotto_id = p.id
      LEFT JOIN categorie c ON p.categoria_id = c.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE od.ordine_id = ?
      ORDER BY od.id
    `).all(ordine_id);

    // Carica storico cambi stato
    const tracking = db.prepare(`
      SELECT 
        stato_precedente,
        stato_nuovo,
        note,
        data_cambio
      FROM ordini_tracking
      WHERE ordine_id = ?
      ORDER BY data_cambio DESC
    `).all(ordine_id);

    // Stati disponibili per le transizioni
    const stati_disponibili = ['NUOVO', 'CONFERMATO', 'IN_PREPARAZIONE', 'PRONTO', 'SPEDITO', 'CONSEGNATO', 'ANNULLATO', 'RESO'];
    
    // Corrieri disponibili
    const corrieri_disponibili = ['DHL', 'UPS', 'FedEx', 'BRT', 'GLS', 'SDA', 'TNT', 'Bartolini'];

    // Carica movimenti di magazzino collegati ai prodotti dell'ordine
    const movimenti = db.prepare(`
      SELECT DISTINCT
        m.id,
        m.tipo_movimento,
        m.quantita,
        m.prezzo,
        m.numero_documento,
        m.data_documento,
        m.causale,
        m.operatore,
        m.note,
        m.data_movimento,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        f.ragione_sociale as fornitore_nome,
        -- Determina se è collegato all'ordine tramite prodotto e timeframe
        CASE 
          WHEN m.data_movimento >= date(o.data_ordine, '-1 day') 
               AND m.data_movimento <= date(COALESCE(o.data_spedizione, 'now'), '+1 day')
               AND od.prodotto_id = m.prodotto_id
          THEN 1 
          ELSE 0 
        END as collegato_ordine
      FROM movimenti m
      JOIN prodotti p ON m.prodotto_id = p.id
      LEFT JOIN fornitori f ON m.fornitore_id = f.id
      JOIN ordini_dettaglio_new od ON od.prodotto_id = m.prodotto_id
      JOIN ordini o ON od.ordine_id = o.id
      WHERE od.ordine_id = ? 
        AND m.committente_id_origine = ?
        AND m.data_movimento >= date(?, '-7 days')  -- Movimenti 7 giorni prima ordine
        AND m.data_movimento <= date('now', '+1 day')
      ORDER BY m.data_movimento DESC, m.id DESC
    `).all(ordine_id, committente_id, ordine.data_ordine || ordine.created_at);

    // Statistiche movimenti
    const movimenti_stats = {
      totale_movimenti: movimenti.length,
      movimenti_collegati: movimenti.filter(m => m.collegato_ordine).length,
      carichi: movimenti.filter(m => m.tipo_movimento === 'CARICO').length,
      scarichi: movimenti.filter(m => m.tipo_movimento === 'SCARICO').length,
      rettifiche: movimenti.filter(m => m.tipo_movimento.includes('RETTIFICA')).length
    };

    return {
      ordine,
      righe,
      tracking,
      movimenti,
      movimenti_stats,
      stati_disponibili,
      corrieri_disponibili
    };
    
  } catch (err) {
    console.error('Errore caricamento dettaglio ordine:', err);
    throw error(500, 'Errore nel caricamento del dettaglio ordine');
  }
};

export const actions: Actions = {
  // Azione per aggiornare lo stato dell'ordine
  updateStatus: async ({ request, params, url }) => {
    try {
      const formData = await request.formData();
      const ordine_id = parseInt(params.id);
      const committente_id = parseInt(url.searchParams.get('committente') || '1');
      
      const nuovo_stato = formData.get('stato')?.toString() || '';
      const note = formData.get('note')?.toString() || '';
      const corriere = formData.get('corriere')?.toString() || null;
      const tracking_number = formData.get('tracking_number')?.toString() || null;
      
      if (!nuovo_stato) {
        return fail(400, {
          error: 'Stato obbligatorio'
        });
      }

      // Ottieni stato attuale
      const ordine = db.prepare('SELECT stato FROM ordini WHERE id = ? AND committente_id = ?')
        .get(ordine_id, committente_id);
      
      if (!ordine) {
        return fail(404, {
          error: 'Ordine non trovato'
        });
      }

      const stato_precedente = ordine.stato;

      // Inizia transazione
      const transaction = db.transaction(() => {
        // Aggiorna ordine
        let updateQuery = `
          UPDATE ordini 
          SET stato = ?, updated_at = datetime('now')
        `;
        let params: any[] = [nuovo_stato];

        // Se spedito, aggiungi data spedizione, corriere e tracking
        if (nuovo_stato === 'SPEDITO') {
          updateQuery += `, data_spedizione = date('now'), corriere = ?, tracking_number = ?`;
          params.push(corriere, tracking_number);
        }
        
        updateQuery += ` WHERE id = ? AND committente_id = ?`;
        params.push(ordine_id, committente_id);

        db.prepare(updateQuery).run(...params);

        // Inserisci tracking
        db.prepare(`
          INSERT INTO ordini_tracking (
            ordine_id,
            stato_precedente,
            stato_nuovo,
            note
          ) VALUES (?, ?, ?, ?)
        `).run(ordine_id, stato_precedente, nuovo_stato, note || `Stato cambiato da ${stato_precedente} a ${nuovo_stato}`);
      });

      transaction();

      return {
        success: 'Stato ordine aggiornato con successo'
      };

    } catch (err) {
      console.error('Errore aggiornamento stato ordine:', err);
      return fail(500, {
        error: 'Errore nell\'aggiornamento dello stato'
      });
    }
  },

  // Azione per aggiornare le quantità evase
  updateQuantities: async ({ request, params, url }) => {
    try {
      const formData = await request.formData();
      const ordine_id = parseInt(params.id);
      const committente_id = parseInt(url.searchParams.get('committente') || '1');

      // Raccogli quantità dalle righe
      const updates: Array<{
        riga_id: number;
        quantita_evasa: number;
      }> = [];

      let i = 0;
      while (formData.has(`riga_${i}_id`)) {
        const riga_id = parseInt(formData.get(`riga_${i}_id`)?.toString() || '0');
        const quantita_evasa = parseInt(formData.get(`riga_${i}_evasa`)?.toString() || '0');

        if (riga_id) {
          updates.push({
            riga_id,
            quantita_evasa: quantita_evasa || 0
          });
        }
        i++;
      }

      if (updates.length === 0) {
        return fail(400, {
          error: 'Nessuna riga da aggiornare'
        });
      }

      // Inizia transazione
      const transaction = db.transaction(() => {
        for (const update of updates) {
          db.prepare(`
            UPDATE ordini_dettaglio_new
            SET quantita_evasa = ?
            WHERE id = ?
          `).run(update.quantita_evasa, update.riga_id);
        }

        // Aggiorna timestamp ordine
        db.prepare('UPDATE ordini SET updated_at = datetime(\'now\') WHERE id = ?')
          .run(ordine_id);
      });

      transaction();

      return {
        success: 'Quantità evase aggiornate con successo'
      };

    } catch (err) {
      console.error('Errore aggiornamento quantità evase:', err);
      return fail(500, {
        error: 'Errore nell\'aggiornamento delle quantità evase'
      });
    }
  }
};