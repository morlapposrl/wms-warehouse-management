import db from '../database.js';

export interface Giacenza {
  id: number;
  committente_id: number;
  prodotto_id: number;
  quantita: number;
  valore_medio: number;
  ultima_modifica: string;
}

export interface GiacenzaDettaglio extends Giacenza {
  prodotto_codice: string;
  prodotto_descrizione: string;
  categoria_descrizione: string;
  unita_misura_codice: string;
  scorta_minima: number;
  scorta_massima: number;
  prezzo_acquisto: number;
  prezzo_vendita: number;
  ubicazione?: string;
  valore_totale: number;
  stato_scorta: 'OK' | 'BASSA' | 'CRITICA' | 'ECCESSIVA';
  giorni_ultima_movimentazione?: number;
}

export interface StatisticheGiacenze {
  totale_prodotti: number;
  prodotti_attivi: number;
  prodotti_scorta_bassa: number;
  prodotti_scorta_critica: number;
  valore_totale_magazzino: number;
  ultima_movimentazione: string | null;
}

export const giacenzeRepository = {
  // Trova tutte le giacenze per un committente con dettagli
  findByCommittenteWithDetails(committente_id: number): GiacenzaDettaglio[] {
    const stmt = db.prepare(`
      SELECT 
        g.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        p.scorta_minima,
        p.scorta_massima,
        p.prezzo_acquisto,
        p.prezzo_vendita,
        p.ubicazione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        (g.quantita * p.prezzo_acquisto) as valore_totale,
        CASE 
          WHEN g.quantita <= 0 THEN 'CRITICA'
          WHEN g.quantita <= p.scorta_minima THEN 'BASSA'
          WHEN g.quantita >= p.scorta_massima AND p.scorta_massima > 0 THEN 'ECCESSIVA'
          ELSE 'OK'
        END as stato_scorta,
        -- Giorni dall'ultima movimentazione
        CAST((julianday('now') - julianday(
          COALESCE(
            (SELECT MAX(data_movimento) 
             FROM movimenti m 
             WHERE m.prodotto_id = p.id 
               AND (m.committente_id_origine = ? OR m.committente_id_destinazione = ?)
            ), 
            g.ultima_modifica
          )
        )) AS INTEGER) as giorni_ultima_movimentazione
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE g.committente_id = ? AND p.attivo = 1
      ORDER BY 
        CASE 
          WHEN g.quantita <= 0 THEN 1
          WHEN g.quantita <= p.scorta_minima THEN 2
          ELSE 3
        END,
        p.codice ASC
    `);

    return stmt.all(committente_id, committente_id, committente_id) as GiacenzaDettaglio[];
  },

  // Trova giacenze filtrate
  findByCommittenteFiltered(
    committente_id: number, 
    filters: {
      categoria_id?: number;
      stato_scorta?: string;
      search?: string;
      solo_attivi?: boolean;
    }
  ): GiacenzaDettaglio[] {
    let query = `
      SELECT 
        g.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        p.scorta_minima,
        p.scorta_massima,
        p.prezzo_acquisto,
        p.prezzo_vendita,
        p.ubicazione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        (g.quantita * p.prezzo_acquisto) as valore_totale,
        CASE 
          WHEN g.quantita <= 0 THEN 'CRITICA'
          WHEN g.quantita <= p.scorta_minima THEN 'BASSA'
          WHEN g.quantita >= p.scorta_massima AND p.scorta_massima > 0 THEN 'ECCESSIVA'
          ELSE 'OK'
        END as stato_scorta
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE g.committente_id = ?
    `;

    const params: any[] = [committente_id];

    if (filters.solo_attivi !== false) {
      query += ` AND p.attivo = 1`;
    }

    if (filters.categoria_id) {
      query += ` AND c.id = ?`;
      params.push(filters.categoria_id);
    }

    if (filters.search) {
      query += ` AND (p.codice LIKE ? OR p.descrizione LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` ORDER BY p.codice ASC`;

    const results = db.prepare(query).all(...params) as GiacenzaDettaglio[];

    // Filtra per stato scorta se specificato
    if (filters.stato_scorta) {
      return results.filter(r => r.stato_scorta === filters.stato_scorta);
    }

    return results;
  },

  // Trova giacenza per prodotto specifico
  findByProdotto(committente_id: number, prodotto_id: number): GiacenzaDettaglio | null {
    const stmt = db.prepare(`
      SELECT 
        g.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        p.scorta_minima,
        p.scorta_massima,
        p.prezzo_acquisto,
        p.prezzo_vendita,
        p.ubicazione,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        (g.quantita * p.prezzo_acquisto) as valore_totale,
        CASE 
          WHEN g.quantita <= 0 THEN 'CRITICA'
          WHEN g.quantita <= p.scorta_minima THEN 'BASSA'
          WHEN g.quantita >= p.scorta_massima AND p.scorta_massima > 0 THEN 'ECCESSIVA'
          ELSE 'OK'
        END as stato_scorta
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE g.committente_id = ? AND g.prodotto_id = ?
    `);

    return stmt.get(committente_id, prodotto_id) as GiacenzaDettaglio | null;
  },

  // Statistiche giacenze per committente
  getStatistiche(committente_id: number): StatisticheGiacenze {
    const stmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT g.prodotto_id) as totale_prodotti,
        COUNT(CASE WHEN p.attivo = 1 THEN 1 END) as prodotti_attivi,
        COUNT(CASE WHEN g.quantita <= p.scorta_minima AND g.quantita > 0 THEN 1 END) as prodotti_scorta_bassa,
        COUNT(CASE WHEN g.quantita <= 0 THEN 1 END) as prodotti_scorta_critica,
        COALESCE(SUM(g.quantita * p.prezzo_acquisto), 0) as valore_totale_magazzino,
        MAX(g.ultima_modifica) as ultima_movimentazione
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      WHERE g.committente_id = ?
    `);

    return stmt.get(committente_id) as StatisticheGiacenze;
  },

  // Prodotti con scorta bassa/critica
  getProdottiScortaBassa(committente_id: number): GiacenzaDettaglio[] {
    const stmt = db.prepare(`
      SELECT 
        g.*,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        p.scorta_minima,
        p.scorta_massima,
        p.prezzo_acquisto,
        p.prezzo_vendita,
        c.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice,
        (g.quantita * p.prezzo_acquisto) as valore_totale,
        CASE 
          WHEN g.quantita <= 0 THEN 'CRITICA'
          WHEN g.quantita <= p.scorta_minima THEN 'BASSA'
          ELSE 'OK'
        END as stato_scorta
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE g.committente_id = ? 
        AND p.attivo = 1
        AND (g.quantita <= p.scorta_minima OR g.quantita <= 0)
      ORDER BY 
        CASE WHEN g.quantita <= 0 THEN 1 ELSE 2 END,
        g.quantita ASC
    `);

    return stmt.all(committente_id) as GiacenzaDettaglio[];
  },

  // Valore magazzino per categoria
  getValorePerCategoria(committente_id: number): Array<{
    categoria_id: number;
    categoria_descrizione: string;
    quantita_totale: number;
    valore_totale: number;
    numero_prodotti: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        c.id as categoria_id,
        c.descrizione as categoria_descrizione,
        SUM(g.quantita) as quantita_totale,
        SUM(g.quantita * p.prezzo_acquisto) as valore_totale,
        COUNT(DISTINCT p.id) as numero_prodotti
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      WHERE g.committente_id = ? AND p.attivo = 1
      GROUP BY c.id, c.descrizione
      ORDER BY valore_totale DESC
    `);

    return stmt.all(committente_id) as any[];
  },

  // Aggiorna scorte minime/massime (utility)
  updateScorteMinMax(committente_id: number, prodotto_id: number, scorta_minima: number, scorta_massima: number): boolean {
    // Verifica che il prodotto appartenga al committente
    const checkStmt = db.prepare('SELECT id FROM prodotti WHERE id = ? AND committente_id = ?');
    const exists = checkStmt.get(prodotto_id, committente_id);
    
    if (!exists) return false;

    const stmt = db.prepare(`
      UPDATE prodotti 
      SET scorta_minima = ?, scorta_massima = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND committente_id = ?
    `);

    const result = stmt.run(scorta_minima, scorta_massima, prodotto_id, committente_id);
    return result.changes > 0;
  },

  // Ottieni categorie per il committente (per filtri)
  getCategorieDisponibili(committente_id: number): Array<{
    id: number;
    descrizione: string;
    numero_prodotti: number;
  }> {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.descrizione,
        COUNT(DISTINCT p.id) as numero_prodotti
      FROM categorie c
      LEFT JOIN prodotti p ON c.id = p.categoria_id AND p.attivo = 1
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = ?
      WHERE c.committente_id = ?
      GROUP BY c.id, c.descrizione
      HAVING COUNT(DISTINCT p.id) > 0
      ORDER BY c.descrizione
    `);

    return stmt.all(committente_id, committente_id) as any[];
  },

  // Cronologia giacenze (ultimi movimenti per prodotto)
  getUltimiMovimenti(committente_id: number, prodotto_id: number, limit: number = 10): Array<{
    data_movimento: string;
    tipo_movimento: string;
    quantita: number;
    giacenza_dopo: number;
    operatore?: string;
    causale?: string;
  }> {
    const stmt = db.prepare(`
      SELECT 
        m.data_movimento,
        m.tipo_movimento,
        m.quantita,
        m.operatore,
        m.causale
      FROM movimenti m
      WHERE (m.committente_id_origine = ? OR m.committente_id_destinazione = ?)
        AND m.prodotto_id = ?
      ORDER BY m.data_movimento DESC, m.id DESC
      LIMIT ?
    `);

    return stmt.all(committente_id, committente_id, prodotto_id, limit) as any[];
  }
};