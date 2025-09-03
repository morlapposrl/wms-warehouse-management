// @ts-nocheck
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    const committente_id = parseInt(url.searchParams.get('committente') || '1');
    
    // Carica prodotti per il committente
    const prodotti = db.prepare(`
      SELECT
        p.id,
        p.codice,
        p.descrizione,
        p.prezzo_vendita,
        c.descrizione as categoria,
        um.descrizione as unita_misura
      FROM prodotti p
      LEFT JOIN categorie c ON p.categoria_id = c.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE p.committente_id = ? AND p.attivo = 1
      ORDER BY p.descrizione
    `).all(committente_id);

    // Carica fornitori (tutti i fornitori)
    const fornitori = db.prepare(`
      SELECT DISTINCT
        f.id,
        f.ragione_sociale,
        f.email,
        f.telefono
      FROM fornitori f
      ORDER BY f.ragione_sociale
    `).all();

    // Info committente
    const committente = db.prepare(`
      SELECT
        id,
        codice,
        ragione_sociale
      FROM committenti
      WHERE id = ? AND stato = 'attivo'
    `).get(committente_id);

    if (!committente) {
      throw error(404, 'Committente non trovato');
    }

    return {
      committente,
      prodotti,
      fornitori
    };
  } catch (err) {
    console.error('Errore caricamento form ordine:', err);
    throw error(500, 'Errore nel caricamento del form');
  }
};

export const actions = {
  default: async ({ request, url }: import('./$types').RequestEvent) => {
    try {
      const formData = await request.formData();
      const committente_id = parseInt(url.searchParams.get('committente') || '1');
      
      // Dati ordine principale
      const numero_ordine = formData.get('numero_ordine')?.toString() || '';
      const tipo_ordine = formData.get('tipo_ordine')?.toString() || 'OUTBOUND';
      const cliente_fornitore = formData.get('cliente_fornitore')?.toString() || '';
      const data_richiesta = formData.get('data_richiesta')?.toString() || null;
      const indirizzo_destinazione = formData.get('indirizzo_destinazione')?.toString() || '';
      const contatti_destinazione = formData.get('contatti_destinazione')?.toString() || '';
      const note_spedizione = formData.get('note_spedizione')?.toString() || '';

      // Validazioni base
      if (!numero_ordine || !cliente_fornitore) {
        return fail(400, {
          error: 'Numero ordine e cliente/fornitore sono obbligatori'
        });
      }

      // Controlla unicità numero ordine per committente
      const existing = db.prepare(`
        SELECT id FROM ordini 
        WHERE committente_id = ? AND numero_ordine = ?
      `).get(committente_id, numero_ordine);

      if (existing) {
        return fail(400, {
          error: 'Numero ordine già esistente per questo committente'
        });
      }

      // Raccogli righe ordine
      const righe: Array<{
        prodotto_id: number;
        quantita: number;
        prezzo_unitario: number;
        note_riga?: string;
      }> = [];

      let totale_colli = 0;
      let totale_valore = 0;

      // Processa le righe ordine dal form
      let i = 0;
      while (formData.has(`riga_${i}_prodotto_id`)) {
        const prodotto_id = parseInt(formData.get(`riga_${i}_prodotto_id`)?.toString() || '0');
        const quantita = parseInt(formData.get(`riga_${i}_quantita`)?.toString() || '0');
        const prezzo_unitario = parseFloat(formData.get(`riga_${i}_prezzo`)?.toString() || '0');
        const note_riga = formData.get(`riga_${i}_note`)?.toString() || '';

        if (prodotto_id && quantita > 0 && prezzo_unitario >= 0) {
          righe.push({
            prodotto_id,
            quantita,
            prezzo_unitario,
            note_riga: note_riga || undefined
          });

          totale_colli += quantita;
          totale_valore += quantita * prezzo_unitario;
        }
        i++;
      }

      if (righe.length === 0) {
        return fail(400, {
          error: 'Aggiungere almeno una riga ordine'
        });
      }

      // Inizia transazione
      const transaction = db.transaction(() => {
        // Inserisci ordine principale
        const ordineResult = db.prepare(`
          INSERT INTO ordini (
            committente_id,
            numero_ordine,
            tipo_ordine,
            stato,
            data_ordine,
            data_richiesta,
            cliente_fornitore,
            indirizzo_destinazione,
            contatti_destinazione,
            note_spedizione,
            totale_colli,
            totale_valore
          ) VALUES (?, ?, ?, 'NUOVO', date('now'), ?, ?, ?, ?, ?, ?, ?)
        `).run(
          committente_id,
          numero_ordine,
          tipo_ordine,
          data_richiesta,
          cliente_fornitore,
          indirizzo_destinazione,
          contatti_destinazione,
          note_spedizione,
          totale_colli,
          totale_valore
        );

        const ordine_id = ordineResult.lastInsertRowid;

        // Inserisci righe ordine
        const insertRiga = db.prepare(`
          INSERT INTO ordini_dettaglio_new (
            ordine_id,
            prodotto_id,
            quantita_ordinata,
            prezzo_unitario,
            note_riga
          ) VALUES (?, ?, ?, ?, ?)
        `);

        for (const riga of righe) {
          insertRiga.run(
            ordine_id,
            riga.prodotto_id,
            riga.quantita,
            riga.prezzo_unitario,
            riga.note_riga
          );
        }

        // Log operazione
        db.prepare(`
          INSERT INTO ordini_tracking (
            ordine_id,
            stato_precedente,
            stato_nuovo,
            note
          ) VALUES (?, NULL, 'NUOVO', 'Ordine creato')
        `).run(ordine_id);

        return ordine_id;
      });

      const ordine_id = transaction();

      // Redirect alla lista ordini
      throw redirect(302, `/auth/ordini?committente=${committente_id}&success=created`);
      
    } catch (err) {
      console.error('Errore creazione ordine:', err);
      return fail(500, {
        error: 'Errore nella creazione dell\'ordine'
      });
    }
  }
};;null as any as Actions;