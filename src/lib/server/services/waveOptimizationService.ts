import { wavePlanningRepository } from '../repositories/wavePlanningRepository';
import db from '../database';

// Interfacce per gli algoritmi di ottimizzazione
interface OrderForWave {
  id: number;
  numero_ordine: string;
  committente_id: number;
  committente_nome: string;
  stato: string;
  data_ordine: string;
  data_richiesta: string;
  priorita: number;
  righe_totali: number;
  quantita_totale: number;
  cliente_fornitore: string;
}

interface ProductLocation {
  prodotto_id: number;
  prodotto_codice: string;
  ubicazione_id: number;
  ubicazione_codice: string;
  zona: string;
  coordinata_x: number;
  coordinata_y: number;
  quantita_disponibile: number;
}

interface PickTaskOptimized {
  ordine_id: number;
  prodotto_id: number;
  ubicazione_id: number;
  quantita_richiesta: number;
  zona: string;
  coordinata_x: number;
  coordinata_y: number;
  sequenza_pick: number;
  distanza_dal_precedente: number;
  tempo_stimato_secondi: number;
}

export class WaveOptimizationService {
  
  /**
   * Algoritmo principale per creare una wave ottimizzata
   */
  static async createOptimizedWave(params: {
    committente_id?: number;
    tipo_wave: 'BATCH_PICKING' | 'ZONE_PICKING' | 'DISCRETE_PICKING' | 'WAVE_PICKING';
    max_ordini?: number;
    priorita_minima?: number;
    data_da?: string;
    data_a?: string;
    operatore_id?: number;
    selected_order_ids?: number[];
  }) {
    try {
      let ordiniSelezionati: OrderForWave[];

      if (params.selected_order_ids && params.selected_order_ids.length > 0) {
        // 1. Usa ordini selezionati manualmente
        const ordiniCandidati = await this.getEligibleOrders({
          committente_id: params.committente_id,
          priorita_minima: params.priorita_minima || 1,
          data_da: params.data_da,
          data_a: params.data_a,
          stati: ['NUOVO', 'CONFERMATO']
        });

        ordiniSelezionati = ordiniCandidati.filter(o => params.selected_order_ids!.includes(o.id));

        if (ordiniSelezionati.length === 0) {
          throw new Error('Nessun ordine valido tra quelli selezionati');
        }
      } else {
        // 2. Selezione automatica ordini
        const ordiniCandidati = await this.getEligibleOrders({
          committente_id: params.committente_id,
          priorita_minima: params.priorita_minima || 1,
          data_da: params.data_da,
          data_a: params.data_a,
          stati: ['NUOVO', 'CONFERMATO']
        });

        if (ordiniCandidati.length === 0) {
          throw new Error('Nessun ordine disponibile per la wave');
        }

        // Applica algoritmo di selezione basato sul tipo di wave
        ordiniSelezionati = this.selectOrdersForWave(
          ordiniCandidati, 
          params.tipo_wave, 
          params.max_ordini || 20
        );
      }

      // 3. Genera numero wave univoco
      const waveNumber = await this.generateWaveNumber(params.committente_id);

      // 4. Crea wave nel database
      const waveId = wavePlanningRepository.createWave({
        wave_number: waveNumber,
        stato: 'PIANIFICATA',
        tipo_wave: params.tipo_wave,
        committente_id: params.committente_id,
        priorita_minima: params.priorita_minima || 1,
        data_da: params.data_da,
        data_a: params.data_a,
        totale_ordini: ordiniSelezionati.length,
        totale_righe: ordiniSelezionati.reduce((sum, o) => sum + o.righe_totali, 0),
        totale_picks: 0, // Sarà calcolato dopo l'UDC assignment
        distanza_stimata_metri: 0,
        tempo_stimato_minuti: 0,
        operatore_principale_id: params.operatore_id,
        numero_operatori: 1
      });

      // 5. Aggiungi ordini alla wave
      let sequenza = 1;
      for (const ordine of ordiniSelezionati) {
        wavePlanningRepository.addOrderToWave({
          wave_id: waveId,
          ordine_id: ordine.id,
          sequenza: sequenza++,
          stato: 'IN_CODA',
          picks_completati: 0,
          picks_totali: ordine.righe_totali
        });
      }

      // 6. Crea pick tasks con UDC assignment  
      const ordiniIds = ordiniSelezionati.map(o => o.id);
      const tasksCreated = wavePlanningRepository.createPickTasksWithUDC(waveId, ordiniIds);

      // 7. Aggiorna statistiche wave
      if (tasksCreated > 0) {
        const stats = wavePlanningRepository.getWaveStatistics(waveId);
        const avgTime = stats.tempo_medio_pick || 60;
        const totalTime = tasksCreated * avgTime;
        const estimatedDistance = tasksCreated * 25; // 25m media per pick

        db.prepare(`
          UPDATE wave_planning 
          SET totale_picks = ?, tempo_stimato_minuti = ?, distanza_stimata_metri = ?
          WHERE id = ?
        `).run(tasksCreated, Math.round(totalTime / 60), estimatedDistance, waveId);
      }

      return {
        wave_id: waveId,
        wave_number: waveNumber,
        ordini_selezionati: ordiniSelezionati.length,
        picks_created: tasksCreated,
        tipo_wave: params.tipo_wave
      };

    } catch (error) {
      console.error('Errore creazione wave ottimizzata:', error);
      throw error;
    }
  }

