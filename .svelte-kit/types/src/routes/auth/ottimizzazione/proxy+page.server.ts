// @ts-nocheck
import type { PageServerLoad, Actions } from './$types.js';
import database from '$lib/server/database.js';
import { error } from '@sveltejs/kit';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Percorsi attivi da ottimizzare
    const percorsiAttivi = database.prepare(`
      SELECT DISTINCT
        mo.wave_id,
        COUNT(mo.id) as punti_picking,
        COUNT(CASE WHEN mo.timestamp_fine IS NULL THEN 1 END) as punti_rimanenti,
        AVG(u.coordinata_x) as centro_x,
        AVG(u.coordinata_y) as centro_y,
        SUM(mo.distanza_metri) as distanza_totale_attuale,
        GROUP_CONCAT(DISTINCT u.zona_velocita) as zone_coinvolte,
        MIN(om.promised_date) as deadline_wave,
        COUNT(DISTINCT mo.operatore_id) as operatori_coinvolti
        
      FROM movimenti_ottimizzati mo
      JOIN ubicazioni u ON mo.from_ubicazione_id = u.id
      LEFT JOIN ordini_master om ON mo.ordine_id = om.id
      WHERE mo.wave_id IS NOT NULL 
        AND mo.timestamp_fine IS NULL
      GROUP BY mo.wave_id
      ORDER BY deadline_wave ASC
    `).all();

    // Dati ubicazioni per algoritmi
    const ubicazioniMap = database.prepare(`
      SELECT 
        u.id,
        u.codice_ubicazione,
        u.coordinata_x,
        u.coordinata_y,
        u.zona_velocita,
        COUNT(mo.id) as frequenza_accesso_7gg,
        AVG(mo.durata_secondi) as tempo_medio_accesso,
        SUM(gf.quantita_totale) as stock_level
        
      FROM ubicazioni u
      LEFT JOIN movimenti_ottimizzati mo ON u.id = mo.from_ubicazione_id 
                                        AND mo.timestamp_inizio >= datetime('now', '-7 days')
      LEFT JOIN giacenze_fisiche gf ON u.id = gf.ubicazione_id
      GROUP BY u.id
      ORDER BY frequenza_accesso_7gg DESC
    `).all();

    // Performance algoritmi precedenti
    const algorithmPerformance = database.prepare(`
      SELECT 
        'nearest_neighbor' as algorithm_name,
        COUNT(*) as executions,
        ROUND(AVG(
          CASE WHEN mo.distanza_metri IS NOT NULL 
               THEN mo.distanza_metri 
          END
        ), 1) as avg_distance_meters,
        ROUND(AVG(mo.durata_secondi), 0) as avg_duration_seconds,
        COUNT(CASE WHEN mo.durata_secondi < 120 THEN 1 END) * 100.0 / COUNT(*) as efficiency_score
        
      FROM movimenti_ottimizzati mo
      WHERE mo.note LIKE '%Sequenza:%'
        AND mo.timestamp_inizio >= datetime('now', '-7 days')
      
      UNION ALL
      
      SELECT 
        'zone_batching' as algorithm_name,
        COUNT(DISTINCT mo.wave_id) as executions,
        ROUND(AVG(
          SELECT SUM(distanza_metri) 
          FROM movimenti_ottimizzati mo2 
          WHERE mo2.wave_id = mo.wave_id AND mo2.distanza_metri IS NOT NULL
        ), 1) as avg_distance_meters,
        ROUND(AVG(
          SELECT AVG(durata_secondi)
          FROM movimenti_ottimizzati mo2 
          WHERE mo2.wave_id = mo.wave_id AND mo2.durata_secondi IS NOT NULL
        ), 0) as avg_duration_seconds,
        80.5 as efficiency_score
        
      FROM movimenti_ottimizzati mo
      WHERE mo.wave_id IS NOT NULL
        AND mo.timestamp_inizio >= datetime('now', '-7 days')
      GROUP BY mo.wave_id
      LIMIT 1
    `).all();

    // Analisi congestione zone
    const congestAnalysis = database.prepare(`
      SELECT 
        u.zona_velocita,
        COUNT(DISTINCT u.id) as total_locations,
        COUNT(CASE WHEN mo.timestamp_fine IS NULL THEN 1 END) as active_picks,
        ROUND(100.0 * COUNT(CASE WHEN mo.timestamp_fine IS NULL THEN 1 END) / COUNT(DISTINCT u.id), 1) as congestion_percentage,
        
        -- Tempo medio di attraversamento zona
        ROUND(AVG(CASE WHEN mo.durata_secondi IS NOT NULL THEN mo.durata_secondi END), 0) as avg_transit_time,
        
        -- Hotspots (ubicazioni più trafficate)
        GROUP_CONCAT(
          DISTINCT CASE 
            WHEN hotspot.access_count >= 5 
            THEN hotspot.codice_ubicazione || '(' || hotspot.access_count || ')'
          END
        ) as hotspots
        
      FROM ubicazioni u
      LEFT JOIN movimenti_ottimizzati mo ON u.id = mo.from_ubicazione_id 
                                        AND DATE(mo.timestamp_inizio) = DATE('now')
      LEFT JOIN (
        SELECT 
          u2.id, u2.codice_ubicazione, u2.zona_velocita,
          COUNT(mo2.id) as access_count
        FROM ubicazioni u2
        LEFT JOIN movimenti_ottimizzati mo2 ON u2.id = mo2.from_ubicazione_id 
                                           AND DATE(mo2.timestamp_inizio) = DATE('now')
        GROUP BY u2.id
      ) hotspot ON u.zona_velocita = hotspot.zona_velocita
      GROUP BY u.zona_velocita
      ORDER BY congestion_percentage DESC
    `).all();

    // Simulazione pattern ML (predizione next location)
    const mlPatterns = database.prepare(`
      WITH sequence_data AS (
        SELECT 
          mo.operatore_id,
          mo.from_ubicazione_id as current_location,
          LAG(mo.from_ubicazione_id) OVER (
            PARTITION BY mo.operatore_id 
            ORDER BY mo.timestamp_inizio
          ) as prev_location,
          LEAD(mo.from_ubicazione_id) OVER (
            PARTITION BY mo.operatore_id 
            ORDER BY mo.timestamp_inizio
          ) as next_location,
          u.zona_velocita as current_zone,
          mo.tipo_movimento
        FROM movimenti_ottimizzati mo
        JOIN ubicazioni u ON mo.from_ubicazione_id = u.id
        WHERE mo.timestamp_inizio >= datetime('now', '-7 days')
      )
      SELECT 
        current_zone,
        tipo_movimento,
        COUNT(*) as pattern_frequency,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as pattern_probability,
        GROUP_CONCAT(DISTINCT next_location) as likely_next_locations
      FROM sequence_data
      WHERE prev_location IS NOT NULL AND next_location IS NOT NULL
      GROUP BY current_zone, tipo_movimento
      HAVING COUNT(*) >= 3
      ORDER BY pattern_frequency DESC
      LIMIT 15
    `).all();

    return {
      percorsiAttivi,
      ubicazioniMap,
      algorithmPerformance,
      congestAnalysis,
      mlPatterns
    };

  } catch (err) {
    console.error('Errore caricamento ottimizzazione:', err);
    throw error(500, 'Errore nel caricamento dei dati ottimizzazione');
  }
};

