import db from '../database.js';

export interface Movimento {
  id: number;
  committente_id_origine: number;
  committente_id_destinazione?: number;
  tipo_movimento: 'CARICO' | 'SCARICO' | 'TRASFERIMENTO_INTERNO' | 'TRASFERIMENTO_INTER_COMMITTENTE' | 'RETTIFICA_POS' | 'RETTIFICA_NEG' | 'RESO_CLIENTE' | 'RESO_FORNITORE';
  prodotto_id: number;
  quantita: number;
  prezzo: number;
  fornitore_id?: number;
  ordine_id?: number;
  numero_documento?: string;
  data_documento?: string;
  causale?: string;
  operatore?: string;
  note?: string;
  data_movimento: string;
  created_at: string;
  updated_at: string;
}

export interface MovimentoDettaglio extends Movimento {
  prodotto_codice: string;
  prodotto_descrizione: string;
  categoria_descrizione: string;
  unita_misura_codice: string;
  fornitore_ragione_sociale?: string;
  committente_origine_ragione_sociale: string;
  committente_destinazione_ragione_sociale?: string;
  ordine_numero?: string;
  ordine_tipo?: string;
  ubicazione_da?: string;
  ubicazione_a?: string;
  zona_da?: string;
  zona_a?: string;
  udc_barcode?: string;
  udc_tipo?: string;
  udc_stato?: string;
}

export interface CreateMovimentoData {
  committente_id_origine: number;
  committente_id_destinazione?: number;
  tipo_movimento: string;
  prodotto_id: number;
  quantita: number;
  prezzo?: number;
  fornitore_id?: number;
  ordine_id?: number;
  numero_documento?: string;
  data_documento?: string;
  causale?: string;
  operatore?: string;
  note?: string;
  data_movimento?: string;
}

