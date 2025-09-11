import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente = url.searchParams.get('committente');
    
    if (!committente) {
      return json({ error: 'Committente richiesto' }, { status: 400 });
    }
    
    const prodotti = db.prepare(`
      SELECT 
        p.id,
        p.codice,
        p.descrizione,
        p.prezzo_vendita,
        p.scorta_minima,
        p.scorta_massima,
        c.descrizione as categoria_nome,
        um.codice as unita_misura,
        COALESCE(g.quantita, 0) as giacenza_attuale
      FROM prodotti p
      LEFT JOIN categorie c ON p.categoria_id = c.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ?
      ORDER BY p.codice
    `).all(parseInt(committente));
    
    return json(prodotti);
    
  } catch (error) {
    console.error('Errore API prodotti:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};