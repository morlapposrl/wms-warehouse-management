import { json } from '@sveltejs/kit';
import { db as database } from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente_id = url.searchParams.get('committente_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Query giacenze critiche e alert scorte
    const giacenzeCriticheQuery = `
      SELECT 
        p.id as prodotto_id,
        p.codice,
        p.descrizione,
        c.descrizione as categoria,
        um.descrizione as unita_misura,
        g.quantita as giacenza_attuale,
        p.scorta_minima,
        p.scorta_massima,
        g.valore_medio as prezzo_medio,
        g.quantita * g.valore_medio as valore_totale,
        g.ultima_modifica as ultimo_movimento,
        
        -- Calcolo giorni di autonomia (basato su movimenti ultimi 30gg)
        COALESCE((
          SELECT AVG(m.quantita) 
          FROM movimenti m 
          WHERE m.prodotto_id = p.id 
          AND m.tipo_movimento IN ('SCARICO', 'TRASFERIMENTO_INTERNO')
          AND date(m.data_movimento) >= date('now', '-30 days')
          ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
        ), 0) as consumo_medio_giornaliero,
        
        CASE 
          WHEN g.quantita = 0 THEN 'ESAURITO'
          WHEN g.quantita <= p.scorta_minima AND p.scorta_minima > 0 THEN 'CRITICO'
          WHEN g.quantita <= (p.scorta_minima * 1.5) AND p.scorta_minima > 0 THEN 'BASSO' 
          WHEN g.quantita >= p.scorta_massima AND p.scorta_massima > 0 THEN 'ECCESSO'
          ELSE 'NORMALE'
        END as stato_scorta,
        
        -- Rotazione (movimenti negli ultimi 30 giorni)
        COALESCE((
          SELECT COUNT(*)
          FROM movimenti m 
          WHERE m.prodotto_id = p.id 
          AND date(m.data_movimento) >= date('now', '-30 days')
          ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
        ), 0) as movimenti_ultimi_30gg,
        
        -- Ubicazioni dove si trova
        GROUP_CONCAT(DISTINCT ub.codice_ubicazione) as ubicazioni
        
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      JOIN unita_misura um ON p.unita_misura_id = um.id
      LEFT JOIN movimenti m_loc ON m_loc.prodotto_id = p.id 
        AND m_loc.ubicazione_id IS NOT NULL
        AND date(m_loc.data_movimento) >= date('now', '-7 days')
      LEFT JOIN ubicazioni ub ON m_loc.ubicazione_id = ub.id
      
      WHERE g.quantita >= 0 
        AND p.attivo = 1
        ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}
        
      GROUP BY p.id, p.codice, p.descrizione, c.descrizione, um.descrizione, 
               g.quantita, p.scorta_minima, p.scorta_massima, g.valore_medio, g.ultima_modifica
               
      ORDER BY 
        CASE stato_scorta
          WHEN 'ESAURITO' THEN 1
          WHEN 'CRITICO' THEN 2
          WHEN 'BASSO' THEN 3
          WHEN 'ECCESSO' THEN 4
          ELSE 5
        END,
        g.ultima_modifica DESC
        
      LIMIT ${limit}
    `;

    const giacenzeCritiche = database.prepare(giacenzeCriticheQuery).all();

    // Statistiche aggregate giacenze
    const statsQuery = `
      SELECT 
        COUNT(p.id) as totale_sku,
        
        SUM(g.quantita) as quantita_totale_magazzino,
        
        SUM(g.quantita * g.valore_medio) as valore_totale_magazzino,
        
        COUNT(CASE WHEN g.quantita = 0 THEN 1 END) as prodotti_esauriti,
        
        COUNT(CASE WHEN g.quantita <= p.scorta_minima AND p.scorta_minima > 0 THEN 1 END) as prodotti_sotto_scorta,
        
        COUNT(CASE WHEN g.quantita >= p.scorta_massima AND p.scorta_massima > 0 THEN 1 END) as prodotti_sovrastoccati,
        
        -- Movimenti nelle ultime 24h
        COALESCE((
          SELECT COUNT(*) 
          FROM movimenti m
          WHERE datetime(m.data_movimento) >= datetime('now', '-1 day')
          ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
        ), 0) as movimenti_ultime_24h,
        
        -- SKU con movimenti nelle ultime 24h  
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM movimenti m 
            WHERE m.prodotto_id = p.id 
            AND datetime(m.data_movimento) >= datetime('now', '-1 day')
            ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
          ) THEN p.id 
        END) as sku_attivi_24h,
        
        -- Percentuale rotazione
        ROUND(
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM movimenti m 
              WHERE m.prodotto_id = p.id 
              AND datetime(m.data_movimento) >= datetime('now', '-1 day')
              ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
            ) THEN p.id 
          END) * 100.0 / COUNT(p.id), 1
        ) as percentuale_rotazione_24h
        
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      WHERE p.attivo = 1
        ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}
    `;

    const stats = database.prepare(statsQuery).get();

    // Top 10 prodotti per valore
    const topValoreQuery = `
      SELECT 
        p.codice,
        p.descrizione,
        g.quantita,
        g.valore_medio,
        g.quantita * g.valore_medio as valore_totale
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      WHERE g.quantita > 0 
        AND p.attivo = 1
        ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}
      ORDER BY valore_totale DESC
      LIMIT 10
    `;

    const topValore = database.prepare(topValoreQuery).all();

    const response = {
      giacenze_critiche: giacenzeCritiche.map(g => ({
        ...g,
        giorni_autonomia: g.consumo_medio_giornaliero > 0 ? 
          Math.floor(g.giacenza_attuale / g.consumo_medio_giornaliero) : null,
        alert_attivo: ['ESAURITO', 'CRITICO', 'BASSO', 'ECCESSO'].includes(g.stato_scorta),
        percentuale_scorta: g.scorta_minima > 0 ? 
          Math.round((g.giacenza_attuale / g.scorta_minima) * 100) : null
      })),
      statistiche: stats,
      top_valore: topValore,
      filtri_applicati: {
        committente_id: committente_id ? parseInt(committente_id) : null,
        limit: limit
      },
      timestamp: new Date().toISOString(),
      cache_duration_seconds: 45
    };

    return json(response, {
      headers: {
        'Cache-Control': 'public, max-age=45',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Errore API Giacenze Live:', error);
    return json({ 
      error: 'Errore interno del server',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
};