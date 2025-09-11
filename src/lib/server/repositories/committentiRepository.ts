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

  // DELETE - Hard delete con cascata (ATTENZIONE: elimina tutto il magazzino)
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
      throw new Error('Impossibile eliminare: committente ha dati collegati. Utilizzare soft delete o cascading delete.');
    }
    
    const stmt = db.prepare('DELETE FROM committenti WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // DELETE - Cascading delete completo (PERICOLOSO: elimina tutto il magazzino del committente)
  cascadeDelete(id: number): { 
    success: boolean; 
    deletedRecords: { 
      prodotti: number; 
      movimenti: number; 
      giacenze: number; 
      categorie: number; 
      unita_misura: number; 
      utenti: number; 
      ordini: number; 
      committente: boolean; 
    } 
  } {
    // Inizia una transazione per garantire atomicità
    const transaction = db.transaction(() => {
      const deletedRecords = {
        prodotti: 0,
        movimenti: 0,
        giacenze: 0,
        categorie: 0,
        unita_misura: 0,
        utenti: 0,
        ordini: 0,
        committente: false
      };

      // 1. Elimina giacenze del committente
      let stmt = db.prepare('DELETE FROM giacenze WHERE committente_id = ?');
      let result = stmt.run(id);
      deletedRecords.giacenze = result.changes;

      // 2. Elimina movimenti dove il committente è origine o destinazione
      stmt = db.prepare(`
        DELETE FROM movimenti 
        WHERE committente_id_origine = ? OR committente_id_destinazione = ?
      `);
      result = stmt.run(id, id);
      deletedRecords.movimenti = result.changes;

      // 3. Elimina ordini del committente
      stmt = db.prepare('DELETE FROM ordini WHERE committente_id = ?');
      result = stmt.run(id);
      deletedRecords.ordini = result.changes;

      // 4. Elimina prodotti del committente
      stmt = db.prepare('DELETE FROM prodotti WHERE committente_id = ?');
      result = stmt.run(id);
      deletedRecords.prodotti = result.changes;

      // 5. Elimina categorie del committente
      stmt = db.prepare('DELETE FROM categorie WHERE committente_id = ?');
      result = stmt.run(id);
      deletedRecords.categorie = result.changes;

      // 6. Elimina unità di misura personalizzate del committente
      stmt = db.prepare('DELETE FROM unita_misura WHERE committente_id = ?');
      result = stmt.run(id);
      deletedRecords.unita_misura = result.changes;

      // 7. Disassocia utenti dal committente (non li elimina)
      stmt = db.prepare('UPDATE utenti SET committente_id = NULL WHERE committente_id = ?');
      result = stmt.run(id);
      deletedRecords.utenti = result.changes;

      // 8. Elimina relazioni committente-fornitori
      stmt = db.prepare('DELETE FROM committenti_fornitori WHERE committente_id = ?');
      stmt.run(id);

      // 9. Elimina inventari del committente
      stmt = db.prepare('DELETE FROM inventari WHERE committente_id = ?');
      stmt.run(id);

      // 10. Elimina audit trail del committente
      stmt = db.prepare('DELETE FROM audit_trail WHERE committente_id = ?');
      stmt.run(id);

      // 11. Elimina giacenze logiche/fisiche/ownership
      stmt = db.prepare('DELETE FROM giacenze_logiche WHERE committente_id = ?');
      stmt.run(id);
      
      stmt = db.prepare('DELETE FROM giacenze_ownership WHERE committente_id = ?');
      stmt.run(id);

      stmt = db.prepare('DELETE FROM prodotti_committente_v2 WHERE committente_id = ?');
      stmt.run(id);

      stmt = db.prepare('DELETE FROM movimenti_ottimizzati WHERE committente_id = ?');
      stmt.run(id);

      // 12. Infine, elimina il committente stesso
      stmt = db.prepare('DELETE FROM committenti WHERE id = ?');
      result = stmt.run(id);
      deletedRecords.committente = result.changes > 0;

      return deletedRecords;
    });

    try {
      const deletedRecords = transaction();
      return { success: true, deletedRecords };
    } catch (error) {
      console.error('Errore durante la cancellazione in cascata:', error);
      return { 
        success: false, 
        deletedRecords: {
          prodotti: 0, movimenti: 0, giacenze: 0, categorie: 0,
          unita_misura: 0, utenti: 0, ordini: 0, committente: false
        } 
      };
    }
  },

  // UTILITY - Conta tutti i record collegati al committente
  getRelatedRecordsCount(id: number): {
    prodotti: number;
    movimenti: number;
    giacenze: number;
    categorie: number;
    unita_misura: number;
    utenti: number;
    ordini: number;
    fornitori: number;
    inventari: number;
    total: number;
  } {
    const stmt = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM prodotti WHERE committente_id = ?) as prodotti,
        (SELECT COUNT(*) FROM movimenti WHERE committente_id_origine = ? OR committente_id_destinazione = ?) as movimenti,
        (SELECT COUNT(*) FROM giacenze WHERE committente_id = ?) as giacenze,
        (SELECT COUNT(*) FROM categorie WHERE committente_id = ?) as categorie,
        (SELECT COUNT(*) FROM unita_misura WHERE committente_id = ?) as unita_misura,
        (SELECT COUNT(*) FROM utenti WHERE committente_id = ?) as utenti,
        (SELECT COUNT(*) FROM ordini WHERE committente_id = ?) as ordini,
        (SELECT COUNT(*) FROM committenti_fornitori WHERE committente_id = ?) as fornitori,
        (SELECT COUNT(*) FROM inventari WHERE committente_id = ?) as inventari
    `);
    
    const result = stmt.get(id, id, id, id, id, id, id, id, id, id) as any;
    
    result.total = result.prodotti + result.movimenti + result.giacenze + 
                   result.categorie + result.unita_misura + result.utenti + 
                   result.ordini + result.fornitori + result.inventari;
    
    return result;
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