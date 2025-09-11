import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

// GET - Lista tutte le categorie globali (per tutte le committenti)
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
    console.error('Errore nel caricamento categorie:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento delle categorie'
    }, { status: 500 });
  }
}

// POST - Crea nuova categoria
export async function POST({ request, cookies }) {
  try {
    const data = await request.json();
    
    // Validazione base
    if (!data.committente_id || !data.codice || !data.descrizione) {
      return json({
        success: false,
        error: 'Committente, codice e descrizione sono obbligatori',
        errors: {
          committente_id: !data.committente_id ? ['Seleziona un committente'] : [],
          codice: !data.codice ? ['Inserisci un codice'] : [],
          descrizione: !data.descrizione ? ['Inserisci una descrizione'] : []
        }
      }, { status: 400 });
    }
    
    // Verifica che il codice non esista già per lo stesso committente
    const existingQuery = `
      SELECT id FROM categorie 
      WHERE committente_id = ? AND codice = ?
    `;
    const existing = db.prepare(existingQuery).get(data.committente_id, data.codice);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice categoria già esistente per questo committente',
        errors: {
          codice: ['Codice già esistente per questo committente']
        }
      }, { status: 400 });
    }
    
    // Inserimento
    const insertQuery = `
      INSERT INTO categorie (committente_id, codice, descrizione, attiva, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const result = db.prepare(insertQuery).run(
      data.committente_id,
      data.codice,
      data.descrizione,
      data.attiva ? 1 : 0
    );
    
    // Recupera la categoria creata per audit
    const nuovaCategoria = db.prepare('SELECT * FROM categorie WHERE id = ?').get(result.lastInsertRowid);
    
    // Log audit per creazione categoria
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'categorie',
          operation: 'CREATE',
          description: `Creata categoria "${nuovaCategoria.descrizione}" (${nuovaCategoria.codice}) per committente ID ${nuovaCategoria.committente_id}`,
          module: 'CATEGORIE',
          functionality: 'create_categoria',
          importance: 'MEDIA',
          entities_involved: { 
            categoria_id: nuovaCategoria.id,
            codice: nuovaCategoria.codice,
            descrizione: nuovaCategoria.descrizione,
            committente_id: nuovaCategoria.committente_id
          },
          data_before: null,
          data_after: nuovaCategoria
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({
      success: true,
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Errore nella creazione categoria:', error);
    return json({
      success: false,
      error: 'Errore nella creazione della categoria'
    }, { status: 500 });
  }
}