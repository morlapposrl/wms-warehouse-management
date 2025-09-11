import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

// GET - Lista tutti i fornitori globali
export async function GET() {
  try {
    const query = `SELECT * FROM fornitori ORDER BY ragione_sociale`;
    const fornitori = db.prepare(query).all();
    
    return json({
      success: true,
      data: fornitori
    });
  } catch (error) {
    console.error('Errore nel caricamento fornitori:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento dei fornitori'
    }, { status: 500 });
  }
}

// POST - Crea nuovo fornitore
export async function POST({ request, cookies }) {
  try {
    const data = await request.json();
    
    if (!data.codice || !data.ragione_sociale) {
      return json({
        success: false,
        error: 'Codice e ragione sociale sono obbligatori',
        errors: {
          codice: !data.codice ? ['Inserisci un codice'] : [],
          ragione_sociale: !data.ragione_sociale ? ['Inserisci una ragione sociale'] : []
        }
      }, { status: 400 });
    }

    if (!data.committenti_selezionati || data.committenti_selezionati.length === 0) {
      return json({
        success: false,
        error: 'Seleziona almeno un committente',
        errors: {
          committenti_selezionati: ['Seleziona almeno un committente']
        }
      }, { status: 400 });
    }
    
    const existingQuery = `SELECT id FROM fornitori WHERE codice = ?`;
    const existing = db.prepare(existingQuery).get(data.codice);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice fornitore già esistente',
        errors: { codice: ['Codice già esistente'] }
      }, { status: 400 });
    }
    
    // Usa transazione per inserire fornitore e associazioni
    const transaction = db.transaction(() => {
      // Inserisci fornitore
      const insertQuery = `
        INSERT INTO fornitori (codice, ragione_sociale, partita_iva, indirizzo, telefono, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      const result = db.prepare(insertQuery).run(
        data.codice,
        data.ragione_sociale,
        data.partita_iva || null,
        data.indirizzo || null,
        data.telefono || null,
        data.email || null
      );

      const fornitore_id = result.lastInsertRowid;

      // Inserisci associazioni con committenti
      const insertAssociazione = db.prepare(`
        INSERT INTO committenti_fornitori (committente_id, fornitore_id, attivo)
        VALUES (?, ?, 1)
      `);

      for (const committente_id of data.committenti_selezionati) {
        insertAssociazione.run(committente_id, fornitore_id);
      }

      return fornitore_id;
    });

    const fornitore_id = transaction();
    
    // Recupera il fornitore creato per l'audit
    const nuovoFornitore = db.prepare('SELECT * FROM fornitori WHERE id = ?').get(fornitore_id);
    
    // Log audit per creazione fornitore
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'fornitori',
          operation: 'CREATE',
          description: `Creato fornitore "${nuovoFornitore.ragione_sociale}" (${nuovoFornitore.codice})`,
          module: 'FORNITORI',
          functionality: 'create_fornitore',
          importance: 'MEDIA',
          entities_involved: { 
            fornitore_id: fornitore_id,
            codice: nuovoFornitore.codice,
            ragione_sociale: nuovoFornitore.ragione_sociale
          },
          data_before: null,
          data_after: nuovoFornitore
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({
      success: true,
      data: { id: fornitore_id }
    });
  } catch (error) {
    console.error('Errore nella creazione fornitore:', error);
    return json({
      success: false,
      error: 'Errore nella creazione del fornitore'
    }, { status: 500 });
  }
}