import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();
    
    console.log('🔧 COMPATIBILITY UPDATE - Categoria sicurezza ricevuta:', data.categoria_sicurezza);
    console.log('🔧 COMPATIBILITY UPDATE - Richiede temperatura:', data.richiede_temperatura_controllata);
    console.log('🔧 COMPATIBILITY UPDATE - Peso unitario:', data.peso_unitario_kg);
    
    // Validazione dati richiesti
    if (!data.codice || !data.descrizione || !data.committente_id || !data.categoria_id || !data.unita_misura_id) {
      return json({ error: 'Codice, descrizione, committente, categoria e unità di misura sono obbligatori' }, { status: 400 });
    }
    
    // Verifica se il prodotto esiste
    const existing = db.prepare(`
      SELECT id FROM prodotti 
      WHERE id = ?
    `).get(id);
    
    if (!existing) {
      return json({ error: 'Prodotto non trovato' }, { status: 404 });
    }
    
    // Verifica se il codice esiste già per questo committente (escludendo il prodotto corrente)
    const duplicate = db.prepare(`
      SELECT id FROM prodotti 
      WHERE codice = ? AND committente_id = ? AND id != ?
    `).get(data.codice, data.committente_id, id);
    
    if (duplicate) {
      return json({ error: 'Codice prodotto già esistente per questo committente' }, { status: 400 });
    }
    
    // Aggiorna il prodotto
    db.prepare(`
      UPDATE prodotti SET
        codice = ?,
        descrizione = ?,
        categoria_id = ?,
        unita_misura_id = ?,
        prezzo_vendita = ?,
        scorta_minima = ?,
        scorta_massima = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.codice,
      data.descrizione,
      data.categoria_id,
      data.unita_misura_id,
      data.prezzo_vendita || 0,
      data.scorta_minima || 0,
      data.scorta_massima || 0,
      id
    );
    
    return json({ success: true });
    
  } catch (error) {
    console.error('Errore aggiornamento prodotto:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    
    // Verifica se il prodotto esiste
    const existing = db.prepare(`
      SELECT id FROM prodotti 
      WHERE id = ?
    `).get(id);
    
    if (!existing) {
      return json({ error: 'Prodotto non trovato' }, { status: 404 });
    }
    
    // Verifica se ci sono giacenze associate
    const giacenze = db.prepare(`
      SELECT COUNT(*) as count FROM giacenze 
      WHERE prodotto_id = ?
    `).get(id);
    
    if (giacenze.count > 0) {
      return json({ error: 'Impossibile eliminare il prodotto: esistono giacenze associate' }, { status: 400 });
    }
    
    // Elimina il prodotto
    db.prepare(`
      DELETE FROM prodotti WHERE id = ?
    `).run(id);
    
    return json({ success: true });
    
  } catch (error) {
    console.error('Errore eliminazione prodotto:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};