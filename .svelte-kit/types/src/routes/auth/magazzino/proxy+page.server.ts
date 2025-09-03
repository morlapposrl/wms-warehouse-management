// @ts-nocheck
import type { PageServerLoad } from './$types.js';
import db from '$lib/server/database.js';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Carica tutte le ubicazioni con le loro coordinate per la mappa
    const ubicazioni = db.prepare(`
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
    `).all();

    // Statistiche magazzino
    const statistiche = db.prepare(`
      SELECT 
        COUNT(*) as totale_ubicazioni,
        COUNT(CASE WHEN tipo = 'SCAFFALE' THEN 1 END) as scaffali,
        COUNT(CASE WHEN tipo = 'PALLET' THEN 1 END) as pallet,
        COUNT(CASE WHEN tipo = 'FRIGO' THEN 1 END) as frigo,
        COUNT(CASE WHEN accesso_limitato = 1 THEN 1 END) as accesso_limitato,
        ROUND(AVG(percentuale_occupazione), 1) as occupazione_media,
        ROUND(SUM(volume_occupato_cm3) / 1000000.0, 2) as volume_occupato_m3,
        ROUND(SUM(volume_max_cm3) / 1000000.0, 2) as volume_totale_m3,
        ROUND(SUM(peso_attuale_kg), 1) as peso_totale_kg
      FROM ubicazioni 
      WHERE attiva = 1
    `).get();

    // Zone summary
    const zone = db.prepare(`
      SELECT 
        zona,
        COUNT(*) as ubicazioni_count,
        COUNT(CASE WHEN zona_velocita = 'HOT' THEN 1 END) as hot_zone,
        COUNT(CASE WHEN zona_velocita = 'WARM' THEN 1 END) as warm_zone,
        COUNT(CASE WHEN zona_velocita = 'COLD' THEN 1 END) as cold_zone,
        ROUND(AVG(percentuale_occupazione), 1) as occupazione_media,
        MIN(coordinata_x) as x_min,
        MAX(coordinata_x) as x_max,
        MIN(coordinata_y) as y_min,
        MAX(coordinata_y) as y_max
      FROM ubicazioni 
      WHERE attiva = 1
      GROUP BY zona
      ORDER BY zona
    `).all();

    // Parametri filtri
    const zona_filter = url.searchParams.get('zona') || '';
    const tipo_filter = url.searchParams.get('tipo') || '';
    const zona_velocita_filter = url.searchParams.get('zona_velocita') || '';

    return {
      ubicazioni,
      statistiche,
      zone,
      filters: {
        zona: zona_filter,
        tipo: tipo_filter,
        zona_velocita: zona_velocita_filter
      }
    };

  } catch (error) {
    console.error('Errore caricamento magazzino:', error);
    return {
      ubicazioni: [],
      statistiche: null,
      zone: [],
      filters: {
        zona: '',
        tipo: '',
        zona_velocita: ''
      }
    };
  }
};