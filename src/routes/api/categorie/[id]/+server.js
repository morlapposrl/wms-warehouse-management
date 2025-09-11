import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

// PUT - Aggiorna categoria
export async function PUT({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // Recupera dati BEFORE per audit
    const categoriaEsistente = db.prepare('SELECT * FROM categorie WHERE id = ?').get(id);
    
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
    
    // Verifica che il codice non esista già per lo stesso committente (escludendo la categoria corrente)
    if (data.codice && data.committente_id) {
      const existingQuery = `
        SELECT id FROM categorie 
        WHERE committente_id = ? AND codice = ? AND id != ?
      `;
      const existing = db.prepare(existingQuery).get(data.committente_id, data.codice, id);
      
      if (existing) {
        return json({
          success: false,
          error: 'Codice categoria già esistente per questo committente',
          errors: {
            codice: ['Codice già esistente per questo committente']
          }
        }, { status: 400 });
      }
    }
    
    // Aggiornamento
    const updateQuery = `
      UPDATE categorie 
      SET codice = ?, descrizione = ?, attiva = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    const result = db.prepare(updateQuery).run(
      data.codice,
      data.descrizione,
      data.attiva ? 1 : 0,
      id
    );
    
    if (result.changes === 0) {
      return json({
        success: false,
        error: 'Categoria non trovata'
      }, { status: 404 });
    }
    
    // Recupera dati AFTER per audit
    const categoriaAggiornata = db.prepare('SELECT * FROM categorie WHERE id = ?').get(id);
    
    // Log audit per modifica categoria
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'categorie',
          operation: 'UPDATE',
          description: `Modificata categoria "${categoriaAggiornata.descrizione}" (${categoriaAggiornata.codice})`,
          module: 'CATEGORIE',
          functionality: 'update_categoria',
          importance: 'MEDIA',
          entities_involved: { 
            categoria_id: categoriaAggiornata.id,
            codice: categoriaAggiornata.codice,
            descrizione: categoriaAggiornata.descrizione,
            committente_id: categoriaAggiornata.committente_id
          },
          data_before: categoriaEsistente,
          data_after: categoriaAggiornata
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento categoria:', error);
    return json({
      success: false,
      error: 'Errore nell\'aggiornamento della categoria'
    }, { status: 500 });
  }
}

// DELETE - Elimina categoria
export async function DELETE({ params }) {
  try {
    const id = parseInt(params.id);
    
    // Verifica se la categoria è utilizzata in prodotti
    const usageQuery = `
      SELECT COUNT(*) as count FROM prodotti 
      WHERE categoria_id = ?
    `;
    const usage = db.prepare(usageQuery).get(id);
    
    if (usage.count > 0) {
      return json({
        success: false,
        error: `Impossibile eliminare la categoria: è utilizzata da ${usage.count} prodott${usage.count === 1 ? 'o' : 'i'}`
      }, { status: 400 });
    }
    
    // Eliminazione
    const deleteQuery = `
      DELETE FROM categorie WHERE id = ?
    `;
    
    const result = db.prepare(deleteQuery).run(id);
    
    if (result.changes === 0) {
      return json({
        success: false,
        error: 'Categoria non trovata'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione categoria:', error);
    return json({
      success: false,
      error: 'Errore nell\'eliminazione della categoria'
    }, { status: 500 });
  }
}