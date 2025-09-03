import type { PageServerLoad, Actions } from './$types.js';
import database from '$lib/server/database.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
  try {
    // Ordini pronti per picking (con priorità)
    const ordiniPronti = database.prepare(`
      SELECT DISTINCT
        om.id,
        om.order_number,
        om.customer_name,
        om.service_level,
        om.promised_date,
        om.total_amount,
        om.status,
        COUNT(od.id) as righe_ordine,
        SUM(od.quantita) as pezzi_totali,
        CASE 
          WHEN om.service_level = 'PRIME' THEN 1
          WHEN om.service_level = 'STANDARD' THEN 2  
          ELSE 3
        END as priorita,
        CASE
          WHEN om.promised_date < datetime('now', '+1 day') THEN 'URGENTE'
          WHEN om.promised_date < datetime('now', '+2 days') THEN 'NORMALE'
          ELSE 'BASSA'
        END as urgenza
      FROM ordini_master om
      JOIN ordini_dettaglio od ON om.id = od.order_id
      JOIN giacenze_logiche gl ON od.sku_code = gl.sku_code AND od.committente_id = gl.committente_id
      WHERE om.status IN ('PAYMENT_CONFIRMED', 'PENDING_PICKING')
        AND od.quantita <= gl.quantita_disponibile
        AND om.wave_id IS NULL
      GROUP BY om.id
      ORDER BY priorita ASC, om.promised_date ASC
    `).all();

    // Wave attive in corso
    const waveAttive = database.prepare(`
      SELECT
        wave_id,
        COUNT(DISTINCT id) as ordini_count,
        SUM(total_amount) as valore_totale,
        MIN(promised_date) as prima_consegna,
        MAX(promised_date) as ultima_consegna,
        GROUP_CONCAT(DISTINCT service_level) as livelli_servizio,
        CASE
          WHEN COUNT(CASE WHEN timestamp_fine IS NULL THEN 1 END) > 0 AND COUNT(CASE WHEN timestamp_fine IS NOT NULL THEN 1 END) > 0 THEN 'IN_CORSO'
          WHEN COUNT(CASE WHEN timestamp_fine IS NOT NULL THEN 1 END) = COUNT(mov_id) AND COUNT(mov_id) > 0 THEN 'COMPLETATA'
          ELSE 'ASSEGNATA'
        END as status_wave
      FROM (
        SELECT
          om.wave_id,
          om.id,
          om.total_amount,
          om.promised_date,
          om.service_level,
          mo.id as mov_id,
          mo.timestamp_fine
        FROM ordini_master om
        LEFT JOIN movimenti_ottimizzati mo ON om.wave_id = mo.wave_id
        WHERE om.wave_id IS NOT NULL
      )
      GROUP BY wave_id
      ORDER BY prima_consegna ASC
    `).all();

    // Statistiche magazzino per wave planning
    const statsUbicazioni = database.prepare(`
      SELECT 
        u.zona_velocita,
        COUNT(DISTINCT u.id) as ubicazioni_totali,
        COUNT(DISTINCT gf.ubicazione_id) as ubicazioni_occupate,
        ROUND(AVG(u.coordinata_x), 1) as centro_x,
        ROUND(AVG(u.coordinata_y), 1) as centro_y,
        SUM(gf.quantita_totale) as pezzi_totali
      FROM ubicazioni u
      LEFT JOIN giacenze_fisiche gf ON u.id = gf.ubicazione_id
      GROUP BY u.zona_velocita
      ORDER BY 
        CASE u.zona_velocita 
          WHEN 'HOT' THEN 1
          WHEN 'WARM' THEN 2 
          WHEN 'COLD' THEN 3
        END
    `).all();

    // Operatori disponibili
    const operatori = database.prepare(`
      SELECT 
        id,
        nome,
        cognome,
        specializzazione,
        COALESCE(
          (SELECT COUNT(*) FROM movimenti_ottimizzati 
           WHERE operatore_id = utenti.id 
             AND DATE(timestamp_inizio) = DATE('now')
             AND timestamp_fine IS NULL), 0
        ) as movimenti_attivi
      FROM utenti 
      WHERE ruolo IN ('operatore_magazzino', 'team_leader')
        AND attivo = 1
      ORDER BY movimenti_attivi ASC, specializzazione ASC
    `).all();

    return {
      ordiniPronti,
      waveAttive, 
      statsUbicazioni,
      operatori
    };
  } catch (err) {
    console.error('Errore caricamento wave planning:', err);
    throw error(500, 'Errore nel caricamento dei dati');
  }
};

