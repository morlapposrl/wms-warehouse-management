import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';

const db = new Database('database/magazzino.db');

// GET - Lista tutte le unità di misura con committente
export async function GET() {
  try {
    const query = `
      SELECT 
        u.*,
        c.ragione_sociale as committente_ragione_sociale
      FROM unita_misura u
      LEFT JOIN committenti c ON u.committente_id = c.id
      ORDER BY u.tipo DESC, c.ragione_sociale NULLS FIRST, u.descrizione
    `;
    
    const unitaMisura = db.prepare(query).all();
    
    return json({
      success: true,
      data: unitaMisura
    });
  } catch (error) {
    console.error('Errore nel caricamento unità di misura globali:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento delle unità di misura'
    }, { status: 500 });
  }
}