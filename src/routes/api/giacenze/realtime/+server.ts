import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

interface GiacenzaRealTime {
  id: number;
  committente_id: number;
  prodotto_id: number;
  prodotto_codice: string;
  prodotto_descrizione: string;
  categoria_nome: string;
  quantita: number;
  valore_medio: number;
  stato_scorta: 'OK' | 'BASSA' | 'CRITICA' | 'ECCESSIVA';
  scorta_minima: number;
  scorta_massima: number;
  ultima_modifica: string;
  ultimo_movimento?: string;
  movimenti_ultimi_7_giorni: number;
}

interface AlertGiacenza {
  id: string;
  tipo: 'SCORTA_BASSA' | 'SCORTA_CRITICA' | 'MOVIMENTO_ANOMALO' | 'ECCESSO_STOCK';
  prodotto_codice: string;
  prodotto_descrizione: string;
  committente_nome: string;
  messaggio: string;
  quantita_attuale: number;
  quantita_soglia?: number;
  timestamp: string;
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente_id = url.searchParams.get('committente_id');
    const since = url.searchParams.get('since'); // Per ottimizzazioni future
    
    // Query principali giacenze real-time
    let giacenzeQuery = `
      SELECT 
        g.id,
        g.committente_id,
        g.prodotto_id,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        c.descrizione as categoria_nome,
        g.quantita,
        g.valore_medio,
        p.scorta_minima,
        p.scorta_massima,
        g.ultima_modifica,
        -- Calcolo stato scorta
        CASE 
          WHEN g.quantita <= 0 THEN 'CRITICA'
          WHEN g.quantita <= p.scorta_minima THEN 'BASSA'
          WHEN g.quantita >= p.scorta_massima AND p.scorta_massima > 0 THEN 'ECCESSIVA'
          ELSE 'OK'
        END as stato_scorta,
        -- Ultimo movimento
        (SELECT MAX(data_movimento) 
         FROM movimenti m 
         WHERE m.prodotto_id = p.id 
           AND (m.committente_id_origine = g.committente_id OR m.committente_id_destinazione = g.committente_id)
        ) as ultimo_movimento,
        -- Movimenti ultimi 7 giorni
        (SELECT COUNT(*) 
         FROM movimenti m 
         WHERE m.prodotto_id = p.id 
           AND (m.committente_id_origine = g.committente_id OR m.committente_id_destinazione = g.committente_id)
           AND m.data_movimento >= date('now', '-7 days')
        ) as movimenti_ultimi_7_giorni
      FROM giacenze g
      JOIN prodotti p ON g.prodotto_id = p.id
      JOIN categorie c ON p.categoria_id = c.id
      WHERE p.attivo = 1
    `;
    
    const params: any[] = [];
    
    if (committente_id) {
      giacenzeQuery += ` AND g.committente_id = ?`;
      params.push(parseInt(committente_id));
    }
    
    giacenzeQuery += ` ORDER BY g.ultima_modifica DESC`;
    
    const giacenzeStmt = db.prepare(giacenzeQuery);
    const giacenze = giacenzeStmt.all(...params) as GiacenzaRealTime[];
    
    // Genera alerts per situazioni critiche
    const alerts: AlertGiacenza[] = [];
    const now = new Date().toISOString();
    
    // Ottieni nome committente per gli alerts
    const committentiNames = new Map<number, string>();
    const committentiStmt = db.prepare('SELECT id, ragione_sociale FROM committenti');
    const committenti = committentiStmt.all() as { id: number; ragione_sociale: string }[];
    committenti.forEach(c => committentiNames.set(c.id, c.ragione_sociale));
    
