import { json } from '@sveltejs/kit';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import { validateSuggestionsFornitore } from '$lib/validations/fornitore';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Suggerimenti per autocompletamento fornitori
export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    if (!query) {
      return json<ApiResponse>({
        success: false,
        error: 'Specificare la query di ricerca'
      }, { status: 400 });
    }

    // Valida i parametri
    const validation = validateSuggestionsFornitore({
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

    const suggerimenti = fornitoriRepository.getSuggestions(
      validation.data.query,
      validation.data.limit
    );
    
    return json<ApiResponse>({
      success: true,
      data: {
        suggerimenti: suggerimenti.map(fornitore => ({
          id: fornitore.id,
          codice: fornitore.codice,
          ragione_sociale: fornitore.ragione_sociale,
          partita_iva: fornitore.partita_iva,
          email: fornitore.email,
          telefono: fornitore.telefono
        })),
        query: validation.data.query,
        totali: suggerimenti.length
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/fornitori/suggestions:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero dei suggerimenti'
    }, { status: 500 });
  }
};