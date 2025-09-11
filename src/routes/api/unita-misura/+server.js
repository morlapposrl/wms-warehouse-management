import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

// GET - Lista tutte le unità di misura globali
export async function GET() {
  try {
    const query = `
      SELECT 
        u.*,
        c.ragione_sociale as committente_ragione_sociale
      FROM unita_misura u
      LEFT JOIN committenti c ON u.committente_id = c.id
      ORDER BY u.tipo DESC, c.ragione_sociale, u.descrizione
    `;
    
    const unitaMisura = db.prepare(query).all();
    
    return json({
      success: true,
      data: unitaMisura
    });
  } catch (error) {
    console.error('Errore nel caricamento unità di misura:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento delle unità di misura'
    }, { status: 500 });
  }
}

// POST - Crea nuova unità di misura
export async function POST({ request, cookies }) {
  try {
    const data = await request.json();
    
    // Validazione base
    if (!data.codice || !data.descrizione) {
      return json({
        success: false,
        error: 'Codice e descrizione sono obbligatori',
        errors: {
          codice: !data.codice ? ['Inserisci un codice'] : [],
          descrizione: !data.descrizione ? ['Inserisci una descrizione'] : []
        }
      }, { status: 400 });
    }
    
    // Verifica che il codice non esista già
    const existingQuery = `
      SELECT id FROM unita_misura 
      WHERE codice = ? AND (committente_id = ? OR (committente_id IS NULL AND ? IS NULL))
    `;
    const existing = db.prepare(existingQuery).get(data.codice, data.committente_id || null, data.committente_id || null);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice unità di misura già esistente',
        errors: {
          codice: ['Codice già esistente']
        }
      }, { status: 400 });
    }
    
    // Inserimento
    const insertQuery = `
      INSERT INTO unita_misura (committente_id, codice, descrizione, tipo, attiva, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const result = db.prepare(insertQuery).run(
      data.committente_id || null,
      data.codice,
      data.descrizione,
      data.tipo || 'personalizzata',
      data.attiva ? 1 : 0
    );
    
    // Recupera l'unità di misura creata per audit
    const nuovaUnitaMisura = db.prepare('SELECT * FROM unita_misura WHERE id = ?').get(result.lastInsertRowid);
    
    // Log audit per creazione unità di misura
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'unita_misura',
          operation: 'CREATE',
          description: `Creata unità di misura "${nuovaUnitaMisura.descrizione}" (${nuovaUnitaMisura.codice})`,
          module: 'UNITA_MISURA',
          functionality: 'create_unita_misura',
          importance: 'MEDIA',
          entities_involved: { 
            unita_misura_id: nuovaUnitaMisura.id,
            codice: nuovaUnitaMisura.codice,
            descrizione: nuovaUnitaMisura.descrizione,
            tipo: nuovaUnitaMisura.tipo,
            committente_id: nuovaUnitaMisura.committente_id
          },
          data_before: null,
          data_after: nuovaUnitaMisura
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
    console.error('Errore nella creazione unità di misura:', error);
    return json({
      success: false,
      error: 'Errore nella creazione dell\'unità di misura'
    }, { status: 500 });
  }
}