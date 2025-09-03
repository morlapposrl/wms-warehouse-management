import { json } from '@sveltejs/kit';
import database from '$lib/server/database';

export async function GET() {
  try {
    const prodotti = database.prepare(`
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
        COALESCE(g.quantita * p.prezzo_acquisto, 0) as valore_giacenza
      FROM prodotti p
      LEFT JOIN categorie c ON p.categoria_id = c.id AND p.committente_id = c.committente_id
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND p.committente_id = g.committente_id
      WHERE p.attivo = 1
      ORDER BY p.committente_id, p.codice
    `).all();
    
    return json(prodotti);
  } catch (error) {
    console.error('Errore API prodotti globali:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
}