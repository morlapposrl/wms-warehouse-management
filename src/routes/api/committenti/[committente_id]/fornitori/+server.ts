import { json } from '@sveltejs/kit';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateSearchFornitore } from '$lib/validations/fornitore';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista fornitori associati al committente
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    
    if (isNaN(committente_id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID committente non valido'
      }, { status: 400 });
    }

    // Verifica esistenza committente
    const committente = committentiRepository.findById(committente_id);
    if (!committente) {
      return json<ApiResponse>({
        success: false,
        error: 'Committente non trovato'
      }, { status: 404 });
    }

    const searchQuery = url.searchParams.get('q');
    
    let fornitori: any[];
    
    if (searchQuery) {
      // Ricerca
      const validation = validateSearchFornitore({ 
        query: searchQuery,
        limit: parseInt(url.searchParams.get('limit') || '20')
      });
      
      if (!validation.success) {
        return json<ApiResponse>({
          success: false,
          error: 'Parametri di ricerca non validi',
          errors: validation.errors
        }, { status: 400 });
      }
      
      fornitori = fornitoriRepository.searchByCommittente(committente_id, validation.data.query);
    } else {
      // Lista completa
      fornitori = fornitoriRepository.findByCommittente(committente_id);
    }

    // Statistiche fornitori per committente
    const stats = fornitoriRepository.getStatsForCommittente(committente_id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitori,
        totali: fornitori.length,
        statistiche: stats,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/fornitori:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella ricerca dei fornitori'
    }, { status: 500 });
  }
};