  /**
   * Ottimizzazione del percorso di picking
   */
  private static async optimizePickingPath(waveId: number, tipoWave: string) {
    // 1. Carica tutti i task di picking necessari
    const pickTasks = await this.getPickTasksForWave(waveId);
    
    if (pickTasks.length === 0) {
      return;
    }

    // 2. Applica algoritmo di ottimizzazione in base al tipo
    let optimizedTasks: PickTaskOptimized[];
    
    switch (tipoWave) {
      case 'ZONE_PICKING':
        optimizedTasks = this.optimizeByZone(pickTasks);
        break;
      case 'BATCH_PICKING':
        optimizedTasks = this.optimizeBatching(pickTasks);
        break;
      case 'DISCRETE_PICKING':
        optimizedTasks = this.optimizeDiscrete(pickTasks);
        break;
      default:
        optimizedTasks = this.optimizeWavePicking(pickTasks);
    }

    // 3. Salva i task ottimizzati
    let sequenza = 1;
    for (const task of optimizedTasks) {
      wavePlanningRepository.createPickTask({
        wave_id: waveId,
        ordine_id: task.ordine_id,
        prodotto_id: task.prodotto_id,
        ubicazione_id: task.ubicazione_id,
        quantita_richiesta: task.quantita_richiesta,
        quantita_prelevata: 0,
        sequenza_pick: sequenza++,
        zona: task.zona,
        distanza_dal_precedente: task.distanza_dal_precedente,
        tempo_stimato_secondi: task.tempo_stimato_secondi,
        stato: 'IN_CODA',
        controllo_barcode: 1
      });
    }

    // 4. Aggiorna statistiche wave
    const totalDistance = optimizedTasks.reduce((sum, t) => sum + t.distanza_dal_precedente, 0);
    const totalTime = optimizedTasks.reduce((sum, t) => sum + t.tempo_stimato_secondi, 0);

    db.prepare(`
      UPDATE wave_planning 
      SET totale_picks = ?, distanza_stimata_metri = ?, tempo_stimato_minuti = ?
      WHERE id = ?
    `).run(optimizedTasks.length, totalDistance, Math.round(totalTime / 60), waveId);
  }

  /**
   * Carica ordini eleggibili per wave
   */
  private static async getEligibleOrders(filters: {
    committente_id?: number;
    priorita_minima: number;
    data_da?: string;
    data_a?: string;
    stati: string[];
  }): Promise<OrderForWave[]> {
    
    return wavePlanningRepository.getOrdersForWaveCreation(filters);
  }

  /**
   * Seleziona ordini in base al tipo di wave
   */
  private static selectOrdersForWave(
    ordini: OrderForWave[], 
    tipoWave: string, 
    maxOrdini: number
  ): OrderForWave[] {
    
    let selezionati: OrderForWave[];

    switch (tipoWave) {
      case 'ZONE_PICKING':
        // Seleziona ordini che condividono zone simili
        selezionati = this.selectByZoneAffinity(ordini, maxOrdini);
        break;
        
      case 'BATCH_PICKING':
        // Seleziona ordini con prodotti simili
        selezionati = this.selectByProductAffinity(ordini, maxOrdini);
        break;
        
      case 'DISCRETE_PICKING':
        // Seleziona ordini singoli ad alta priorità
        selezionati = ordini
          .filter(o => o.priorita >= 8 || o.righe_totali <= 5)
          .slice(0, Math.min(maxOrdini, 10));
        break;
        
      default:
        // Wave picking standard - ordini in sequenza FIFO
        selezionati = ordini
          .sort((a, b) => new Date(a.data_ordine).getTime() - new Date(b.data_ordine).getTime())
          .slice(0, maxOrdini);
    }

    return selezionati;
  }

