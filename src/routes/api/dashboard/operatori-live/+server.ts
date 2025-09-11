import { json } from '@sveltejs/kit';
import { db as database } from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente_id = url.searchParams.get('committente_id');
    
    // Query per operatori attivi real-time
    const operatoriQuery = `
      SELECT DISTINCT
        u.id,
        u.nome || ' ' || u.cognome as nome_completo,
        u.specializzazione,
        u.ultimo_accesso,
        
        -- Ultimo movimento fatto
        m.tipo_movimento as ultima_attivita,
        m.data_movimento as timestamp_ultima_attivita,
        p.codice as ultimo_prodotto_movimentato,
        p.descrizione as descrizione_ultimo_prodotto,
        
        -- Zona di lavoro prevalente
        ub.zona as zona_attuale,
        ub.codice_ubicazione as ubicazione_attuale,
        
        -- Performance oggi
        COUNT(m.id) OVER (PARTITION BY u.id) as movimenti_oggi,
        
        -- Stato operatore
        CASE 
          WHEN datetime(m.data_movimento) >= datetime('now', '-30 minutes') THEN 'ATTIVO'
          WHEN datetime(m.data_movimento) >= datetime('now', '-2 hours') THEN 'PAUSA'
          WHEN datetime(u.ultimo_accesso) >= datetime('now', '-8 hours') THEN 'DISPONIBILE'
          ELSE 'OFFLINE'
        END as stato,
        
        -- Efficienza (movimenti per ora nelle ultime 8h)
        COALESCE((
          SELECT COUNT(*) * 1.0 / 8.0
          FROM movimenti m2 
          WHERE m2.operatore = u.nome || ' ' || u.cognome
          AND datetime(m2.data_movimento) >= datetime('now', '-8 hours')
          ${committente_id ? `AND m2.committente_id_origine = ${committente_id}` : ''}
        ), 0) as efficienza_movimenti_ora
        
      FROM utenti u
      LEFT JOIN movimenti m ON m.operatore = u.nome || ' ' || u.cognome
        AND date(m.data_movimento) = date('now')
        ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
      LEFT JOIN prodotti p ON m.prodotto_id = p.id
      LEFT JOIN ubicazioni ub ON m.ubicazione_id = ub.id
      
      WHERE u.ruolo IN ('operatore_magazzino', 'admin_committente', 'super_admin')
        AND u.attivo = 1
        ${committente_id ? `AND (u.committente_id = ${committente_id} OR u.committente_id IS NULL)` : ''}
        
      ORDER BY 
        CASE stato
          WHEN 'ATTIVO' THEN 1
          WHEN 'PAUSA' THEN 2 
          WHEN 'DISPONIBILE' THEN 3
          ELSE 4
        END,
        movimenti_oggi DESC
        
      LIMIT 20
    `;

    const operatori = database.prepare(operatoriQuery).all();

    // Statistiche aggregate operatori
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as totale_operatori_registrati,
        
        COUNT(DISTINCT CASE 
          WHEN datetime(m.data_movimento) >= datetime('now', '-30 minutes') 
          THEN u.id END) as operatori_attivi_ora,
          
        COUNT(DISTINCT CASE 
          WHEN date(m.data_movimento) = date('now') 
          THEN u.id END) as operatori_con_attivita_oggi,
          
        COALESCE(AVG(CASE 
          WHEN datetime(m.data_movimento) >= datetime('now', '-8 hours')
          THEN movimenti_per_operatore.count_mov / 8.0 
        END), 0) as efficienza_media_sistema
        
      FROM utenti u
      LEFT JOIN movimenti m ON m.operatore = u.nome || ' ' || u.cognome
        ${committente_id ? `AND m.committente_id_origine = ${committente_id}` : ''}
      LEFT JOIN (
        SELECT 
          operatore, 
          COUNT(*) as count_mov
        FROM movimenti 
        WHERE datetime(data_movimento) >= datetime('now', '-8 hours')
        ${committente_id ? `AND committente_id_origine = ${committente_id}` : ''}
        GROUP BY operatore
      ) movimenti_per_operatore ON movimenti_per_operatore.operatore = u.nome || ' ' || u.cognome
      
      WHERE u.ruolo IN ('operatore_magazzino', 'admin_committente', 'super_admin')
        AND u.attivo = 1
        ${committente_id ? `AND (u.committente_id = ${committente_id} OR u.committente_id IS NULL)` : ''}
    `;

    const stats = database.prepare(statsQuery).get();

    const response = {
      operatori: operatori.map(op => ({
        ...op,
        tempo_ultima_attivita: op.timestamp_ultima_attivita ? 
          Math.floor((Date.now() - new Date(op.timestamp_ultima_attivita).getTime()) / 60000) : null
      })),
      statistiche: stats,
      timestamp: new Date().toISOString(),
      cache_duration_seconds: 60
    };

    return json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Errore API Operatori Live:', error);
    return json({ 
      error: 'Errore interno del server',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
};