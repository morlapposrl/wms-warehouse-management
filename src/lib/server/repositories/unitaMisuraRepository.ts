import db from '../database';
import type { UnitaMisura } from '$lib/types';

// Repository per unità di misura con logica GLOBALE + PER COMMITTENTE
export const unitaMisuraRepository = {
  // CREATE - Crea nuova unità di misura
  create(data: { 
    committente_id?: number; 
    codice: string; 
    descrizione: string; 
    tipo?: 'sistema' | 'personalizzata';
    attiva?: boolean 
  }): UnitaMisura {
    const stmt = db.prepare(`
      INSERT INTO unita_misura (committente_id, codice, descrizione, tipo, attiva)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.committente_id || null,
      data.codice,
      data.descrizione,
      data.tipo || 'personalizzata',
      data.attiva !== undefined ? (data.attiva ? 1 : 0) : 1
    );
    
    return this.findById(Number(result.lastInsertRowid))!;
  },

  // READ - Lista unità globali + specifiche per committente
  findAvailableForCommittente(committente_id: number): UnitaMisura[] {
    const stmt = db.prepare(`
      SELECT * FROM unita_misura 
      WHERE (committente_id IS NULL OR committente_id = ?) 
      AND attiva = 1
      ORDER BY 
        committente_id IS NULL DESC,  -- Prima le globali
        descrizione ASC
    `);
    
    return stmt.all(committente_id) as UnitaMisura[];
  },

  // READ - Solo unità globali di sistema
  findGlobali(): UnitaMisura[] {
    const stmt = db.prepare(`
      SELECT * FROM unita_misura 
      WHERE committente_id IS NULL 
      ORDER BY descrizione ASC
    `);
    
    return stmt.all() as UnitaMisura[];
  },

  // READ - Solo unità specifiche per committente
  findByCommittente(committente_id: number): UnitaMisura[] {
    const stmt = db.prepare(`
      SELECT * FROM unita_misura 
      WHERE committente_id = ?
      ORDER BY descrizione ASC
    `);
    
    return stmt.all(committente_id) as UnitaMisura[];
  },

  // READ - Tutte le unità con info committente
  findAllWithCommittente(): Array<UnitaMisura & { committente_ragione_sociale?: string }> {
    const stmt = db.prepare(`
      SELECT um.*, c.ragione_sociale as committente_ragione_sociale
      FROM unita_misura um
      LEFT JOIN committenti c ON c.id = um.committente_id
      ORDER BY 
        um.committente_id IS NULL DESC,
        c.ragione_sociale,
        um.descrizione
    `);
    
    return stmt.all() as Array<UnitaMisura & { committente_ragione_sociale?: string }>;
  },

  // READ - Singola per ID
  findById(id: number): UnitaMisura | null {
    const stmt = db.prepare('SELECT * FROM unita_misura WHERE id = ?');
    return stmt.get(id) as UnitaMisura || null;
  },

  // READ - Ricerca per codice
  findByCodice(codice: string, committente_id?: number): UnitaMisura | null {
    let query = 'SELECT * FROM unita_misura WHERE codice = ? COLLATE NOCASE';
    const params: any[] = [codice];
    
    if (committente_id !== undefined) {
      query += ' AND (committente_id IS NULL OR committente_id = ?)';
      params.push(committente_id);
    }
    
    const stmt = db.prepare(query);
    return stmt.get(...params) as UnitaMisura || null;
  },

  // READ - Ricerca testuale
  search(query: string, committente_id?: number): UnitaMisura[] {
    let sql = `
      SELECT * FROM unita_misura 
      WHERE (descrizione LIKE ? OR codice LIKE ?)
    `;
    const params: any[] = [`%${query}%`, `%${query}%`];
    
    if (committente_id !== undefined) {
      sql += ' AND (committente_id IS NULL OR committente_id = ?)';
      params.push(committente_id);
    }
    
    sql += ` ORDER BY 
      committente_id IS NULL DESC,
      descrizione ASC
    `;
    
    const stmt = db.prepare(sql);
    return stmt.all(...params) as UnitaMisura[];
  },

  // UPDATE - Aggiorna unità di misura
  update(id: number, data: Partial<{
    codice: string; 
    descrizione: string; 
    attiva: boolean;
    committente_id?: number
  }>): UnitaMisura | null {
    const existing = this.findById(id);
    if (!existing) return null;

    // Non permettere modifica delle unità di sistema
    if (existing.tipo === 'sistema') {
      throw new Error('Non è possibile modificare le unità di misura di sistema');
    }

    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.codice !== undefined) {
      fields.push('codice = ?');
      params.push(data.codice);
    }
    
    if (data.descrizione !== undefined) {
      fields.push('descrizione = ?');
      params.push(data.descrizione);
    }
    
    if (data.attiva !== undefined) {
      fields.push('attiva = ?');
      params.push(data.attiva ? 1 : 0);
    }
    
    if (fields.length === 0) return existing;
    
    params.push(id);
    
    const stmt = db.prepare(`
      UPDATE unita_misura 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    const result = stmt.run(...params);
    return result.changes > 0 ? this.findById(id) : null;
  },

  // DELETE - Elimina unità di misura (solo se non in uso)
  delete(id: number): boolean {
    const existing = this.findById(id);
    if (!existing) return false;

    // Non permettere eliminazione delle unità di sistema
    if (existing.tipo === 'sistema') {
      throw new Error('Non è possibile eliminare le unità di misura di sistema');
    }

    // Verifica che non sia in uso da prodotti
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM prodotti 
      WHERE unita_misura_id = ?
    `);
    
    const { count } = checkStmt.get(id) as { count: number };
    
    if (count > 0) {
      throw new Error(`Impossibile eliminare: unità di misura utilizzata da ${count} prodotti`);
    }
    
    const stmt = db.prepare('DELETE FROM unita_misura WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // UTILITY - Verifica disponibilità codice
  isCodeAvailable(codice: string, excludeId?: number, committente_id?: number): boolean {
    let query = 'SELECT COUNT(*) as count FROM unita_misura WHERE codice = ? COLLATE NOCASE';
    const params: any[] = [codice];
    
    // Per unità specifiche, controlla solo nel contesto del committente + globali
    if (committente_id !== undefined) {
      query += ' AND (committente_id IS NULL OR committente_id = ?)';
      params.push(committente_id);
    }
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = db.prepare(query);
    const { count } = stmt.get(...params) as { count: number };
    
    return count === 0;
  },

  // UTILITY - Statistiche generali
  getStats() {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totali,
        COUNT(CASE WHEN attiva = 1 THEN 1 END) as attive,
        COUNT(CASE WHEN attiva = 0 THEN 1 END) as inattive,
        COUNT(CASE WHEN committente_id IS NULL THEN 1 END) as globali,
        COUNT(CASE WHEN committente_id IS NOT NULL THEN 1 END) as personalizzate,
        COUNT(CASE WHEN tipo = 'sistema' THEN 1 END) as sistema
      FROM unita_misura
    `);
    
    return stmt.get() as {
      totali: number;
      attive: number;
      inattive: number;
      globali: number;
      personalizzate: number;
      sistema: number;
    };
  },

  // UTILITY - Statistiche per committente
  getStatsForCommittente(committente_id: number) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as disponibili,
        COUNT(CASE WHEN committente_id IS NULL THEN 1 END) as globali,
        COUNT(CASE WHEN committente_id = ? THEN 1 END) as personalizzate
      FROM unita_misura 
      WHERE (committente_id IS NULL OR committente_id = ?) 
      AND attiva = 1
    `);
    
    return stmt.get(committente_id, committente_id) as {
      disponibili: number;
      globali: number;
      personalizzate: number;
    };
  },

  // ADMIN - Crea unità di sistema standard
  createSystemUnits(): number {
    const systemUnits = [
      { codice: 'PZ', descrizione: 'Pezzo' },
      { codice: 'KG', descrizione: 'Chilogrammo' },
      { codice: 'LT', descrizione: 'Litro' },
      { codice: 'MT', descrizione: 'Metro' },
      { codice: 'MQ', descrizione: 'Metro Quadrato' },
      { codice: 'MC', descrizione: 'Metro Cubo' },
      { codice: 'GR', descrizione: 'Grammo' },
      { codice: 'SCATOLA', descrizione: 'Scatola' },
      { codice: 'PALLET', descrizione: 'Pallet' },
      { codice: 'CONF', descrizione: 'Confezione' }
    ];

    let created = 0;
    const transaction = db.transaction(() => {
      for (const unit of systemUnits) {
        try {
          // Verifica se esiste già
          if (!this.findByCodice(unit.codice)) {
            this.create({
              codice: unit.codice,
              descrizione: unit.descrizione,
              tipo: 'sistema',
              attiva: true
            });
            created++;
          }
        } catch (error) {
          console.warn(`Unità di sistema ${unit.codice} non creata:`, error);
        }
      }
    });

    transaction();
    return created;
  },

  // UTILITY - Suggerimenti per autocompletamento
  getSuggestions(query: string, limit: number = 10): UnitaMisura[] {
    const stmt = db.prepare(`
      SELECT * FROM unita_misura 
      WHERE (codice LIKE ? OR descrizione LIKE ?) 
      AND attiva = 1
      ORDER BY 
        CASE WHEN codice = ? THEN 0 ELSE 1 END,
        committente_id IS NULL DESC,
        LENGTH(codice),
        codice
      LIMIT ?
    `);
    
    const searchTerm = `${query}%`;
    return stmt.all(searchTerm, searchTerm, query, limit) as UnitaMisura[];
  }
};