  /**
   * Selezione ordini per affinità di zona
   */
  private static selectByZoneAffinity(ordini: OrderForWave[], maxOrdini: number): OrderForWave[] {
    // TODO: Implementa logica di clustering per zone
    return ordini.slice(0, maxOrdini);
  }

  /**
   * Selezione ordini per affinità di prodotto
   */
  private static selectByProductAffinity(ordini: OrderForWave[], maxOrdini: number): OrderForWave[] {
    // TODO: Implementa logica di clustering per prodotti
    return ordini.slice(0, maxOrdini);
  }

  /**
   * Ottimizzazione per zone (Zone Picking)
   */
  private static optimizeByZone(tasks: any[]): PickTaskOptimized[] {
    // Raggruppa per zona e ottimizza all'interno di ogni zona
    const tasksByZone = new Map<string, any[]>();
    
    tasks.forEach(task => {
      const zona = task.zona || 'DEFAULT';
      if (!tasksByZone.has(zona)) {
        tasksByZone.set(zona, []);
      }
      tasksByZone.get(zona)!.push(task);
    });

    const optimized: PickTaskOptimized[] = [];
    let sequenza = 1;

    // Processa ogni zona con algoritmo Nearest Neighbor
    for (const [zona, zoneTasks] of tasksByZone) {
      const zoneOptimized = this.nearestNeighborTSP(zoneTasks);
      
      for (const task of zoneOptimized) {
        optimized.push({
          ...task,
          sequenza_pick: sequenza++
        });
      }
    }

    return optimized;
  }

  /**
   * Ottimizzazione Batch Picking
   */
  private static optimizeBatching(tasks: any[]): PickTaskOptimized[] {
    // Raggruppa task per stesso prodotto/ubicazione
    const batches = new Map<string, any[]>();
    
    tasks.forEach(task => {
      const key = `${task.prodotto_id}_${task.ubicazione_id}`;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(task);
    });

    const optimized: PickTaskOptimized[] = [];
    let sequenza = 1;

    // Crea task consolidati per batch
    for (const [key, batchTasks] of batches) {
      const firstTask = batchTasks[0];
      const totalQuantity = batchTasks.reduce((sum, t) => sum + t.quantita_richiesta, 0);
      
      optimized.push({
        ...firstTask,
        quantita_richiesta: totalQuantity,
        sequenza_pick: sequenza++,
        distanza_dal_precedente: (sequenza === 1 || !optimized.length || !firstTask) ? 0 : this.calculateDistance(
          optimized[optimized.length - 1],
          firstTask
        ),
        tempo_stimato_secondi: 45 + (batchTasks.length * 15) // Tempo base + tempo per ordine
      });
    }

    return optimized;
  }

  /**
   * Ottimizzazione Discrete Picking
   */
  private static optimizeDiscrete(tasks: any[]): PickTaskOptimized[] {
    // Ogni task è processato individualmente con percorso ottimale
    return this.nearestNeighborTSP(tasks);
  }

  /**
   * Ottimizzazione Wave Picking (standard)
   */
  private static optimizeWavePicking(tasks: any[]): PickTaskOptimized[] {
    // Bilanciamento tra zone e efficienza globale
    return this.nearestNeighborTSP(tasks);
  }

  /**
   * Algoritmo Nearest Neighbor TSP per ottimizzazione percorso
   */
  private static nearestNeighborTSP(tasks: any[]): PickTaskOptimized[] {
    if (tasks.length === 0) return [];
    
    // Filtra task validi
    const validTasks = tasks.filter(task => 
      task && 
      typeof task.coordinata_x === 'number' && 
      typeof task.coordinata_y === 'number'
    );
    
    if (validTasks.length === 0) return [];
    
    const optimized: PickTaskOptimized[] = [];
    const remaining = [...validTasks];
    
    // Inizia dal punto più vicino all'entrata (0,0)
    let current = remaining.reduce((closest, task) => {
      const currentDist = Math.sqrt(task.coordinata_x ** 2 + task.coordinata_y ** 2);
      const closestDist = Math.sqrt(closest.coordinata_x ** 2 + closest.coordinata_y ** 2);
      return currentDist < closestDist ? task : closest;
    });

    remaining.splice(remaining.indexOf(current), 1);
    
    optimized.push({
      ...current,
      sequenza_pick: 1,
      distanza_dal_precedente: Math.sqrt(current.coordinata_x ** 2 + current.coordinata_y ** 2),
      tempo_stimato_secondi: 60 // Tempo base primo pick
    });

    // Continua con nearest neighbor
    let sequenza = 2;
    while (remaining.length > 0) {
      const next = remaining.reduce((closest, task) => {
        const currentDist = this.calculateDistance(current, task);
        const closestDist = this.calculateDistance(current, closest);
        return currentDist < closestDist ? task : closest;
      });

      const distance = this.calculateDistance(current, next);
      
      optimized.push({
        ...next,
        sequenza_pick: sequenza++,
        distanza_dal_precedente: distance,
        tempo_stimato_secondi: 30 + Math.round(distance * 2) // Tempo base + tempo movimento
      });

      remaining.splice(remaining.indexOf(next), 1);
      current = next;
    }

    return optimized;
  }