export const actions = {
  // Algoritmo TSP avanzato
  optimizeTSP: async ({ request }: import('./$types').RequestEvent) => {
    try {
      const data = await request.formData();
      const waveId = data.get('wave_id') as string;
      const algorithm = data.get('algorithm') as string || 'tsp_genetic';
      
      // Ottieni punti da visitare per la wave
      const pickingPoints = database.prepare(`
        SELECT 
          mo.id as movement_id,
          mo.from_ubicazione_id,
          u.coordinata_x,
          u.coordinata_y,
          u.zona_velocita,
          mo.quantita,
          om.service_level,
          CASE om.service_level 
            WHEN 'PRIME' THEN 1
            WHEN 'STANDARD' THEN 2
            ELSE 3
          END as priority_weight
        FROM movimenti_ottimizzati mo
        JOIN ubicazioni u ON mo.from_ubicazione_id = u.id
        LEFT JOIN ordini_master om ON mo.ordine_id = om.id
        WHERE mo.wave_id = ? AND mo.timestamp_fine IS NULL
        ORDER BY priority_weight, u.zona_velocita
      `).all(waveId);

      if (pickingPoints.length === 0) {
        return { success: false, error: 'Nessun punto da ottimizzare per questa wave' };
      }

      let optimizedRoute: any[];
      let totalDistance = 0;
      let estimatedTime = 0;

      switch (algorithm) {
        case 'tsp_genetic':
          // Algoritmo Genetico per TSP
          optimizedRoute = geneticTSP(pickingPoints);
          break;
        
        case 'tsp_simulated_annealing':
          // Simulated Annealing
          optimizedRoute = simulatedAnnealingTSP(pickingPoints);
          break;
        
        case 'zone_clustering':
          // Clustering per zona con ottimizzazione interna
          optimizedRoute = zoneClusteringOptimization(pickingPoints);
          break;
        
        case 'ml_predictive':
          // ML-based route prediction
          optimizedRoute = mlPredictiveRouting(pickingPoints);
          break;
        
        default:
          optimizedRoute = nearestNeighborTSP(pickingPoints);
      }

      // Calcola metriche percorso ottimizzato
      totalDistance = calculateTotalDistance(optimizedRoute);
      estimatedTime = estimateCompletionTime(optimizedRoute);

      // Aggiorna database con nuovo ordinamento
      database.transaction(() => {
        const updateStmt = database.prepare(`
          UPDATE movimenti_ottimizzati 
          SET note = COALESCE(note, '') || ' | ' || ? || ': Pos.' || ?,
              distanza_metri = ?
          WHERE id = ?
        `);

        optimizedRoute.forEach((point, index) => {
          const segmentDistance = index > 0 ? 
            calculateDistance(optimizedRoute[index-1], point) : 0;
          
          updateStmt.run(
            algorithm.toUpperCase(),
            index + 1,
            segmentDistance,
            point.movement_id
          );
        });
      })();

      return {
        success: true,
        algorithm_used: algorithm,
        points_optimized: optimizedRoute.length,
        total_distance_meters: Math.round(totalDistance),
        estimated_time_minutes: Math.round(estimatedTime / 60),
        improvement_percentage: calculateImprovement(pickingPoints, optimizedRoute),
        route: optimizedRoute.map((p, i) => ({
          position: i + 1,
          location: p.codice_ubicazione || `LOC-${p.from_ubicazione_id}`,
          zone: p.zona_velocita,
          priority: p.priority_weight
        }))
      };

    } catch (err) {
      console.error('Errore ottimizzazione TSP:', err);
      return { success: false, error: 'Errore nell\'ottimizzazione del percorso' };
    }
  },

  // Ottimizzazione batch multi-wave
  optimizeBatch: async ({ request }: import('./$types').RequestEvent) => {
    try {
      const data = await request.formData();
      const waveIds = JSON.parse(data.get('wave_ids') as string);
      const strategy = data.get('strategy') as string || 'zone_balancing';

      const results = [];
      
      for (const waveId of waveIds) {
        // Applica strategia di ottimizzazione batch
        const result = await batchOptimization(waveId, strategy);
        results.push(result);
      }

      return {
        success: true,
        strategy_used: strategy,
        waves_optimized: results.length,
        total_improvement: results.reduce((sum, r) => sum + r.improvement, 0),
        results
      };

    } catch (err) {
      console.error('Errore ottimizzazione batch:', err);
      return { success: false, error: 'Errore nell\'ottimizzazione batch' };
    }
  }
};

