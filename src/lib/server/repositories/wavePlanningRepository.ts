import Database from 'better-sqlite3';
import db from '../database';

export interface WavePlanning {
  id?: number;
  wave_number: string;
  data_creazione?: string;
  stato: 'PIANIFICATA' | 'IN_CORSO' | 'COMPLETATA' | 'ANNULLATA';
  tipo_wave: 'BATCH_PICKING' | 'ZONE_PICKING' | 'DISCRETE_PICKING' | 'WAVE_PICKING';
  committente_id?: number;
  priorita_minima: number;
  data_da?: string;
  data_a?: string;
  totale_ordini: number;
  totale_righe: number;
  totale_picks: number;
  distanza_stimata_metri: number;
  tempo_stimato_minuti: number;
  operatore_principale_id?: number;
  numero_operatori: number;
  data_inizio?: string;
  data_fine?: string;
  durata_effettiva_minuti?: number;
  note?: string;
}

export interface WaveOrdine {
  id?: number;
  wave_id: number;
  ordine_id: number;
  sequenza: number;
  stato: 'IN_CODA' | 'IN_PREPARAZIONE' | 'COMPLETATO' | 'ERRORE';
  data_inizio?: string;
  data_fine?: string;
  durata_minuti?: number;
  picks_completati: number;
  picks_totali: number;
}

export interface WavePickTask {
  id?: number;
  wave_id: number;
  ordine_id: number;
  prodotto_id: number;
  ubicazione_id: number;
  udc_id?: number;
  quantita_richiesta: number;
  quantita_prelevata: number;
  sequenza_pick: number;
  zona: string;
  distanza_dal_precedente: number;
  tempo_stimato_secondi: number;
  stato: 'IN_CODA' | 'IN_CORSO' | 'COMPLETATO' | 'SKIP' | 'ERRORE';
  operatore_id?: number;
  timestamp_inizio?: string;
  timestamp_fine?: string;
  controllo_barcode: number;
  barcode_scansionato?: string;
  note_operatore?: string;
}

