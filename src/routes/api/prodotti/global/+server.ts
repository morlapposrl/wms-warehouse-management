import { json } from '@sveltejs/kit';
import database from '$lib/server/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente_id = url.searchParams.get('committente');
    
    // Costruisci la query base
    let query = `
      SELECT 
        p.id,
        p.committente_id,
        p.codice,
        p.descrizione,
        COALESCE(c.descrizione, 'Senza categoria') as categoria_descrizione,
        p.prezzo_acquisto,
        p.prezzo_vendita,
        p.scorta_minima,
        p.scorta_massima,
        p.ubicazione,
        p.attivo,
        COALESCE(g.quantita, 0) as giacenza_attuale,
        COALESCE(g.quantita * p.prezzo_acquisto, 0) as valore_giacenza,
        -- Info committente per vista globale
        comm.ragione_sociale as committente_nome,
        comm.codice as committente_codice
      FROM prodotti p
      LEFT JOIN categorie c ON p.categoria_id = c.id AND p.committente_id = c.committente_id
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND p.committente_id = g.committente_id
      JOIN committenti comm ON p.committente_id = comm.id
      WHERE p.attivo = 1
    `;
    
    let params = [];
    
    // Aggiungi filtro committente se specificato
    if (committente_id && committente_id !== '') {
      query += ` AND p.committente_id = ?`;
      params.push(parseInt(committente_id));
    }
    
    query += ` ORDER BY comm.ragione_sociale, p.codice`;
    
    const prodotti = database.prepare(query).all(...params);
    
    return json(prodotti);
  } catch (error) {
    console.error('Errore API prodotti globali:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
}