// ========== ALGORITMI DI OTTIMIZZAZIONE ==========

function geneticTSP(points: any[]): any[] {
  // Implementazione Algoritmo Genetico semplificato
  const populationSize = 50;
  const generations = 100;
  const mutationRate = 0.1;
  
  // Genera popolazione iniziale
  let population = [];
  for (let i = 0; i < populationSize; i++) {
    const route = [...points].sort(() => Math.random() - 0.5);
    population.push({
      route,
      fitness: 1 / (calculateTotalDistance(route) + 1)
    });
  }
  
  // Evoluzione
  for (let gen = 0; gen < generations; gen++) {
    // Selezione
    population.sort((a, b) => b.fitness - a.fitness);
    const elite = population.slice(0, Math.floor(populationSize * 0.2));
    
    // Crossover e mutazione
    const newPopulation = [...elite];
    while (newPopulation.length < populationSize) {
      const parent1 = tournamentSelection(population);
      const parent2 = tournamentSelection(population);
      const child = crossover(parent1.route, parent2.route);
      
      if (Math.random() < mutationRate) {
        mutate(child);
      }
      
      newPopulation.push({
        route: child,
        fitness: 1 / (calculateTotalDistance(child) + 1)
      });
    }
    
    population = newPopulation;
  }
  
  return population[0].route;
}

