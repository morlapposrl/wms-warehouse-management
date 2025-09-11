import db from '../database';

export interface TipoUDC {
  id: number;
  codice: string;
  nome: string;
  descrizione?: string;
  categoria: 'PALLET' | 'CONTAINER' | 'BOX' | 'ROLL' | 'CUSTOM';
  lunghezza_cm: number;
  larghezza_cm: number;
  altezza_max_cm: number;
  peso_max_kg: number;
  volume_max_cm3: number;
  impilabile: boolean;
  max_stack: number;
  riutilizzabile: boolean;
  costo_acquisto?: number;
  costo_noleggio_giorno?: number;
  attivo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UDC {
  id?: number;
  barcode: string;
  tipo_udc_id: number;
  stato: 'VUOTO' | 'PARZIALE' | 'PIENO' | 'IN_MOVIMENTO' | 'BLOCCATO' | 'DANNEGGIATO';
  committente_proprietario_id?: number;
  ubicazione_attuale_id?: number;
  
  // Specifiche fisiche (override rispetto al tipo)
  lunghezza_cm?: number;
  larghezza_cm?: number;
  altezza_max_cm?: number;
  peso_max_kg?: number;
  
  // Tracking corrente
  peso_attuale_kg?: number;
  altezza_attuale_cm?: number;
  volume_occupato_cm3?: number;
  numero_sku_diversi?: number;
  percentuale_riempimento?: number;
  
  // Metadati
  data_creazione?: string;
  ultimo_movimento?: string;
  operatore_ultimo_movimento?: number;
  note?: string;
  qr_code?: string;
}

export interface UDCConTipo extends UDC {
  tipo_udc?: TipoUDC;
}

export interface UDCContenuto {
  id?: number;
  udc_id: number;
  prodotto_id: number;
  quantita: number;
  lotto?: string;
  scadenza?: string;
  posizione_in_udc?: string;
  peso_kg?: number;
  volume_cm3?: number;
  data_inserimento?: string;
  operatore_inserimento?: number;
  note_contenuto?: string;
}

export interface UDCMovimento {
  id?: number;
  udc_id: number;
  tipo_movimento: 'CREAZIONE' | 'CARICO' | 'SCARICO' | 'TRASFERIMENTO' | 'SPLIT' | 'MERGE' | 'INVENTARIO' | 'BLOCCO' | 'SBLOCCO' | 'DANNEGGIAMENTO' | 'RIPARAZIONE' | 'ELIMINAZIONE';
  ubicazione_da_id?: number;
  ubicazione_a_id?: number;
  operatore_id: number;
  wave_id?: number;
  ordine_id?: number;
  
  quantita_movimentata?: number;
  prodotti_coinvolti?: string;
  peso_prima_kg?: number;
  peso_dopo_kg?: number;
  
  data_inizio?: string;
  data_fine?: string;
  durata_secondi?: number;
  distanza_metri?: number;
  device_id?: string;
  
