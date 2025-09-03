import { json } from '@sveltejs/kit';
import { prodottiRepository } from '$lib/server/repositories/prodottiRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateSuggestionsProdotto } from '$lib/validations/prodotto';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Suggerimenti per autocompletamento prodotti
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
    const validation = validateSuggestionsProdotto({
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

    const suggerimenti = prodottiRepository.getSuggestions(
      committente_id,
      validation.data.query,
      validation.data.limit
    );
    
    return json<ApiResponse>({
      success: true,
      data: {
        suggerimenti: suggerimenti.map(prodotto => ({
          id: prodotto.id,
          codice: prodotto.codice,
          descrizione: prodotto.descrizione,
          categoria_descrizione: prodotto.categoria_descrizione,
          prezzo_vendita: prodotto.prezzo_vendita
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
    console.error('Errore GET /api/committenti/[committente_id]/prodotti/suggestions:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero dei suggerimenti'
    }, { status: 500 });
  }
};