  /**
   * Calcola distanza euclidea tra due ubicazioni
   */
  private static calculateDistance(from: any, to: any): number {
    // Controlli di sicurezza
    if (!from || !to || 
        typeof from.coordinata_x !== 'number' || typeof from.coordinata_y !== 'number' ||
        typeof to.coordinata_x !== 'number' || typeof to.coordinata_y !== 'number') {
      return 0;
    }
    
    const dx = to.coordinata_x - from.coordinata_x;
    const dy = to.coordinata_y - from.coordinata_y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Carica task di picking per una wave
   */
  private static async getPickTasksForWave(waveId: number): Promise<any[]> {
    const stmt = db.prepare(`
      SELECT 
        od.ordine_id,
        od.prodotto_id,
        p.codice as prodotto_codice,
        od.quantita_ordinata as quantita_richiesta,
        u.id as ubicazione_id,
        u.codice_ubicazione,
        u.zona,
        u.coordinata_x,
        u.coordinata_y,
        COALESCE(g.quantita, od.quantita_ordinata) as quantita_disponibile
      FROM wave_ordini wo
      JOIN ordini_dettaglio_new od ON wo.ordine_id = od.ordine_id
      JOIN prodotti p ON od.prodotto_id = p.id
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND p.committente_id = g.committente_id
      JOIN (
        SELECT * FROM ubicazioni 
        WHERE attiva = 1 
        ORDER BY zona, coordinata_x, coordinata_y 
        LIMIT 1
      ) u ON 1=1
      WHERE wo.wave_id = ?
      ORDER BY od.ordine_id, od.prodotto_id
    `);

    const result = stmt.all(waveId);
    console.log('Pick tasks result:', result);
    return result;
  }

  /**
   * Genera numero wave univoco
   */
  private static async generateWaveNumber(committente_id?: number): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM wave_planning 
      WHERE DATE(data_creazione) = DATE('now')
      ${committente_id ? 'AND (committente_id = ? OR committente_id IS NULL)' : ''}
    `);
    
    const result = committente_id 
      ? stmt.get(committente_id) as { count: number }
      : stmt.get() as { count: number };
    
    const numero = (result.count + 1).toString().padStart(3, '0');
    
    return committente_id 
      ? `WAVE-C${committente_id}-${today}-${numero}`
      : `WAVE-GLOBAL-${today}-${numero}`;
  }

  /**
   * Calcola metriche di performance per wave
   */
  static getWavePerformanceMetrics(waveId: number) {
    const stmt = db.prepare(`
      SELECT 
        w.wave_number,
        w.stato,
        w.totale_ordini,
        w.totale_picks,
        w.distanza_stimata_metri,
        w.tempo_stimato_minuti,
        w.data_creazione,
        w.data_inizio,
        w.data_fine,
        w.durata_effettiva_minuti,
        
        -- Performance picking
        COUNT(CASE WHEN wpt.stato = 'COMPLETATO' THEN 1 END) as picks_completati,
        COUNT(CASE WHEN wpt.stato = 'ERRORE' THEN 1 END) as picks_errore,
        AVG(CASE WHEN wpt.timestamp_fine IS NOT NULL AND wpt.timestamp_inizio IS NOT NULL 
            THEN (julianday(wpt.timestamp_fine) - julianday(wpt.timestamp_inizio)) * 86400 
            END) as tempo_medio_pick_secondi,
        
        -- Efficienza
        CASE WHEN w.tempo_stimato_minuti > 0 
             THEN ROUND((w.durata_effettiva_minuti * 100.0 / w.tempo_stimato_minuti), 2) 
             ELSE NULL 
        END as efficienza_tempo_percentuale,
        
        ROUND(w.distanza_stimata_metri / w.tempo_stimato_minuti, 2) as velocita_media_metri_minuto
        
      FROM wave_planning w
      LEFT JOIN wave_pick_tasks wpt ON w.id = wpt.wave_id
      WHERE w.id = ?
      GROUP BY w.id
    `);

    return stmt.get(waveId);
  }
}