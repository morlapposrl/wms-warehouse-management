import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ubicazioniRepository } from '$lib/server/repositories/ubicazioniRepository.js';
import { chaoticStorageService } from '$lib/server/services/chaoticStorageService.js';
import db from '$lib/server/database.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const zona = url.searchParams.get('zona');
    const tipo = url.searchParams.get('tipo');
    const zona_velocita = url.searchParams.get('zona_velocita');
    
    let ubicazioni;
    
    if (zona) {
      ubicazioni = ubicazioniRepository.findByZona(zona);
    } else {
      ubicazioni = ubicazioniRepository.findAll();
    }
    
    // Apply additional filters
    if (tipo) {
      ubicazioni = ubicazioni.filter(u => u.tipo === tipo);
    }
    
    if (zona_velocita) {
      ubicazioni = ubicazioni.filter(u => u.zona_velocita === zona_velocita);
    }

    // Get statistics
    const statistics = ubicazioniRepository.getOverallStatistics();
    const zoneStats = ubicazioniRepository.getZoneStatistics();

    return json({
      ubicazioni,
      statistics,
      zone_statistics: zoneStats
    });

  } catch (error) {
    console.error('Error loading ubicazioni:', error);
    return json({ error: 'Failed to load ubicazioni' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    const required = ['codice_ubicazione', 'zona', 'tipo', 'coordinata_x', 'coordinata_y'];
    for (const field of required) {
      if (!data[field] && data[field] !== 0) {
        return json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Database is already imported at top

    // Create new ubicazione
    const insertUbicazione = db.prepare(`
      INSERT INTO ubicazioni (
        codice_ubicazione, zona, corridoio, scaffale, ripiano, posizione, tipo,
        coordinata_x, coordinata_y, coordinata_z,
        larghezza_cm, profondita_cm, altezza_cm, orientamento, colore_hex,
        volume_max_cm3, peso_max_kg, accessibilita, temperatura_controllata,
        attiva, priorita_picking, zona_velocita, frequenza_prelievi, accesso_limitato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Extract hierarchical components from form data
    const corridoio = data.fronte || '01';
    const scaffale = data.colonna || 'A'; 
    const ripiano = parseInt(data.piano) || 1;
    const posizione = `${data.area}-${data.zona}-${corridoio}-${scaffale}`;

    // Calculate volume based on dimensions
    const volume_max_cm3 = (data.larghezza_cm || 120) * (data.profondita_cm || 80) * (data.altezza_cm || 200);
    const peso_max_kg = Math.round(volume_max_cm3 / 1000); // 1kg per litro approssimativo

    const result = insertUbicazione.run(
      data.codice_ubicazione,
      data.zona,
      corridoio,
      scaffale,
      ripiano,
      posizione,
      data.tipo,
      parseFloat(data.coordinata_x),
      parseFloat(data.coordinata_y),
      parseFloat(data.coordinata_z) || 0,
      parseFloat(data.larghezza_cm) || 120,
      parseFloat(data.profondita_cm) || 80,
      parseFloat(data.altezza_cm) || 200,
      parseInt(data.orientamento) || 0,
      data.colore_hex || '#3B82F6',
      volume_max_cm3,
      peso_max_kg,
      data.accessibilita || 'DIRETTA',
      data.temperatura_controllata ? 1 : 0,
      1, // attiva
      parseInt(data.priorita_picking) || 5,
      data.zona_velocita || 'WARM',
      0, // frequenza_prelievi
      data.accesso_limitato ? 1 : 0
    );

    console.log(`✅ Ubicazione creata: ${data.codice_ubicazione} (ID: ${result.lastInsertRowid})`);

    return json({ 
      success: true, 
      message: 'Ubicazione creata con successo',
      ubicazione: { id: result.lastInsertRowid, ...data }
    });

  } catch (error) {
    console.error('Error creating ubicazione:', error);
    return json({ error: 'Failed to create ubicazione' }, { status: 500 });
  }
};