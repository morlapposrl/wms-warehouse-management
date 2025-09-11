import type { PageServerLoad } from './$types';
import { udcRepository } from '$lib/server/repositories/udcRepository';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const udc_id = parseInt(params.id);
    
    if (!udc_id || isNaN(udc_id)) {
      throw new Error('UDC ID non valido');
    }

    // Carica dati UDC completi
    const udc = udcRepository.getUDCById(udc_id);
    if (!udc) {
      throw new Error('UDC non trovato');
    }

    // Carica contenuto UDC
    const contenuto = udcRepository.getContenutoUDC(udc_id);

    // Carica movimenti UDC
    const movimenti = udcRepository.getMovimentiUDC(udc_id);

    // Statistiche UDC
    const stats = {
      prodotti_diversi: contenuto.length,
      quantita_totale: contenuto.reduce((sum, c) => sum + c.quantita, 0),
      peso_totale: contenuto.reduce((sum, c) => sum + (c.peso_kg || 0), 0),
      volume_totale: contenuto.reduce((sum, c) => sum + (c.volume_cm3 || 0), 0),
      movimenti_totali: movimenti.length
    };

    // Calcola saturazione UDC usando le specifiche del tipo UDC o override
    const lunghezza_effettiva = udc.lunghezza_cm || udc.tipo_lunghezza_cm || 120;
    const larghezza_effettiva = udc.larghezza_cm || udc.tipo_larghezza_cm || 80;
    const altezza_effettiva = udc.altezza_max_cm || udc.tipo_altezza_max_cm || 180;
    const peso_max_effettivo = udc.peso_max_kg || udc.tipo_peso_max_kg || 1000;
    
    const volume_max = lunghezza_effettiva * larghezza_effettiva * altezza_effettiva; // cm³
    const volume_occupato = stats.volume_totale;
    const percentuale_volume = volume_max > 0 ? (volume_occupato / volume_max) * 100 : 0;
    const percentuale_peso = peso_max_effettivo > 0 ? (stats.peso_totale / peso_max_effettivo) * 100 : 0;

    return {
      udc,
      contenuto,
      movimenti,
      stats,
      saturazione: {
        volume: percentuale_volume,
        peso: percentuale_peso,
        volume_max,
        volume_occupato,
        peso_max_effettivo,
        lunghezza_effettiva,
        larghezza_effettiva,
        altezza_effettiva
      }
    };

  } catch (error) {
    console.error('Errore caricamento dettaglio UDC:', error);
    throw error;
  }
};