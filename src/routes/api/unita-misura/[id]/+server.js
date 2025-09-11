import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

// PUT - Aggiorna unità di misura
export async function PUT({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
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
    
    // Recupera i dati esistenti per audit
    const dataEsistente = db.prepare('SELECT * FROM unita_misura WHERE id = ?').get(id);
    if (!dataEsistente) {
      return json({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }
    
    // Verifica che il codice non esista già (escludendo l'unità corrente)
    const existingQuery = `
      SELECT id FROM unita_misura 
      WHERE codice = ? AND (committente_id = ? OR (committente_id IS NULL AND ? IS NULL)) AND id != ?
    `;
    const existing = db.prepare(existingQuery).get(
      data.codice, 
      data.committente_id || null, 
      data.committente_id || null, 
      id
    );
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice unità di misura già esistente',
        errors: {
          codice: ['Codice già esistente']
        }
      }, { status: 400 });
    }
    
    // Aggiornamento
    const updateQuery = `
      UPDATE unita_misura 
      SET codice = ?, descrizione = ?, tipo = ?, attiva = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    const result = db.prepare(updateQuery).run(
      data.codice,
      data.descrizione,
      data.tipo || 'personalizzata',
      data.attiva ? 1 : 0,
      id
    );
    
    if (result.changes === 0) {
      return json({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }
    
    // Recupera i dati aggiornati per audit
    const dataAggiornata = db.prepare('SELECT * FROM unita_misura WHERE id = ?').get(id);
    
    // Log audit per aggiornamento unità di misura
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'unita_misura',
          operation: 'UPDATE',
          description: `Aggiornata unità di misura "${dataAggiornata.descrizione}" (${dataAggiornata.codice})`,
          module: 'UNITA_MISURA',
          functionality: 'update_unita_misura',
          importance: 'MEDIA',
          entities_involved: { 
            unita_misura_id: dataAggiornata.id,
            codice: dataAggiornata.codice,
            descrizione: dataAggiornata.descrizione,
            tipo: dataAggiornata.tipo,
            committente_id: dataAggiornata.committente_id
          },
          data_before: dataEsistente,
          data_after: dataAggiornata
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
    console.error('Errore nell\'aggiornamento unità di misura:', error);
    return json({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'unità di misura'
    }, { status: 500 });
  }
}

// DELETE - Elimina unità di misura
export async function DELETE({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
    
    // Recupera i dati esistenti per audit
    const dataEsistente = db.prepare('SELECT * FROM unita_misura WHERE id = ?').get(id);
    if (!dataEsistente) {
      return json({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }
    
    // Verifica se l'unità è utilizzata in prodotti
    const usageQuery = `
      SELECT COUNT(*) as count FROM prodotti 
      WHERE unita_misura_id = ?
    `;
    const usage = db.prepare(usageQuery).get(id);
    
    if (usage.count > 0) {
      return json({
        success: false,
        error: `Impossibile eliminare l'unità di misura: è utilizzata da ${usage.count} prodott${usage.count === 1 ? 'o' : 'i'}`
      }, { status: 400 });
    }
    
    // Eliminazione
    const deleteQuery = `
      DELETE FROM unita_misura WHERE id = ?
    `;
    
    const result = db.prepare(deleteQuery).run(id);
    
    if (result.changes === 0) {
      return json({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }
    
    // Log audit per eliminazione unità di misura
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'unita_misura',
          operation: 'DELETE',
          description: `Eliminata unità di misura "${dataEsistente.descrizione}" (${dataEsistente.codice})`,
          module: 'UNITA_MISURA',
          functionality: 'delete_unita_misura',
          importance: 'ALTA',
          entities_involved: { 
            unita_misura_id: dataEsistente.id,
            codice: dataEsistente.codice,
            descrizione: dataEsistente.descrizione,
            tipo: dataEsistente.tipo,
            committente_id: dataEsistente.committente_id
          },
          data_before: dataEsistente,
          data_after: null
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
    console.error('Errore nell\'eliminazione unità di misura:', error);
    return json({
      success: false,
      error: 'Errore nell\'eliminazione dell\'unità di misura'
    }, { status: 500 });
  }
}