import db from '../database';
import type { Fornitore, CommittenteFornitore } from '$lib/types';

// Repository per fornitori con logica MANY-TO-MANY con committenti
export const fornitoriRepository = {
  
  // CREATE - Crea nuovo fornitore
  create(data: {
    codice: string;
    ragione_sociale: string;
    partita_iva?: string;
    codice_fiscale?: string;
    indirizzo?: string;
    cap?: string;
    citta?: string;
    provincia?: string;
    telefono?: string;
    email?: string;
  }): Fornitore {
    const stmt = db.prepare(`
      INSERT INTO fornitori (
        codice, ragione_sociale, partita_iva, codice_fiscale, 
        indirizzo, cap, citta, provincia, telefono, email
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.codice,
      data.ragione_sociale,
      data.partita_iva || null,
      data.codice_fiscale || null,
      data.indirizzo || null,
      data.cap || null,
      data.citta || null,
      data.provincia || null,
      data.telefono || null,
      data.email || null
    );
    
    return this.findById(Number(result.lastInsertRowid))!;
  },

  // READ - Trova fornitore per ID
  findById(id: number): Fornitore | null {
    const stmt = db.prepare('SELECT * FROM fornitori WHERE id = ?');
    return stmt.get(id) as Fornitore || null;
  },

  // READ - Tutti i fornitori (solo admin)
  findAll(): Fornitore[] {
    const stmt = db.prepare(`
      SELECT * FROM fornitori 
      ORDER BY ragione_sociale ASC
    `);
    return stmt.all() as Fornitore[];
  },

  // READ - Fornitori disponibili per committente (associati)
  findByCommittente(committente_id: number): Array<Fornitore & { 
    attivo: boolean; 
    condizioni_specifiche?: string;
    relazione_id: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        f.*,
        cf.attivo,
        cf.condizioni_specifiche,
        cf.id as relazione_id
      FROM fornitori f
      INNER JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      WHERE cf.committente_id = ?
      ORDER BY f.ragione_sociale ASC
    `);
    
    return stmt.all(committente_id) as Array<Fornitore & { 
      attivo: boolean; 
      condizioni_specifiche?: string;
      relazione_id: number;
    }>;
  },

  // READ - Fornitori NON ancora associati al committente
  findNotAssociatedToCommittente(committente_id: number): Fornitore[] {
    const stmt = db.prepare(`
      SELECT f.*
      FROM fornitori f
      LEFT JOIN committenti_fornitori cf ON f.id = cf.fornitore_id 
        AND cf.committente_id = ?
      WHERE cf.id IS NULL
      ORDER BY f.ragione_sociale ASC
    `);
    
    return stmt.all(committente_id) as Fornitore[];
  },

  // READ - Ricerca fornitori per committente
  searchByCommittente(committente_id: number, query: string): Array<Fornitore & { 
    attivo: boolean; 
    condizioni_specifiche?: string;
    relazione_id: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        f.*,
        cf.attivo,
        cf.condizioni_specifiche,
        cf.id as relazione_id
      FROM fornitori f
      INNER JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      WHERE cf.committente_id = ? 
        AND (f.ragione_sociale LIKE ? OR f.codice LIKE ? OR f.partita_iva LIKE ?)
      ORDER BY f.ragione_sociale ASC
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(committente_id, searchTerm, searchTerm, searchTerm) as Array<Fornitore & { 
      attivo: boolean; 
      condizioni_specifiche?: string;
      relazione_id: number;
    }>;
  },

  // READ - Ricerca generale fornitori (admin)
  search(query: string): Fornitore[] {
    const stmt = db.prepare(`
      SELECT * FROM fornitori
      WHERE ragione_sociale LIKE ? OR codice LIKE ? OR partita_iva LIKE ?
      ORDER BY ragione_sociale ASC
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, searchTerm) as Fornitore[];
  },

  // READ - Fornitori con numero di committenti associati
  findAllWithCommittentiCount(): Array<Fornitore & { committenti_count: number }> {
    const stmt = db.prepare(`
      SELECT 
        f.*,
        COUNT(cf.committente_id) as committenti_count
      FROM fornitori f
      LEFT JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      GROUP BY f.id
      ORDER BY f.ragione_sociale ASC
    `);
    
    return stmt.all() as Array<Fornitore & { committenti_count: number }>;
  },

  // UPDATE - Aggiorna fornitore
  update(id: number, data: Partial<{
    codice: string;
    ragione_sociale: string;
    partita_iva: string;
    codice_fiscale: string;
    indirizzo: string;
    cap: string;
    citta: string;
    provincia: string;
    telefono: string;
    email: string;
  }>): Fornitore | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value || null);
      }
    });
    
    if (fields.length === 0) return existing;
    
    params.push(id);
    
    const stmt = db.prepare(`
      UPDATE fornitori 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    const result = stmt.run(...params);
    return result.changes > 0 ? this.findById(id) : null;
  },

  // DELETE - Elimina fornitore (solo se non in uso)
  delete(id: number): boolean {
    const existing = this.findById(id);
    if (!existing) return false;

    // Verifica che non sia associato a committenti
    const checkRelations = db.prepare(`
      SELECT COUNT(*) as count 
      FROM committenti_fornitori 
      WHERE fornitore_id = ?
    `);
    
    const { count: relationsCount } = checkRelations.get(id) as { count: number };
    
    if (relationsCount > 0) {
      throw new Error(`Impossibile eliminare: fornitore associato a ${relationsCount} committenti`);
    }

    // Verifica che non sia in uso nei movimenti
    const checkMovimenti = db.prepare(`
      SELECT COUNT(*) as count 
      FROM movimenti 
      WHERE fornitore_id = ?
    `);
    
    const { count: movimentiCount } = checkMovimenti.get(id) as { count: number };
    
    if (movimentiCount > 0) {
      throw new Error(`Impossibile eliminare: fornitore utilizzato in ${movimentiCount} movimenti`);
    }
    
    const stmt = db.prepare('DELETE FROM fornitori WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // UTILITY - Verifica disponibilità codice
  isCodeAvailable(codice: string, excludeId?: number): boolean {
    let query = 'SELECT COUNT(*) as count FROM fornitori WHERE codice = ? COLLATE NOCASE';
    const params: any[] = [codice];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = db.prepare(query);
    const { count } = stmt.get(...params) as { count: number };
    
    return count === 0;
  },

  // ASSOCIAZIONI - Associa fornitore a committente
  associateToCommittente(fornitore_id: number, committente_id: number, data: {
    attivo?: boolean;
    condizioni_specifiche?: string;
  } = {}): CommittenteFornitore {
    const stmt = db.prepare(`
      INSERT INTO committenti_fornitori (
        fornitore_id, committente_id, attivo, condizioni_specifiche
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(committente_id, fornitore_id) DO UPDATE SET
        attivo = ?,
        condizioni_specifiche = ?
    `);
    
    const attivo = data.attivo !== undefined ? (data.attivo ? 1 : 0) : 1;
    const condizioni = data.condizioni_specifiche || null;
    
    stmt.run(fornitore_id, committente_id, attivo, condizioni, attivo, condizioni);
    
    // Recupera l'associazione creata
    const getStmt = db.prepare(`
      SELECT * FROM committenti_fornitori 
      WHERE fornitore_id = ? AND committente_id = ?
    `);
    
    return getStmt.get(fornitore_id, committente_id) as CommittenteFornitore;
  },

  // ASSOCIAZIONI - Rimuovi associazione fornitore-committente
  dissociateFromCommittente(fornitore_id: number, committente_id: number): boolean {
    // Verifica che non ci siano movimenti attivi
    const checkMovimenti = db.prepare(`
      SELECT COUNT(*) as count 
      FROM movimenti 
      WHERE fornitore_id = ? AND committente_id_origine = ?
    `);
    
    const { count } = checkMovimenti.get(fornitore_id, committente_id) as { count: number };
    
    if (count > 0) {
      throw new Error(`Impossibile rimuovere associazione: ${count} movimenti registrati`);
    }
    
    const stmt = db.prepare(`
      DELETE FROM committenti_fornitori 
      WHERE fornitore_id = ? AND committente_id = ?
    `);
    
    const result = stmt.run(fornitore_id, committente_id);
    return result.changes > 0;
  },

  // ASSOCIAZIONI - Aggiorna associazione fornitore-committente
  updateAssociation(fornitore_id: number, committente_id: number, data: {
    attivo?: boolean;
    condizioni_specifiche?: string;
  }): CommittenteFornitore | null {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.attivo !== undefined) {
      fields.push('attivo = ?');
      params.push(data.attivo ? 1 : 0);
    }
    
    if (data.condizioni_specifiche !== undefined) {
      fields.push('condizioni_specifiche = ?');
      params.push(data.condizioni_specifiche || null);
    }
    
    if (fields.length === 0) {
      // Recupera l'associazione esistente
      const getStmt = db.prepare(`
        SELECT * FROM committenti_fornitori 
        WHERE fornitore_id = ? AND committente_id = ?
      `);
      return getStmt.get(fornitore_id, committente_id) as CommittenteFornitore;
    }
    
    params.push(fornitore_id, committente_id);
    
    const stmt = db.prepare(`
      UPDATE committenti_fornitori 
      SET ${fields.join(', ')}
      WHERE fornitore_id = ? AND committente_id = ?
    `);
    
    const result = stmt.run(...params);
    
    if (result.changes > 0) {
      const getStmt = db.prepare(`
        SELECT * FROM committenti_fornitori 
        WHERE fornitore_id = ? AND committente_id = ?
      `);
      return getStmt.get(fornitore_id, committente_id) as CommittenteFornitore;
    }
    
    return null;
  },

  // STATISTICHE - Statistiche generali fornitori
  getStats() {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totali,
        COUNT(CASE WHEN f.email IS NOT NULL AND f.email != '' THEN 1 END) as con_email,
        COUNT(CASE WHEN f.telefono IS NOT NULL AND f.telefono != '' THEN 1 END) as con_telefono,
        COUNT(CASE WHEN f.partita_iva IS NOT NULL AND f.partita_iva != '' THEN 1 END) as con_partita_iva
      FROM fornitori f
    `);
    
    return stmt.get() as {
      totali: number;
      con_email: number;
      con_telefono: number;
      con_partita_iva: number;
    };
  },

  // STATISTICHE - Statistiche fornitori per committente
  getStatsForCommittente(committente_id: number) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as associati,
        COUNT(CASE WHEN cf.attivo = 1 THEN 1 END) as attivi,
        COUNT(CASE WHEN cf.attivo = 0 THEN 1 END) as inattivi,
        COUNT(CASE WHEN cf.condizioni_specifiche IS NOT NULL THEN 1 END) as con_condizioni
      FROM committenti_fornitori cf
      INNER JOIN fornitori f ON f.id = cf.fornitore_id
      WHERE cf.committente_id = ?
    `);
    
    return stmt.get(committente_id) as {
      associati: number;
      attivi: number;
      inattivi: number;
      con_condizioni: number;
    };
  },

  // UTILITY - Suggerimenti per autocompletamento
  getSuggestions(query: string, limit: number = 10): Fornitore[] {
    const stmt = db.prepare(`
      SELECT * FROM fornitori 
      WHERE ragione_sociale LIKE ? OR codice LIKE ?
      ORDER BY 
        CASE WHEN ragione_sociale = ? THEN 0 ELSE 1 END,
        CASE WHEN codice = ? THEN 0 ELSE 1 END,
        LENGTH(ragione_sociale),
        ragione_sociale
      LIMIT ?
    `);
    
    const searchTerm = `${query}%`;
    return stmt.all(searchTerm, searchTerm, query, query, limit) as Fornitore[];
  }
};