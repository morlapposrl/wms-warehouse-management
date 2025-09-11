// @ts-nocheck
import type { PageServerLoad } from './$types.js';
import db from '$lib/server/database.js';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Carica tutte le ubicazioni con giacenze reali, prioritizzando quelle con stock
    const ubicazioni = db.prepare(`
      SELECT 
        u.id,
        u.codice_ubicazione,
        u.zona,
        u.corridoio,
        u.scaffale,
        u.ripiano,
        u.posizione,
        u.tipo,
        u.coordinata_x,
        u.coordinata_y,
        u.coordinata_z,
        u.larghezza_cm,
        u.profondita_cm,
        u.altezza_cm,
        u.orientamento,
        u.colore_hex,
        u.volume_max_cm3,
        u.peso_max_kg,
        u.accessibilita,
        u.temperatura_controllata,
        u.temperatura_attuale,
        u.attiva,
        u.priorita_picking,
        u.zona_velocita,
        u.frequenza_prelievi,
        u.accesso_limitato,
        u.badge_richiesto,
        -- Calcola dati reali da giacenze_fisiche
        COALESCE(gf.volume_occupato_totale, 0) as volume_occupato_cm3,
        COALESCE(gf.peso_totale, 0) as peso_attuale_kg,
        COALESCE(gf.prodotti_diversi, 0) as prodotti_diversi,
        COALESCE(gf.quantita_totale, 0) as quantita_totale,
        ROUND(
          CASE 
            WHEN u.volume_max_cm3 > 0 THEN (COALESCE(gf.volume_occupato_totale, 0) * 100.0 / u.volume_max_cm3)
            ELSE 0
          END, 1
        ) as percentuale_occupazione,
        -- Dettaglio contenuto per tooltip
        CASE 
          WHEN gf.prodotti_diversi > 0 THEN 
            CAST(gf.prodotti_diversi AS TEXT) || ' SKU, ' || CAST(gf.quantita_totale AS TEXT) || ' pz'
          ELSE 'Vuota'
        END as contenuto_attuale,
        -- Aggiungo campo area derivato dalla zona per compatibilità
        SUBSTR(u.zona, 1, 1) as area
      FROM ubicazioni u
      LEFT JOIN (
        SELECT 
          ubicazione_id,
          SUM(volume_occupato_cm3) as volume_occupato_totale,
          SUM(peso_totale_kg) as peso_totale,
          COUNT(DISTINCT sku_code) as prodotti_diversi,
          SUM(quantita_totale) as quantita_totale
        FROM giacenze_fisiche 
        WHERE quantita_totale > 0
        GROUP BY ubicazione_id
      ) gf ON u.id = gf.ubicazione_id
      WHERE u.attiva = 1 
        AND u.id <= 100  -- Escludi ubicazioni duplicate ad ID alto
      ORDER BY 
        CASE WHEN gf.quantita_totale > 0 THEN 0 ELSE 1 END,  -- Ubicazioni con giacenze prima
        u.zona, u.corridoio, u.scaffale, u.ripiano
    `).all();

    // Statistiche magazzino reali da giacenze_fisiche
    const statistiche = db.prepare(`
      SELECT 
        COUNT(*) as totale_ubicazioni,
        COUNT(CASE WHEN u.tipo = 'SCAFFALE' THEN 1 END) as scaffali,
        COUNT(CASE WHEN u.tipo = 'PALLET' THEN 1 END) as pallet,
        COUNT(CASE WHEN u.tipo = 'FRIGO' THEN 1 END) as frigo,
        COUNT(CASE WHEN u.accesso_limitato = 1 THEN 1 END) as accesso_limitato,
        ROUND(AVG(
          CASE 
            WHEN u.volume_max_cm3 > 0 THEN (COALESCE(gf.volume_occupato_totale, 0) * 100.0 / u.volume_max_cm3)
            ELSE 0
          END), 1) as occupazione_media,
        ROUND(SUM(COALESCE(gf.volume_occupato_totale, 0)) / 1000000.0, 2) as volume_occupato_m3,
        ROUND(SUM(u.volume_max_cm3) / 1000000.0, 2) as volume_totale_m3,
        ROUND(SUM(COALESCE(gf.peso_totale, 0)), 1) as peso_totale_kg,
        SUM(COALESCE(gf.prodotti_diversi, 0)) as sku_totali,
        SUM(COALESCE(gf.quantita_totale, 0)) as pezzi_totali,
        COUNT(CASE WHEN gf.prodotti_diversi > 0 THEN 1 END) as ubicazioni_occupate
      FROM ubicazioni u
      LEFT JOIN (
        SELECT 
          ubicazione_id,
          SUM(volume_occupato_cm3) as volume_occupato_totale,
          SUM(peso_totale_kg) as peso_totale,
          COUNT(DISTINCT sku_code) as prodotti_diversi,
          SUM(quantita_totale) as quantita_totale
        FROM giacenze_fisiche 
        WHERE quantita_totale > 0
        GROUP BY ubicazione_id
      ) gf ON u.id = gf.ubicazione_id
      WHERE u.attiva = 1
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
    const search_filter = url.searchParams.get('search') || '';
    const zona_filter = url.searchParams.get('zona') || '';
    const tipo_filter = url.searchParams.get('tipo') || '';
    const zona_velocita_filter = url.searchParams.get('zona_velocita') || '';
    const occupazione_min = url.searchParams.get('occupazione_min') || '';
    const occupazione_max = url.searchParams.get('occupazione_max') || '';
    const stato_filter = url.searchParams.get('stato') || '';

    // Applica filtri lato server per ottimizzazione
    let ubicazioniFiltrate = ubicazioni;

    if (search_filter) {
      ubicazioniFiltrate = ubicazioniFiltrate.filter(u => 
        u.codice_ubicazione.toLowerCase().includes(search_filter.toLowerCase()) ||
        u.zona.toLowerCase().includes(search_filter.toLowerCase()) ||
        u.tipo.toLowerCase().includes(search_filter.toLowerCase())
      );
    }

    if (zona_filter) {
      ubicazioniFiltrate = ubicazioniFiltrate.filter(u => u.zona === zona_filter);
    }

    if (tipo_filter) {
      ubicazioniFiltrate = ubicazioniFiltrate.filter(u => u.tipo === tipo_filter);
    }

    if (zona_velocita_filter) {
      ubicazioniFiltrate = ubicazioniFiltrate.filter(u => u.zona_velocita === zona_velocita_filter);
    }

    if (occupazione_min) {
      ubicazioniFiltrate = ubicazioniFiltrate.filter(u => (u.percentuale_occupazione || 0) >= parseInt(occupazione_min));
    }

    if (occupazione_max) {
      ubicazioniFiltrate = ubicazioniFiltrate.filter(u => (u.percentuale_occupazione || 0) <= parseInt(occupazione_max));
    }

    if (stato_filter) {
      switch(stato_filter) {
        case 'vuoto':
          ubicazioniFiltrate = ubicazioniFiltrate.filter(u => (u.percentuale_occupazione || 0) === 0);
          break;
        case 'basso':
          ubicazioniFiltrate = ubicazioniFiltrate.filter(u => (u.percentuale_occupazione || 0) > 0 && (u.percentuale_occupazione || 0) <= 50);
          break;
        case 'medio':
          ubicazioniFiltrate = ubicazioniFiltrate.filter(u => (u.percentuale_occupazione || 0) > 50 && (u.percentuale_occupazione || 0) <= 80);
          break;
        case 'alto':
          ubicazioniFiltrate = ubicazioniFiltrate.filter(u => (u.percentuale_occupazione || 0) > 80);
          break;
      }
    }

    // Statistiche aggiornate da includere
    const statisticheComplete = {
      ...statistiche,
      zone_hot: zone.reduce((sum, z) => sum + z.hot_zone, 0),
      zone_warm: zone.reduce((sum, z) => sum + z.warm_zone, 0),
      zone_cold: zone.reduce((sum, z) => sum + z.cold_zone, 0),
      ubicazioni_piene: ubicazioni.filter(u => (u.percentuale_occupazione || 0) > 90).length
    };


    return {
      ubicazioni: ubicazioniFiltrate,
      ubicazioniTutte: ubicazioni, // Per la mappa
      statistiche: statisticheComplete,
      zone,
      filters: {
        search: search_filter,
        zona: zona_filter,
        tipo: tipo_filter,
        zona_velocita: zona_velocita_filter,
        occupazione_min,
        occupazione_max,
        stato: stato_filter
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