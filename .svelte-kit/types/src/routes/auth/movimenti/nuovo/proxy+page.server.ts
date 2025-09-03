// @ts-nocheck
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const MovimentoSchema = z.object({
  committente_id: z.string().min(1, 'Committente richiesto'),
  tipo_movimento: z.string().min(1, 'Tipo movimento richiesto'),
  prodotto_id: z.string().min(1, 'Prodotto richiesto'),
  quantita: z.string().min(1, 'Quantità richiesta'),
  prezzo: z.string().optional(),
  causale: z.string().optional(),
  note: z.string().optional(),
  ordine_numero: z.string().optional(),
  ordine_id: z.string().optional() // ID ordine di riferimento
});

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Carica tutti i committenti attivi
    const committenti = db.prepare(`
      SELECT id, ragione_sociale, codice
      FROM committenti
      WHERE stato = 'attivo'
      ORDER BY ragione_sociale
    `).all();

    // Carica tutti i prodotti per committente selezionato
    let prodotti: any[] = [];
    let ordiniIngresso: any[] = [];
    const committente_id = url.searchParams.get('committente');
    
    if (committente_id) {
      prodotti = db.prepare(`
        SELECT 
          p.id,
          p.codice,
          p.descrizione,
          c.descrizione as categoria_nome,
          um.codice as unita_misura,
          COALESCE(g.quantita, 0) as giacenza_attuale
        FROM prodotti p
        LEFT JOIN categorie c ON p.categoria_id = c.id
        LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
        LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = p.committente_id
        WHERE p.committente_id = ?
        ORDER BY p.codice
      `).all(parseInt(committente_id));

      // Carica ordini di ingresso attivi per il committente (solo NUOVO e IN_PREPARAZIONE)
      ordiniIngresso = db.prepare(`
        SELECT 
          o.id,
          o.numero_ordine,
          o.stato,
          o.data_ordine,
          o.data_richiesta,
          o.cliente_fornitore,
          o.totale_valore,
          o.totale_colli as righe_totali,
          0 as righe_aperte
        FROM ordini o
        WHERE o.committente_id = ?
        AND o.tipo_ordine = 'INBOUND'
        AND o.stato IN ('NUOVO', 'IN_PREPARAZIONE')
        ORDER BY 
          CASE o.stato 
            WHEN 'NUOVO' THEN 1 
            WHEN 'IN_PREPARAZIONE' THEN 2 
          END,
          o.data_ordine DESC, 
          o.numero_ordine
      `).all(parseInt(committente_id));
    }

    return {
      committenti,
      prodotti,
      ordiniIngresso,
      selectedCommittente: committente_id
    };

  } catch (err) {
    console.error('Errore caricamento dati movimento:', err);
    throw error(500, 'Errore nel caricamento dei dati');
  }
};

export const actions = {
  create: async ({ request }: import('./$types').RequestEvent) => {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);

      // Validazione
      const validation = MovimentoSchema.safeParse(data);
      if (!validation.success) {
        return {
          error: true,
          message: validation.error.errors.map(e => e.message).join(', ')
        };
      }

      const {
        committente_id,
        tipo_movimento,
        prodotto_id,
        quantita,
        prezzo,
        causale,
        note,
        ordine_numero,
        ordine_id
      } = validation.data;

      // Conversioni
      const committenteId = parseInt(committente_id);
      const prodottoId = parseInt(prodotto_id);
      const qty = parseInt(quantita);
      const prezzoNum = prezzo ? parseFloat(prezzo) : null;

      // Verifica che il prodotto appartenga al committente
      const prodotto = db.prepare(`
        SELECT id, codice, descrizione
        FROM prodotti
        WHERE id = ? AND committente_id = ?
      `).get(prodottoId, committenteId);

      if (!prodotto) {
        return {
          error: true,
          message: 'Prodotto non trovato o non appartiene al committente selezionato'
        };
      }

      // Inserisci movimento
      const now = new Date().toISOString();
      const ordineIdNum = ordine_id ? parseInt(ordine_id) : null;
      
      const movimento = db.prepare(`
        INSERT INTO movimenti (
          committente_id,
          prodotto_id,
          tipo_movimento,
          quantita,
          prezzo_unitario,
          causale,
          note,
          ordine_numero,
          ordine_id,
          data_movimento,
          operatore_id,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        committenteId,
        prodottoId,
        tipo_movimento,
        qty,
        prezzoNum,
        causale || null,
        note || null,
        ordine_numero || null,
        ordineIdNum,
        now,
        null, // operatore_id - da implementare con auth
        now
      );

      // Aggiorna giacenze
      const isPositive = ['CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE'].includes(tipo_movimento);
      const deltaQuantita = isPositive ? qty : -qty;

      // Verifica se esiste già una giacenza per questo prodotto
      const giacenzaEsistente = db.prepare(`
        SELECT id, quantita
        FROM giacenze
        WHERE prodotto_id = ? AND committente_id = ?
      `).get(prodottoId, committenteId);

      if (giacenzaEsistente) {
        // Aggiorna giacenza esistente
        const nuovaQuantita = giacenzaEsistente.quantita + deltaQuantita;
        db.prepare(`
          UPDATE giacenze
          SET quantita = ?,
              valore_medio = CASE 
                WHEN ? > 0 AND ? > 0 THEN 
                  (COALESCE(valore_medio, 0) * quantita + ? * ?) / ?
                ELSE valore_medio
              END,
              ultima_modifica = ?
          WHERE id = ?
        `).run(
          nuovaQuantita,
          deltaQuantita, prezzoNum || 0, // per calcolo valore medio
          deltaQuantita, prezzoNum || 0,
          nuovaQuantita,
          now,
          giacenzaEsistente.id
        );
      } else {
        // Crea nuova giacenza
        db.prepare(`
          INSERT INTO giacenze (
            committente_id,
            prodotto_id,
            quantita,
            valore_medio,
            ultima_modifica,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          committenteId,
          prodottoId,
          deltaQuantita,
          prezzoNum || 0,
          now,
          now
        );
      }

      // Redirect al movimento globale con filtro committente
      throw redirect(302, `/auth/movimenti?committente=${committenteId}&search=${prodotto.codice}`);

    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        throw err; // Re-throw redirect
      }
      
      console.error('Errore creazione movimento:', err);
      return {
        error: true,
        message: 'Errore nella creazione del movimento'
      };
    }
  }
};;null as any as Actions;