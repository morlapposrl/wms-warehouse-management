import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

export async function PUT({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // Recupera i dati esistenti per audit
    const dataEsistente = db.prepare('SELECT * FROM magazzini WHERE id = ?').get(id);
    if (!dataEsistente) {
      return json({
        success: false,
        error: 'Magazzino non trovato'
      }, { status: 404 });
    }
    
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
    
    const existingQuery = `SELECT id FROM magazzini WHERE codice = ? AND id != ?`;
    const existing = db.prepare(existingQuery).get(data.codice, id);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice magazzino già esistente',
        errors: { codice: ['Codice già esistente'] }
      }, { status: 400 });
    }
    
    const updateQuery = `
      UPDATE magazzini 
      SET codice = ?, nome = ?, indirizzo = ?, citta = ?, cap = ?, 
          larghezza_metri = ?, lunghezza_metri = ?, altezza_metri = ?,
          temperatura_min = ?, temperatura_max = ?, umidita_max = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    const result = db.prepare(updateQuery).run(
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
      data.umidita_max ? parseFloat(data.umidita_max) : null,
      id
    );
    
    if (result.changes === 0) {
      return json({ success: false, error: 'Magazzino non trovato' }, { status: 404 });
    }
    
    // Recupera i dati aggiornati per audit
    const dataAggiornata = db.prepare('SELECT * FROM magazzini WHERE id = ?').get(id);
    
    // Log audit per aggiornamento magazzino
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'magazzini',
          operation: 'UPDATE',
          description: `Aggiornato magazzino "${dataAggiornata.nome}" (${dataAggiornata.codice})`,
          module: 'MAGAZZINI',
          functionality: 'update_magazzino',
          importance: 'ALTA',
          entities_involved: { 
            magazzino_id: dataAggiornata.id,
            codice: dataAggiornata.codice,
            nome: dataAggiornata.nome,
            indirizzo: dataAggiornata.indirizzo
          },
          data_before: dataEsistente,
          data_after: dataAggiornata
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({ success: true, data: { id } });
  } catch (error) {
    console.error('Errore nell\'aggiornamento magazzino:', error);
    return json({ success: false, error: 'Errore nell\'aggiornamento del magazzino' }, { status: 500 });
  }
}

export async function DELETE({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
    
    // Recupera i dati esistenti per audit
    const dataEsistente = db.prepare('SELECT * FROM magazzini WHERE id = ?').get(id);
    if (!dataEsistente) {
      return json({
        success: false,
        error: 'Magazzino non trovato'
      }, { status: 404 });
    }
    
    const deleteQuery = `DELETE FROM magazzini WHERE id = ?`;
    const result = db.prepare(deleteQuery).run(id);
    
    if (result.changes === 0) {
      return json({ success: false, error: 'Magazzino non trovato' }, { status: 404 });
    }
    
    // Log audit per eliminazione magazzino
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'magazzini',
          operation: 'DELETE',
          description: `Eliminato magazzino "${dataEsistente.nome}" (${dataEsistente.codice})`,
          module: 'MAGAZZINI',
          functionality: 'delete_magazzino',
          importance: 'ALTA',
          entities_involved: { 
            magazzino_id: dataEsistente.id,
            codice: dataEsistente.codice,
            nome: dataEsistente.nome,
            indirizzo: dataEsistente.indirizzo
          },
          data_before: dataEsistente,
          data_after: null
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({ success: true, data: { id } });
  } catch (error) {
    console.error('Errore nell\'eliminazione magazzino:', error);
    return json({ success: false, error: 'Errore nell\'eliminazione del magazzino' }, { status: 500 });
  }
}