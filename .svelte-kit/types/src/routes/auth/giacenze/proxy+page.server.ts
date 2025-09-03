// @ts-nocheck
import type { PageServerLoad } from './$types';
import db from '$lib/server/database';
import { error } from '@sveltejs/kit';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // GIACENZE GLOBALI: non filtriamo per committente specifico
    const search = url.searchParams.get('search') || '';
    const categoria_id = url.searchParams.get('categoria') || '';
    const committente_filter = url.searchParams.get('committente') || ''; // Filtro opzionale
    const solo_scorte_basse = url.searchParams.get('solo_scorte_basse') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    // Query base per giacenze GLOBALI
    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Filtro committente opzionale (per giacenze globali)
    if (committente_filter && committente_filter !== '') {
      whereConditions.push('g.committente_id = ?');
      queryParams.push(parseInt(committente_filter));
    }

    if (search) {
      whereConditions.push('(p.codice LIKE ? OR p.descrizione LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (categoria_id) {
      whereConditions.push('p.categoria_id = ?');
      queryParams.push(parseInt(categoria_id));
    }

    if (solo_scorte_basse) {
      whereConditions.push('(g.quantita <= p.scorta_minima OR (p.scorta_minima IS NULL AND g.quantita <= 10))');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Carica giacenze GLOBALI con dettagli prodotto e committente
    const giacenze = db.prepare(`
      SELECT 
        g.id,
        g.committente_id,
        g.prodotto_id,
        g.quantita,
        g.valore_medio,
        g.ultima_modifica,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        p.prezzo_acquisto,
        p.prezzo_vendita,
        p.scorta_minima,
        p.scorta_massima,
        p.ubicazione,
        p.lotto_partita as lotto,
        c.descrizione as categoria_nome,
        um.descrizione as unita_misura,
        -- Info committente per vista globale
        comm.ragione_sociale as committente_nome,
        comm.codice as committente_codice,
        -- Calcoli
        ROUND(g.quantita * COALESCE(g.valore_medio, p.prezzo_acquisto, 0), 2) as valore_totale,
        CASE 
          WHEN p.scorta_minima IS NOT NULL AND g.quantita <= p.scorta_minima THEN 'BASSA'
          WHEN p.scorta_massima IS NOT NULL AND g.quantita >= p.scorta_massima THEN 'ALTA'
          ELSE 'NORMALE'
        END as stato_scorta,
        -- Movimenti recenti globali (ultimi 7 giorni)
        COALESCE(m_recent.movimenti_recenti, 0) as movimenti_recenti
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN committenti comm ON g.committente_id = comm.id
      LEFT JOIN categorie c ON p.categoria_id = c.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      LEFT JOIN (
        SELECT 
          prodotto_id,
          committente_id_origine,
          COUNT(*) as movimenti_recenti
        FROM movimenti 
        WHERE data_movimento >= date('now', '-7 days')
        GROUP BY prodotto_id, committente_id_origine
      ) m_recent ON p.id = m_recent.prodotto_id AND g.committente_id = m_recent.committente_id_origine
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN g.quantita <= COALESCE(p.scorta_minima, 0) THEN 0
          ELSE 1
        END,
        comm.ragione_sociale,
        g.ultima_modifica DESC
      LIMIT ? OFFSET ?
    `).all(...queryParams, limit, offset);

    // Conteggio totale per paginazione (GLOBALE)
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN committenti comm ON g.committente_id = comm.id
      ${whereClause}
    `).get(...queryParams) as { count: number };

    // Statistiche GLOBALI (tutti i committenti)
    const stats = committente_filter ? 
      db.prepare(`
        SELECT 
          COUNT(*) as totale_prodotti,
          SUM(g.quantita) as totale_quantita,
          SUM(ROUND(g.quantita * COALESCE(g.valore_medio, p.prezzo_acquisto, 0), 2)) as valore_totale,
          COUNT(CASE WHEN g.quantita <= COALESCE(p.scorta_minima, 0) THEN 1 END) as scorte_basse,
          COUNT(CASE WHEN g.quantita = 0 THEN 1 END) as prodotti_esauriti,
          COUNT(CASE WHEN g.quantita >= COALESCE(p.scorta_massima, 999999) THEN 1 END) as scorte_eccessive,
          COUNT(DISTINCT g.committente_id) as totale_committenti
        FROM giacenze g
        JOIN prodotti p ON g.prodotto_id = p.id
        WHERE g.committente_id = ?
      `).get(parseInt(committente_filter)) :
      db.prepare(`
        SELECT 
          COUNT(*) as totale_prodotti,
          SUM(g.quantita) as totale_quantita,
          SUM(ROUND(g.quantita * COALESCE(g.valore_medio, p.prezzo_acquisto, 0), 2)) as valore_totale,
          COUNT(CASE WHEN g.quantita <= COALESCE(p.scorta_minima, 0) THEN 1 END) as scorte_basse,
          COUNT(CASE WHEN g.quantita = 0 THEN 1 END) as prodotti_esauriti,
          COUNT(CASE WHEN g.quantita >= COALESCE(p.scorta_massima, 999999) THEN 1 END) as scorte_eccessive,
          COUNT(DISTINCT g.committente_id) as totale_committenti
        FROM giacenze g
        JOIN prodotti p ON g.prodotto_id = p.id
      `).get();

    // Carica TUTTI i committenti per vista globale
    const committenti = db.prepare(`
      SELECT c.*, 
             COUNT(g.id) as prodotti_count,
             SUM(g.quantita) as totale_quantita,
             SUM(ROUND(g.quantita * COALESCE(g.valore_medio, p.prezzo_acquisto, 0), 2)) as valore_totale
      FROM committenti c
      LEFT JOIN giacenze g ON c.id = g.committente_id
      LEFT JOIN prodotti p ON g.prodotto_id = p.id
      WHERE c.stato = 'attivo'
      GROUP BY c.id
      ORDER BY c.ragione_sociale
    `).all();

    // Carica categorie GLOBALI per filtro
    const categorie = db.prepare(`
      SELECT DISTINCT c.id, c.descrizione, COUNT(p.id) as prodotti_count
      FROM categorie c
      JOIN prodotti p ON c.id = p.categoria_id
      JOIN giacenze g ON p.id = g.prodotto_id
      GROUP BY c.id, c.descrizione
      ORDER BY c.descrizione
    `).all();

    return {
      giacenze,
      stats,
      committenti,
      categorie,
      filters: {
        committente_filter,
        search,
        categoria_id: categoria_id ? parseInt(categoria_id) : null,
        solo_scorte_basse
      },
      pagination: {
        current_page: page,
        limit,
        total_count: totalCount.count,
        total_pages: Math.ceil(totalCount.count / limit)
      }
    };

  } catch (err) {
    console.error('Errore caricamento giacenze:', err);
    throw error(500, 'Errore nel caricamento delle giacenze');
  }
};