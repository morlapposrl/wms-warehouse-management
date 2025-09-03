import { json } from '@sveltejs/kit';
import { unitaMisuraRepository } from '$lib/server/repositories/unitaMisuraRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateSuggestionsUnitaMisura } from '$lib/validations/unitaMisura';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Suggerimenti per autocompletamento unità di misura
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

    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    if (!query) {
      return json<ApiResponse>({
        success: false,
        error: 'Specificare la query di ricerca'
      }, { status: 400 });
    }

    // Valida i parametri
    const validation = validateSuggestionsUnitaMisura({
      query,
      limit
    });

    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Parametri non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Ottiene suggerimenti filtrati per committente
    const suggerimenti = unitaMisuraRepository.getSuggestions(
      validation.data.query,
      validation.data.limit
    ).filter(unita => 
      // Include unità globali e specifiche per il committente
      unita.committente_id === null || unita.committente_id === committente_id
    );
    
    return json<ApiResponse>({
      success: true,
      data: {
        suggerimenti: suggerimenti.map(unita => ({
          id: unita.id,
          codice: unita.codice,
          descrizione: unita.descrizione,
          tipo: unita.tipo,
          is_global: unita.committente_id === null
        })),
        query: validation.data.query,
        totali: suggerimenti.length,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/unita-misura/suggestions:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero dei suggerimenti'
    }, { status: 500 });
  }
};