import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { wavePlanningRepository } from '$lib/server/repositories/wavePlanningRepository';
import { WaveOptimizationService } from '$lib/server/services/waveOptimizationService';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const waveId = parseInt(params.id);
    
    if (!waveId) {
      return json({
        success: false,
        error: 'ID wave non valido'
      }, { status: 400 });
    }

    const wave = wavePlanningRepository.getWaveById(waveId);
    
    if (!wave) {
      return json({
        success: false,
        error: 'Wave non trovata'
      }, { status: 404 });
    }

    // Carica dati correlati
    const ordini = wavePlanningRepository.getWaveOrders(waveId);
    const pickTasks = wavePlanningRepository.getPickTasks(waveId);
    const statistics = wavePlanningRepository.getWaveStatistics(waveId);
    const performance = WaveOptimizationService.getWavePerformanceMetrics(waveId);

    return json({
      success: true,
      data: {
        wave,
        ordini,
        pickTasks,
        statistics,
        performance
      }
    });

  } catch (error) {
    console.error('Errore caricamento dettaglio wave:', error);
    return json({
      success: false,
      error: 'Errore nel caricamento del dettaglio wave'
    }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const waveId = parseInt(params.id);
    const data = await request.json();
    
    const { stato, data_inizio, data_fine } = data;

    if (!waveId || !stato) {
      return json({
        success: false,
        error: 'Dati mancanti per aggiornamento wave'
      }, { status: 400 });
    }

    // Aggiorna stato wave
    wavePlanningRepository.updateWaveStatus(waveId, stato, data_inizio, data_fine);

    return json({
      success: true,
      message: 'Wave aggiornata con successo'
    });

  } catch (error) {
    console.error('Errore aggiornamento wave:', error);
    return json({
      success: false,
      error: 'Errore nell\'aggiornamento della wave'
    }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const waveId = parseInt(params.id);
    
    if (!waveId) {
      return json({
        success: false,
        error: 'ID wave non valido'
      }, { status: 400 });
    }

    wavePlanningRepository.deleteWave(waveId);

    return json({
      success: true,
      message: 'Wave eliminata con successo'
    });

  } catch (error) {
    console.error('Errore eliminazione wave:', error);
    return json({
      success: false,
      error: 'Errore nell\'eliminazione della wave'
    }, { status: 500 });
  }
};