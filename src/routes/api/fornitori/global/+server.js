import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';

const db = new Database('database/magazzino.db');

export async function GET() {
  try {
    // Query per caricare fornitori con i committenti associati
    const query = `
      SELECT DISTINCT
        f.id,
        f.codice,
        f.ragione_sociale,
        f.partita_iva,
        f.indirizzo,
        f.telefono,
        f.email,
        f.created_at,
        f.updated_at,
        COALESCE(GROUP_CONCAT(cf.committente_id), '') as committenti_ids
      FROM fornitori f
      LEFT JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      GROUP BY f.id, f.codice, f.ragione_sociale, f.partita_iva, f.indirizzo, f.telefono, f.email, f.created_at, f.updated_at
      ORDER BY f.ragione_sociale
    `;
    const fornitori = db.prepare(query).all();
    
    return json({
      success: true,
      data: fornitori
    });
  } catch (error) {
    console.error('Errore nel caricamento fornitori globali:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento dei fornitori'
    }, { status: 500 });
  }
}