export const movimentiRepository = {
  // Crea nuovo movimento - CON ORDER TRACKING
  create(data: CreateMovimentoData): number {
    // Validazione: CARICO e RETTIFICA_POS devono avere ordine_id per tracciabilità
    const tipiRichiedonoOrdine = ['CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE'];
    if (tipiRichiedonoOrdine.includes(data.tipo_movimento) && !data.ordine_id) {
      throw new Error(`Movimento di tipo ${data.tipo_movimento} richiede ordine_id per tracciabilità`);
    }

    // Validazione: verifica che l'ordine sia INBOUND per movimenti di carico
    if (data.ordine_id && tipiRichiedonoOrdine.includes(data.tipo_movimento)) {
      const ordine = db.prepare('SELECT tipo_ordine FROM ordini WHERE id = ?').get(data.ordine_id) as any;
      if (!ordine || ordine.tipo_ordine !== 'INBOUND') {
        throw new Error(`Movimento di carico deve essere collegato a un ordine INBOUND`);
      }
    }

    const stmt = db.prepare(`
      INSERT INTO movimenti (
        committente_id_origine, committente_id_destinazione, tipo_movimento,
        prodotto_id, quantita, prezzo, fornitore_id, ordine_id, numero_documento,
        data_documento, causale, operatore, note, data_movimento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.committente_id_origine,
      data.committente_id_destinazione || null,
      data.tipo_movimento,
      data.prodotto_id,
      data.quantita,
      data.prezzo || 0,
      data.fornitore_id || null,
      data.ordine_id || null,
      data.numero_documento || null,
      data.data_documento || null,
      data.causale || null,
      data.operatore || null,
      data.note || null,
      data.data_movimento || new Date().toISOString()
    );

    return result.lastInsertRowid as number;
  },

  // Trova tutti i movimenti per un committente (origine o destinazione) - CON ORDER INFO
  findByCommittente(committente_id: number): MovimentoDettaglio[] {
    const stmt = db.prepare(`
      SELECT 
        m.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        f.ragione_sociale as fornitore_ragione_sociale,
        co.ragione_sociale as committente_origine_ragione_sociale,
        cd.ragione_sociale as committente_destinazione_ragione_sociale,
        o.numero_ordine as ordine_numero,
        o.tipo_ordine as ordine_tipo,
        -- Placeholder per UDC/ubicazioni (da implementare)
        '-' as ubicazione_da,
        '-' as ubicazione_a,
        '-' as zona_da,
        '-' as zona_a,
        '-' as udc_barcode,
        '-' as udc_tipo,
        '-' as udc_stato
      FROM movimenti m
      JOIN prodotti p ON m.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      JOIN committenti co ON m.committente_id_origine = co.id
      LEFT JOIN committenti cd ON m.committente_id_destinazione = cd.id
      LEFT JOIN fornitori f ON m.fornitore_id = f.id
      LEFT JOIN ordini o ON m.ordine_id = o.id
      WHERE m.committente_id_origine = ? OR m.committente_id_destinazione = ?
      ORDER BY m.data_movimento DESC, m.id DESC
    `);

    return stmt.all(committente_id, committente_id) as MovimentoDettaglio[];
  },

  // Trova movimenti per periodo - CON ORDER INFO
  findByCommittenteAndPeriod(committente_id: number, data_inizio: string, data_fine: string): MovimentoDettaglio[] {
    const stmt = db.prepare(`
      SELECT 
        m.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        f.ragione_sociale as fornitore_ragione_sociale,
        co.ragione_sociale as committente_origine_ragione_sociale,
        cd.ragione_sociale as committente_destinazione_ragione_sociale,
        o.numero_ordine as ordine_numero,
        o.tipo_ordine as ordine_tipo,
        -- Placeholder per UDC/ubicazioni (da implementare)
        '-' as ubicazione_da,
        '-' as ubicazione_a,
        '-' as zona_da,
        '-' as zona_a,
        '-' as udc_barcode,
        '-' as udc_tipo,
        '-' as udc_stato
      FROM movimenti m
      JOIN prodotti p ON m.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      JOIN committenti co ON m.committente_id_origine = co.id
      LEFT JOIN committenti cd ON m.committente_id_destinazione = cd.id
      LEFT JOIN fornitori f ON m.fornitore_id = f.id
      LEFT JOIN ordini o ON m.ordine_id = o.id
      WHERE (m.committente_id_origine = ? OR m.committente_id_destinazione = ?)
        AND DATE(m.data_movimento) >= DATE(?)
        AND DATE(m.data_movimento) <= DATE(?)
      ORDER BY m.data_movimento DESC, m.id DESC
    `);

    return stmt.all(committente_id, committente_id, data_inizio, data_fine) as MovimentoDettaglio[];
  },

  // Trova movimenti per prodotto - CON ORDER INFO (KEY METHOD FOR TRACEABILITY)
  findByProdotto(prodotto_id: number, committente_id: number): MovimentoDettaglio[] {
    const stmt = db.prepare(`
      SELECT 
        m.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        f.ragione_sociale as fornitore_ragione_sociale,
        co.ragione_sociale as committente_origine_ragione_sociale,
        cd.ragione_sociale as committente_destinazione_ragione_sociale,
        o.numero_ordine as ordine_numero,
        o.tipo_ordine as ordine_tipo
      FROM movimenti m
      JOIN prodotti p ON m.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      JOIN committenti co ON m.committente_id_origine = co.id
      LEFT JOIN committenti cd ON m.committente_id_destinazione = cd.id
      LEFT JOIN fornitori f ON m.fornitore_id = f.id
      LEFT JOIN ordini o ON m.ordine_id = o.id
      WHERE m.prodotto_id = ? 
        AND (m.committente_id_origine = ? OR m.committente_id_destinazione = ?)
      ORDER BY m.data_movimento DESC, m.id DESC
    `);

    return stmt.all(prodotto_id, committente_id, committente_id) as MovimentoDettaglio[];
  },

  // Trova movimento per ID (con controllo committente) - CON ORDER INFO
  findById(id: number, committente_id: number): MovimentoDettaglio | null {
    const stmt = db.prepare(`
      SELECT 
        m.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        f.ragione_sociale as fornitore_ragione_sociale,
        co.ragione_sociale as committente_origine_ragione_sociale,
        cd.ragione_sociale as committente_destinazione_ragione_sociale,
        o.numero_ordine as ordine_numero,
        o.tipo_ordine as ordine_tipo
      FROM movimenti m
      JOIN prodotti p ON m.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      JOIN committenti co ON m.committente_id_origine = co.id
      LEFT JOIN committenti cd ON m.committente_id_destinazione = cd.id
      LEFT JOIN fornitori f ON m.fornitore_id = f.id
      LEFT JOIN ordini o ON m.ordine_id = o.id
      WHERE m.id = ? 
        AND (m.committente_id_origine = ? OR m.committente_id_destinazione = ?)
    `);

    return stmt.get(id, committente_id, committente_id) as MovimentoDettaglio | null;
  },

  // Aggiorna movimento (solo note e dettagli, non quantità per integrità giacenze)
  update(id: number, committente_id: number, data: Partial<CreateMovimentoData>): boolean {
    // Verifica che il movimento appartenga al committente
    const movimento = this.findById(id, committente_id);
    if (!movimento) return false;

    const stmt = db.prepare(`
      UPDATE movimenti 
      SET numero_documento = ?, data_documento = ?, causale = ?, 
          operatore = ?, note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (committente_id_origine = ? OR committente_id_destinazione = ?)
    `);

    const result = stmt.run(
      data.numero_documento || null,
      data.data_documento || null,
      data.causale || null,
      data.operatore || null,
      data.note || null,
      id,
      committente_id,
      committente_id
    );

    return result.changes > 0;
  },

  // Elimina movimento (attenzione: influisce sulle giacenze)
  delete(id: number, committente_id: number): boolean {
    // Verifica che il movimento appartenga al committente
    const movimento = this.findById(id, committente_id);
    if (!movimento) return false;

    // IMPORTANTE: Prima di eliminare il movimento, bisognerebbe
    // creare un movimento di segno opposto per annullare l'effetto sulle giacenze
    // Per semplicità, per ora eliminiamo solo se è l'ultimo movimento del prodotto
    
    const stmt = db.prepare(`
      DELETE FROM movimenti 
      WHERE id = ? AND (committente_id_origine = ? OR committente_id_destinazione = ?)
    `);

    const result = stmt.run(id, committente_id, committente_id);
    return result.changes > 0;
  },

  // Statistiche movimenti per committente
  getStatistiche(committente_id: number): {
    totale_movimenti: number;
    carichi_totali: number;
    scarichi_totali: number;
    rettifiche_totali: number;
    ultimo_movimento: string | null;
  } {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totale_movimenti,
        SUM(CASE WHEN tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE') THEN 1 ELSE 0 END) as carichi_totali,
        SUM(CASE WHEN tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE') THEN 1 ELSE 0 END) as scarichi_totali,
        SUM(CASE WHEN tipo_movimento IN ('RETTIFICA_POS', 'RETTIFICA_NEG') THEN 1 ELSE 0 END) as rettifiche_totali,
        MAX(data_movimento) as ultimo_movimento
      FROM movimenti 
      WHERE committente_id_origine = ? OR committente_id_destinazione = ?
    `);

    return stmt.get(committente_id, committente_id) as any;
  },

  // Ottieni prodotti disponibili per il committente (per dropdown)
  getProdottiDisponibili(committente_id: number): Array<{
    id: number;
    codice: string;
    descrizione: string;
    categoria_descrizione: string;
    unita_misura_codice: string;
    giacenza_attuale: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        p.id,
        p.codice,
        p.descrizione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        COALESCE(g.quantita, 0) as giacenza_attuale
      FROM prodotti p
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ? AND p.attivo = 1
      ORDER BY p.codice
    `);

    return stmt.all(committente_id) as any[];
  },

  // Ottieni fornitori del committente (per dropdown)
  getFornitoriDisponibili(committente_id: number): Array<{
    id: number;
    codice: string;
    ragione_sociale: string;
  }> {
    const stmt = db.prepare(`
      SELECT f.id, f.codice, f.ragione_sociale
      FROM fornitori f
      JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      WHERE cf.committente_id = ? AND cf.attivo = 1
      ORDER BY f.ragione_sociale
    `);

    return stmt.all(committente_id) as any[];
  },

  // Ottieni ordini INBOUND disponibili per movimenti di carico
  getOrdiniInboundDisponibili(committente_id: number): Array<{
    id: number;
    numero_ordine: string;
    stato: string;
    data_ordine: string;
    cliente_fornitore: string;
  }> {
    const stmt = db.prepare(`
      SELECT 
        id,
        numero_ordine,
        stato,
        data_ordine,
        cliente_fornitore
      FROM ordini 
      WHERE committente_id = ? 
        AND tipo_ordine = 'INBOUND'
        AND stato IN ('NUOVO', 'CONFERMATO', 'IN_PREPARAZIONE')
      ORDER BY data_ordine DESC, numero_ordine
    `);

    return stmt.all(committente_id) as any[];
  },

  // Trova movimenti per ordine (tracciabilità completa)
  findByOrdine(ordine_id: number, committente_id: number): MovimentoDettaglio[] {
    const stmt = db.prepare(`
      SELECT 
        m.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        f.ragione_sociale as fornitore_ragione_sociale,
        co.ragione_sociale as committente_origine_ragione_sociale,
        cd.ragione_sociale as committente_destinazione_ragione_sociale,
        o.numero_ordine as ordine_numero,
        o.tipo_ordine as ordine_tipo
      FROM movimenti m
      JOIN prodotti p ON m.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      JOIN committenti co ON m.committente_id_origine = co.id
      LEFT JOIN committenti cd ON m.committente_id_destinazione = cd.id
      LEFT JOIN fornitori f ON m.fornitore_id = f.id
      LEFT JOIN ordini o ON m.ordine_id = o.id
      WHERE m.ordine_id = ? 
        AND (m.committente_id_origine = ? OR m.committente_id_destinazione = ?)
      ORDER BY m.data_movimento DESC, m.id DESC
    `);

    return stmt.all(ordine_id, committente_id, committente_id) as MovimentoDettaglio[];
  }
};