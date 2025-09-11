import { json } from '@sveltejs/kit';
import { db as database } from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    console.log('Alerts API called, database status:', database ? 'OK' : 'UNDEFINED');
    if (!database) {
      console.error('Database connection is undefined in Alerts API');
      return json({ error: 'Database connection failed' }, { status: 500 });
    }
    const committente_id = url.searchParams.get('committente_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Alert automatici basati su condizioni del sistema
    const alertsQuery = `
      SELECT 
        'ALERT_' || ABS(RANDOM() % 999999) as id,
        tipo_alert,
        priorita,
        messaggio,
        timestamp_alert,
        prodotto_codice,
        prodotto_descrizione,
        stato,
        dettagli_json
      FROM (
      
        -- Alert scorte minime
        SELECT 
          'SCORTA_MINIMA' as tipo_alert,
          'CRITICO' as priorita,
          'Prodotto ' || p.codice || ' sotto scorta minima (' || g.quantita || '/' || p.scorta_minima || ')' as messaggio,
          g.ultima_modifica as timestamp_alert,
          p.codice as prodotto_codice,
          p.descrizione as prodotto_descrizione,
          'ATTIVO' as stato,
          '{"giacenza_attuale": ' || g.quantita || ', "scorta_minima": ' || p.scorta_minima || ', "differenza": ' || (g.quantita - p.scorta_minima) || '}' as dettagli_json
        FROM giacenze g
        JOIN prodotti p ON g.prodotto_id = p.id
        WHERE g.quantita <= p.scorta_minima 
          AND p.scorta_minima > 0
          AND p.attivo = 1
          ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}
          
        UNION ALL
        
        -- Alert prodotti esauriti
        SELECT 
          'PRODOTTO_ESAURITO' as tipo_alert,
          'CRITICO' as priorita,
          'Prodotto ' || p.codice || ' completamente esaurito' as messaggio,
          g.ultima_modifica as timestamp_alert,
          p.codice as prodotto_codice,
          p.descrizione as prodotto_descrizione,
          'ATTIVO' as stato,
          '{"giacenza_attuale": 0, "ultimo_movimento": "' || g.ultima_modifica || '"}' as dettagli_json
        FROM giacenze g
        JOIN prodotti p ON g.prodotto_id = p.id
        WHERE g.quantita = 0 
          AND p.attivo = 1
          ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}
          
        UNION ALL
        
        -- Alert sovrastoccaggio
        SELECT 
          'SOVRASTOCCAGGIO' as tipo_alert,
          'MEDIO' as priorita,
          'Prodotto ' || p.codice || ' in sovrastoccaggio (' || g.quantita || '/' || p.scorta_massima || ')' as messaggio,
          g.ultima_modifica as timestamp_alert,
          p.codice as prodotto_codice,
          p.descrizione as prodotto_descrizione,
          'ATTIVO' as stato,
          '{"giacenza_attuale": ' || g.quantita || ', "scorta_massima": ' || p.scorta_massima || ', "eccesso": ' || (g.quantita - p.scorta_massima) || '}' as dettagli_json
        FROM giacenze g
        JOIN prodotti p ON g.prodotto_id = p.id
        WHERE g.quantita >= p.scorta_massima 
          AND p.scorta_massima > 0
          AND p.attivo = 1
          ${committente_id ? `AND g.committente_id = ${committente_id}` : ''}
          
        UNION ALL
        
        -- Alert operatori inattivi
        SELECT 
          'OPERATORE_INATTIVO' as tipo_alert,
          'BASSO' as priorita,
          'Operatore ' || u.nome || ' ' || u.cognome || ' inattivo da oltre 4 ore' as messaggio,
          datetime('now') as timestamp_alert,
          NULL as prodotto_codice,
          NULL as prodotto_descrizione,
          'ATTIVO' as stato,
          '{"operatore_id": ' || u.id || ', "ultimo_accesso": "' || COALESCE(u.ultimo_accesso, '') || '"}' as dettagli_json
        FROM utenti u
        WHERE u.ruolo IN ('operatore_magazzino', 'admin_committente')
          AND u.attivo = 1
          AND (
            u.ultimo_accesso IS NULL 
            OR datetime(u.ultimo_accesso) < datetime('now', '-4 hours')
          )
          AND NOT EXISTS (
            SELECT 1 FROM movimenti m 
            WHERE m.operatore = u.nome || ' ' || u.cognome
            AND datetime(m.data_movimento) >= datetime('now', '-4 hours')
            ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
          )
          ${committente_id ? `AND (u.committente_id = ${committente_id} OR u.committente_id IS NULL)` : ''}
          
        UNION ALL
        
        -- Alert wave in ritardo
        SELECT 
          'WAVE_IN_RITARDO' as tipo_alert,
          'ALTO' as priorita,
          'Wave ' || wp.wave_number || ' in ritardo rispetto alla pianificazione' as messaggio,
          wp.created_at as timestamp_alert,
          NULL as prodotto_codice,
          NULL as prodotto_descrizione,
          'ATTIVO' as stato,
          '{"wave_id": ' || wp.id || ', "stato": "' || wp.stato || '", "ritardo_ore": ' || 
          CAST((julianday('now') - julianday(wp.data_creazione)) * 24 AS INTEGER) || '}' as dettagli_json
        FROM wave_planning wp
        WHERE wp.stato IN ('PIANIFICATA', 'IN_CORSO')
          AND datetime(wp.data_creazione) < datetime('now', '-2 hours')
          ${committente_id ? `AND wp.committente_id = ${committente_id}` : ''}
          
        UNION ALL
        
        -- Alert ordini bloccati
        SELECT 
          'ORDINE_BLOCCATO' as tipo_alert,
          'ALTO' as priorita,
          'Ordine ' || o.numero_ordine || ' bloccato in stato ' || o.stato || ' da oltre 24h' as messaggio,
          o.updated_at as timestamp_alert,
          NULL as prodotto_codice,
          NULL as prodotto_descrizione,
          'ATTIVO' as stato,
          '{"ordine_id": ' || o.id || ', "stato_attuale": "' || o.stato || '", "ore_blocco": ' || 
          CAST((julianday('now') - julianday(o.updated_at)) * 24 AS INTEGER) || '}' as dettagli_json
        FROM ordini o
        WHERE o.stato IN ('IN_PREPARAZIONE', 'CONFERMATO')
          AND datetime(o.updated_at) < datetime('now', '-1 day')
          ${committente_id ? `AND o.committente_id = ${committente_id}` : ''}
          
        UNION ALL
        
        -- Alert UDC danneggiate
        SELECT 
          'UDC_DANNEGGIATA' as tipo_alert,
          'MEDIO' as priorita,
          'UDC ' || u.barcode || ' risulta danneggiata e richiede intervento' as messaggio,
          u.ultimo_movimento as timestamp_alert,
          NULL as prodotto_codice,
          NULL as prodotto_descrizione,
          'ATTIVO' as stato,
          '{"udc_barcode": "' || u.barcode || '", "tipo_udc": "' || COALESCE(tu.descrizione, 'N/D') || '"}' as dettagli_json
        FROM udc u
        LEFT JOIN tipi_udc tu ON u.tipo_udc_id = tu.id
        WHERE u.stato = 'DANNEGGIATO'
          ${committente_id ? `AND u.committente_proprietario_id = ${committente_id}` : ''}
          
      ) alerts
      
      ORDER BY 
        CASE priorita
          WHEN 'CRITICO' THEN 1
          WHEN 'ALTO' THEN 2  
          WHEN 'MEDIO' THEN 3
          ELSE 4
        END,
        timestamp_alert DESC
        
      LIMIT ${limit}
    `;

    const alerts = database.prepare(alertsQuery).all();

    // Statistiche alert - versione semplificata per evitare errori SQL
    const stats = {
      totale_alert_attivi: alerts.length,
      alert_critici: alerts.filter(a => a.priorita === 'CRITICO').length,
      alert_alti: alerts.filter(a => a.priorita === 'ALTO').length,
      alert_medi: alerts.filter(a => a.priorita === 'MEDIO').length,
      alert_giacenze: alerts.filter(a => a.tipo_alert.includes('SCORTA') || a.tipo_alert === 'PRODOTTO_ESAURITO').length,
      alert_operatori: alerts.filter(a => a.tipo_alert.includes('OPERATORE')).length,
      alert_operativi: alerts.filter(a => a.tipo_alert.includes('WAVE') || a.tipo_alert.includes('ORDINE')).length,
      alert_udc: alerts.filter(a => a.tipo_alert.includes('UDC')).length
    };

    const response = {
      alerts: alerts.map(alert => ({
        ...alert,
        dettagli: alert.dettagli_json ? JSON.parse(alert.dettagli_json) : {},
        eta_risoluzione_stimata: getEtaRisoluzione(alert.tipo_alert, alert.priorita),
        azioni_suggerite: getAzioniSuggerite(alert.tipo_alert)
      })),
      statistiche: stats,
      filtri_applicati: {
        committente_id: committente_id ? parseInt(committente_id) : null,
        limit: limit
      },
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
    console.error('Errore API Alerts Live:', error);
    return json({ 
      error: 'Errore interno del server',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
};

// Helper functions
function getEtaRisoluzione(tipoAlert: string, priorita: string): number {
  const baseMinutes = {
    'CRITICO': 15,
    'ALTO': 60, 
    'MEDIO': 240,
    'BASSO': 480
  };
  
  const multipliers = {
    'SCORTA_MINIMA': 1.5,
    'PRODOTTO_ESAURITO': 2.0,
    'WAVE_IN_RITARDO': 0.5,
    'ORDINE_BLOCCATO': 1.0,
    'UDC_DANNEGGIATA': 1.2,
    'OPERATORE_INATTIVO': 0.3
  };
  
  const baseTime = baseMinutes[priorita as keyof typeof baseMinutes] || 120;
  const multiplier = multipliers[tipoAlert as keyof typeof multipliers] || 1.0;
  
  return Math.round(baseTime * multiplier);
}

function getAzioniSuggerite(tipoAlert: string): string[] {
  const azioni = {
    'SCORTA_MINIMA': ['Verificare fornitore', 'Creare ordine di riapprovvigionamento', 'Valutare scorta di sicurezza'],
    'PRODOTTO_ESAURITO': ['Ordine urgente fornitore', 'Comunicare a vendite', 'Verificare prodotti sostitutivi'],
    'SOVRASTOCCAGGIO': ['Promuovere vendite', 'Valutare sconti', 'Verificare previsioni'],
    'WAVE_IN_RITARDO': ['Assegnare più operatori', 'Rivedere priorità', 'Comunicare ritardo'],
    'ORDINE_BLOCCATO': ['Verificare giacenze', 'Contattare cliente', 'Sbloccare manualmente'],
    'UDC_DANNEGGIATA': ['Ispezionare UDC', 'Riparare o sostituire', 'Spostare contenuto'],
    'OPERATORE_INATTIVO': ['Contattare operatore', 'Verificare assenze', 'Ridistribuire carico']
  };
  
  return azioni[tipoAlert as keyof typeof azioni] || ['Verificare situazione', 'Contattare responsabile'];
}