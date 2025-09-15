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

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validazione dati richiesti
    if (!data.codice || !data.descrizione || !data.committente_id || !data.categoria_id || !data.unita_misura_id) {
      return json({ error: 'Codice, descrizione, committente, categoria e unità di misura sono obbligatori' }, { status: 400 });
    }
    
    // Verifica se il codice esiste già per questo committente
    const existing = db.prepare(`
      SELECT id FROM prodotti 
      WHERE codice = ? AND committente_id = ?
    `).get(data.codice, data.committente_id);
    
    if (existing) {
      return json({ error: 'Codice prodotto già esistente per questo committente' }, { status: 400 });
    }
    
    // Inserisci il nuovo prodotto
    const result = db.prepare(`
      INSERT INTO prodotti (
        committente_id, codice, descrizione, categoria_id, 
        unita_misura_id, prezzo_vendita, scorta_minima, scorta_massima,
        attivo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      data.committente_id,
      data.codice,
      data.descrizione,
      data.categoria_id,
      data.unita_misura_id,
      data.prezzo_vendita || 0,
      data.scorta_minima || 0,
      data.scorta_massima || 0
    );
    
    return json({ success: true, id: result.lastInsertRowid });
    
  } catch (error) {
    console.error('Errore creazione prodotto:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};