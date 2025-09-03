import db from '../database';
import type { Categoria } from '$lib/types';

// Repository per categorie con SEGREGAZIONE COMMITTENTE
export const categorieRepository = {
  // CREATE - Crea nuova categoria per committente
  create(committente_id: number, data: { codice: string; descrizione: string; attiva?: boolean }): Categoria {
    const stmt = db.prepare(`
      INSERT INTO categorie (committente_id, codice, descrizione, attiva)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      committente_id,
      data.codice,
      data.descrizione,
      data.attiva !== undefined ? (data.attiva ? 1 : 0) : 1
    );
    
    return this.findById(committente_id, Number(result.lastInsertRowid))!;
  },

  // READ - Lista categorie per committente
  findAll(committente_id: number): Categoria[] {
    const stmt = db.prepare(`
      SELECT * FROM categorie 
      WHERE committente_id = ? 
      ORDER BY descrizione ASC
    `);
    
    return stmt.all(committente_id) as Categoria[];
  },

  // READ - Categorie attive per committente (per select)
  findActive(committente_id: number): Categoria[] {
    const stmt = db.prepare(`
      SELECT * FROM categorie 
      WHERE committente_id = ? AND attiva = 1 
      ORDER BY descrizione ASC
    `);
    
    return stmt.all(committente_id) as Categoria[];
  },

  // READ - Singola categoria per ID e committente (SICUREZZA CRITICA)
  findById(committente_id: number, id: number): Categoria | null {
    const stmt = db.prepare(`
      SELECT * FROM categorie 
      WHERE committente_id = ? AND id = ?
    `);
    
    return stmt.get(committente_id, id) as Categoria || null;
  },

  // READ - Ricerca per codice all'interno del committente
  findByCodice(committente_id: number, codice: string): Categoria | null {
    const stmt = db.prepare(`
      SELECT * FROM categorie 
      WHERE committente_id = ? AND codice = ? COLLATE NOCASE
    `);
    
    return stmt.get(committente_id, codice) as Categoria || null;
  },

  // READ - Ricerca testuale nelle categorie del committente
  search(committente_id: number, query: string): Categoria[] {
    const stmt = db.prepare(`
      SELECT * FROM categorie 
      WHERE committente_id = ? 
      AND (descrizione LIKE ? OR codice LIKE ?)
      ORDER BY descrizione ASC
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(committente_id, searchTerm, searchTerm) as Categoria[];
  },

  // UPDATE - Aggiorna categoria (solo per il committente proprietario)
  update(committente_id: number, id: number, data: Partial<{ codice: string; descrizione: string; attiva: boolean }>): Categoria | null {
    // Verifica che la categoria appartenga al committente
    const existing = this.findById(committente_id, id);
    if (!existing) {
      return null;
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
    
    if (fields.length === 0) {
      return existing; // Nessun campo da aggiornare
    }
    
    // Aggiungi i parametri WHERE
    params.push(committente_id, id);
    
    const stmt = db.prepare(`
      UPDATE categorie 
      SET ${fields.join(', ')}
      WHERE committente_id = ? AND id = ?
    `);
    
    const result = stmt.run(...params);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.findById(committente_id, id);
  },

  // DELETE - Elimina categoria (solo se non in uso)
  delete(committente_id: number, id: number): boolean {
    // Verifica che la categoria appartenga al committente
    const existing = this.findById(committente_id, id);
    if (!existing) {
      return false;
    }

    // Verifica che non sia in uso da prodotti
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM prodotti 
      WHERE committente_id = ? AND categoria_id = ?
    `);
    
    const { count } = checkStmt.get(committente_id, id) as { count: number };
    
    if (count > 0) {
      throw new Error(`Impossibile eliminare: categoria utilizzata da ${count} prodotti`);
    }
    
    const stmt = db.prepare(`
      DELETE FROM categorie 
      WHERE committente_id = ? AND id = ?
    `);
    
    const result = stmt.run(committente_id, id);
    return result.changes > 0;
  },

  // UTILITY - Verifica se codice è disponibile per il committente
  isCodeAvailable(committente_id: number, codice: string, excludeId?: number): boolean {
    let query = `
      SELECT COUNT(*) as count 
      FROM categorie 
      WHERE committente_id = ? AND codice = ? COLLATE NOCASE
    `;
    const params: any[] = [committente_id, codice];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = db.prepare(query);
    const { count } = stmt.get(...params) as { count: number };
    
    return count === 0;
  },

  // UTILITY - Conta categorie per committente
  countByCommittente(committente_id: number): { totali: number; attive: number; inattive: number } {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totali,
        COUNT(CASE WHEN attiva = 1 THEN 1 END) as attive,
        COUNT(CASE WHEN attiva = 0 THEN 1 END) as inattive
      FROM categorie 
      WHERE committente_id = ?
    `);
    
    return stmt.get(committente_id) as { totali: number; attive: number; inattive: number };
  },

  // UTILITY - Copia categorie da un committente template ad un nuovo committente
  copyFromTemplate(source_committente_id: number, target_committente_id: number): number {
    const sourceCategorie = this.findAll(source_committente_id);
    let copiedCount = 0;
    
    // Usa transazione per atomicità
    const transaction = db.transaction(() => {
      for (const categoria of sourceCategorie) {
        try {
          this.create(target_committente_id, {
            codice: categoria.codice,
            descrizione: categoria.descrizione,
            attiva: categoria.attiva
          });
          copiedCount++;
        } catch (error) {
          // Ignora errori di duplicati, continua con le altre
          console.warn(`Categoria ${categoria.codice} non copiata: ${error}`);
        }
      }
    });
    
    transaction();
    return copiedCount;
  },

  // UTILITY - Lista committenti che hanno categorie simili (per suggerimenti)
  findSimilarCategories(codice: string, exclude_committente_id?: number): Array<{committente_id: number; categoria: Categoria}> {
    let query = `
      SELECT c.*, cat.committente_id
      FROM categorie cat
      JOIN committenti c ON c.id = cat.committente_id
      WHERE cat.codice = ? COLLATE NOCASE
    `;
    const params: any[] = [codice];
    
    if (exclude_committente_id) {
      query += ' AND cat.committente_id != ?';
      params.push(exclude_committente_id);
    }
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    
    return results.map((row: any) => ({
      committente_id: row.committente_id,
      categoria: {
        id: row.id,
        committente_id: row.committente_id,
        codice: row.codice,
        descrizione: row.descrizione,
        attiva: !!row.attiva,
        created_at: row.created_at,
        updated_at: row.updated_at
      } as Categoria
    }));
  },

  // ADMIN - Lista tutte le categorie di tutti i committenti (solo per super admin)
  findAllForAllCommittenti(): Array<Categoria & { committente_ragione_sociale: string }> {
    const stmt = db.prepare(`
      SELECT cat.*, c.ragione_sociale as committente_ragione_sociale
      FROM categorie cat
      JOIN committenti c ON c.id = cat.committente_id
      ORDER BY c.ragione_sociale, cat.descrizione
    `);
    
    return stmt.all() as Array<Categoria & { committente_ragione_sociale: string }>;
  }
};