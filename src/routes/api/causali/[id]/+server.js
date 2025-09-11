import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';

const db = new Database('database/magazzino.db');

export async function PUT({ params, request }) {
  try {
    const id = parseInt(params.id);
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
    
    const existingQuery = `SELECT id FROM causali_trasferimento WHERE codice = ? AND id != ?`;
    const existing = db.prepare(existingQuery).get(data.codice, id);
    
    if (existing) {
      return json({
        success: false,
        error: 'Codice causale già esistente',
        errors: { codice: ['Codice già esistente'] }
      }, { status: 400 });
    }
    
    const updateQuery = `
      UPDATE causali_trasferimento 
      SET codice = ?, descrizione = ?, tipo = ?, richiede_autorizzazione = ?, attiva = ?
      WHERE id = ?
    `;
    
    const result = db.prepare(updateQuery).run(
      data.codice,
      data.descrizione,
      data.tipo,
      data.richiede_autorizzazione ? 1 : 0,
      data.attiva !== false ? 1 : 0,
      id
    );
    
    if (result.changes === 0) {
      return json({ success: false, error: 'Causale non trovata' }, { status: 404 });
    }
    
    return json({ success: true, data: { id } });
  } catch (error) {
    console.error('Errore nell\'aggiornamento causale:', error);
    return json({ success: false, error: 'Errore nell\'aggiornamento della causale' }, { status: 500 });
  }
}

export async function DELETE({ params }) {
  try {
    const id = parseInt(params.id);
    
    const deleteQuery = `DELETE FROM causali_trasferimento WHERE id = ?`;
    const result = db.prepare(deleteQuery).run(id);
    
    if (result.changes === 0) {
      return json({ success: false, error: 'Causale non trovata' }, { status: 404 });
    }
    
    return json({ success: true, data: { id } });
  } catch (error) {
    console.error('Errore nell\'eliminazione causale:', error);
    return json({ success: false, error: 'Errore nell\'eliminazione della causale' }, { status: 500 });
  }
}