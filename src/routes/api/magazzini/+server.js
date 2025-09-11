import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

// GET - Lista tutti i magazzini
export async function GET() {
  try {
    const query = `SELECT * FROM magazzini ORDER BY nome`;
    const magazzini = db.prepare(query).all();
    
    return json({
      success: true,
      data: magazzini
    });
  } catch (error) {
    console.error('Errore nel caricamento magazzini:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento dei magazzini'
    }, { status: 500 });
  }
}

// POST - Crea nuovo magazzino
export async function POST({ request, cookies }) {
  try {
    const data = await request.json();
    
    if (!data.codice || !data.nome) {
      return json({
        success: false,
        error: 'Codice e nome sono obbligatori',
        errors: {
          codice: !data.codice ? ['Inserisci un codice'] : [],
          nome: !data.nome ? ['Inserisci un nome'] : []
        }
      }, { status: 400 });
    }
    
    if (!data.larghezza_metri || !data.lunghezza_metri || !data.altezza_metri) {
      return json({
        success: false,
        error: 'Dimensioni magazzino obbligatorie',
        errors: {
          larghezza_metri: !data.larghezza_metri ? ['Inserisci la larghezza'] : [],
          lunghezza_metri: !data.lunghezza_metri ? ['Inserisci la lunghezza'] : [],
          altezza_metri: !data.altezza_metri ? ['Inserisci l\'altezza'] : []
        }
      }, { status: 400 });
    }
    
    const existingQuery = `SELECT id FROM magazzini WHERE codice = ?`;
    const existing = db.prepare(existingQuery).get(data.codice);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice magazzino già esistente',
        errors: { codice: ['Codice già esistente'] }
      }, { status: 400 });
    }
    
    const insertQuery = `
      INSERT INTO magazzini (codice, nome, indirizzo, citta, cap, larghezza_metri, lunghezza_metri, altezza_metri, 
                            temperatura_min, temperatura_max, umidita_max, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const result = db.prepare(insertQuery).run(
      data.codice,
      data.nome,
      data.indirizzo || null,
      data.citta || null,
      data.cap || null,
      parseFloat(data.larghezza_metri),
      parseFloat(data.lunghezza_metri),
      parseFloat(data.altezza_metri),
      data.temperatura_min ? parseFloat(data.temperatura_min) : null,
      data.temperatura_max ? parseFloat(data.temperatura_max) : null,
      data.umidita_max ? parseFloat(data.umidita_max) : null
    );
    
    // Recupera il magazzino creato per audit
    const nuovoMagazzino = db.prepare('SELECT * FROM magazzini WHERE id = ?').get(result.lastInsertRowid);
    
    // Log audit per creazione magazzino
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'magazzini',
          operation: 'CREATE',
          description: `Creato magazzino "${nuovoMagazzino.nome}" (${nuovoMagazzino.codice})`,
          module: 'MAGAZZINI',
          functionality: 'create_magazzino',
          importance: 'ALTA',
          entities_involved: { 
            magazzino_id: nuovoMagazzino.id,
            codice: nuovoMagazzino.codice,
            nome: nuovoMagazzino.nome,
            indirizzo: nuovoMagazzino.indirizzo
          },
          data_before: null,
          data_after: nuovoMagazzino
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
    console.error('Errore nella creazione magazzino:', error);
    return json({
      success: false,
      error: 'Errore nella creazione del magazzino'
    }, { status: 500 });
  }
}