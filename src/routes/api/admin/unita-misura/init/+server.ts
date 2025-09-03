import { json } from '@sveltejs/kit';
import { unitaMisuraRepository } from '$lib/server/repositories/unitaMisuraRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// POST - Inizializza unità di misura di sistema (solo admin)
export const POST: RequestHandler = async () => {
  try {
    // Crea le unità di sistema standard
    const created = unitaMisuraRepository.createSystemUnits();
    
    // Ottiene statistiche aggiornate
    const stats = unitaMisuraRepository.getStats();
    
    return json<ApiResponse>({
      success: true,
      data: {
        unita_create: created,
        statistiche: stats,
        message: created > 0 
          ? `Inizializzate ${created} unità di misura di sistema`
          : 'Tutte le unità di sistema sono già presenti'
      }
    }, { status: created > 0 ? 201 : 200 });
    
  } catch (error) {
    console.error('Errore POST /api/admin/unita-misura/init:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'inizializzazione delle unità di sistema'
    }, { status: 500 });
  }
};