export const wavePlanningRepository = {
  // WAVE PLANNING CRUD
  createWave(data: Omit<WavePlanning, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO wave_planning (
        wave_number, stato, tipo_wave, committente_id, priorita_minima,
        data_da, data_a, totale_ordini, totale_righe, totale_picks,
        distanza_stimata_metri, tempo_stimato_minuti, operatore_principale_id,
        numero_operatori, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.wave_number,
      data.stato,
      data.tipo_wave,
      data.committente_id || null,
      data.priorita_minima,
      data.data_da || null,
      data.data_a || null,
      data.totale_ordini,
      data.totale_righe,
      data.totale_picks,
      data.distanza_stimata_metri,
      data.tempo_stimato_minuti,
      data.operatore_principale_id || null,
      data.numero_operatori,
      data.note || null
    );
    
    return result.lastInsertRowid as number;
  },

  getAllWaves(committente_id?: number): WavePlanning[] {
    let query = `
      SELECT 
        w.*,
        c.ragione_sociale as committente_nome,
        u.nome as operatore_nome
      FROM wave_planning w
      LEFT JOIN committenti c ON w.committente_id = c.id
      LEFT JOIN utenti u ON w.operatore_principale_id = u.id
    `;
    
    if (committente_id) {
      query += ` WHERE (w.committente_id = ? OR w.committente_id IS NULL)`;
    }
    
    query += ` ORDER BY w.data_creazione DESC`;
    
    const stmt = db.prepare(query);
    return committente_id ? stmt.all(committente_id) : stmt.all();
  },

  getWaveById(id: number): WavePlanning | null {
    const stmt = db.prepare(`
      SELECT 
        w.*,
        c.ragione_sociale as committente_nome,
        u.nome as operatore_nome
      FROM wave_planning w
      LEFT JOIN committenti c ON w.committente_id = c.id
      LEFT JOIN utenti u ON w.operatore_principale_id = u.id
      WHERE w.id = ?
    `);
    
    return stmt.get(id) as WavePlanning | null;
  },

  updateWaveStatus(id: number, stato: WavePlanning['stato'], data_inizio?: string, data_fine?: string) {
    const stmt = db.prepare(`
      UPDATE wave_planning 
      SET stato = ?, data_inizio = ?, data_fine = ?
      WHERE id = ?
    `);
    
    return stmt.run(stato, data_inizio || null, data_fine || null, id);
  },

  // WAVE ORDINI
  addOrderToWave(data: Omit<WaveOrdine, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO wave_ordini (
        wave_id, ordine_id, sequenza, stato, picks_completati, picks_totali
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.wave_id,
      data.ordine_id,
      data.sequenza,
      data.stato,
      data.picks_completati,
      data.picks_totali
    );
    
    return result.lastInsertRowid as number;
  },

  getWaveOrders(wave_id: number): any[] {
    const stmt = db.prepare(`
      SELECT 
        wo.*,
        o.numero_ordine,
        o.cliente_fornitore,
        o.totale_colli,
        c.ragione_sociale as committente_nome
      FROM wave_ordini wo
      JOIN ordini o ON wo.ordine_id = o.id
      JOIN committenti c ON o.committente_id = c.id
      WHERE wo.wave_id = ?
      ORDER BY wo.sequenza
    `);
    
    return stmt.all(wave_id);
  },

  // WAVE PICK TASKS
  createPickTask(data: Omit<WavePickTask, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO wave_pick_tasks (
        wave_id, ordine_id, prodotto_id, ubicazione_id, udc_id,
        quantita_richiesta, quantita_prelevata, sequenza_pick, zona,
        distanza_dal_precedente, tempo_stimato_secondi, stato,
        operatore_id, controllo_barcode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.wave_id,
      data.ordine_id,
      data.prodotto_id,
      data.ubicazione_id,
      data.udc_id || null,
      data.quantita_richiesta,
      data.quantita_prelevata,
      data.sequenza_pick,
      data.zona,
      data.distanza_dal_precedente,
      data.tempo_stimato_secondi,
      data.stato,
      data.operatore_id || null,
      data.controllo_barcode
    );
    
    return result.lastInsertRowid as number;
  },

  getPickTasks(wave_id: number, zona?: string): any[] {
    let query = `
      SELECT 
        wpt.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        u.codice_ubicazione,
        u.zona as ubicazione_zona,
        o.numero_ordine,
        udc.barcode as udc_barcode,
        tu.codice as tipo_udc,
        udc.stato as udc_stato
      FROM wave_pick_tasks wpt
      JOIN prodotti p ON wpt.prodotto_id = p.id
      JOIN ubicazioni u ON wpt.ubicazione_id = u.id
      JOIN ordini o ON wpt.ordine_id = o.id
      LEFT JOIN udc ON wpt.udc_id = udc.id
      LEFT JOIN tipi_udc tu ON udc.tipo_udc_id = tu.id
      WHERE wpt.wave_id = ?
    `;
    
    const params = [wave_id];
    
    if (zona) {
      query += ` AND wpt.zona = ?`;
      params.push(zona);
    }
    
    query += ` ORDER BY wpt.sequenza_pick`;
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  updatePickTaskStatus(id: number, stato: WavePickTask['stato'], quantita_prelevata?: number) {
    let query = `UPDATE wave_pick_tasks SET stato = ?`;
    const params = [stato, id];
    
    if (quantita_prelevata !== undefined) {
      query = `UPDATE wave_pick_tasks SET stato = ?, quantita_prelevata = ?`;
      params.splice(1, 0, quantita_prelevata);
    }
    
    query += ` WHERE id = ?`;
    
    const stmt = db.prepare(query);
    return stmt.run(...params);
  },

  // ALGORITMI OTTIMIZZAZIONE
  getOrdersForWaveCreation(filters: {
    committente_id?: number;
    data_da?: string;
    data_a?: string;
    priorita_minima?: number;
    stato?: string[];
  }): any[] {
    let query = `
      SELECT 
        o.*,
        c.ragione_sociale as committente_nome,
        COUNT(od.id) as righe_totali,
        SUM(od.quantita_ordinata) as quantita_totale
      FROM ordini o
      JOIN committenti c ON o.committente_id = c.id
      LEFT JOIN ordini_dettaglio_new od ON o.id = od.ordine_id
      WHERE o.tipo_ordine = 'OUTBOUND'
    `;
    
    const params: any[] = [];
    
    if (filters.committente_id) {
      query += ` AND o.committente_id = ?`;
      params.push(filters.committente_id);
    }
    
    if (filters.data_da) {
      query += ` AND o.data_ordine >= ?`;
      params.push(filters.data_da);
    }
    
    if (filters.data_a) {
      query += ` AND o.data_ordine <= ?`;
      params.push(filters.data_a);
    }
    
    if (filters.stato && filters.stato.length > 0) {
      const placeholders = filters.stato.map(() => '?').join(',');
      query += ` AND o.stato IN (${placeholders})`;
      params.push(...filters.stato);
    }
    
    query += `
      GROUP BY o.id, c.ragione_sociale
      HAVING righe_totali > 0
      ORDER BY 
        CASE o.stato 
          WHEN 'NUOVO' THEN 1 
          WHEN 'CONFERMATO' THEN 2 
          WHEN 'IN_PREPARAZIONE' THEN 3 
        END,
        o.data_ordine ASC
    `;
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  // STATISTICHE E PERFORMANCE
  getWaveStatistics(wave_id: number): any {
    const stmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT wo.ordine_id) as ordini_totali,
        COUNT(wpt.id) as pick_tasks_totali,
        COUNT(CASE WHEN wpt.stato = 'COMPLETATO' THEN 1 END) as pick_completati,
        AVG(wpt.tempo_stimato_secondi) as tempo_medio_pick,
        SUM(wpt.distanza_dal_precedente) as distanza_totale,
        COUNT(DISTINCT wpt.zona) as zone_coinvolte
      FROM wave_ordini wo
      LEFT JOIN wave_pick_tasks wpt ON wo.wave_id = wpt.wave_id
      WHERE wo.wave_id = ?
    `);
    
    return stmt.get(wave_id);
  },

  // UDC-BASED PICK TASKS GENERATION
  createPickTasksWithUDC(wave_id: number, selectedOrderIds: number[]): number {
    if (selectedOrderIds.length === 0) return 0;
    
    // Ottieni i dettagli degli ordini con UDC assegnati
    const orderDetailsQuery = `
      SELECT 
        od.ordine_id,
        od.prodotto_id,
        od.quantita_ordinata,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        
        -- Trova il miglior UDC per questo prodotto
        udc.id as udc_id,
        udc.barcode as udc_barcode,
        udc.ubicazione_attuale_id,
        ub.codice_ubicazione,
        ub.zona,
        
        -- Calcola sequenza ottimale per zona
        ROW_NUMBER() OVER (
          PARTITION BY ub.zona 
          ORDER BY ub.codice_ubicazione, udc.barcode, p.codice
        ) as sequenza_pick
        
      FROM ordini_dettaglio_new od
      JOIN prodotti p ON od.prodotto_id = p.id
      
      -- Trova UDC contenenti questo prodotto con quantità sufficiente
      JOIN udc_contenuto uc ON p.id = uc.prodotto_id AND uc.quantita >= od.quantita_ordinata
      JOIN udc ON uc.udc_id = udc.id AND udc.stato IN ('PARZIALE', 'PIENO')
      JOIN ubicazioni ub ON udc.ubicazione_attuale_id = ub.id
      
      WHERE od.ordine_id IN (${selectedOrderIds.map(() => '?').join(',')})
      
      ORDER BY ub.zona, ub.codice_ubicazione, udc.barcode, p.codice
    `;
    
    const stmt = db.prepare(orderDetailsQuery);
    const orderDetails = stmt.all(...selectedOrderIds);
    
    let tasksCreated = 0;
    
    // Crea i pick tasks con UDC
    for (const detail of orderDetails) {
      const pickTask = this.createPickTask({
        wave_id: wave_id,
        ordine_id: detail.ordine_id,
        prodotto_id: detail.prodotto_id,
        ubicazione_id: detail.ubicazione_attuale_id,
        udc_id: detail.udc_id,
        quantita_richiesta: detail.quantita_ordinata,
        quantita_prelevata: 0,
        sequenza_pick: detail.sequenza_pick,
        zona: detail.zona,
        distanza_dal_precedente: 0,
        tempo_stimato_secondi: 60,
        stato: 'IN_CODA',
        controllo_barcode: 1
      });
      
      if (pickTask) tasksCreated++;
    }
    
    return tasksCreated;
  },

  // CLEANUP
  deleteWave(id: number) {
    const stmt = db.prepare(`DELETE FROM wave_planning WHERE id = ?`);
    return stmt.run(id);
  }
};