  note_movimento?: string;
  costo_movimento?: number;
}

export const udcRepository = {
  // CRUD UDC
  createUDC(data: Omit<UDC, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO udc (
        barcode, tipo_udc_id, stato, committente_proprietario_id, ubicazione_attuale_id,
        lunghezza_cm, larghezza_cm, altezza_max_cm, peso_max_kg,
        peso_attuale_kg, altezza_attuale_cm, volume_occupato_cm3, numero_sku_diversi,
        operatore_ultimo_movimento, note, qr_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.barcode,
      data.tipo_udc_id,
      data.stato,
      data.committente_proprietario_id || null,
      data.ubicazione_attuale_id || null,
      data.lunghezza_cm || null,
      data.larghezza_cm || null,
      data.altezza_max_cm || null,
      data.peso_max_kg || null,
      data.peso_attuale_kg || 0,
      data.altezza_attuale_cm || 0,
      data.volume_occupato_cm3 || 0,
      data.numero_sku_diversi || 0,
      data.operatore_ultimo_movimento || null,
      data.note || null,
      data.qr_code || null
    );
    
    return result.lastInsertRowid as number;
  },

  getAllUDC(filters?: {
    committente_id?: number;
    stato?: string;
    tipo_udc_id?: number;
    ubicazione_id?: number;
    barcode?: string;
  }): UDCConTipo[] {
    let query = `
      SELECT 
        u.*,
        t.codice as tipo_codice,
        t.nome as tipo_nome,
        t.categoria as tipo_categoria,
        t.lunghezza_cm as tipo_lunghezza_cm,
        t.larghezza_cm as tipo_larghezza_cm,
        t.altezza_max_cm as tipo_altezza_max_cm,
        t.peso_max_kg as tipo_peso_max_kg,
        t.impilabile as tipo_impilabile,
        t.max_stack as tipo_max_stack,
        c.ragione_sociale as committente_nome,
        ub.codice_ubicazione,
        ub.zona,
        COUNT(uc.id) as righe_contenuto,
        SUM(uc.quantita) as pezzi_totali,
        GROUP_CONCAT(p.codice, ', ') as prodotti_codici,
        strftime('%d-%m-%Y %H:%M', u.ultimo_movimento, 'localtime') as ultimo_movimento_formatted
      FROM udc u
      LEFT JOIN tipi_udc t ON u.tipo_udc_id = t.id
      LEFT JOIN committenti c ON u.committente_proprietario_id = c.id
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      LEFT JOIN udc_contenuto uc ON u.id = uc.udc_id
      LEFT JOIN prodotti p ON uc.prodotto_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters?.committente_id) {
      query += ' AND u.committente_proprietario_id = ?';
      params.push(filters.committente_id);
    }
    if (filters?.stato) {
      query += ' AND u.stato = ?';
      params.push(filters.stato);
    }
    if (filters?.tipo_udc_id) {
      query += ' AND u.tipo_udc_id = ?';
      params.push(filters.tipo_udc_id);
    }
    if (filters?.ubicazione_id) {
      query += ' AND u.ubicazione_attuale_id = ?';
      params.push(filters.ubicazione_id);
    }
    if (filters?.barcode) {
      query += ' AND u.barcode LIKE ?';
      params.push(`%${filters.barcode}%`);
    }
    
    query += ` 
      GROUP BY u.id
      ORDER BY u.ultimo_movimento DESC
    `;
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  getUDCById(id: number): UDCConTipo | null {
    const stmt = db.prepare(`
      SELECT 
        u.*,
        t.codice as tipo_codice,
        t.nome as tipo_nome,
        t.categoria as tipo_categoria,
        t.lunghezza_cm as tipo_lunghezza_cm,
        t.larghezza_cm as tipo_larghezza_cm,
        t.altezza_max_cm as tipo_altezza_max_cm,
        t.peso_max_kg as tipo_peso_max_kg,
        t.impilabile as tipo_impilabile,
        t.max_stack as tipo_max_stack,
        c.ragione_sociale as committente_nome,
        ub.codice_ubicazione,
        ub.zona,
        strftime('%d-%m-%Y %H:%M', u.ultimo_movimento, 'localtime') as ultimo_movimento_formatted
      FROM udc u
      LEFT JOIN tipi_udc t ON u.tipo_udc_id = t.id
      LEFT JOIN committenti c ON u.committente_proprietario_id = c.id
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      WHERE u.id = ?
    `);
    
    return stmt.get(id) as UDCConTipo | null;
  },

  getUDCByBarcode(barcode: string): any | null {
    const stmt = db.prepare(`
      SELECT 
        u.*,
        c.ragione_sociale as committente_nome,
        ub.codice_ubicazione,
        ub.zona,
        strftime('%d-%m-%Y %H:%M', u.ultimo_movimento, 'localtime') as ultimo_movimento_formatted
      FROM udc u
      LEFT JOIN committenti c ON u.committente_proprietario_id = c.id
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      WHERE u.barcode = ?
    `);
    
    return stmt.get(barcode);
  },

  updateUDC(id: number, data: Partial<UDC>): void {
    const fields = [];
    const values = [];
    
    if (data.stato !== undefined) {
      fields.push('stato = ?');
      values.push(data.stato);
    }
    if (data.ubicazione_attuale_id !== undefined) {
      fields.push('ubicazione_attuale_id = ?');
      values.push(data.ubicazione_attuale_id);
    }
    if (data.note !== undefined) {
      fields.push('note = ?');
      values.push(data.note);
    }
    if (data.operatore_ultimo_movimento !== undefined) {
      fields.push('operatore_ultimo_movimento = ?, ultimo_movimento = CURRENT_TIMESTAMP');
      values.push(data.operatore_ultimo_movimento);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE udc SET ${fields.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
  },

  deleteUDC(id: number): void {
    const stmt = db.prepare('DELETE FROM udc WHERE id = ?');
    stmt.run(id);
  },

  // CRUD UDC Contenuto
  addContenutoUDC(data: Omit<UDCContenuto, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO udc_contenuto (
        udc_id, prodotto_id, quantita, lotto, scadenza, posizione_in_udc,
        peso_kg, volume_cm3, operatore_inserimento, note_contenuto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.udc_id,
      data.prodotto_id,
      data.quantita,
      data.lotto || null,
      data.scadenza || null,
      data.posizione_in_udc || null,
      data.peso_kg || null,
      data.volume_cm3 || null,
      data.operatore_inserimento || null,
      data.note_contenuto || null
    );
    
    return result.lastInsertRowid as number;
  },

  getContenutoUDC(udc_id: number): any[] {
    const stmt = db.prepare(`
      SELECT 
        uc.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        p.unita_misura_id,
        um.descrizione as unita_misura,
        u.nome as operatore_nome,
        strftime('%d-%m-%Y %H:%M', uc.data_inserimento, 'localtime') as data_inserimento_formatted
      FROM udc_contenuto uc
      JOIN prodotti p ON uc.prodotto_id = p.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      LEFT JOIN utenti u ON uc.operatore_inserimento = u.id
      WHERE uc.udc_id = ?
      ORDER BY uc.data_inserimento DESC
    `);
    
    return stmt.all(udc_id);
  },

  removeContenutoUDC(udc_id: number, prodotto_id: number, quantita?: number): void {
    if (quantita) {
      // Rimozione parziale
      const stmt = db.prepare(`
        UPDATE udc_contenuto 
        SET quantita = quantita - ?
        WHERE udc_id = ? AND prodotto_id = ? AND quantita >= ?
      `);
      stmt.run(quantita, udc_id, prodotto_id, quantita);
      
      // Rimuovi se quantità diventa 0
      const cleanup = db.prepare(`
        DELETE FROM udc_contenuto 
        WHERE udc_id = ? AND prodotto_id = ? AND quantita <= 0
      `);
      cleanup.run(udc_id, prodotto_id);
    } else {
      // Rimozione totale
      const stmt = db.prepare(`
        DELETE FROM udc_contenuto 
        WHERE udc_id = ? AND prodotto_id = ?
      `);
      stmt.run(udc_id, prodotto_id);
    }
  },

  // Movimenti UDC
  createMovimentoUDC(data: Omit<UDCMovimento, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO udc_movimenti (
        udc_id, tipo_movimento, ubicazione_da_id, ubicazione_a_id, operatore_id,
        wave_id, ordine_id, quantita_movimentata, prodotti_coinvolti,
        peso_prima_kg, peso_dopo_kg, durata_secondi, distanza_metri,
        device_id, note_movimento, costo_movimento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.udc_id,
      data.tipo_movimento,
      data.ubicazione_da_id || null,
      data.ubicazione_a_id || null,
      data.operatore_id,
      data.wave_id || null,
      data.ordine_id || null,
      data.quantita_movimentata || null,
      data.prodotti_coinvolti || null,
      data.peso_prima_kg || null,
      data.peso_dopo_kg || null,
      data.durata_secondi || null,
      data.distanza_metri || null,
      data.device_id || null,
      data.note_movimento || null,
      data.costo_movimento || null
    );
    
    return result.lastInsertRowid as number;
  },

  getMovimentiUDC(udc_id: number, limit: number = 50): any[] {
    // Unisce movimenti da entrambe le tabelle per una vista completa
    const stmt = db.prepare(`
      SELECT 
        tipo_movimento,
        ubicazione_da,
        ubicazione_a,
        operatore_nome,
        data_inizio_formatted,
        quantita_movimentata,
        durata_secondi,
        note_movimento,
        ordine_cronologico
      FROM (
        -- Movimenti UDC specifici (creazione, trasferimenti UDC, ecc.)
        SELECT 
          um.tipo_movimento,
          ub_da.codice_ubicazione as ubicazione_da,
          ub_a.codice_ubicazione as ubicazione_a,
          u.nome as operatore_nome,
          strftime('%d-%m-%Y %H:%M', um.data_inizio, 'localtime') as data_inizio_formatted,
          um.quantita_movimentata,
          um.durata_secondi,
          um.note_movimento,
          um.data_inizio as ordine_cronologico
        FROM udc_movimenti um
        LEFT JOIN ubicazioni ub_da ON um.ubicazione_da_id = ub_da.id
        LEFT JOIN ubicazioni ub_a ON um.ubicazione_a_id = ub_a.id
        LEFT JOIN utenti u ON um.operatore_id = u.id
        WHERE um.udc_id = ?
        
        UNION ALL
        
        -- Movimenti prodotti collegati all'UDC
        SELECT 
          m.tipo_movimento,
          ub.codice_ubicazione as ubicazione_da,
          ub.codice_ubicazione as ubicazione_a,
          m.operatore as operatore_nome,
          strftime('%d-%m-%Y %H:%M', m.data_movimento, 'localtime') as data_inizio_formatted,
          m.quantita as quantita_movimentata,
          NULL as durata_secondi,
          COALESCE(m.note, 'Movimento prodotto: ' || p.descrizione) as note_movimento,
          m.data_movimento as ordine_cronologico
        FROM movimenti m
        LEFT JOIN ubicazioni ub ON m.ubicazione_id = ub.id
        LEFT JOIN prodotti p ON m.prodotto_id = p.id
        WHERE m.udc_id = ?
      )
      ORDER BY ordine_cronologico DESC
      LIMIT ?
    `);
    
    return stmt.all(udc_id, udc_id, limit);
  },

  // Statistiche UDC
  getStatisticheUDC(committente_id?: number): any {
    let query = `
      SELECT 
        COUNT(*) as totale_udc,
        COUNT(CASE WHEN stato = 'VUOTO' THEN 1 END) as udc_vuoti,
        COUNT(CASE WHEN stato = 'PARZIALE' THEN 1 END) as udc_parziali,
        COUNT(CASE WHEN stato = 'PIENO' THEN 1 END) as udc_pieni,
        COUNT(CASE WHEN stato = 'IN_MOVIMENTO' THEN 1 END) as udc_in_movimento,
        COUNT(CASE WHEN stato = 'BLOCCATO' THEN 1 END) as udc_bloccati,
        AVG(percentuale_riempimento) as riempimento_medio,
        SUM(peso_attuale_kg) as peso_totale,
        COUNT(DISTINCT ubicazione_attuale_id) as ubicazioni_occupate
      FROM udc
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (committente_id) {
      query += ' AND committente_proprietario_id = ?';
      params.push(committente_id);
    }
    
    const stmt = db.prepare(query);
    return stmt.get(...params);
  },

  // UDC per Wave Planning
  getUDCPerWavePicking(filters: {
    committente_id?: number;
    prodotto_ids?: number[];
    zona?: string;
    stato?: string[];
  }): any[] {
    let query = `
      SELECT DISTINCT
        u.id as udc_id,
        u.barcode,
        -- u.tipo_udc,  -- RIMOSSO: campo non esistente 
        u.stato,
        u.ubicazione_attuale_id,
        ub.codice_ubicazione,
        ub.zona,
        u.peso_attuale_kg,
        u.percentuale_riempimento,
        uc.prodotto_id,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        uc.quantita,
        uc.lotto,
        uc.posizione_in_udc
      FROM udc u
      INNER JOIN udc_contenuto uc ON u.id = uc.udc_id
      INNER JOIN prodotti p ON uc.prodotto_id = p.id
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.committente_id) {
      query += ' AND u.committente_proprietario_id = ?';
      params.push(filters.committente_id);
    }
    if (filters.prodotto_ids && filters.prodotto_ids.length > 0) {
      const placeholders = filters.prodotto_ids.map(() => '?').join(',');
      query += ` AND uc.prodotto_id IN (${placeholders})`;
      params.push(...filters.prodotto_ids);
    }
    if (filters.zona) {
      query += ' AND ub.zona = ?';
      params.push(filters.zona);
    }
    if (filters.stato && filters.stato.length > 0) {
      const placeholders = filters.stato.map(() => '?').join(',');
      query += ` AND u.stato IN (${placeholders})`;
      params.push(...filters.stato);
    }
    
    query += ' ORDER BY ub.zona, u.barcode, uc.prodotto_id';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  // GESTIONE TIPI UDC
  getAllTipiUDC(): TipoUDC[] {
    const stmt = db.prepare(`
      SELECT * FROM tipi_udc 
      WHERE attivo = 1 
      ORDER BY categoria, nome
    `);
    return stmt.all() as TipoUDC[];
  },

  getTipoUDCById(id: number): TipoUDC | null {
    const stmt = db.prepare(`
      SELECT * FROM tipi_udc WHERE id = ?
    `);
    return stmt.get(id) as TipoUDC | null;
  },

  getTipoUDCByCode(codice: string): TipoUDC | null {
    const stmt = db.prepare(`
      SELECT * FROM tipi_udc WHERE codice = ?
    `);
    return stmt.get(codice) as TipoUDC | null;
  },

  createTipoUDC(data: Omit<TipoUDC, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = db.prepare(`
      INSERT INTO tipi_udc (
        codice, nome, descrizione, categoria, lunghezza_cm, larghezza_cm, 
        altezza_max_cm, peso_max_kg, impilabile, max_stack, riutilizzabile,
        costo_acquisto, costo_noleggio_giorno, attivo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = stmt.run(
      data.codice, data.nome, data.descrizione || null, data.categoria,
      data.lunghezza_cm, data.larghezza_cm, data.altezza_max_cm, data.peso_max_kg,
      data.impilabile ? 1 : 0, data.max_stack, data.riutilizzabile ? 1 : 0,
      data.costo_acquisto || null, data.costo_noleggio_giorno || null, data.attivo ? 1 : 0
    );
    
    return result.lastInsertRowid as number;
  },

  updateTipoUDC(id: number, data: Partial<Omit<TipoUDC, 'id' | 'created_at' | 'updated_at'>>): boolean {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = datetime(\'now\')');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE tipi_udc SET ${fields.join(', ')} WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    return result.changes > 0;
  },

  deleteTipoUDC(id: number): boolean {
    // Controllo se ci sono UDC che usano questo tipo
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM udc WHERE tipo_udc_id = ?');
    const count = checkStmt.get(id) as { count: number };
    
    if (count.count > 0) {
      throw new Error('Impossibile eliminare: tipo UDC utilizzato da UDC esistenti');
    }
    
    const stmt = db.prepare('DELETE FROM tipi_udc WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};