import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { wavePlanningRepository } from '$lib/server/repositories/wavePlanningRepository';
import { WaveOptimizationService } from '$lib/server/services/waveOptimizationService';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente_id = url.searchParams.get('committente');
    const stato = url.searchParams.get('stato');
    
    const waves = wavePlanningRepository.getAllWaves(
      committente_id ? parseInt(committente_id) : undefined
    );

    // Filtra per stato se specificato
    const filteredWaves = stato 
      ? waves.filter(w => w.stato === stato)
      : waves;

    return json({
      success: true,
      data: filteredWaves
    });

  } catch (error) {
    console.error('Errore caricamento wave planning:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento delle wave'
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    const {
      committente_id,
      tipo_wave = 'BATCH_PICKING',
      max_ordini = 20,
      priorita_minima = 1,
      data_da,
      data_a,
      operatore_id
    } = data;

    // Validazione input
    if (!['BATCH_PICKING', 'ZONE_PICKING', 'DISCRETE_PICKING', 'WAVE_PICKING'].includes(tipo_wave)) {
      return json({
        success: false,
        error: 'Tipo wave non valido'
      }, { status: 400 });
    }

    // Crea wave ottimizzata
    const result = await WaveOptimizationService.createOptimizedWave({
      committente_id: committente_id ? parseInt(committente_id) : undefined,
      tipo_wave,
      max_ordini: parseInt(max_ordini),
      priorita_minima: parseInt(priorita_minima),
      data_da,
      data_a,
      operatore_id: operatore_id ? parseInt(operatore_id) : undefined
    });

    return json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Errore creazione wave:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore nella creazione della wave'
    }, { status: 500 });
  }
};