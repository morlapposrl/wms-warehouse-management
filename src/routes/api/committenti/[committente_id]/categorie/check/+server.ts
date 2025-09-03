import { json } from '@sveltejs/kit';
import { categorieRepository } from '$lib/server/repositories/categorieRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Verifica disponibilità codice categoria per committente
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

    const codice = url.searchParams.get('codice');
    const excludeId = url.searchParams.get('exclude_id');
    
    if (!codice) {
      return json<ApiResponse>({
        success: false,
        error: 'Specificare il codice da verificare'
      }, { status: 400 });
    }

    const disponibile = categorieRepository.isCodeAvailable(
      committente_id,
      codice,
      excludeId ? parseInt(excludeId) : undefined
    );

    // Se il codice non è disponibile, mostra categorie simili di altri committenti
    let suggerimenti: any[] = [];
    if (!disponibile) {
      const similar = categorieRepository.findSimilarCategories(codice, committente_id);
      suggerimenti = similar.map(s => ({
        committente_id: s.committente_id,
        descrizione: s.categoria.descrizione
      }));
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        codice,
        disponibile,
        suggerimenti: suggerimenti.length > 0 ? suggerimenti : undefined
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/categorie/check:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella verifica di disponibilità'
    }, { status: 500 });
  }
};