import type { PageServerLoad } from './$types';
import db from '$lib/server/database';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
  try {
    // GIACENZE GLOBALI CON UDC: visualizza tutti i committenti
    const search = url.searchParams.get('search') || '';
    const categoria_id = url.searchParams.get('categoria') || '';
    const committente_filter = url.searchParams.get('committente') || '';
    const solo_scorte_basse = url.searchParams.get('solo_scorte_basse') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    // Query per ottenere giacenze globali con dettagli UDC
    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Filtro committente opzionale
    if (committente_filter && committente_filter !== '') {
      whereConditions.push('g.committente_id = ?');
      queryParams.push(parseInt(committente_filter));
    }

    if (search) {
      whereConditions.push('(p.codice LIKE ? OR p.descrizione LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (categoria_id && categoria_id !== '') {
      whereConditions.push('p.categoria_id = ?');
      queryParams.push(parseInt(categoria_id));
    }

    if (solo_scorte_basse) {
      whereConditions.push('g.quantita <= p.scorta_minima');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Query principale per giacenze con UDC GLOBALI
    const giacenzeQuery = `
      SELECT 
        p.id as prodotto_id,
        p.codice,
        p.descrizione,
        p.categoria_id,
        p.scorta_minima,
        cat.descrizione as categoria,
        um.codice as unita_misura,
        g.quantita as quantita_totale,
        g.valore_medio,
        g.committente_id,
        
        -- Info committente
        comm.ragione_sociale as committente_nome,
        comm.codice as committente_codice,
        
        -- UDC Details
        u.barcode as udc_barcode,
        tu.nome as tipo_udc,
        u.stato as udc_stato,
        u.peso_attuale_kg as peso_lordo,
        uc.quantita as quantita_udc,
        uc.lotto,
        uc.scadenza,
        uc.peso_kg,
        uc.posizione_in_udc,
        uc.data_inserimento,
        
        -- Ubicazione
        ub.codice_ubicazione,
        ub.zona,
        
        -- Ordine di carico (se disponibile)
        o.numero_ordine,
        o.data_ordine,
        o.cliente_fornitore as fornitore,
        
        -- Calcoli
        ROUND(g.quantita * COALESCE(g.valore_medio, 0), 2) as valore_totale,
        (uc.quantita * COALESCE(g.valore_medio, 0)) as valore_udc,
        
        -- Stato scorta
        CASE 
          WHEN p.scorta_minima IS NOT NULL AND g.quantita <= p.scorta_minima THEN 'BASSA'
          WHEN p.scorta_massima IS NOT NULL AND g.quantita >= p.scorta_massima THEN 'ALTA'
          ELSE 'NORMALE'
        END as stato_scorta
        
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN committenti comm ON g.committente_id = comm.id
      LEFT JOIN categorie cat ON p.categoria_id = cat.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      LEFT JOIN udc_contenuto uc ON p.id = uc.prodotto_id
      LEFT JOIN udc u ON uc.udc_id = u.id
      LEFT JOIN tipi_udc tu ON u.tipo_udc_id = tu.id
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      LEFT JOIN movimenti m ON uc.udc_id = m.udc_id
      LEFT JOIN ordini o ON m.ordine_id = o.id
      ${whereClause}
      ORDER BY comm.ragione_sociale, p.codice, u.barcode, uc.posizione_in_udc
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const giacenzeRaw = db.prepare(giacenzeQuery).all(...queryParams);

    // Raggruppa per committente e poi per prodotto con espansione UDC
    const giacenzeRaggruppate = new Map();
    
    for (const row of giacenzeRaw) {
      // Chiave: committente_id + prodotto_id
      const key = `${row.committente_id}_${row.prodotto_id}`;
      
      if (!giacenzeRaggruppate.has(key)) {
        giacenzeRaggruppate.set(key, {
          committente: {
            id: row.committente_id,
            nome: row.committente_nome,
            codice: row.committente_codice
          },
          prodotto: {
            id: row.prodotto_id,
            codice: row.codice,
            descrizione: row.descrizione,
            categoria_id: row.categoria_id,
            categoria: row.categoria,
            unita_misura: row.unita_misura,
            scorta_minima: row.scorta_minima
          },
          totale: {
            quantita: row.quantita_totale,
            valore_medio: row.valore_medio,
            valore_totale: row.valore_totale,
            stato_scorta: row.stato_scorta
          },
          dettagli_udc: [],
          udc_count: 0,
          ubicazioni_count: 0
        });
      }
      
      const gruppo = giacenzeRaggruppate.get(key);
      
      if (row.udc_barcode) {
        gruppo.dettagli_udc.push({
          udc_barcode: row.udc_barcode,
          tipo_udc: row.tipo_udc,
          stato: row.udc_stato,
          quantita: row.quantita_udc,
          lotto: row.lotto,
          scadenza: row.scadenza,
          peso_kg: row.peso_kg,
          peso_lordo: row.peso_lordo,
          posizione: row.posizione_in_udc,
          data_inserimento: row.data_inserimento,
          ubicazione: row.codice_ubicazione,
          zona: row.zona,
          valore: row.valore_udc,
          // Riferimenti ordine di carico
          ordine_numero: row.numero_ordine,
          ordine_data: row.data_ordine,
          fornitore: row.fornitore
        });
      }
    }

    // Converti Map in array e calcola statistiche
    const giacenzeFinali = Array.from(giacenzeRaggruppate.values()).map(gruppo => {
      const ubicazioni = new Set(gruppo.dettagli_udc.map(d => d.ubicazione).filter(u => u));
      const udcs = new Set(gruppo.dettagli_udc.map(d => d.udc_barcode).filter(u => u));
      
      return {
        ...gruppo,
        udc_count: udcs.size,
        ubicazioni_count: ubicazioni.size,
        is_distributed: udcs.size > 1 || ubicazioni.size > 1
      };
    });

    // Statistiche globali
    const statisticheQuery = db.prepare(`
      SELECT 
        COUNT(DISTINCT g.id) as totale_giacenze,
        COUNT(DISTINCT g.committente_id) as totale_committenti,
        COUNT(DISTINCT g.prodotto_id) as totale_prodotti,
        COUNT(DISTINCT u.id) as totale_udc,
        ROUND(SUM(g.quantita * COALESCE(g.valore_medio, 0)), 2) as valore_totale_magazzino,
        COUNT(CASE WHEN g.quantita <= p.scorta_minima THEN 1 END) as giacenze_scorta_bassa
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      LEFT JOIN udc_contenuto uc ON p.id = uc.prodotto_id
      LEFT JOIN udc u ON uc.udc_id = u.id
      LEFT JOIN tipi_udc tu ON u.tipo_udc_id = tu.id
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      LEFT JOIN movimenti m ON uc.udc_id = m.udc_id
      LEFT JOIN ordini o ON m.ordine_id = o.id
    `).get();

    // Lista committenti per filtro
    const committenti = db.prepare(`
      SELECT DISTINCT 
        comm.id, 
        comm.ragione_sociale, 
        comm.codice,
        COUNT(g.id) as numero_giacenze
      FROM committenti comm
      JOIN giacenze g ON comm.id = g.committente_id
      GROUP BY comm.id, comm.ragione_sociale, comm.codice
      ORDER BY comm.ragione_sociale
    `).all();

    // Lista categorie per filtro
    const categorie = db.prepare(`
      SELECT DISTINCT 
        c.id, 
        c.descrizione,
        COUNT(g.id) as numero_giacenze
      FROM categorie c
      JOIN prodotti p ON c.id = p.categoria_id
      JOIN giacenze g ON p.id = g.prodotto_id
      GROUP BY c.id, c.descrizione
      ORDER BY c.descrizione
    `).all();

    // Count totale per paginazione
    const totalQuery = `
      SELECT COUNT(DISTINCT CONCAT(g.committente_id, '_', g.prodotto_id)) as total
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN committenti comm ON g.committente_id = comm.id
      ${whereClause}
    `;
    
    const totalResult = db.prepare(totalQuery).get(...queryParams.slice(0, -2));
    const total = totalResult?.total || 0;

    return {
      giacenze: giacenzeFinali,
      statistiche: {
        ...statisticheQuery,
        prodotti_distribuiti: giacenzeFinali.filter(g => g.is_distributed).length
      },
      committenti,
      categorie,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        categoria_id,
        committente_filter,
        solo_scorte_basse
      }
    };

  } catch (err) {
    console.error('Errore nel caricamento giacenze globali:', err);
    throw error(500, 'Errore nel caricamento delle giacenze');
  }
};