export const actions: Actions = {
  // Crea una nuova wave
  creaWave: async ({ request }) => {
    try {
      const data = await request.formData();
      const ordiniSelezionati = JSON.parse(data.get('ordini') as string);
      const operatoreId = parseInt(data.get('operatore_id') as string);
      const tipoWave = data.get('tipo_wave') as string;
      
      const waveId = `WAVE_${Date.now()}`;
      
      database.transaction(() => {
        // Assegna wave agli ordini
        const updateStmt = database.prepare(`
          UPDATE ordini_master 
          SET wave_id = ?, status = 'PICKING_IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        
        ordiniSelezionati.forEach((ordineId: number) => {
          updateStmt.run(waveId, ordineId);
        });

        // Crea movimenti di picking ottimizzati
        const ordiniWave = database.prepare(`
          SELECT od.*, p.descrizione_personalizzata as descrizione, gl.quantita_disponibile
          FROM ordini_dettaglio od
          JOIN ordini_master om ON od.order_id = om.id  
          JOIN prodotti_committente_v2 p ON od.sku_code = p.sku_code AND od.committente_id = p.committente_id
          JOIN giacenze_logiche gl ON od.sku_code = gl.sku_code AND od.committente_id = gl.committente_id
          WHERE om.wave_id = ?
          ORDER BY od.committente_id, od.sku_code
        `).all(waveId);

        // Raggruppa per SKU per ottimizzare i prelievi
        const pickingTasks = new Map();
        
        ordiniWave.forEach(riga => {
          const key = `${riga.committente_id}_${riga.sku_code}`;
          if (pickingTasks.has(key)) {
            pickingTasks.get(key).quantita_totale += riga.quantita;
            pickingTasks.get(key).ordini.push(riga.order_id);
          } else {
            pickingTasks.set(key, {
              ...riga,
              quantita_totale: riga.quantita,
              ordini: [riga.order_id]
            });
          }
        });

        // Trova ubicazioni ottimali per picking
        const movimentoStmt = database.prepare(`
          INSERT INTO movimenti_ottimizzati 
          (committente_id, sku_code, tipo_movimento, quantita, from_ubicazione_id, 
           operatore_id, wave_id, ordine_id, note, timestamp_inizio)
          VALUES (?, ?, 'PICK', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        Array.from(pickingTasks.values()).forEach(task => {
          // Trova ubicazione con più giacenza per questo SKU
          const ubicazioneOttimale = database.prepare(`
            SELECT gf.ubicazione_id, gf.quantita_totale,
                   u.zona_velocita, u.coordinata_x, u.coordinata_y
            FROM giacenze_fisiche gf
            JOIN ubicazioni u ON gf.ubicazione_id = u.id
            JOIN giacenze_ownership go ON gf.ubicazione_id = go.ubicazione_id 
                                       AND gf.sku_code = go.sku_code
            WHERE gf.sku_code = ? 
              AND go.committente_id = ?
              AND gf.quantita_totale >= ?
            ORDER BY u.zona_velocita = 'HOT' DESC, gf.quantita_totale DESC
            LIMIT 1
          `).get(task.sku_code, task.committente_id, task.quantita_totale);

          if (ubicazioneOttimale) {
            movimentoStmt.run(
              task.committente_id,
              task.sku_code, 
              task.quantita_totale,
              ubicazioneOttimale.ubicazione_id,
              operatoreId,
              waveId,
              task.ordini[0], // Ordine principale
              `Picking wave per ${task.ordini.length} ordini: ${task.ordini.join(', ')}`
            );
          }
        });

        // Riserva le giacenze
        const riservStmt = database.prepare(`
          UPDATE giacenze_logiche 
          SET quantita_riservata = quantita_riservata + ?,
              quantita_disponibile = quantita_disponibile - ?
          WHERE committente_id = ? AND sku_code = ?
        `);

        Array.from(pickingTasks.values()).forEach(task => {
          riservStmt.run(task.quantita_totale, task.quantita_totale, 
                        task.committente_id, task.sku_code);
        });
      })();

      return { 
        success: true, 
        waveId,
        message: `Wave ${waveId} creata con successo per ${ordiniSelezionati.length} ordini`
      };

    } catch (err) {
      console.error('Errore creazione wave:', err);
      return { success: false, error: 'Errore nella creazione della wave' };
    }
  },

  // Ottimizza percorso wave
  ottimizzaPercorso: async ({ request }) => {
    try {
      const data = await request.formData();
      const waveId = data.get('wave_id') as string;
      
      // Algoritmo di ottimizzazione percorso (Nearest Neighbor semplificato)
      const movimenti = database.prepare(`
        SELECT mo.id, mo.from_ubicazione_id, u.coordinata_x, u.coordinata_y,
               mo.sku_code, mo.quantita, COALESCE(p.descrizione, mo.sku_code) as descrizione
        FROM movimenti_ottimizzati mo
        JOIN ubicazioni u ON mo.from_ubicazione_id = u.id
        LEFT JOIN prodotti p ON mo.sku_code = p.sku_code AND mo.committente_id = p.committente_id
        WHERE mo.wave_id = ? AND mo.timestamp_fine IS NULL
        ORDER BY u.zona_velocita = 'HOT' DESC, u.coordinata_x, u.coordinata_y
      `).all(waveId);

      // Calcola percorso ottimizzato
      const percorsoOttimizzato = ottimizzaPercorsoPickering(movimenti);
      
      // Aggiorna sequenza movimenti
      database.transaction(() => {
        const updateStmt = database.prepare(`
          UPDATE movimenti_ottimizzati 
          SET note = COALESCE(note, '') || ' | Sequenza: ' || ?
          WHERE id = ?
        `);
        
        percorsoOttimizzato.forEach((movimento, index) => {
          updateStmt.run(index + 1, movimento.id);
        });
      })();

      return { 
        success: true,
        percorso: percorsoOttimizzato,
        distanzaTotale: calcolaDistanzaTotale(percorsoOttimizzato)
      };

    } catch (err) {
      console.error('Errore ottimizzazione percorso:', err);
      return { success: false, error: 'Errore nell\'ottimizzazione del percorso' };
    }
  }
};

// Algoritmo Nearest Neighbor per ottimizzare percorso
function ottimizzaPercorsoPickering(movimenti: any[]): any[] {
  if (movimenti.length <= 1) return movimenti;
  
  const visitati = new Set();
  const percorso = [];
  
  // Inizia dal punto più vicino all'entrata (0,0)
  let corrente = movimenti.reduce((nearest, mov) => {
    const dist = Math.sqrt(mov.coordinata_x ** 2 + mov.coordinata_y ** 2);
    const nearestDist = Math.sqrt(nearest.coordinata_x ** 2 + nearest.coordinata_y ** 2);
    return dist < nearestDist ? mov : nearest;
  });
  
  visitati.add(corrente.id);
  percorso.push(corrente);
  
  // Trova il prossimo punto più vicino
  while (percorso.length < movimenti.length) {
    let prossimoMinimo = null;
    let distanzaMinima = Infinity;
    
    movimenti.forEach(mov => {
      if (visitati.has(mov.id)) return;
      
      const distanza = Math.sqrt(
        (mov.coordinata_x - corrente.coordinata_x) ** 2 +
        (mov.coordinata_y - corrente.coordinata_y) ** 2
      );
      
      if (distanza < distanzaMinima) {
        distanzaMinima = distanza;
        prossimoMinimo = mov;
      }
    });
    
    if (prossimoMinimo) {
      visitati.add(prossimoMinimo.id);
      percorso.push(prossimoMinimo);
      corrente = prossimoMinimo;
    }
  }
  
  return percorso;
}

// Calcola distanza totale percorso
function calcolaDistanzaTotale(percorso: any[]): number {
  if (percorso.length <= 1) return 0;
  
  let distanzaTotale = 0;
  
  // Distanza dall'entrata al primo punto
  distanzaTotale += Math.sqrt(
    percorso[0].coordinata_x ** 2 + percorso[0].coordinata_y ** 2
  );
  
  // Distanze tra punti consecutivi
  for (let i = 1; i < percorso.length; i++) {
    distanzaTotale += Math.sqrt(
      (percorso[i].coordinata_x - percorso[i-1].coordinata_x) ** 2 +
      (percorso[i].coordinata_y - percorso[i-1].coordinata_y) ** 2
    );
  }
  
  return Math.round(distanzaTotale * 10) / 10; // Arrotonda a 1 decimale
}