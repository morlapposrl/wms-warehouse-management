import db from '../database';
import type { Prodotto } from '$lib/types';

// Repository per prodotti SEMPRE legati a un committente
export const prodottiRepository = {
  
  // CREATE - Crea nuovo prodotto per committente
  create(committente_id: number, data: {
    codice: string;
    descrizione: string;
    categoria_id: number;
    unita_misura_id: number;
    prezzo_acquisto?: number;
    prezzo_vendita?: number;
    scorta_minima?: number;
    scorta_massima?: number;
    ubicazione?: string;
    lotto_partita?: string;
    note?: string;
    attivo?: boolean;
  }): Prodotto {
    const stmt = db.prepare(`
      INSERT INTO prodotti (
        committente_id, codice, descrizione, categoria_id, unita_misura_id,
        prezzo_acquisto, prezzo_vendita, scorta_minima, scorta_massima,
        ubicazione, lotto_partita, note, attivo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      committente_id,
      data.codice,
      data.descrizione,
      data.categoria_id,
      data.unita_misura_id,
      data.prezzo_acquisto || 0,
      data.prezzo_vendita || 0,
      data.scorta_minima || 0,
      data.scorta_massima || 0,
      data.ubicazione || null,
      data.lotto_partita || null,
      data.note || null,
      data.attivo !== undefined ? (data.attivo ? 1 : 0) : 1
    );
    
    return this.findById(committente_id, Number(result.lastInsertRowid))!;
  },

  // READ - Trova prodotto per ID (sempre con filtro committente)
  findById(committente_id: number, id: number): Prodotto | null {
    const stmt = db.prepare(`
      SELECT * FROM prodotti 
      WHERE committente_id = ? AND id = ?
    `);
    return stmt.get(committente_id, id) as Prodotto || null;
  },

  // READ - Lista prodotti per committente
  findByCommittente(committente_id: number): Prodotto[] {
    const stmt = db.prepare(`
      SELECT * FROM prodotti 
      WHERE committente_id = ?
      ORDER BY descrizione ASC
    `);
    return stmt.all(committente_id) as Prodotto[];
  },

  // READ - Lista prodotti con dati correlati (categoria, unità, giacenze)
  findByCommittenteWithDetails(committente_id: number): Array<Prodotto & {
    categoria_descrizione: string;
    unita_misura_codice: string;
    unita_misura_descrizione: string;
    giacenza_attuale: number;
    valore_giacenza: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        um.descrizione as unita_misura_descrizione,
        COALESCE(g.quantita, 0) as giacenza_attuale,
        COALESCE(g.valore_medio * g.quantita, 0) as valore_giacenza
      FROM prodotti p
      INNER JOIN categorie c ON c.id = p.categoria_id AND c.committente_id = p.committente_id
      INNER JOIN unita_misura um ON um.id = p.unita_misura_id
      LEFT JOIN giacenze g ON g.prodotto_id = p.id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ?
      ORDER BY p.descrizione ASC
    `);
    
    return stmt.all(committente_id) as Array<Prodotto & {
      categoria_descrizione: string;
      unita_misura_codice: string;
      unita_misura_descrizione: string;
      giacenza_attuale: number;
      valore_giacenza: number;
    }>;
  },

  // READ - Prodotti per categoria
  findByCategoria(committente_id: number, categoria_id: number): Prodotto[] {
    const stmt = db.prepare(`
      SELECT * FROM prodotti 
      WHERE committente_id = ? AND categoria_id = ?
      ORDER BY descrizione ASC
    `);
    return stmt.all(committente_id, categoria_id) as Prodotto[];
  },

  // READ - Prodotti attivi/inattivi
  findByStatus(committente_id: number, attivo: boolean): Prodotto[] {
    const stmt = db.prepare(`
      SELECT * FROM prodotti 
      WHERE committente_id = ? AND attivo = ?
      ORDER BY descrizione ASC
    `);
    return stmt.all(committente_id, attivo ? 1 : 0) as Prodotto[];
  },

  // READ - Prodotti con scorte sotto minimo
  findWithLowStock(committente_id: number): Array<Prodotto & {
    categoria_descrizione: string;
    giacenza_attuale: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.descrizione as categoria_descrizione,
        COALESCE(g.quantita, 0) as giacenza_attuale
      FROM prodotti p
      INNER JOIN categorie c ON c.id = p.categoria_id AND c.committente_id = p.committente_id
      LEFT JOIN giacenze g ON g.prodotto_id = p.id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ? 
        AND p.attivo = 1
        AND p.scorta_minima > 0
        AND COALESCE(g.quantita, 0) < p.scorta_minima
      ORDER BY (COALESCE(g.quantita, 0) - p.scorta_minima) ASC
    `);
    
    return stmt.all(committente_id) as Array<Prodotto & {
      categoria_descrizione: string;
      giacenza_attuale: number;
    }>;
  },

  // READ - Ricerca prodotti per committente
  search(committente_id: number, query: string): Array<Prodotto & {
    categoria_descrizione: string;
    unita_misura_codice: string;
    giacenza_attuale: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        COALESCE(g.quantita, 0) as giacenza_attuale
      FROM prodotti p
      INNER JOIN categorie c ON c.id = p.categoria_id AND c.committente_id = p.committente_id
      INNER JOIN unita_misura um ON um.id = p.unita_misura_id
      LEFT JOIN giacenze g ON g.prodotto_id = p.id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ? 
        AND (p.descrizione LIKE ? OR p.codice LIKE ? OR p.lotto_partita LIKE ?)
      ORDER BY p.descrizione ASC
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(committente_id, searchTerm, searchTerm, searchTerm) as Array<Prodotto & {
      categoria_descrizione: string;
      unita_misura_codice: string;
      giacenza_attuale: number;
    }>;
  },

  // UPDATE - Aggiorna prodotto
  update(committente_id: number, id: number, data: Partial<{
    codice: string;
    descrizione: string;
    categoria_id: number;
    unita_misura_id: number;
    prezzo_acquisto: number;
    prezzo_vendita: number;
    scorta_minima: number;
    scorta_massima: number;
    ubicazione: string;
    lotto_partita: string;
    note: string;
    attivo: boolean;
  }>): Prodotto | null {
    const existing = this.findById(committente_id, id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'attivo') {
          fields.push(`${key} = ?`);
          params.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          params.push(value || null);
        }
      }
    });
    
    if (fields.length === 0) return existing;
    
    params.push(committente_id, id);
    
    const stmt = db.prepare(`
      UPDATE prodotti 
      SET ${fields.join(', ')}
      WHERE committente_id = ? AND id = ?
    `);
    
    const result = stmt.run(...params);
    return result.changes > 0 ? this.findById(committente_id, id) : null;
  },

  // DELETE - Elimina prodotto (solo se non ha movimenti)
  delete(committente_id: number, id: number): boolean {
    const existing = this.findById(committente_id, id);
    if (!existing) return false;

    // Verifica che non abbia movimenti
    const checkMovimenti = db.prepare(`
      SELECT COUNT(*) as count 
      FROM movimenti 
      WHERE prodotto_id = ? AND committente_id_origine = ?
    `);
    
    const { count: movimentiCount } = checkMovimenti.get(id, committente_id) as { count: number };
    
    if (movimentiCount > 0) {
      throw new Error(`Impossibile eliminare: prodotto utilizzato in ${movimentiCount} movimenti`);
    }

    // Elimina anche eventuali giacenze
    const deleteGiacenze = db.prepare(`
      DELETE FROM giacenze 
      WHERE prodotto_id = ? AND committente_id = ?
    `);
    deleteGiacenze.run(id, committente_id);
    
    // Elimina il prodotto
    const stmt = db.prepare(`
      DELETE FROM prodotti 
      WHERE committente_id = ? AND id = ?
    `);
    const result = stmt.run(committente_id, id);
    return result.changes > 0;
  },

  // UTILITY - Verifica disponibilità codice per committente
  isCodeAvailable(committente_id: number, codice: string, excludeId?: number): boolean {
    let query = `
      SELECT COUNT(*) as count 
      FROM prodotti 
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

  // UTILITY - Conteggio prodotti per committente
  countByCommittente(committente_id: number) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totali,
        COUNT(CASE WHEN attivo = 1 THEN 1 END) as attivi,
        COUNT(CASE WHEN attivo = 0 THEN 1 END) as inattivi,
        COUNT(CASE WHEN prezzo_acquisto > 0 THEN 1 END) as con_prezzo_acquisto,
        COUNT(CASE WHEN prezzo_vendita > 0 THEN 1 END) as con_prezzo_vendita,
        COUNT(CASE WHEN scorta_minima > 0 THEN 1 END) as con_scorta_minima,
        AVG(prezzo_vendita) as prezzo_medio
      FROM prodotti 
      WHERE committente_id = ?
    `);
    
    return stmt.get(committente_id) as {
      totali: number;
      attivi: number;
      inattivi: number;
      con_prezzo_acquisto: number;
      con_prezzo_vendita: number;
      con_scorta_minima: number;
      prezzo_medio: number;
    };
  },

  // UTILITY - Conteggio prodotti per categoria
  countByCategoria(committente_id: number, categoria_id: number): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM prodotti 
      WHERE committente_id = ? AND categoria_id = ?
    `);
    
    const { count } = stmt.get(committente_id, categoria_id) as { count: number };
    return count;
  },

  // UTILITY - Valore totale magazzino per committente
  getStockValue(committente_id: number) {
    const stmt = db.prepare(`
      SELECT 
        COALESCE(SUM(g.quantita * g.valore_medio), 0) as valore_totale,
        COALESCE(SUM(g.quantita), 0) as quantita_totale,
        COUNT(DISTINCT p.id) as prodotti_con_giacenza
      FROM prodotti p
      INNER JOIN giacenze g ON g.prodotto_id = p.id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ? AND p.attivo = 1
    `);
    
    return stmt.get(committente_id) as {
      valore_totale: number;
      quantita_totale: number;
      prodotti_con_giacenza: number;
    };
  },

  // UTILITY - Prodotti più movimentati
  getMostMovedProducts(committente_id: number, limit: number = 10) {
    const stmt = db.prepare(`
      SELECT 
        p.id,
        p.codice,
        p.descrizione,
        c.descrizione as categoria_descrizione,
        COUNT(m.id) as movimenti_count,
        COALESCE(SUM(m.quantita), 0) as quantita_totale,
        MAX(m.data_movimento) as ultimo_movimento
      FROM prodotti p
      INNER JOIN categorie c ON c.id = p.categoria_id AND c.committente_id = p.committente_id
      LEFT JOIN movimenti m ON m.prodotto_id = p.id AND m.committente_id_origine = p.committente_id
      WHERE p.committente_id = ?
      GROUP BY p.id
      ORDER BY movimenti_count DESC, quantita_totale DESC
      LIMIT ?
    `);
    
    return stmt.all(committente_id, limit) as Array<{
      id: number;
      codice: string;
      descrizione: string;
      categoria_descrizione: string;
      movimenti_count: number;
      quantita_totale: number;
      ultimo_movimento: string | null;
    }>;
  },

  // UTILITY - Suggerimenti per autocompletamento
  getSuggestions(committente_id: number, query: string, limit: number = 10): Array<{
    id: number;
    codice: string;
    descrizione: string;
    categoria_descrizione: string;
    prezzo_vendita: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        p.id,
        p.codice,
        p.descrizione,
        c.descrizione as categoria_descrizione,
        p.prezzo_vendita
      FROM prodotti p
      INNER JOIN categorie c ON c.id = p.categoria_id AND c.committente_id = p.committente_id
      WHERE p.committente_id = ? 
        AND p.attivo = 1
        AND (p.descrizione LIKE ? OR p.codice LIKE ?)
      ORDER BY 
        CASE WHEN p.codice = ? THEN 0 ELSE 1 END,
        CASE WHEN p.descrizione = ? THEN 0 ELSE 1 END,
        LENGTH(p.descrizione),
        p.descrizione
      LIMIT ?
    `);
    
    const searchTerm = `${query}%`;
    return stmt.all(
      committente_id, 
      searchTerm, 
      searchTerm, 
      query, 
      query, 
      limit
    ) as Array<{
      id: number;
      codice: string;
      descrizione: string;
      categoria_descrizione: string;
      prezzo_vendita: number;
    }>;
  },

  // ADMIN - Copia prodotti tra committenti (con validazioni)
  copyFromTemplate(source_committente_id: number, target_committente_id: number): number {
    const sourceProdotti = this.findByCommittente(source_committente_id);
    let copied = 0;

    const transaction = db.transaction(() => {
      for (const prodotto of sourceProdotti) {
        try {
          // Verifica se il codice è già utilizzato nel committente destinazione
          if (!this.isCodeAvailable(target_committente_id, prodotto.codice)) {
            continue; // Salta se codice già esistente
          }

          // Verifica che categoria e unità di misura esistano per il committente target
          const checkCategoria = db.prepare(`
            SELECT id FROM categorie 
            WHERE id = ? AND committente_id = ?
          `);
          const categoria = checkCategoria.get(prodotto.categoria_id, target_committente_id);
          if (!categoria) continue;

          // Per unità di misura, accetta sia globali che specifiche per committente
          const checkUnita = db.prepare(`
            SELECT id FROM unita_misura 
            WHERE id = ? AND (committente_id IS NULL OR committente_id = ?)
          `);
          const unita = checkUnita.get(prodotto.unita_misura_id, target_committente_id);
          if (!unita) continue;

          this.create(target_committente_id, {
            codice: prodotto.codice,
            descrizione: prodotto.descrizione,
            categoria_id: prodotto.categoria_id,
            unita_misura_id: prodotto.unita_misura_id,
            prezzo_acquisto: prodotto.prezzo_acquisto,
            prezzo_vendita: prodotto.prezzo_vendita,
            scorta_minima: prodotto.scorta_minima,
            scorta_massima: prodotto.scorta_massima,
            ubicazione: prodotto.ubicazione,
            lotto_partita: prodotto.lotto_partita,
            note: prodotto.note,
            attivo: prodotto.attivo
          });

          copied++;
        } catch (error) {
          console.warn(`Prodotto ${prodotto.codice} non copiato:`, error);
        }
      }
    });

    transaction();
    return copied;
  }
};