import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { chaoticStorageService } from '$lib/server/services/chaoticStorageService.js';
import { ubicazioniRepository } from '$lib/server/repositories/ubicazioniRepository.js';
import db from '$lib/server/database.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { ubicazione_id } = await request.json();
    
    if (!ubicazione_id) {
      return json({ error: 'Missing ubicazione_id' }, { status: 400 });
    }

    const ubicazioneId = parseInt(ubicazione_id);
    if (isNaN(ubicazioneId)) {
      return json({ error: 'Invalid ubicazione ID' }, { status: 400 });
    }

    // Get the ubicazione
    const ubicazione = ubicazioniRepository.findById(ubicazioneId);
    if (!ubicazione) {
      return json({ error: 'Ubicazione not found' }, { status: 404 });
    }

    const suggestions = [];

    // 1. Check if ubicazione is overcrowded (>85% full)
    if (ubicazione.percentuale_occupazione > 85) {
      // Find items that could be moved to less crowded locations
      const movableItems = db.prepare(`
        SELECT 
          go.*,
          sm.descrizione,
          -- Calculate velocity (movements in last 30 days)
          (SELECT COUNT(*) FROM movimenti_ottimizzati 
           WHERE sku_code = go.sku_code 
           AND timestamp_inizio >= datetime('now', '-30 days')) as velocity
        FROM giacenze_ownership go
        LEFT JOIN sku_master sm ON go.sku_code = sm.sku_code
        WHERE go.ubicazione_id = ?
          AND go.stato = 'DISPONIBILE'
        ORDER BY velocity ASC  -- Low velocity items first
      `).all(ubicazioneId);

      for (const item of movableItems.slice(0, 3)) { // Suggest moving up to 3 items
        // Find alternative location
        const alternativeLocation = await chaoticStorageService.suggestPutAwayLocation({
          sku_code: item.sku_code,
          committente_id: item.committente_id,
          quantita: Math.floor(item.quantita * 0.5), // Move 50%
          volume_cm3: 1000, // Estimated
          peso_kg: 1, // Estimated
          ordine_id: 0
        });

        if (alternativeLocation && alternativeLocation.id !== ubicazioneId) {
          suggestions.push({
            type: 'MOVE',
            reason: 'Ridurre congestione - ubicazione sovraccarica (>85%)',
            sku_code: item.sku_code,
            quantita: Math.floor(item.quantita * 0.5),
            from_location: ubicazione,
            to_location: alternativeLocation,
            priority: 'HIGH',
            estimated_benefit: 'Migliora accessibilità e velocità picking'
          });
        }
      }
    }

    // 2. Check for consolidation opportunities (same SKU in multiple locations)
    const skusInLocation = db.prepare(`
      SELECT DISTINCT sku_code FROM giacenze_ownership 
      WHERE ubicazione_id = ? AND stato = 'DISPONIBILE'
    `).all(ubicazioneId).map(row => row.sku_code);

    for (const skuCode of skusInLocation) {
      const otherLocations = db.prepare(`
        SELECT 
          u.*,
          go.quantita,
          ABS(u.coordinata_x - ?) + ABS(u.coordinata_y - ?) as distance
        FROM ubicazioni u
        JOIN giacenze_ownership go ON u.id = go.ubicazione_id
        WHERE go.sku_code = ?
          AND u.id != ?
          AND go.stato = 'DISPONIBILE'
          AND u.percentuale_occupazione < 80
        ORDER BY distance ASC
        LIMIT 3
      `).all(ubicazione.coordinata_x, ubicazione.coordinata_y, skuCode, ubicazioneId);

      if (otherLocations.length > 0) {
        const nearestLocation = otherLocations[0];
        suggestions.push({
          type: 'CONSOLIDATE',
          reason: 'Consolidare SKU disperso in più ubicazioni',
          sku_code: skuCode,
          quantita: nearestLocation.quantita,
          from_location: nearestLocation,
          to_location: ubicazione,
          priority: 'MEDIUM',
          estimated_benefit: 'Riduce zone di picking, migliora efficienza'
        });
      }
    }

    // 3. Velocity-based optimization (move high-velocity items to HOT zones)
    if (ubicazione.zona_velocita !== 'HOT') {
      const highVelocityItems = db.prepare(`
        SELECT 
          go.*,
          (SELECT COUNT(*) FROM movimenti_ottimizzati 
           WHERE sku_code = go.sku_code 
           AND timestamp_inizio >= datetime('now', '-30 days')) as velocity
        FROM giacenze_ownership go
        WHERE go.ubicazione_id = ?
          AND go.stato = 'DISPONIBILE'
        HAVING velocity > 10  -- High velocity threshold
        ORDER BY velocity DESC
        LIMIT 2
      `).all(ubicazioneId);

      for (const item of highVelocityItems) {
        // Find HOT zone location
        const hotLocation = db.prepare(`
          SELECT * FROM ubicazioni
          WHERE zona_velocita = 'HOT'
            AND attiva = 1
            AND percentuale_occupazione < 80
            AND (volume_max_cm3 - volume_occupato_cm3) > 1000
          ORDER BY percentuale_occupazione ASC
          LIMIT 1
        `).get();

        if (hotLocation) {
          suggestions.push({
            type: 'VELOCITY_OPTIMIZE',
            reason: 'Spostare prodotto ad alta rotazione in zona HOT',
            sku_code: item.sku_code,
            quantita: item.quantita,
            from_location: ubicazione,
            to_location: hotLocation,
            priority: 'HIGH',
            estimated_benefit: 'Riduce tempo picking per prodotti frequenti'
          });
        }
      }
    }

    // 4. Check for temperature compatibility issues
    if (ubicazione.temperatura_controllata) {
      const incompatibleItems = db.prepare(`
        SELECT go.*, sm.temperatura_controllata
        FROM giacenze_ownership go
        LEFT JOIN sku_master sm ON go.sku_code = sm.sku_code
        WHERE go.ubicazione_id = ?
          AND go.stato = 'DISPONIBILE'
          AND COALESCE(sm.temperatura_controllata, 0) = 0
      `).all(ubicazioneId);

      for (const item of incompatibleItems) {
        const standardLocation = db.prepare(`
          SELECT * FROM ubicazioni
          WHERE temperatura_controllata = 0
            AND attiva = 1
            AND percentuale_occupazione < 80
          ORDER BY percentuale_occupazione ASC
          LIMIT 1
        `).get();

        if (standardLocation) {
          suggestions.push({
            type: 'COMPATIBILITY',
            reason: 'Prodotto non richiede temperatura controllata',
            sku_code: item.sku_code,
            quantita: item.quantita,
            from_location: ubicazione,
            to_location: standardLocation,
            priority: 'MEDIUM',
            estimated_benefit: 'Libera spazio in zona temperatura controllata'
          });
        }
      }
    }

    // Sort suggestions by priority
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return json({
      suggestions: suggestions.slice(0, 5), // Return top 5 suggestions
      ubicazione,
      analysis: {
        current_occupation: ubicazione.percentuale_occupazione,
        zone_velocity: ubicazione.zona_velocita,
        temperature_controlled: ubicazione.temperatura_controllata,
        total_suggestions: suggestions.length
      }
    });

  } catch (error) {
    console.error('Error generating optimization suggestions:', error);
    return json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
};