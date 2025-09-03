import db from '../database';
import type { Committente, CommittenteInput, CommittenteUpdate, CommittenteFilters, PaginatedResult, CommittenteWithStats } from '$lib/types';

export const committentiRepository = {
  // CREATE - Crea nuovo committente
  create(data: CommittenteInput): Committente {
    const stmt = db.prepare(`
      INSERT INTO committenti (
        codice, ragione_sociale, partita_iva, codice_fiscale,
        indirizzo_sede, indirizzo_fatturazione, cap, citta, provincia,
        telefono, email, pec, referente_principale, tipo_contratto,
        data_inizio_rapporto, data_fine_rapporto, stato, note
      ) VALUES (
        @codice, @ragione_sociale, @partita_iva, @codice_fiscale,
        @indirizzo_sede, @indirizzo_fatturazione, @cap, @citta, @provincia,
        @telefono, @email, @pec, @referente_principale, @tipo_contratto,
        @data_inizio_rapporto, @data_fine_rapporto, @stato, @note
      )
    `);
    
    // Prepara i dati con valori di default per campi opzionali
    const insertData = {
      codice: data.codice,
      ragione_sociale: data.ragione_sociale,
      partita_iva: data.partita_iva || null,
      codice_fiscale: data.codice_fiscale || null,
      indirizzo_sede: data.indirizzo_sede || null,
      indirizzo_fatturazione: data.indirizzo_fatturazione || null,
      cap: data.cap || null,
      citta: data.citta || null,
      provincia: data.provincia || null,
      telefono: data.telefono || null,
      email: data.email || null,
      pec: data.pec || null,
      referente_principale: data.referente_principale || null,
      tipo_contratto: data.tipo_contratto || 'deposito',
      data_inizio_rapporto: data.data_inizio_rapporto || null,
      data_fine_rapporto: data.data_fine_rapporto || null,
      stato: data.stato || 'attivo',
      note: data.note || null
    };
    
    const result = stmt.run(insertData);
    return this.findById(Number(result.lastInsertRowid))!;
  },

  // READ - Lista completa con filtri opzionali
  findAll(filters?: CommittenteFilters): Committente[] {
    let query = 'SELECT * FROM committenti';
    const conditions: string[] = [];
    const params: any = {};

    if (filters?.stato) {
      conditions.push('stato = @stato');
      params.stato = filters.stato;
    }

    if (filters?.tipo_contratto) {
      conditions.push('tipo_contratto = @tipo_contratto');
      params.tipo_contratto = filters.tipo_contratto;
    }

    if (filters?.search) {
      conditions.push('(ragione_sociale LIKE @search OR codice LIKE @search OR email LIKE @search)');
      params.search = `%${filters.search}%`;
    }

    if (filters?.data_inizio_da) {
      conditions.push('data_inizio_rapporto >= @data_inizio_da');
      params.data_inizio_da = filters.data_inizio_da;
    }

    if (filters?.data_inizio_a) {
      conditions.push('data_inizio_rapporto <= @data_inizio_a');
      params.data_inizio_a = filters.data_inizio_a;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ragione_sociale ASC';

    const stmt = db.prepare(query);
    return stmt.all(params) as Committente[];
  },

  // READ - Lista paginata
  findPaginated(page: number = 1, limit: number = 10, filters?: CommittenteFilters): PaginatedResult<Committente> {
    const offset = (page - 1) * limit;
    
    // Query per il conteggio totale
    let countQuery = 'SELECT COUNT(*) as total FROM committenti';
    const conditions: string[] = [];
    const params: any = {};

    // Applica gli stessi filtri per il conteggio
    if (filters?.stato) {
      conditions.push('stato = @stato');
      params.stato = filters.stato;
    }

    if (filters?.tipo_contratto) {
      conditions.push('tipo_contratto = @tipo_contratto');
      params.tipo_contratto = filters.tipo_contratto;
    }

    if (filters?.search) {
      conditions.push('(ragione_sociale LIKE @search OR codice LIKE @search OR email LIKE @search)');
      params.search = `%${filters.search}%`;
    }

    if (filters?.data_inizio_da) {
      conditions.push('data_inizio_rapporto >= @data_inizio_da');
      params.data_inizio_da = filters.data_inizio_da;
    }

    if (filters?.data_inizio_a) {
      conditions.push('data_inizio_rapporto <= @data_inizio_a');
      params.data_inizio_a = filters.data_inizio_a;
    }

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(params) as { total: number };

    // Query per i dati
    let dataQuery = 'SELECT * FROM committenti';
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    dataQuery += ' ORDER BY ragione_sociale ASC LIMIT @limit OFFSET @offset';

    const dataStmt = db.prepare(dataQuery);
    const data = dataStmt.all({ ...params, limit, offset }) as Committente[];

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  // READ - Singolo per ID
  findById(id: number): Committente | null {
    const stmt = db.prepare('SELECT * FROM committenti WHERE id = ?');
    return stmt.get(id) as Committente || null;
  },

  // READ - Ricerca per codice (deve essere univoco)
  findByCodice(codice: string): Committente | null {
    const stmt = db.prepare('SELECT * FROM committenti WHERE codice = ? COLLATE NOCASE');
    return stmt.get(codice) as Committente || null;
  },

  // READ - Ricerca per email
  findByEmail(email: string): Committente | null {
    const stmt = db.prepare('SELECT * FROM committenti WHERE email = ? COLLATE NOCASE');
    return stmt.get(email) as Committente || null;
  },

  // READ - Lista committenti attivi (per select)
  findActive(): Committente[] {
    const stmt = db.prepare('SELECT * FROM committenti WHERE stato = ? ORDER BY ragione_sociale ASC');
    return stmt.all('attivo') as Committente[];
  },

  // READ - Committenti con statistiche
  findWithStats(): CommittenteWithStats[] {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as num_prodotti,
        COUNT(DISTINCT CASE 
          WHEN m.data_movimento >= date('now', 'start of month') 
          THEN m.id 
        END) as num_movimenti_mese,
        COALESCE(SUM(g.quantita * g.valore_medio), 0) as valore_giacenza
      FROM committenti c
      LEFT JOIN prodotti p ON c.id = p.committente_id AND p.attivo = 1
      LEFT JOIN movimenti m ON c.id = m.committente_id_origine
      LEFT JOIN giacenze g ON c.id = g.committente_id
      GROUP BY c.id
      ORDER BY c.ragione_sociale ASC
    `);
    return stmt.all() as CommittenteWithStats[];
  },

  // UPDATE - Aggiorna committente
  update(id: number, data: CommittenteUpdate): Committente | null {
    const fields: string[] = [];
    const params: any = { id };
    
    // Costruisce dinamicamente la query di UPDATE solo con i campi forniti
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fields.push(`${key} = @${key}`);
        params[key] = value;
      }
    });
    
    if (fields.length === 0) {
      return this.findById(id); // Nessun campo da aggiornare
    }
    
    const stmt = db.prepare(`
      UPDATE committenti 
      SET ${fields.join(', ')}
      WHERE id = @id
    `);
    
    const result = stmt.run(params);
    
    if (result.changes === 0) {
      return null; // Committente non trovato
    }
    
    return this.findById(id);
  },

  // DELETE - Soft delete (cambia stato a 'cessato')
  softDelete(id: number): boolean {
    const stmt = db.prepare(`
      UPDATE committenti 
      SET stato = 'cessato', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // DELETE - Hard delete (ATTENZIONE: elimina definitivamente)
  delete(id: number): boolean {
    // Verifica che non ci siano dati collegati
    const checkStmt = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM prodotti WHERE committente_id = ?) +
        (SELECT COUNT(*) FROM movimenti WHERE committente_id_origine = ?) +
        (SELECT COUNT(*) FROM giacenze WHERE committente_id = ?) +
        (SELECT COUNT(*) FROM categorie WHERE committente_id = ?) as total
    `);
    
    const { total } = checkStmt.get(id, id, id, id) as { total: number };
    
    if (total > 0) {
      throw new Error('Impossibile eliminare: committente ha dati collegati. Utilizzare soft delete.');
    }
    
    const stmt = db.prepare('DELETE FROM committenti WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // UTILITY - Verifica se codice è disponibile
  isCodeAvailable(codice: string, excludeId?: number): boolean {
    let query = 'SELECT COUNT(*) as count FROM committenti WHERE codice = ? COLLATE NOCASE';
    const params: any[] = [codice];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = db.prepare(query);
    const { count } = stmt.get(...params) as { count: number };
    
    return count === 0;
  },

  // UTILITY - Verifica se email è disponibile
  isEmailAvailable(email: string, excludeId?: number): boolean {
    let query = 'SELECT COUNT(*) as count FROM committenti WHERE email = ? COLLATE NOCASE';
    const params: any[] = [email];
    
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
        COUNT(*) as totale,
        COUNT(CASE WHEN stato = 'attivo' THEN 1 END) as attivi,
        COUNT(CASE WHEN stato = 'sospeso' THEN 1 END) as sospesi,
        COUNT(CASE WHEN stato = 'cessato' THEN 1 END) as cessati,
        COUNT(CASE WHEN tipo_contratto = 'deposito' THEN 1 END) as deposito,
        COUNT(CASE WHEN tipo_contratto = 'logistica' THEN 1 END) as logistica,
        COUNT(CASE WHEN tipo_contratto = 'misto' THEN 1 END) as misto
      FROM committenti
    `);
    
    return stmt.get() as {
      totale: number;
      attivi: number;
      sospesi: number;
      cessati: number;
      deposito: number;
      logistica: number;
      misto: number;
    };
  }
};