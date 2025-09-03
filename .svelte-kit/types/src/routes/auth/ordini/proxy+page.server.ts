// @ts-nocheck
import type { PageServerLoad } from './$types';
import db from '$lib/server/database';
import { error } from '@sveltejs/kit';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Ottieni parametri filtri
    const committente_id = parseInt(url.searchParams.get('committente') || '1');
    const search = url.searchParams.get('search') || '';
    const stato = url.searchParams.get('stato') || '';
    const tipo_ordine = url.searchParams.get('tipo') || '';
    const data_da = url.searchParams.get('data_da') || '';
    const data_a = url.searchParams.get('data_a') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // Costruisci query base con tutti i filtri
    let whereConditions: string[] = ['o.committente_id = ?'];
    let queryParams: any[] = [committente_id];

    if (search.trim()) {
      whereConditions.push('(o.numero_ordine LIKE ? OR o.cliente_fornitore LIKE ? OR o.tracking_number LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (stato) {
      whereConditions.push('o.stato = ?');
      queryParams.push(stato);
    }

    if (tipo_ordine) {
      whereConditions.push('o.tipo_ordine = ?');
      queryParams.push(tipo_ordine);
    }

    if (data_da) {
      whereConditions.push('o.data_ordine >= ?');
      queryParams.push(data_da);
    }

    if (data_a) {
      whereConditions.push('o.data_ordine <= ?');
      queryParams.push(data_a);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query ordini con paginazione
    const ordiniQuery = `
      SELECT
        o.id,
        o.numero_ordine,
        o.tipo_ordine,
        o.stato,
        o.data_ordine,
        o.data_richiesta,
        o.data_spedizione,
        o.cliente_fornitore,
        o.corriere,
        o.tracking_number,
        o.totale_colli,
        o.totale_peso_kg,
        o.totale_valore,
        c.ragione_sociale as committente_nome
      FROM ordini o
      JOIN committenti c ON o.committente_id = c.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const ordini = db.prepare(ordiniQuery).all([...queryParams, limit, offset]);

    // Conta totale per paginazione usando stessi parametri
    const countQuery = `
      SELECT COUNT(*) as count
      FROM ordini o
      JOIN committenti c ON o.committente_id = c.id
      WHERE ${whereClause}
    `;

    const totalCount = db.prepare(countQuery).get(queryParams) as { count: number };

    // Statistiche per committente (sempre senza filtri)
    const statsQuery = `
      SELECT
        COUNT(*) as totale_ordini,
        COUNT(CASE WHEN stato = 'NUOVO' THEN 1 END) as ordini_nuovi,
        COUNT(CASE WHEN stato = 'IN_PREPARAZIONE' THEN 1 END) as ordini_in_preparazione,
        COUNT(CASE WHEN stato = 'SPEDITO' THEN 1 END) as ordini_spediti,
        COALESCE(SUM(totale_valore), 0) as valore_totale
      FROM ordini
      WHERE committente_id = ?
    `;

    const stats = db.prepare(statsQuery).get(committente_id);

    // Opzioni per select
    const stati_disponibili = ['NUOVO', 'CONFERMATO', 'IN_PREPARAZIONE', 'PRONTO', 'SPEDITO', 'CONSEGNATO', 'ANNULLATO', 'RESO'];
    const tipi_disponibili = ['INBOUND', 'OUTBOUND'];

    // Lista committenti per select
    const committentiQuery = `
      SELECT id, ragione_sociale, codice 
      FROM committenti 
      WHERE stato = 'attivo' 
      ORDER BY ragione_sociale
    `;
    const committenti = db.prepare(committentiQuery).all();

    return {
      ordini,
      stats,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalCount.count / limit),
        total_count: totalCount.count,
        limit
      },
      filters: {
        committente_id,
        search,
        stato,
        tipo_ordine,
        data_da,
        data_a
      },
      options: {
        stati_disponibili,
        tipi_disponibili,
        committenti
      }
    };
  } catch (err) {
    console.error('Errore caricamento ordini:', err);
    throw error(500, 'Errore nel caricamento degli ordini');
  }
};