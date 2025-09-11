import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';

const db = new Database('database/magazzino.db');

// GET - Lista tutte le categorie per prodotti con committente
export async function GET() {
  try {
    const query = `
      SELECT 
        c.*,
        co.ragione_sociale as committente_ragione_sociale
      FROM categorie c
      LEFT JOIN committenti co ON c.committente_id = co.id
      ORDER BY co.ragione_sociale, c.descrizione
    `;
    
    const categorie = db.prepare(query).all();
    
    return json({
      success: true,
      data: categorie
    });
  } catch (error) {
    console.error('Errore nel caricamento categorie globali:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento delle categorie'
    }, { status: 500 });
  }
}