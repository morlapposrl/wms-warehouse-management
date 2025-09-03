import db from '../database.js';

export interface Ubicazione {
  id: number;
  codice_ubicazione: string;
  zona: string;
  corridoio?: string;
  scaffale?: string;
  ripiano?: number;
  posizione?: string;
  tipo: 'SCAFFALE' | 'PALLET' | 'FRIGO' | 'CONGELATORE' | 'QUARANTENA' | 'UFFICIO' | 'PASSAGGIO' | 'ENTRATA' | 'USCITA';
  coordinata_x: number;
  coordinata_y: number;
  coordinata_z: number;
  larghezza_cm: number;
  profondita_cm: number;
  altezza_cm: number;
  orientamento: number;
  colore_hex: string;
  volume_max_cm3?: number;
  peso_max_kg?: number;
  volume_occupato_cm3: number;
  peso_attuale_kg: number;
  percentuale_occupazione: number;
  accessibilita: 'DIRETTA' | 'SCALA' | 'MULETTO' | 'TRANS_PALLET';
  temperatura_controllata: boolean;
  temperatura_attuale?: number;
  attiva: boolean;
  priorita_picking: number;
  zona_velocita: 'HOT' | 'WARM' | 'COLD';
  frequenza_prelievi: number;
  accesso_limitato: boolean;
  badge_richiesto?: string;
}

export interface UbicazioneContenuto {
  ubicazione_id: number;
  sku_code: string;
  committente_id: number;
  quantita: number;
  volume: number;
  peso: number;
  data_posizionamento: string;
}

