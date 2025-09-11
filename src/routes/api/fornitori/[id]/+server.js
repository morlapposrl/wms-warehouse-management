import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

export async function PUT({ params, request, cookies }) {
  console.log('🔥 PUT FORNITORE CHIAMATO - ID:', params.id);
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    console.log('🔥 DATI RICEVUTI:', data);
    
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

    // Recupera dati prima della modifica per audit
    const fornitoreEsistente = db.prepare('SELECT * FROM fornitori WHERE id = ?').get(id);
    
    if (!fornitoreEsistente) {
      return json({
        success: false,
        error: 'Fornitore non trovato'
      }, { status: 404 });
    }
    
    const existingQuery = `SELECT id FROM fornitori WHERE codice = ? AND id != ?`;
    const existing = db.prepare(existingQuery).get(data.codice, id);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice fornitore già esistente',
        errors: { codice: ['Codice già esistente'] }
      }, { status: 400 });
    }
    
    // Usa transazione per aggiornare fornitore e associazioni
    const transaction = db.transaction(() => {
      // Aggiorna fornitore
      const updateQuery = `
        UPDATE fornitori 
        SET codice = ?, ragione_sociale = ?, partita_iva = ?, indirizzo = ?, telefono = ?, email = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      const result = db.prepare(updateQuery).run(
        data.codice,
        data.ragione_sociale,
        data.partita_iva || null,
        data.indirizzo || null,
        data.telefono || null,
        data.email || null,
        id
      );

      if (result.changes === 0) {
        throw new Error('Fornitore non trovato');
      }

      // Rimuovi tutte le associazioni esistenti
      db.prepare(`DELETE FROM committenti_fornitori WHERE fornitore_id = ?`).run(id);

      // Inserisci nuove associazioni se presenti
      if (data.committenti_selezionati && data.committenti_selezionati.length > 0) {
        const insertAssociazione = db.prepare(`
          INSERT INTO committenti_fornitori (committente_id, fornitore_id, attivo)
          VALUES (?, ?, 1)
        `);

        for (const committente_id of data.committenti_selezionati) {
          insertAssociazione.run(committente_id, id);
        }
      }

      return id;
    });

    const fornitore_id = transaction();
    
    // Recupera il fornitore aggiornato per l'audit
    const fornitoreAggiornato = db.prepare('SELECT * FROM fornitori WHERE id = ?').get(fornitore_id);
    
    // Log audit per modifica fornitore
    try {
      console.log('🔍 TENTATIVO AUDIT...');
      const tracker = createAuditTrackerForAction(request, cookies);
      console.log('🔍 TRACKER CREATO:', !!tracker);
      if (tracker) {
        console.log('🔍 CHIAMANDO logOperation...');
        await tracker.logOperation({
          table: 'fornitori',
          operation: 'UPDATE',
          description: `Modificato fornitore "${fornitoreAggiornato.ragione_sociale}" (${fornitoreAggiornato.codice})`,
          module: 'FORNITORI',
          functionality: 'update_fornitore',
          importance: 'MEDIA',
          entities_involved: { 
            fornitore_id: fornitore_id,
            codice: fornitoreAggiornato.codice,
            ragione_sociale: fornitoreAggiornato.ragione_sociale
          },
          data_before: fornitoreEsistente,
          data_after: fornitoreAggiornato
        });
        console.log('🔍 AUDIT COMPLETATO!');
      } else {
        console.log('🔍 TRACKER NON CREATO');
      }
    } catch (auditError) {
      console.error('🔥 ERRORE AUDIT:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({ success: true, data: { id: fornitore_id } });
  } catch (error) {
    console.error('Errore nell\'aggiornamento fornitore:', error);
    return json({ success: false, error: 'Errore nell\'aggiornamento del fornitore' }, { status: 500 });
  }
}

export async function DELETE({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
    
    // Recupera dati prima della eliminazione per audit
    const fornitoreEsistente = db.prepare('SELECT * FROM fornitori WHERE id = ?').get(id);
    
    if (!fornitoreEsistente) {
      return json({ success: false, error: 'Fornitore non trovato' }, { status: 404 });
    }
    
    const deleteQuery = `DELETE FROM fornitori WHERE id = ?`;
    const result = db.prepare(deleteQuery).run(id);
    
    if (result.changes === 0) {
      return json({ success: false, error: 'Fornitore non trovato' }, { status: 404 });
    }
    
    // Log audit per eliminazione fornitore
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'fornitori',
          operation: 'DELETE',
          description: `Eliminato fornitore "${fornitoreEsistente.ragione_sociale}" (${fornitoreEsistente.codice})`,
          module: 'FORNITORI',
          functionality: 'delete_fornitore',
          importance: 'ALTA',
          entities_involved: { 
            fornitore_id: id,
            codice: fornitoreEsistente.codice,
            ragione_sociale: fornitoreEsistente.ragione_sociale
          },
          data_before: fornitoreEsistente,
          data_after: null
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({ success: true, data: { id } });
  } catch (error) {
    console.error('Errore nell\'eliminazione fornitore:', error);
    return json({ success: false, error: 'Errore nell\'eliminazione del fornitore' }, { status: 500 });
  }
}