import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';

const db = new Database('database/magazzino.db');

// GET - Lista tutte le causali trasferimento
export async function GET() {
  try {
    const query = `SELECT * FROM causali_trasferimento ORDER BY descrizione`;
    const causali = db.prepare(query).all();
    
    return json({
      success: true,
      data: causali
    });
  } catch (error) {
    console.error('Errore nel caricamento causali:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento delle causali'
    }, { status: 500 });
  }
}

// POST - Crea nuova causale
export async function POST({ request }) {
  try {
    const data = await request.json();
    
    if (!data.codice || !data.descrizione || !data.tipo) {
      return json({
        success: false,
        error: 'Codice, descrizione e tipo sono obbligatori',
        errors: {
          codice: !data.codice ? ['Inserisci un codice'] : [],
          descrizione: !data.descrizione ? ['Inserisci una descrizione'] : [],
          tipo: !data.tipo ? ['Seleziona un tipo'] : []
        }
      }, { status: 400 });
    }
    
    const existingQuery = `SELECT id FROM causali_trasferimento WHERE codice = ?`;
    const existing = db.prepare(existingQuery).get(data.codice);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice causale già esistente',
        errors: { codice: ['Codice già esistente'] }
      }, { status: 400 });
    }
    
    const insertQuery = `
      INSERT INTO causali_trasferimento (codice, descrizione, tipo, richiede_autorizzazione, attiva, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    
    const result = db.prepare(insertQuery).run(
      data.codice,
      data.descrizione,
      data.tipo,
      data.richiede_autorizzazione ? 1 : 0,
      data.attiva !== false ? 1 : 0
    );
    
    return json({
      success: true,
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Errore nella creazione causale:', error);
    return json({
      success: false,
      error: 'Errore nella creazione della causale'
    }, { status: 500 });
  }
}