export const ubicazioniRepository = {
  // CRUD operations for ubicazioni
  findAll(): Ubicazione[] {
    return db.prepare(`
      SELECT 
        id,
        codice_ubicazione,
        zona,
        corridoio,
        scaffale,
        ripiano,
        posizione,
        tipo,
        coordinata_x,
        coordinata_y,
        coordinata_z,
        larghezza_cm,
        profondita_cm,
        altezza_cm,
        orientamento,
        colore_hex,
        volume_max_cm3,
        peso_max_kg,
        volume_occupato_cm3,
        peso_attuale_kg,
        percentuale_occupazione,
        accessibilita,
        temperatura_controllata,
        temperatura_attuale,
        attiva,
        priorita_picking,
        zona_velocita,
        frequenza_prelievi,
        accesso_limitato,
        badge_richiesto
      FROM ubicazioni 
      WHERE attiva = 1
      ORDER BY zona, corridoio, scaffale, ripiano
    `).all() as Ubicazione[];
  },

  findById(id: number): Ubicazione | null {
    return db.prepare(`
      SELECT 
        id,
        codice_ubicazione,
        zona,
        corridoio,
        scaffale,
        ripiano,
        posizione,
        tipo,
        coordinata_x,
        coordinata_y,
        coordinata_z,
        larghezza_cm,
        profondita_cm,
        altezza_cm,
        orientamento,
        colore_hex,
        volume_max_cm3,
        peso_max_kg,
        volume_occupato_cm3,
        peso_attuale_kg,
        percentuale_occupazione,
        accessibilita,
        temperatura_controllata,
        temperatura_attuale,
        attiva,
        priorita_picking,
        zona_velocita,
        frequenza_prelievi,
        accesso_limitato,
        badge_richiesto
      FROM ubicazioni 
      WHERE id = ? AND attiva = 1
    `).get(id) as Ubicazione | null;
  },

  findByZona(zona: string): Ubicazione[] {
    return db.prepare(`
      SELECT 
        id,
        codice_ubicazione,
        zona,
        corridoio,
        scaffale,
        ripiano,
        posizione,
        tipo,
        coordinata_x,
        coordinata_y,
        coordinata_z,
        larghezza_cm,
        profondita_cm,
        altezza_cm,
        orientamento,
        colore_hex,
        volume_max_cm3,
        peso_max_kg,
        volume_occupato_cm3,
        peso_attuale_kg,
        percentuale_occupazione,
        accessibilita,
        temperatura_controllata,
        temperatura_attuale,
        attiva,
        priorita_picking,
        zona_velocita,
        frequenza_prelievi,
        accesso_limitato,
        badge_richiesto
      FROM ubicazioni 
      WHERE zona = ? AND attiva = 1
      ORDER BY corridoio, scaffale, ripiano
    `).all(zona) as Ubicazione[];
  },

  // Chaotic storage functions
  findAvailableLocations(volume_needed: number = 0, peso_needed: number = 0): Ubicazione[] {
    return db.prepare(`
      SELECT 
        *,
        (volume_max_cm3 - volume_occupato_cm3) as volume_available,
        (peso_max_kg - peso_attuale_kg) as peso_available
      FROM ubicazioni 
      WHERE attiva = 1
        AND (volume_max_cm3 - volume_occupato_cm3) >= ?
        AND (peso_max_kg - peso_attuale_kg) >= ?
        AND percentuale_occupazione < 95
      ORDER BY 
        zona_velocita DESC,  -- HOT first
        percentuale_occupazione ASC,  -- Less occupied first
        priorita_picking DESC  -- Higher priority first
    `).all(volume_needed, peso_needed) as Ubicazione[];
  },

  findClosestLocation(x: number, y: number, volume_needed: number = 0): Ubicazione | null {
    const locations = this.findAvailableLocations(volume_needed);
    if (locations.length === 0) return null;

    // Calculate distances and find closest
    const withDistances = locations.map(loc => ({
      ...loc,
      distance: Math.sqrt(Math.pow(loc.coordinata_x - x, 2) + Math.pow(loc.coordinata_y - y, 2))
    }));

    withDistances.sort((a, b) => a.distance - b.distance);
    return withDistances[0];
  },

  // Content tracking
  getLocationContent(ubicazione_id: number): UbicazioneContenuto[] {
    return db.prepare(`
      SELECT 
        go.ubicazione_id,
        go.sku_code,
        go.committente_id,
        go.quantita,
        (go.quantita * sm.volume_cm3) as volume,
        (go.quantita * sm.peso_kg) as peso,
        go.data_carico as data_posizionamento
      FROM giacenze_ownership go
      JOIN sku_master sm ON go.sku_code = sm.sku_code
      WHERE go.ubicazione_id = ?
        AND go.stato = 'DISPONIBILE'
      ORDER BY go.data_carico ASC
    `).all(ubicazione_id) as UbicazioneContenuto[];
  },

  // Statistics
  getZoneStatistics() {
    return db.prepare(`
      SELECT 
        zona,
        COUNT(*) as total_locations,
        COUNT(CASE WHEN percentuale_occupazione > 80 THEN 1 END) as full_locations,
        AVG(percentuale_occupazione) as avg_occupation,
        COUNT(CASE WHEN zona_velocita = 'HOT' THEN 1 END) as hot_count,
        COUNT(CASE WHEN zona_velocita = 'WARM' THEN 1 END) as warm_count,
        COUNT(CASE WHEN zona_velocita = 'COLD' THEN 1 END) as cold_count,
        MIN(coordinata_x) as x_min,
        MAX(coordinata_x) as x_max,
        MIN(coordinata_y) as y_min,
        MAX(coordinata_y) as y_max
      FROM ubicazioni 
      WHERE attiva = 1
      GROUP BY zona
      ORDER BY zona
    `).all();
  },

  getOverallStatistics() {
    return db.prepare(`
      SELECT 
        COUNT(*) as total_locations,
        COUNT(CASE WHEN tipo = 'SCAFFALE' THEN 1 END) as scaffali,
        COUNT(CASE WHEN tipo = 'PALLET' THEN 1 END) as pallet,
        COUNT(CASE WHEN tipo = 'FRIGO' THEN 1 END) as frigo,
        COUNT(CASE WHEN tipo = 'CONGELATORE' THEN 1 END) as congelatori,
        COUNT(CASE WHEN accesso_limitato = 1 THEN 1 END) as accesso_limitato,
        ROUND(AVG(percentuale_occupazione), 1) as occupazione_media,
        ROUND(SUM(volume_occupato_cm3) / 1000000.0, 2) as volume_occupato_m3,
        ROUND(SUM(volume_max_cm3) / 1000000.0, 2) as volume_totale_m3,
        ROUND(SUM(peso_attuale_kg), 1) as peso_totale_kg,
        ROUND(SUM(peso_max_kg), 1) as peso_max_totale_kg
      FROM ubicazioni 
      WHERE attiva = 1
    `).get();
  },

  // Optimization helpers
  suggestOptimalLocation(
    sku_code: string, 
    volume_cm3: number, 
    peso_kg: number,
    zona_preferita?: string
  ): Ubicazione | null {
    // Algorithm:
    // 1. Check if SKU already exists in warehouse (consolidation)
    // 2. Find locations with available space
    // 3. Prefer HOT zones for high-rotation items
    // 4. Balance load across zones

    const existingLocations = db.prepare(`
      SELECT DISTINCT u.*, go.quantita as existing_quantity
      FROM ubicazioni u
      JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      WHERE go.sku_code = ? 
        AND u.attiva = 1
        AND go.stato = 'DISPONIBILE'
        AND (u.volume_max_cm3 - u.volume_occupato_cm3) >= ?
        AND (u.peso_max_kg - u.peso_attuale_kg) >= ?
      ORDER BY go.quantita DESC
    `).all(sku_code, volume_cm3, peso_kg);

    // Prefer consolidation if possible
    if (existingLocations.length > 0) {
      return existingLocations[0] as Ubicazione;
    }

    // Find best available location
    let query = `
      SELECT 
        *,
        (volume_max_cm3 - volume_occupato_cm3) as volume_available,
        (peso_max_kg - peso_attuale_kg) as peso_available
      FROM ubicazioni 
      WHERE attiva = 1
        AND (volume_max_cm3 - volume_occupato_cm3) >= ?
        AND (peso_max_kg - peso_attuale_kg) >= ?
        AND percentuale_occupazione < 90
    `;

    const params = [volume_cm3, peso_kg];

    if (zona_preferita) {
      query += ` AND zona = ?`;
      params.push(zona_preferita);
    }

    query += `
      ORDER BY 
        zona_velocita DESC,  -- HOT first for fast items
        percentuale_occupazione ASC,  -- Less occupied first
        priorita_picking DESC,  -- Higher priority first
        volume_available ASC  -- Tighter fit first (less waste)
      LIMIT 1
    `;

    return db.prepare(query).get(...params) as Ubicazione | null;
  },

  // Bulk creation
  createBulk(ubicazioni: any[]): number {
    const insertUbicazione = db.prepare(`
      INSERT INTO ubicazioni (
        codice_ubicazione, zona, corridoio, scaffale, ripiano, posizione,
        tipo, coordinata_x, coordinata_y, coordinata_z, larghezza_cm, 
        profondita_cm, altezza_cm, orientamento, colore_hex,
        volume_max_cm3, peso_max_kg, volume_occupato_cm3, peso_attuale_kg, 
        percentuale_occupazione, accessibilita, temperatura_controllata,
        temperatura_attuale, attiva, priorita_picking, zona_velocita,
        frequenza_prelievi, accesso_limitato, badge_richiesto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((ubicazioni) => {
      let createdCount = 0;
      for (const ubicazione of ubicazioni) {
        try {
          // Calcola campi derivati
          const volume_max = ubicazione.larghezza_cm * ubicazione.profondita_cm * ubicazione.altezza_cm;
          const peso_max = Math.floor(volume_max / 5000); // Stima: 5000 cm³/kg
          const corridoio = ubicazione.area || 'A';
          const scaffale = ubicazione.fronte || '01';
          const ripiano = parseInt(ubicazione.piano) || 1;
          const posizione = ubicazione.colonna || 'A';
          
          insertUbicazione.run(
            ubicazione.codice_ubicazione,
            ubicazione.zona || '01',
            corridoio,
            scaffale, 
            ripiano,
            posizione,
            ubicazione.tipo,
            ubicazione.coordinata_x || 0,
            ubicazione.coordinata_y || 0, 
            ubicazione.coordinata_z || 0,
            ubicazione.larghezza_cm,
            ubicazione.profondita_cm,
            ubicazione.altezza_cm,
            ubicazione.orientamento || 0,
            ubicazione.colore_hex || '#3B82F6',
            volume_max,
            peso_max,
            0, // volume_occupato_cm3
            0, // peso_attuale_kg
            0, // percentuale_occupazione
            ubicazione.accessibilita || 'DIRETTA',
            ubicazione.temperatura_controllata || false,
            ubicazione.temperatura_attuale || null,
            true, // attiva
            ubicazione.priorita_picking || 1,
            ubicazione.zona_velocita,
            0, // frequenza_prelievi
            ubicazione.accesso_limitato || false,
            ubicazione.badge_richiesto || null
          );
          createdCount++;
        } catch (error) {
          console.error(`Errore creazione ubicazione ${ubicazione.codice_ubicazione}:`, error);
          // Continue with other locations
        }
      }
      return createdCount;
    });

    return insertMany(ubicazioni);
  },

  // Location Picker methods
  findLocationsWithProduct(sku_code: string, committente_id: number, search: string = ''): any[] {
    let query = `
      SELECT DISTINCT u.*, 
             go.quantita as same_sku_quantity,
             GROUP_CONCAT(DISTINCT go2.sku_code) as sku_codes,
             SUM(go2.quantita) as quantita_totale
      FROM ubicazioni u
      JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      LEFT JOIN giacenze_ownership go2 ON u.id = go2.ubicazione_id AND go2.committente_id = ?
      WHERE u.attiva = 1
        AND go.sku_code = ?
        AND go.committente_id = ?
        AND go.quantita > 0
    `;

    const params = [committente_id, sku_code, committente_id];

    if (search) {
      query += ` AND (u.codice_ubicazione LIKE ? OR u.zona LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY u.id
      ORDER BY go.quantita DESC, u.zona_velocita DESC
    `;

    return db.prepare(query).all(...params);
  },

  findBestSourceLocations(sku_code: string, committente_id: number, limit: number = 5): any[] {
    return db.prepare(`
      SELECT u.*, 
             go.quantita as same_sku_quantity,
             'Maggiore quantità disponibile' as zone_optimization
      FROM ubicazioni u
      JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      WHERE u.attiva = 1
        AND go.sku_code = ?
        AND go.committente_id = ?
        AND go.quantita > 0
      ORDER BY go.quantita DESC, u.priorita_picking DESC
      LIMIT ?
    `).all(sku_code, committente_id, limit);
  },

  findAvailableForStorage(required_volume: number = 0, required_weight: number = 0, search: string = ''): any[] {
    let query = `
      SELECT u.*,
             (u.volume_max_cm3 - u.volume_occupato_cm3) as volume_disponibile,
             (u.peso_max_kg - u.peso_attuale_kg) as peso_disponibile,
             GROUP_CONCAT(DISTINCT go.sku_code) as sku_codes,
             SUM(go.quantita) as quantita_totale
      FROM ubicazioni u
      LEFT JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      WHERE u.attiva = 1
        AND u.percentuale_occupazione < 95
        AND (u.volume_max_cm3 - u.volume_occupato_cm3) >= ?
        AND (u.peso_max_kg - u.peso_attuale_kg) >= ?
    `;

    const params = [required_volume, required_weight];

    if (search) {
      query += ` AND (u.codice_ubicazione LIKE ? OR u.zona LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY u.id
      ORDER BY 
        u.zona_velocita DESC,
        u.percentuale_occupazione ASC,
        u.priorita_picking DESC
    `;

    return db.prepare(query).all(...params);
  },

  findOptimalStorageLocations(sku_code: string, required_volume: number, required_weight: number, limit: number = 5): any[] {
    // Prima cerca ubicazioni che già contengono questo SKU (consolidamento)
    const consolidationQuery = db.prepare(`
      SELECT u.*, 
             go.quantita as same_sku_quantity,
             'Consolidamento prodotto' as zone_optimization
      FROM ubicazioni u
      JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      WHERE u.attiva = 1
        AND go.sku_code = ?
        AND (u.volume_max_cm3 - u.volume_occupato_cm3) >= ?
        AND (u.peso_max_kg - u.peso_attuale_kg) >= ?
        AND u.percentuale_occupazione < 90
      ORDER BY go.quantita DESC, u.percentuale_occupazione ASC
      LIMIT ?
    `).all(sku_code, required_volume, required_weight, limit);

    if (consolidationQuery.length >= limit) {
      return consolidationQuery;
    }

    // Poi cerca ubicazioni ottimali vuote/poco occupate
    const remaining = limit - consolidationQuery.length;
    const optimalQuery = db.prepare(`
      SELECT u.*,
             0 as same_sku_quantity,
             CASE 
               WHEN u.zona_velocita = 'HOT' THEN 'Zona ad alta rotazione'
               WHEN u.percentuale_occupazione < 20 THEN 'Ubicazione quasi vuota'
               ELSE 'Spazio disponibile ottimale'
             END as zone_optimization
      FROM ubicazioni u
      WHERE u.attiva = 1
        AND (u.volume_max_cm3 - u.volume_occupato_cm3) >= ?
        AND (u.peso_max_kg - u.peso_attuale_kg) >= ?
        AND u.percentuale_occupazione < 80
        AND u.id NOT IN (${consolidationQuery.map(() => '?').join(',') || 'NULL'})
      ORDER BY 
        u.zona_velocita DESC,
        u.percentuale_occupazione ASC,
        u.priorita_picking DESC
      LIMIT ?
    `).all(required_volume, required_weight, ...consolidationQuery.map(l => l.id), remaining);

    return [...consolidationQuery, ...optimalQuery];
  },

  findBestAvailableLocations(required_volume: number = 0, required_weight: number = 0, limit: number = 5): any[] {
    return db.prepare(`
      SELECT u.*,
             0 as same_sku_quantity,
             CASE 
               WHEN u.percentuale_occupazione < 20 THEN 'Ubicazione quasi vuota'
               WHEN u.zona_velocita = 'HOT' THEN 'Zona ad alta rotazione'
               WHEN (u.volume_max_cm3 - u.volume_occupato_cm3) > ? * 2 THEN 'Ampio spazio disponibile'
               ELSE 'Spazio sufficiente'
             END as zone_optimization
      FROM ubicazioni u
      WHERE u.attiva = 1
        AND (u.volume_max_cm3 - u.volume_occupato_cm3) >= ?
        AND (u.peso_max_kg - u.peso_attuale_kg) >= ?
        AND u.percentuale_occupazione < 85
      ORDER BY 
        u.percentuale_occupazione ASC,
        u.zona_velocita DESC,
        u.priorita_picking DESC
      LIMIT ?
    `).all(required_volume * 2, required_volume, required_weight, limit);
  }
};