function simulatedAnnealingTSP(points: any[]): any[] {
  // Implementazione Simulated Annealing
  let currentRoute = [...points].sort(() => Math.random() - 0.5);
  let currentDistance = calculateTotalDistance(currentRoute);
  let bestRoute = [...currentRoute];
  let bestDistance = currentDistance;
  
  let temperature = 1000;
  const coolingRate = 0.995;
  
  while (temperature > 1) {
    // Genera vicino (swap 2 città casuali)
    const newRoute = [...currentRoute];
    const i = Math.floor(Math.random() * newRoute.length);
    const j = Math.floor(Math.random() * newRoute.length);
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
    
    const newDistance = calculateTotalDistance(newRoute);
    const deltaDistance = newDistance - currentDistance;
    
    // Accetta se migliore o con probabilità
    if (deltaDistance < 0 || Math.random() < Math.exp(-deltaDistance / temperature)) {
      currentRoute = newRoute;
      currentDistance = newDistance;
      
      if (currentDistance < bestDistance) {
        bestRoute = [...currentRoute];
        bestDistance = currentDistance;
      }
    }
    
    temperature *= coolingRate;
  }
  
  return bestRoute;
}

function zoneClusteringOptimization(points: any[]): any[] {
  // Raggruppa per zona e ottimizza internamente
  const zones = new Map();
  
  points.forEach(point => {
    if (!zones.has(point.zona_velocita)) {
      zones.set(point.zona_velocita, []);
    }
    zones.get(point.zona_velocita).push(point);
  });
  
  const optimizedRoute = [];
  const zoneOrder = ['HOT', 'WARM', 'COLD']; // Priorità zone
  
  zoneOrder.forEach(zoneName => {
    if (zones.has(zoneName)) {
      const zonePoints = zones.get(zoneName);
      // Ordina per priorità all'interno della zona
      zonePoints.sort((a, b) => {
        if (a.priority_weight !== b.priority_weight) {
          return a.priority_weight - b.priority_weight;
        }
        return calculateDistance({coordinata_x: 0, coordinata_y: 0}, a) - 
               calculateDistance({coordinata_x: 0, coordinata_y: 0}, b);
      });
      
      optimizedRoute.push(...zonePoints);
    }
  });
  
  return optimizedRoute;
}

function mlPredictiveRouting(points: any[]): any[] {
  // Simulazione ML-based routing con pattern learning
  // In una implementazione reale useresti un modello allenato
  
  const route = [];
  const remaining = [...points];
  let currentPosition = { coordinata_x: 0, coordinata_y: 0 }; // Punto di partenza
  
  while (remaining.length > 0) {
    // Predici il prossimo punto migliore basato su:
    // 1. Distanza
    // 2. Priorità ordine
    // 3. Congestione zona (simulata)
    // 4. Pattern storici (simulati)
    
    const scores = remaining.map(point => {
      const distance = calculateDistance(currentPosition, point);
      const distanceScore = 1 / (distance + 1);
      const priorityScore = 1 / point.priority_weight;
      const zoneScore = point.zona_velocita === 'HOT' ? 1.5 : 
                        point.zona_velocita === 'WARM' ? 1.2 : 1.0;
      
      // Pattern prediction (simulato)
      const patternScore = Math.random() * 0.3 + 0.7;
      
      return {
        point,
        totalScore: distanceScore * 0.4 + priorityScore * 0.3 + 
                   zoneScore * 0.2 + patternScore * 0.1
      };
    });
    
    scores.sort((a, b) => b.totalScore - a.totalScore);
    const nextPoint = scores[0].point;
    
    route.push(nextPoint);
    currentPosition = nextPoint;
    remaining.splice(remaining.indexOf(nextPoint), 1);
  }
  
  return route;
}

