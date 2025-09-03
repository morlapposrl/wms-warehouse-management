import db from '../database.js';

export interface Inventario {
  id: number;
  committente_id: number;
  codice_inventario: string;
  descrizione: string;
  tipo: 'TOTALE' | 'PARZIALE' | 'CICLICO';
  stato: 'PIANIFICATO' | 'IN_CORSO' | 'COMPLETATO' | 'ANNULLATO';
  data_pianificazione: string;
  data_inizio?: string;
  data_fine?: string;
  operatore_responsabile?: string;
  categoria_id?: number;
  ubicazione_filtro?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface InventarioDettaglio extends Inventario {
  categoria_descrizione?: string;
  totale_prodotti_da_contare: number;
  prodotti_contati: number;
  prodotti_con_differenze: number;
  valore_differenze: number;
  progresso_percentuale: number;
}

export interface ConteggioProdotto {
  id: number;
  inventario_id: number;
  prodotto_id: number;
  giacenza_sistema: number;
  quantita_contata?: number;
  differenza?: number;
  operatore_conteggio?: string;
  timestamp_conteggio?: string;
  note_conteggio?: string;
  verificato: boolean;
}

export interface ConteggioProdottoDettaglio extends ConteggioProdotto {
  prodotto_codice: string;
  prodotto_descrizione: string;
  categoria_descrizione: string;
  unita_misura_codice: string;
  prezzo_acquisto: number;
  valore_differenza: number;
  stato_differenza: 'OK' | 'SURPLUS' | 'DEFICIT';
}

export interface CreateInventarioData {
  committente_id: number;
  codice_inventario: string;
  descrizione: string;
  tipo: 'TOTALE' | 'PARZIALE' | 'CICLICO';
  data_pianificazione: string;
  operatore_responsabile?: string;
  categoria_id?: number;
  ubicazione_filtro?: string;
  note?: string;
}

export interface UpdateConteggio {
  quantita_contata: number;
  operatore_conteggio?: string;
  note_conteggio?: string;
}

export const inventariRepository = {
  // Crea nuovo inventario
  create(data: CreateInventarioData): number {
    const stmt = db.prepare(`
      INSERT INTO inventari (
        committente_id, codice_inventario, descrizione, tipo, 
        data_pianificazione, operatore_responsabile, categoria_id, 
        ubicazione_filtro, note, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PIANIFICATO')
    `);

    const result = stmt.run(
      data.committente_id,
      data.codice_inventario,
      data.descrizione,
      data.tipo,
      data.data_pianificazione,
      data.operatore_responsabile || null,
      data.categoria_id || null,
      data.ubicazione_filtro || null,
      data.note || null
    );

    return result.lastInsertRowid as number;
  },

  // Trova tutti gli inventari per committente
  findByCommittente(committente_id: number): InventarioDettaglio[] {
    const stmt = db.prepare(`
      SELECT 
        i.*,
        c.descrizione as categoria_descrizione,
        COUNT(cp.id) as totale_prodotti_da_contare,
        COUNT(CASE WHEN cp.quantita_contata IS NOT NULL THEN 1 END) as prodotti_contati,
        COUNT(CASE WHEN cp.differenza != 0 THEN 1 END) as prodotti_con_differenze,
        COALESCE(SUM(cp.differenza * p.prezzo_acquisto), 0) as valore_differenze,
        CASE 
          WHEN COUNT(cp.id) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN cp.quantita_contata IS NOT NULL THEN 1 END) * 100.0) / COUNT(cp.id), 1)
        END as progresso_percentuale
      FROM inventari i
      LEFT JOIN categorie c ON i.categoria_id = c.id
      LEFT JOIN conteggi_prodotti cp ON i.id = cp.inventario_id
      LEFT JOIN prodotti p ON cp.prodotto_id = p.id
      WHERE i.committente_id = ?
      GROUP BY i.id
      ORDER BY i.data_pianificazione DESC, i.id DESC
    `);

    return stmt.all(committente_id) as InventarioDettaglio[];
  },

  // Trova inventario per ID
  findById(id: number, committente_id: number): InventarioDettaglio | null {
    const stmt = db.prepare(`
      SELECT 
        i.*,
        c.descrizione as categoria_descrizione,
        COUNT(cp.id) as totale_prodotti_da_contare,
        COUNT(CASE WHEN cp.quantita_contata IS NOT NULL THEN 1 END) as prodotti_contati,
        COUNT(CASE WHEN cp.differenza != 0 THEN 1 END) as prodotti_con_differenze,
        COALESCE(SUM(cp.differenza * p.prezzo_acquisto), 0) as valore_differenze,
        CASE 
          WHEN COUNT(cp.id) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN cp.quantita_contata IS NOT NULL THEN 1 END) * 100.0) / COUNT(cp.id), 1)
        END as progresso_percentuale
      FROM inventari i
      LEFT JOIN categorie c ON i.categoria_id = c.id
      LEFT JOIN conteggi_prodotti cp ON i.id = cp.inventario_id
      LEFT JOIN prodotti p ON cp.prodotto_id = p.id
      WHERE i.id = ? AND i.committente_id = ?
      GROUP BY i.id
    `);

    return stmt.get(id, committente_id) as InventarioDettaglio | null;
  },

  // Avvia inventario - genera i prodotti da contare
  avviaInventario(inventario_id: number, committente_id: number): boolean {
    const inventario = this.findById(inventario_id, committente_id);
    if (!inventario || inventario.stato !== 'PIANIFICATO') {
      return false;
    }

    const transaction = db.transaction(() => {
      // Aggiorna stato inventario
      const updateInventario = db.prepare(`
        UPDATE inventari 
        SET stato = 'IN_CORSO', data_inizio = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND committente_id = ?
      `);
      updateInventario.run(inventario_id, committente_id);

      // Genera i prodotti da contare basati sui filtri
      let query = `
        INSERT INTO conteggi_prodotti (inventario_id, prodotto_id, giacenza_sistema)
        SELECT ?, p.id, COALESCE(g.quantita, 0)
        FROM prodotti p
        LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = p.committente_id
        WHERE p.committente_id = ? AND p.attivo = 1
      `;

      const params: any[] = [inventario_id, committente_id];

      // Applica filtri se presenti
      if (inventario.categoria_id) {
        query += ` AND p.categoria_id = ?`;
        params.push(inventario.categoria_id);
      }

      if (inventario.ubicazione_filtro) {
        query += ` AND p.ubicazione LIKE ?`;
        params.push(`%${inventario.ubicazione_filtro}%`);
      }

      const insertConteggi = db.prepare(query);
      insertConteggi.run(...params);
    });

    transaction();
    return true;
  },

  // Aggiorna conteggio prodotto
  updateConteggio(
    inventario_id: number, 
    prodotto_id: number, 
    committente_id: number, 
    data: UpdateConteggio
  ): boolean {
    // Verifica che l'inventario appartenga al committente
    const inventario = this.findById(inventario_id, committente_id);
    if (!inventario || inventario.stato !== 'IN_CORSO') {
      return false;
    }

    const stmt = db.prepare(`
      UPDATE conteggi_prodotti 
      SET quantita_contata = ?, 
          differenza = quantita_contata - giacenza_sistema,
          operatore_conteggio = ?, 
          note_conteggio = ?,
          timestamp_conteggio = CURRENT_TIMESTAMP,
          verificato = 1
      WHERE inventario_id = ? AND prodotto_id = ?
    `);

    const result = stmt.run(
      data.quantita_contata,
      data.operatore_conteggio || null,
      data.note_conteggio || null,
      inventario_id,
      prodotto_id
    );

    return result.changes > 0;
  },

  // Ottieni conteggi per inventario
  getConteggi(inventario_id: number, committente_id: number): ConteggioProdottoDettaglio[] {
    // Verifica che l'inventario appartenga al committente
    const inventario = this.findById(inventario_id, committente_id);
    if (!inventario) {
      return [];
    }

    const stmt = db.prepare(`
      SELECT 
        cp.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        p.prezzo_acquisto,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        (COALESCE(cp.differenza, 0) * p.prezzo_acquisto) as valore_differenza,
        CASE 
          WHEN cp.quantita_contata IS NULL THEN 'PENDING'
          WHEN cp.differenza = 0 THEN 'OK'
          WHEN cp.differenza > 0 THEN 'SURPLUS'
          ELSE 'DEFICIT'
        END as stato_differenza
      FROM conteggi_prodotti cp
      JOIN prodotti p ON cp.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE cp.inventario_id = ?
      ORDER BY 
        CASE WHEN cp.quantita_contata IS NULL THEN 0 ELSE 1 END,
        ABS(COALESCE(cp.differenza, 0)) DESC,
        p.codice ASC
    `);

    return stmt.all(inventario_id) as ConteggioProdottoDettaglio[];
  },

  // Completa inventario - applica rettifiche
  completaInventario(inventario_id: number, committente_id: number, applica_rettifiche: boolean = true): boolean {
    const inventario = this.findById(inventario_id, committente_id);
    if (!inventario || inventario.stato !== 'IN_CORSO') {
      return false;
    }

    const transaction = db.transaction(() => {
      if (applica_rettifiche) {
        // Crea movimenti di rettifica per le differenze
        const conteggiConDifferenze = db.prepare(`
          SELECT cp.*, p.codice, p.descrizione
          FROM conteggi_prodotti cp
          JOIN prodotti p ON cp.prodotto_id = p.id
          WHERE cp.inventario_id = ? AND cp.differenza != 0 AND cp.quantita_contata IS NOT NULL
        `).all(inventario_id);

        const insertMovimento = db.prepare(`
          INSERT INTO movimenti (
            committente_id_origine, tipo_movimento, prodotto_id, quantita, 
            causale, operatore, data_movimento
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        for (const conteggio of conteggiConDifferenze as any[]) {
          const tipoMovimento = conteggio.differenza > 0 ? 'RETTIFICA_POS' : 'RETTIFICA_NEG';
          const quantita = Math.abs(conteggio.differenza);
          const causale = `Rettifica da inventario ${inventario.codice_inventario} - Differenza: ${conteggio.differenza}`;

          insertMovimento.run(
            committente_id,
            tipoMovimento,
            conteggio.prodotto_id,
            quantita,
            causale,
            inventario.operatore_responsabile || 'Sistema'
          );
        }
      }

      // Aggiorna stato inventario
      const updateInventario = db.prepare(`
        UPDATE inventari 
        SET stato = 'COMPLETATO', data_fine = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND committente_id = ?
      `);
      updateInventario.run(inventario_id, committente_id);
    });

    transaction();
    return true;
  },

  // Annulla inventario
  annullaInventario(inventario_id: number, committente_id: number): boolean {
    const inventario = this.findById(inventario_id, committente_id);
    if (!inventario || inventario.stato === 'COMPLETATO') {
      return false;
    }

    const stmt = db.prepare(`
      UPDATE inventari 
      SET stato = 'ANNULLATO', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND committente_id = ?
    `);

    const result = stmt.run(inventario_id, committente_id);
    return result.changes > 0;
  },

  // Statistiche inventari per committente
  getStatistiche(committente_id: number): {
    totale_inventari: number;
    inventari_in_corso: number;
    inventari_completati: number;
    ultimo_inventario: string | null;
    prodotti_con_differenze_ultimo_mese: number;
  } {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totale_inventari,
        COUNT(CASE WHEN stato = 'IN_CORSO' THEN 1 END) as inventari_in_corso,
        COUNT(CASE WHEN stato = 'COMPLETATO' THEN 1 END) as inventari_completati,
        MAX(CASE WHEN stato = 'COMPLETATO' THEN data_fine END) as ultimo_inventario,
        (
          SELECT COUNT(DISTINCT cp.prodotto_id)
          FROM inventari i2
          JOIN conteggi_prodotti cp ON i2.id = cp.inventario_id
          WHERE i2.committente_id = ? 
            AND i2.stato = 'COMPLETATO'
            AND i2.data_fine >= date('now', '-1 month')
            AND cp.differenza != 0
        ) as prodotti_con_differenze_ultimo_mese
      FROM inventari 
      WHERE committente_id = ?
    `);

    return stmt.get(committente_id, committente_id) as any;
  },

  // Elimina inventario (solo se pianificato)
  delete(id: number, committente_id: number): boolean {
    const inventario = this.findById(id, committente_id);
    if (!inventario || inventario.stato !== 'PIANIFICATO') {
      return false;
    }

    const stmt = db.prepare(`
      DELETE FROM inventari 
      WHERE id = ? AND committente_id = ? AND stato = 'PIANIFICATO'
    `);

    const result = stmt.run(id, committente_id);
    return result.changes > 0;
  },

  // Prodotti che necessitano inventario ciclico
  getProdottiPerInventarioCiclico(committente_id: number, giorni_senza_conteggio: number = 90): Array<{
    prodotto_id: number;
    prodotto_codice: string;
    prodotto_descrizione: string;
    categoria_descrizione: string;
    giacenza_attuale: number;
    giorni_ultimo_conteggio: number;
    priorita: 'ALTA' | 'MEDIA' | 'BASSA';
  }> {
    const stmt = db.prepare(`
      SELECT 
        p.id as prodotto_id,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria_descrizione,
        COALESCE(g.quantita, 0) as giacenza_attuale,
        COALESCE(
          CAST((julianday('now') - julianday(
            (SELECT MAX(cp2.timestamp_conteggio) 
             FROM conteggi_prodotti cp2 
             JOIN inventari i2 ON cp2.inventario_id = i2.id
             WHERE cp2.prodotto_id = p.id AND i2.committente_id = ?)
          )) AS INTEGER), 
          999
        ) as giorni_ultimo_conteggio,
        CASE 
          WHEN COALESCE(g.quantita, 0) = 0 THEN 'BASSA'
          WHEN COALESCE(g.quantita, 0) <= p.scorta_minima THEN 'ALTA'
          ELSE 'MEDIA'
        END as priorita
      FROM prodotti p
      JOIN categorie c ON p.categoria_id = c.id
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ? 
        AND p.attivo = 1
      HAVING giorni_ultimo_conteggio >= ?
      ORDER BY 
        CASE priorita WHEN 'ALTA' THEN 1 WHEN 'MEDIA' THEN 2 ELSE 3 END,
        giorni_ultimo_conteggio DESC
    `);

    return stmt.all(committente_id, committente_id, giorni_senza_conteggio) as any[];
  }
};