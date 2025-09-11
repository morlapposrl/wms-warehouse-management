import { json } from '@sveltejs/kit';
import { db as database } from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente_id = url.searchParams.get('committente_id');
    
    // Aggregate all dashboard data in one response
    const response = {
      timestamp: new Date().toISOString(),
      committente_id: committente_id ? parseInt(committente_id) : null,
      
      // Basic KPI
      kpi: {
        ordini_oggi: 0,
        movimenti_oggi: 0,
        operatori_attivi: 0,
        spedizioni_oggi: 0
      },
      
      // Recent activity
      attivita_recente: [],
      
      // Quick stats
      statistiche: {
        totale_prodotti: 0,
        totale_giacenze: 0,
        valore_magazzino: 0,
        alert_attivi: 0
      }
    };

    // Get basic counts
    const kpiQuery = `
      SELECT 
        (SELECT COUNT(*) FROM ordini 
         WHERE date(created_at) = date('now')
         ${committente_id ? `AND committente_id = ${committente_id}` : ''}) as ordini_oggi,
         
        (SELECT COUNT(*) FROM movimenti 
         WHERE date(data_movimento) = date('now')
         ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}) as movimenti_oggi,
         
        (SELECT COUNT(DISTINCT operatore) FROM movimenti 
         WHERE operatore IS NOT NULL 
         AND datetime(data_movimento) >= datetime('now', '-8 hours')
         ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}) as operatori_attivi,
         
        (SELECT COUNT(*) FROM ordini 
         WHERE tipo_ordine = 'OUTBOUND' AND stato = 'SPEDITO'
         AND date(data_spedizione) = date('now')
         ${committente_id ? `AND committente_id = ${committente_id}` : ''}) as spedizioni_oggi
    `;

    const kpiData = database.prepare(kpiQuery).get();
    response.kpi = kpiData || response.kpi;

    // Get recent activity
    const activityQuery = `
      SELECT 
        'movimento' as tipo,
        tipo_movimento as descrizione,
        datetime(data_movimento) as timestamp,
        operatore,
        quantita
      FROM movimenti 
      WHERE datetime(data_movimento) >= datetime('now', '-24 hours')
        ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}
      ORDER BY data_movimento DESC 
      LIMIT 10
    `;

    const activity = database.prepare(activityQuery).all();
    response.attivita_recente = activity || [];

    // Get statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM prodotti WHERE attivo = 1
         ${committente_id ? `AND committente_id = ${committente_id}` : ''}) as totale_prodotti,
         
        (SELECT SUM(quantita) FROM giacenze 
         ${committente_id ? `WHERE committente_id = ${committente_id}` : ''}) as totale_giacenze,
         
        (SELECT SUM(quantita * valore_medio) FROM giacenze 
         ${committente_id ? `WHERE committente_id = ${committente_id}` : ''}) as valore_magazzino,
         
        (SELECT COUNT(*) FROM giacenze g
         JOIN prodotti p ON g.prodotto_id = p.id
         WHERE g.quantita <= p.scorta_minima AND p.scorta_minima > 0
         ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}) as alert_attivi
    `;

    const stats = database.prepare(statsQuery).get();
    response.statistiche = stats || response.statistiche;

    return json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Errore API Full Data:', error);
    return json({ 
      error: 'Errore interno del server',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
};