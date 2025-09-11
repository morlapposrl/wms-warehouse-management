import { json } from '@sveltejs/kit';
import { db as database } from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    console.log('KPI API called, database status:', database ? 'OK' : 'UNDEFINED');
    console.log('Database type:', typeof database, 'Constructor:', database?.constructor?.name);
    console.log('Database methods:', database ? Object.getOwnPropertyNames(database) : 'none');
    if (!database) {
      console.error('Database connection is undefined in KPI API');
      return json({ error: 'Database connection failed' }, { status: 500 });
    }
    if (typeof database.prepare !== 'function') {
      console.error('Database prepare method is missing. Database object:', database);
      return json({ error: 'Database prepare method not available' }, { status: 500 });
    }
    const committente_id = url.searchParams.get('committente_id');
    
    // Query per KPI real-time
    const kpiQuery = `
      SELECT 
        -- Ordini oggi
        (SELECT COUNT(*) FROM ordini WHERE date(created_at) = date('now')
         ${committente_id ? `AND committente_id = ${committente_id}` : ''}) as ordini_oggi,
         
        -- Movimenti oggi
        (SELECT COUNT(*) FROM movimenti WHERE date(data_movimento) = date('now')
         ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}) as movimenti_oggi,
         
        -- Movimenti completati (ultimati nelle ultime 24h)
        (SELECT COUNT(*) FROM movimenti 
         WHERE datetime(data_movimento) >= datetime('now', '-1 day')
         AND updated_at IS NOT NULL
         ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}) as movimenti_completati,
         
        -- Movimenti in corso (creati ma non finalizzati)
        (SELECT COUNT(*) FROM movimenti 
         WHERE date(data_movimento) = date('now')
         AND updated_at = created_at
         ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}) as movimenti_in_corso,
         
        -- Operatori attivi (con movimenti nelle ultime 8 ore)
        (SELECT COUNT(DISTINCT operatore) FROM movimenti 
         WHERE operatore IS NOT NULL 
         AND datetime(data_movimento) >= datetime('now', '-8 hours')
         ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}) as operatori_attivi,
         
        -- Wave attive
        (SELECT COUNT(*) FROM wave_planning 
         WHERE stato IN ('PIANIFICATA', 'IN_CORSO')
         ${committente_id ? `AND committente_id = ${committente_id}` : ''}) as wave_attive,
         
        -- Spedizioni oggi (ordini outbound spediti)
        (SELECT COUNT(*) FROM ordini 
         WHERE tipo_ordine = 'OUTBOUND' 
         AND stato = 'SPEDITO'
         AND date(data_spedizione) = date('now')
         ${committente_id ? `AND committente_id = ${committente_id}` : ''}) as spedizioni_oggi,
         
        -- UDC in movimento
        (SELECT COUNT(*) FROM udc WHERE stato = 'IN_MOVIMENTO'
         ${committente_id ? `AND committente_proprietario_id = ${committente_id}` : ''}) as udc_in_movimento,
         
        -- Prodotti sotto scorta
        (SELECT COUNT(*) FROM giacenze g
         JOIN prodotti p ON g.prodotto_id = p.id
         WHERE g.quantita <= p.scorta_minima AND p.scorta_minima > 0
         ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}) as prodotti_sotto_scorta,
         
        -- Efficienza media operatori (movimenti/ora nelle ultime 8h)
        COALESCE((SELECT 
          CAST(COUNT(*) as FLOAT) / 8.0 
          FROM movimenti 
          WHERE operatore IS NOT NULL 
          AND datetime(data_movimento) >= datetime('now', '-8 hours')
          ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}
        ), 0) as efficienza_operatori
    `;

    const kpiData = database.prepare(kpiQuery).get();

    // Timestamp per caching
    const response = {
      ...kpiData,
      timestamp: new Date().toISOString(),
      cache_duration_seconds: 30
    };

    return json(response, {
      headers: {
        'Cache-Control': 'public, max-age=30',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Errore API KPI Live:', error);
    return json({ 
      error: 'Errore interno del server',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
};