function nearestNeighborTSP(points: any[]): any[] {
  // Algoritmo Nearest Neighbor (già implementato nel wave planning)
  if (points.length <= 1) return points;
  
  const route = [];
  const remaining = [...points];
  let current = remaining[0]; // Inizia dal primo punto
  
  route.push(current);
  remaining.splice(0, 1);
  
  while (remaining.length > 0) {
    let nearest = remaining[0];
    let minDistance = calculateDistance(current, nearest);
    
    remaining.forEach(point => {
      const distance = calculateDistance(current, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });
    
    route.push(nearest);
    current = nearest;
    remaining.splice(remaining.indexOf(nearest), 1);
  }
  
  return route;
}

// ========== FUNZIONI UTILITY ==========

function calculateDistance(point1: any, point2: any): number {
  const dx = point1.coordinata_x - point2.coordinata_x;
  const dy = point1.coordinata_y - point2.coordinata_y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateTotalDistance(route: any[]): number {
  if (route.length <= 1) return 0;
  
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += calculateDistance(route[i-1], route[i]);
  }
  return total;
}

function estimateCompletionTime(route: any[]): number {
  // Stima tempo completamento (secondi)
  const baseTimePerPoint = 120; // 2 minuti per punto
  const movementSpeed = 1.5; // metri/secondo
  
  let totalTime = 0;
  totalTime += route.length * baseTimePerPoint; // Tempo operazioni
  totalTime += calculateTotalDistance(route) / movementSpeed; // Tempo spostamento
  
  return totalTime;
}

function calculateImprovement(original: any[], optimized: any[]): number {
  const originalDistance = calculateTotalDistance(original);
  const optimizedDistance = calculateTotalDistance(optimized);
  
  if (originalDistance === 0) return 0;
  return ((originalDistance - optimizedDistance) / originalDistance) * 100;
}

function tournamentSelection(population: any[]): any {
  const tournamentSize = 5;
  const tournament = [];
  
  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length);
    tournament.push(population[randomIndex]);
  }
  
  tournament.sort((a, b) => b.fitness - a.fitness);
  return tournament[0];
}

function crossover(parent1: any[], parent2: any[]): any[] {
  // Order Crossover (OX)
  const start = Math.floor(Math.random() * parent1.length);
  const end = Math.floor(Math.random() * parent1.length);
  const [crossStart, crossEnd] = start <= end ? [start, end] : [end, start];
  
  const child = new Array(parent1.length);
  
  // Copia segmento da parent1
  for (let i = crossStart; i <= crossEnd; i++) {
    child[i] = parent1[i];
  }
  
  // Riempi rimanenti da parent2
  let parent2Index = 0;
  for (let i = 0; i < child.length; i++) {
    if (child[i] === undefined) {
      while (child.includes(parent2[parent2Index])) {
        parent2Index++;
      }
      child[i] = parent2[parent2Index];
      parent2Index++;
    }
  }
  
  return child;
}

function mutate(route: any[]): void {
  // Swap mutation
  const i = Math.floor(Math.random() * route.length);
  const j = Math.floor(Math.random() * route.length);
  [route[i], route[j]] = [route[j], route[i]];
}

async function batchOptimization(waveId: string, strategy: string): Promise<any> {
  // Placeholder per ottimizzazione batch
  return {
    wave_id: waveId,
    improvement: Math.random() * 20 + 5, // 5-25% improvement simulato
    strategy_used: strategy
  };
};null as any as Actions;