    giacenze.forEach(giacenza => {
      const committente_nome = committentiNames.get(giacenza.committente_id) || 'Sconosciuto';
      
      // Alert scorta critica (quantità = 0)
      if (giacenza.quantita <= 0) {
        alerts.push({
          id: `critical_${giacenza.prodotto_id}_${giacenza.committente_id}_${Date.now()}`,
          tipo: 'SCORTA_CRITICA',
          prodotto_codice: giacenza.prodotto_codice,
          prodotto_descrizione: giacenza.prodotto_descrizione,
          committente_nome,
          messaggio: `Prodotto ${giacenza.prodotto_codice} completamente esaurito`,
          quantita_attuale: giacenza.quantita,
          quantita_soglia: 0,
          timestamp: now
        });
      }
      
      // Alert scorta bassa
      else if (giacenza.quantita <= giacenza.scorta_minima && giacenza.scorta_minima > 0) {
        alerts.push({
          id: `low_stock_${giacenza.prodotto_id}_${giacenza.committente_id}_${Date.now()}`,
          tipo: 'SCORTA_BASSA',
          prodotto_codice: giacenza.prodotto_codice,
          prodotto_descrizione: giacenza.prodotto_descrizione,
          committente_nome,
          messaggio: `Scorta bassa per ${giacenza.prodotto_codice}: ${giacenza.quantita} disponibili (minimo ${giacenza.scorta_minima})`,
          quantita_attuale: giacenza.quantita,
          quantita_soglia: giacenza.scorta_minima,
          timestamp: now
        });
      }
      
      // Alert eccesso stock
      else if (giacenza.quantita >= giacenza.scorta_massima && giacenza.scorta_massima > 0) {
        alerts.push({
          id: `excess_stock_${giacenza.prodotto_id}_${giacenza.committente_id}_${Date.now()}`,
          tipo: 'ECCESSO_STOCK',
          prodotto_codice: giacenza.prodotto_codice,
          prodotto_descrizione: giacenza.prodotto_descrizione,
          committente_nome,
          messaggio: `Eccesso stock per ${giacenza.prodotto_codice}: ${giacenza.quantita} disponibili (massimo ${giacenza.scorta_massima})`,
          quantita_attuale: giacenza.quantita,
          quantita_soglia: giacenza.scorta_massima,
          timestamp: now
        });
      }
      
      // Alert movimento anomalo (nessun movimento da più di 90 giorni con stock)
      if (giacenza.quantita > 0 && giacenza.movimenti_ultimi_7_giorni === 0) {
        const ultimoMov = giacenza.ultimo_movimento ? new Date(giacenza.ultimo_movimento) : null;
        const giorniSenzaMovimenti = ultimoMov 
          ? Math.floor((Date.now() - ultimoMov.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
          
        if (giorniSenzaMovimenti > 90) {
          alerts.push({
            id: `stagnant_${giacenza.prodotto_id}_${giacenza.committente_id}_${Date.now()}`,
            tipo: 'MOVIMENTO_ANOMALO',
            prodotto_codice: giacenza.prodotto_codice,
            prodotto_descrizione: giacenza.prodotto_descrizione,
            committente_nome,
            messaggio: `Prodotto ${giacenza.prodotto_codice} senza movimenti da ${giorniSenzaMovimenti} giorni`,
            quantita_attuale: giacenza.quantita,
            timestamp: now
          });
        }
      }
    });

    // Statistiche veloci
    const stats = {
      totale_prodotti: giacenze.length,
      prodotti_critici: giacenze.filter(g => g.stato_scorta === 'CRITICA').length,
      prodotti_scorta_bassa: giacenze.filter(g => g.stato_scorta === 'BASSA').length,
      prodotti_eccesso: giacenze.filter(g => g.stato_scorta === 'ECCESSIVA').length,
      valore_totale: giacenze.reduce((sum, g) => sum + (g.quantita * g.valore_medio), 0),
      last_updated: now,
      alerts_count: alerts.length
    };

    return json({
      success: true,
      giacenze,
      new_alerts: alerts, // Solo gli alert generati in questo momento
      stats,
      timestamp: now,
      query_params: {
        committente_id: committente_id ? parseInt(committente_id) : null,
        since
      }
    });

  } catch (error) {
    console.error('Errore API giacenze real-time:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore interno del server',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
};