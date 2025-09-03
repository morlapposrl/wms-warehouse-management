import db from '../database.js';
import { ubicazioniRepository } from '../repositories/ubicazioniRepository.js';
import type { Ubicazione, UbicazioneContenuto } from '../repositories/ubicazioniRepository.js';

export interface PutAwayTask {
  sku_code: string;
  committente_id: number;
  quantita: number;
  volume_cm3: number;
  peso_kg: number;
  lotto?: string;
  data_scadenza?: string;
  ordine_id: number;
  suggested_location?: Ubicazione;
}

export interface PickTask {
  sku_code: string;
  committente_id: number;
  quantita_richiesta: number;
  ordine_id: number;
  priorita?: 'STANDARD' | 'URGENTE' | 'PRIME';
  locations?: Array<{
    ubicazione: Ubicazione;
    quantita_disponibile: number;
    distanza?: number;
  }>;
}

export interface WavePlan {
  id: string;
  zona: string;
  picks: PickTask[];
  estimated_time_minutes: number;
  path_distance_meters: number;
  operatore_suggerito?: string;
}

export const chaoticStorageService = {

  /**
   * AMAZON-STYLE PUT-AWAY OPTIMIZATION
   * Implements chaotic storage with velocity-based placement
   */
  async suggestPutAwayLocation(task: PutAwayTask): Promise<Ubicazione | null> {
    console.log(`🔍 Finding optimal location for SKU ${task.sku_code}, ${task.quantita} units`);

    // 1. Velocity Analysis - Get item rotation data
    const velocityData = db.prepare(`
      SELECT 
        COUNT(*) as movements_last_30_days,
        SUM(CASE WHEN tipo_movimento IN ('PICK', 'CARICO') THEN quantita ELSE 0 END) as total_moved
      FROM movimenti_ottimizzati 
      WHERE sku_code = ? 
        AND timestamp_inizio >= datetime('now', '-30 days')
    `).get(task.sku_code) as any;

    const isHighVelocity = (velocityData?.movements_last_30_days || 0) > 10;
    const preferredZoneVelocity = isHighVelocity ? 'HOT' : 'WARM';

    // 2. Check for consolidation opportunities (same SKU)
    const existingLocations = db.prepare(`
      SELECT 
        u.*,
        go.quantita as existing_quantity,
        (u.volume_max_cm3 - u.volume_occupato_cm3) as volume_available,
        (u.peso_max_kg - u.peso_attuale_kg) as peso_available
      FROM ubicazioni u
      JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      WHERE go.sku_code = ? 
        AND u.attiva = 1
        AND go.stato = 'DISPONIBILE'
        AND (u.volume_max_cm3 - u.volume_occupato_cm3) >= ?
        AND (u.peso_max_kg - u.peso_attuale_kg) >= ?
        AND u.percentuale_occupazione < 95
      ORDER BY u.zona_velocita = ? DESC, go.quantita DESC
    `).all(task.sku_code, task.volume_cm3, task.peso_kg, preferredZoneVelocity);

    if (existingLocations.length > 0) {
      console.log(`✅ Consolidation opportunity found: ${existingLocations[0].codice_ubicazione}`);
      return existingLocations[0] as Ubicazione;
    }

    // 3. Weight and compatibility rules
    let compatibilityFilter = '';
    const compatibilityParams: any[] = [];

    // Heavy items go to ground level or pallet positions
    if (task.peso_kg > 20) {
      compatibilityFilter += ' AND (tipo IN ("PALLET") OR ripiano <= 1)';
    }

    // Temperature controlled items
    const skuData = db.prepare(`
      SELECT temperatura_controllata, categoria 
      FROM sku_master 
      WHERE sku_code = ?
    `).get(task.sku_code) as any;

    if (skuData?.temperatura_controllata) {
      compatibilityFilter += ' AND temperatura_controllata = 1';
    }

    // 4. Find optimal location with advanced algorithm
    const optimalLocation = db.prepare(`
      SELECT 
        u.*,
        (u.volume_max_cm3 - u.volume_occupato_cm3) as volume_available,
        (u.peso_max_kg - u.peso_attuale_kg) as peso_available,
        -- Distance from receiving area (assuming zone A is receiving)
        ABS(u.coordinata_x - 0) + ABS(u.coordinata_y - 0) as distance_from_receiving,
        -- Zone balancing factor
        (SELECT AVG(percentuale_occupazione) FROM ubicazioni WHERE zona = u.zona) as zone_avg_occupation
      FROM ubicazioni u
      WHERE u.attiva = 1
        AND (u.volume_max_cm3 - u.volume_occupato_cm3) >= ?
        AND (u.peso_max_kg - u.peso_attuale_kg) >= ?
        AND u.percentuale_occupazione < 90
        ${compatibilityFilter}
      ORDER BY 
        -- Priority factors (weighted scoring)
        CASE 
          WHEN u.zona_velocita = ? THEN 100  -- Preferred velocity zone
          WHEN u.zona_velocita = 'WARM' THEN 50
          ELSE 10
        END DESC,
        u.percentuale_occupazione ASC,  -- Less occupied first
        zone_avg_occupation ASC,  -- Balance across zones
        distance_from_receiving ASC,  -- Closer to receiving
        volume_available ASC  -- Tighter fit (less waste)
      LIMIT 1
    `).get(task.volume_cm3, task.peso_kg, preferredZoneVelocity) as Ubicazione | null;

    if (optimalLocation) {
      console.log(`🎯 Optimal location found: ${optimalLocation.codice_ubicazione} (${optimalLocation.zona_velocita} zone)`);
    }

    return optimalLocation;
  },

  /**
   * EXECUTE PUT-AWAY OPERATION
   */
  async executePutAway(task: PutAwayTask): Promise<{ success: boolean; ubicazione?: Ubicazione; error?: string }> {
    const location = await this.suggestPutAwayLocation(task);
    
    if (!location) {
      return { success: false, error: 'No suitable location found' };
    }

    try {
      // Start transaction
      const transaction = db.transaction(() => {
        // 1. Create ownership record
        db.prepare(`
          INSERT INTO giacenze_ownership (
            ubicazione_id, sku_code, committente_id, quantita, lotto,
            data_carico, data_scadenza, costo_acquisto, ordine_id, stato
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 0, ?, 'DISPONIBILE')
        `).run(
          location.id, task.sku_code, task.committente_id, task.quantita,
          task.lotto, task.data_scadenza, task.ordine_id
        );

        // 2. Update physical inventory
        const existing = db.prepare(`
          SELECT * FROM giacenze_fisiche 
          WHERE ubicazione_id = ? AND sku_code = ?
        `).get(location.id, task.sku_code);

        if (existing) {
          db.prepare(`
            UPDATE giacenze_fisiche 
            SET quantita_totale = quantita_totale + ?,
                volume_occupato_cm3 = volume_occupato_cm3 + ?,
                peso_totale_kg = peso_totale_kg + ?,
                ultima_movimentazione = CURRENT_TIMESTAMP
            WHERE ubicazione_id = ? AND sku_code = ?
          `).run(task.quantita, task.volume_cm3, task.peso_kg, location.id, task.sku_code);
        } else {
          db.prepare(`
            INSERT INTO giacenze_fisiche (
              ubicazione_id, sku_code, quantita_totale, 
              volume_occupato_cm3, peso_totale_kg
            ) VALUES (?, ?, ?, ?, ?)
          `).run(location.id, task.sku_code, task.quantita, task.volume_cm3, task.peso_kg);
        }

        // 3. Update location occupancy
        db.prepare(`
          UPDATE ubicazioni 
          SET volume_occupato_cm3 = volume_occupato_cm3 + ?,
              peso_attuale_kg = peso_attuale_kg + ?,
              frequenza_prelievi = frequenza_prelievi + 1
          WHERE id = ?
        `).run(task.volume_cm3, task.peso_kg, location.id);

        // 4. Update logical inventory
        const logicalExisting = db.prepare(`
          SELECT * FROM giacenze_logiche 
          WHERE committente_id = ? AND sku_code = ?
        `).get(task.committente_id, task.sku_code);

        if (logicalExisting) {
          db.prepare(`
            UPDATE giacenze_logiche 
            SET quantita_disponibile = quantita_disponibile + ?
            WHERE committente_id = ? AND sku_code = ?
          `).run(task.quantita, task.committente_id, task.sku_code);
        } else {
          db.prepare(`
            INSERT INTO giacenze_logiche (committente_id, sku_code, quantita_disponibile)
            VALUES (?, ?, ?)
          `).run(task.committente_id, task.sku_code, task.quantita);
        }

        // 5. Log the movement
        db.prepare(`
          INSERT INTO movimenti_ottimizzati (
            committente_id, sku_code, tipo_movimento, quantita,
            to_ubicazione_id, ordine_id, timestamp_inizio, timestamp_fine
          ) VALUES (?, ?, 'PUT_AWAY', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(task.committente_id, task.sku_code, task.quantita, location.id, task.ordine_id);
      });

      transaction();

      console.log(`✅ Put-away completed: ${task.quantita} x ${task.sku_code} → ${location.codice_ubicazione}`);
      return { success: true, ubicazione: location };

    } catch (error) {
      console.error('Put-away failed:', error);
      return { success: false, error: 'Database transaction failed' };
    }
  },

  /**
   * AMAZON-STYLE PICKING OPTIMIZATION
   * Implements FIFO with location proximity optimization
   */
  async findOptimalPickLocations(task: PickTask): Promise<Array<{
    ubicazione: Ubicazione;
    quantita_disponibile: number;
    lotto?: string;
    data_carico: string;
    distanza_picking?: number;
  }>> {
    console.log(`🔍 Finding pick locations for SKU ${task.sku_code}, ${task.quantita_richiesta} units`);

    // FIFO-based picking with location optimization
    const pickLocations = db.prepare(`
      SELECT 
        u.*,
        go.quantita as quantita_disponibile,
        go.lotto,
        go.data_carico,
        -- Distance from picking start point (assuming main corridor)
        (ABS(u.coordinata_x - 10) + ABS(u.coordinata_y - 5)) as distanza_picking
      FROM ubicazioni u
      JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      WHERE go.sku_code = ?
        AND go.committente_id = ?
        AND go.stato = 'DISPONIBILE'
        AND u.attiva = 1
      ORDER BY 
        go.data_carico ASC,  -- FIFO
        distanza_picking ASC  -- Closest first within same date
    `).all(task.sku_code, task.committente_id);

    return pickLocations as any[];
  },

  /**
   * WAVE PLANNING OPTIMIZATION
   * Groups picks by zone for maximum efficiency
   */
  async createPickingWave(picks: PickTask[], zone?: string): Promise<WavePlan> {
    const waveId = `WAVE-${Date.now()}`;
    let totalDistance = 0;
    let estimatedTime = 0;

    // Enhance picks with location data
    const enhancedPicks = await Promise.all(
      picks.map(async (pick) => {
        const locations = await this.findOptimalPickLocations(pick);
        return { ...pick, locations };
      })
    );

    // Filter by zone if specified
    const zonePicks = zone ? enhancedPicks.filter(pick => 
      pick.locations?.some(loc => loc.ubicazione.zona === zone)
    ) : enhancedPicks;

    // Calculate wave metrics
    estimatedTime = zonePicks.length * 2; // 2 minutes per pick average
    totalDistance = this.calculateWaveDistance(zonePicks);

    return {
      id: waveId,
      zona: zone || 'MIXED',
      picks: zonePicks,
      estimated_time_minutes: estimatedTime,
      path_distance_meters: totalDistance
    };
  },

  /**
   * PATH OPTIMIZATION
   * Calculate optimal picking path using nearest neighbor algorithm
   */
  calculateWaveDistance(picks: PickTask[]): number {
    if (picks.length === 0) return 0;

    let totalDistance = 0;
    let currentX = 0; // Start from origin
    let currentY = 0;

    // Simple nearest neighbor algorithm
    const unvisited = [...picks];
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      // Find nearest unvisited pick
      unvisited.forEach((pick, index) => {
        if (pick.locations && pick.locations.length > 0) {
          const loc = pick.locations[0].ubicazione;
          const distance = Math.sqrt(
            Math.pow(loc.coordinata_x - currentX, 2) + 
            Math.pow(loc.coordinata_y - currentY, 2)
          );
          
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        }
      });

      // Move to nearest location
      const nearest = unvisited[nearestIndex];
      if (nearest.locations && nearest.locations.length > 0) {
        currentX = nearest.locations[0].ubicazione.coordinata_x;
        currentY = nearest.locations[0].ubicazione.coordinata_y;
        totalDistance += nearestDistance;
      }

      // Remove from unvisited
      unvisited.splice(nearestIndex, 1);
    }

    return Math.round(totalDistance * 100) / 100; // Convert to meters and round
  },

  /**
   * REBALANCING OPERATIONS
   * Redistribute inventory for optimal picking efficiency
   */
  async suggestRebalancing(): Promise<Array<{
    from_location: Ubicazione;
    to_location: Ubicazione;
    sku_code: string;
    quantita: number;
    reason: string;
  }>> {
    const suggestions = [];

    // Find overcrowded hot zones
    const overcrowdedHotZones = db.prepare(`
      SELECT u.*, go.sku_code, go.quantita
      FROM ubicazioni u
      JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      WHERE u.zona_velocita = 'HOT'
        AND u.percentuale_occupazione > 85
        AND go.stato = 'DISPONIBILE'
    `).all();

    for (const hotLocation of overcrowdedHotZones) {
      // Find alternative warm location for low-velocity items
      const alternative = await this.suggestPutAwayLocation({
        sku_code: hotLocation.sku_code,
        committente_id: 1, // Will be dynamic
        quantita: Math.floor(hotLocation.quantita * 0.3), // Move 30%
        volume_cm3: 1000, // Estimated
        peso_kg: 1, // Estimated
        ordine_id: 0
      });

      if (alternative && alternative.zona_velocita !== 'HOT') {
        suggestions.push({
          from_location: hotLocation,
          to_location: alternative,
          sku_code: hotLocation.sku_code,
          quantita: Math.floor(hotLocation.quantita * 0.3),
          reason: 'Rebalance hot zone congestion'
        });
      }
    }

    return suggestions;
  },

  /**
   * ANALYTICS AND KPI TRACKING
   */
  async getPickingPerformanceMetrics(days: number = 7) {
    return db.prepare(`
      SELECT 
        DATE(timestamp_inizio) as date,
        COUNT(*) as total_picks,
        AVG(JULIANDAY(timestamp_fine) - JULIANDAY(timestamp_inizio)) * 24 * 60 as avg_pick_time_minutes,
        COUNT(DISTINCT operatore_id) as active_pickers,
        SUM(quantita) as total_units_picked
      FROM movimenti_ottimizzati 
      WHERE tipo_movimento = 'PICK'
        AND timestamp_inizio >= datetime('now', '-${days} days')
      GROUP BY DATE(timestamp_inizio)
      ORDER BY date DESC
    `).all();
  }
};