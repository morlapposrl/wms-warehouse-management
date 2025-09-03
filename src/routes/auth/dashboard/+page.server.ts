import type { PageServerLoad } from './$types.js';
import database from '$lib/server/database.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
  try {
    // KPI Real-time per operatori
    const kpiData = database.prepare(`
      SELECT 
        -- Ordini oggi
        (SELECT COUNT(*) FROM ordini_master WHERE DATE(created_at) = DATE('now')) as ordini_oggi,
        (SELECT COUNT(*) FROM ordini_master WHERE status = 'PICKING_IN_PROGRESS') as ordini_in_picking,
        (SELECT COUNT(*) FROM ordini_master WHERE status = 'PACKED') as ordini_packed,
        (SELECT COUNT(*) FROM ordini_master WHERE status = 'SHIPPED' AND DATE(updated_at) = DATE('now')) as spedizioni_oggi,
        
        -- Movimenti oggi  
        (SELECT COUNT(*) FROM movimenti_ottimizzati WHERE DATE(timestamp_inizio) = DATE('now')) as movimenti_oggi,
        (SELECT COUNT(*) FROM movimenti_ottimizzati WHERE DATE(timestamp_inizio) = DATE('now') AND timestamp_fine IS NOT NULL) as movimenti_completati,
        (SELECT COUNT(*) FROM movimenti_ottimizzati WHERE timestamp_fine IS NULL) as movimenti_in_corso,
        
        -- Performance operatori oggi
        (SELECT COUNT(DISTINCT operatore_id) FROM movimenti_ottimizzati WHERE DATE(timestamp_inizio) = DATE('now')) as operatori_attivi,
        
        -- Wave in corso
        (SELECT COUNT(DISTINCT wave_id) FROM ordini_master WHERE wave_id IS NOT NULL AND status IN ('PICKING_IN_PROGRESS', 'PICKED_COMPLETE')) as wave_attive,
        
        -- Alert urgenze
        (SELECT COUNT(*) FROM ordini_master WHERE promised_date < datetime('now') AND status NOT IN ('SHIPPED', 'DELIVERED', 'CANCELLED')) as ordini_scaduti,
        (SELECT COUNT(*) FROM ordini_master WHERE promised_date < datetime('now', '+4 hours') AND status IN ('PAYMENT_CONFIRMED', 'PENDING_PICKING')) as ordini_critici
    `).get();

    // Performance operatori in tempo reale
    const operatoriPerformance = database.prepare(`
      SELECT 
        u.id,
        u.nome,
        u.cognome,
        u.specializzazione,
        
        -- Movimenti oggi
        COUNT(mo.id) as movimenti_oggi,
        COUNT(CASE WHEN mo.timestamp_fine IS NOT NULL THEN 1 END) as movimenti_completati,
        COUNT(CASE WHEN mo.timestamp_fine IS NULL THEN 1 END) as movimenti_in_corso,
        
        -- Performance
        ROUND(AVG(CASE WHEN mo.durata_secondi IS NOT NULL THEN mo.durata_secondi END), 0) as durata_media_secondi,
        SUM(CASE WHEN mo.tipo_movimento = 'PICK' THEN mo.quantita ELSE 0 END) as pezzi_prelevati,
        
        -- Produttività (picks/ora)
        ROUND(
          COUNT(CASE WHEN mo.tipo_movimento = 'PICK' AND mo.timestamp_fine IS NOT NULL THEN 1 END) * 60.0 / 
          NULLIF(SUM(CASE WHEN mo.durata_secondi IS NOT NULL THEN mo.durata_secondi END) / 60.0, 0), 1
        ) as picks_per_ora,
        
        -- Ultimo movimento
        MAX(mo.timestamp_inizio) as ultimo_movimento,
        
        -- Device usato
        mo.device_id as device_corrente,
        
        -- Status operatore
        CASE 
          WHEN COUNT(CASE WHEN mo.timestamp_fine IS NULL THEN 1 END) > 0 THEN 'ATTIVO'
          WHEN MAX(mo.timestamp_inizio) > datetime('now', '-1 hour') THEN 'RECENTE' 
          ELSE 'INATTIVO'
        END as status_operatore
        
      FROM utenti u
      LEFT JOIN movimenti_ottimizzati mo ON u.id = mo.operatore_id 
                                         AND DATE(mo.timestamp_inizio) = DATE('now')
      WHERE u.ruolo IN ('operatore_magazzino', 'team_leader') 
        AND u.attivo = 1
      GROUP BY u.id
      ORDER BY movimenti_completati DESC, picks_per_ora DESC
    `).all();

    // Zone magazzino - occupazione real-time COMPLETA
    const zoneStatus = database.prepare(`
      SELECT 
        u.zona_velocita,
        COUNT(DISTINCT u.id) as ubicazioni_totali,
        COUNT(DISTINCT gf.ubicazione_id) as ubicazioni_occupate,
        ROUND(100.0 * COUNT(DISTINCT gf.ubicazione_id) / NULLIF(COUNT(DISTINCT u.id), 0), 1) as percentuale_occupazione,
        
        -- Volume completo
        SUM(COALESCE(gf.volume_occupato_cm3, 0)) as volume_occupato_totale,
        SUM(
          COALESCE(u.larghezza_cm, 120) * 
          COALESCE(u.profondita_cm, 80) * 
          COALESCE(u.altezza_cm, 200)
        ) as volume_disponibile_totale,
        
        -- Movimenti attivi per zona (subquery ottimizzata)
        COALESCE(mov_stats.movimenti_in_corso, 0) as movimenti_in_corso,
        COALESCE(mov_stats.prime_picking, 0) as prime_picking,
        COALESCE(mov_stats.movimenti_completati_oggi, 0) as movimenti_completati_oggi,
        
        -- Ordine per priorità zone
        CASE u.zona_velocita 
          WHEN 'HOT' THEN 1
          WHEN 'WARM' THEN 2
          WHEN 'COLD' THEN 3
          ELSE 4
        END as sort_order
        
      FROM ubicazioni u
      LEFT JOIN giacenze_fisiche gf ON u.id = gf.ubicazione_id
      LEFT JOIN (
        SELECT 
          u2.zona_velocita,
          COUNT(CASE WHEN mo.timestamp_fine IS NULL THEN 1 END) as movimenti_in_corso,
          COUNT(CASE WHEN om.service_level = 'PRIME' AND mo.tipo_movimento = 'PICK' THEN 1 END) as prime_picking,
          COUNT(CASE WHEN mo.timestamp_fine IS NOT NULL AND DATE(mo.timestamp_inizio) = DATE('now') THEN 1 END) as movimenti_completati_oggi
        FROM ubicazioni u2
        LEFT JOIN movimenti_ottimizzati mo ON u2.id = mo.from_ubicazione_id 
                                          AND DATE(mo.timestamp_inizio) = DATE('now')
        LEFT JOIN ordini_master om ON mo.ordine_id = om.id
        WHERE u2.zona_velocita IS NOT NULL
        GROUP BY u2.zona_velocita
      ) mov_stats ON u.zona_velocita = mov_stats.zona_velocita
      WHERE u.zona_velocita IS NOT NULL
      GROUP BY u.zona_velocita
    `).all();

    // Alert system per operatori
    const alertsOperatori = database.prepare(`
      SELECT 
        'ORDINE_SCADUTO' as tipo_alert,
        'CRITICO' as priorita,
        om.order_number || ' scaduto da ' || 
        ROUND((julianday('now') - julianday(om.promised_date)) * 24, 1) || ' ore' as messaggio,
        om.id as riferimento_id,
        om.promised_date as timestamp_alert
      FROM ordini_master om 
      WHERE om.promised_date < datetime('now') 
        AND om.status NOT IN ('SHIPPED', 'DELIVERED', 'CANCELLED')
      
      UNION ALL
      
      SELECT 
        'MOVIMENTO_BLOCCATO' as tipo_alert,
        'ALTO' as priorita,
        'Movimento ' || mo.tipo_movimento || ' bloccato da ' ||
        ROUND((julianday('now') - julianday(mo.timestamp_inizio)) * 24 * 60, 0) || ' minuti' as messaggio,
        mo.id as riferimento_id,
        mo.timestamp_inizio as timestamp_alert
      FROM movimenti_ottimizzati mo
      WHERE mo.timestamp_fine IS NULL 
        AND mo.timestamp_inizio < datetime('now', '-30 minutes')
      
      UNION ALL
      
      SELECT 
        'WAVE_LENTA' as tipo_alert,
        'MEDIO' as priorita,
        'Wave ' || wave_id || ' in ritardo: ' || COUNT(*) || ' ordini ancora in picking' as messaggio,
        NULL as riferimento_id,
        MIN(om.promised_date) as timestamp_alert
      FROM ordini_master om
      WHERE om.wave_id IS NOT NULL 
        AND om.status = 'PICKING_IN_PROGRESS'
        AND om.promised_date < datetime('now', '+2 hours')
      GROUP BY om.wave_id
      HAVING COUNT(*) > 3
      
      ORDER BY priorita DESC, timestamp_alert ASC
      LIMIT 10
    `).all();

    // Throughput orario (ultimi 24 ore)
    const throughputOrario = database.prepare(`
      SELECT 
        strftime('%H:00', mo.timestamp_fine) as ora,
        COUNT(*) as movimenti_completati,
        COUNT(CASE WHEN mo.tipo_movimento = 'PICK' THEN 1 END) as picks_completati,
        COUNT(CASE WHEN mo.tipo_movimento = 'PUT_AWAY' THEN 1 END) as putaways_completati,
        ROUND(AVG(mo.durata_secondi), 0) as durata_media_secondi,
        COUNT(DISTINCT mo.operatore_id) as operatori_attivi_ora
        
      FROM movimenti_ottimizzati mo
      WHERE mo.timestamp_fine >= datetime('now', '-24 hours')
        AND mo.timestamp_fine IS NOT NULL
      GROUP BY strftime('%H:00', mo.timestamp_fine)
      ORDER BY ora DESC
      LIMIT 24
    `).all();

    // Inventory velocity (rotazione)
    const inventoryVelocity = database.prepare(`
      SELECT 
        p.codice as sku_code,
        p.descrizione,
        COALESCE(gl.quantita_disponibile, 0) as quantita_disponibile,
        COALESCE(gl.quantita_riservata, 0) as quantita_riservata,
        
        -- Movimenti ultimi 7 giorni
        COUNT(mo.id) as movimenti_7gg,
        SUM(CASE WHEN mo.tipo_movimento IN ('PICK', 'DISPOSE') THEN mo.quantita ELSE 0 END) as uscite_7gg,
        SUM(CASE WHEN mo.tipo_movimento IN ('RECEIVE', 'PUT_AWAY') THEN mo.quantita ELSE 0 END) as entrate_7gg,
        
        -- Velocity score (uscite/giacenza)
        ROUND(
          SUM(CASE WHEN mo.tipo_movimento IN ('PICK', 'DISPOSE') THEN mo.quantita ELSE 0 END) * 1.0 / 
          NULLIF(COALESCE(gl.quantita_disponibile, 0) + COALESCE(gl.quantita_riservata, 0), 0), 3
        ) as velocity_score,
        
        -- Classificazione ABC
        CASE 
          WHEN SUM(CASE WHEN mo.tipo_movimento IN ('PICK', 'DISPOSE') THEN mo.quantita ELSE 0 END) >= 20 THEN 'A'
          WHEN SUM(CASE WHEN mo.tipo_movimento IN ('PICK', 'DISPOSE') THEN mo.quantita ELSE 0 END) >= 5 THEN 'B'
          ELSE 'C'
        END as classe_abc
        
      FROM prodotti p
      LEFT JOIN giacenze_logiche gl ON p.codice = gl.sku_code AND p.committente_id = gl.committente_id
      LEFT JOIN movimenti_ottimizzati mo ON p.codice = mo.sku_code 
                                        AND mo.timestamp_inizio >= datetime('now', '-7 days')
      WHERE p.attivo = 1
      GROUP BY p.codice, p.committente_id
      ORDER BY velocity_score DESC
      LIMIT 20
    `).all();

    return {
      kpiData,
      operatoriPerformance,
      zoneStatus,
      alertsOperatori,
      throughputOrario,
      inventoryVelocity
    };

  } catch (err) {
    console.error('Errore caricamento dashboard:', err);
    throw error(500, 'Errore nel caricamento dei dati dashboard');
  }
};