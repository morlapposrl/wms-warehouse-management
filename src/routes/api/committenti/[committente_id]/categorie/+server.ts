import { json } from '@sveltejs/kit';
import { categorieRepository } from '$lib/server/repositories/categorieRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateCategoria } from '$lib/validations/categoria';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista categorie per committente
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

    // Parametri di ricerca
    const search = url.searchParams.get('search');
    const attiva = url.searchParams.get('attiva');
    const activeOnly = url.searchParams.get('active_only') === 'true';

    let categorie;

    if (activeOnly) {
      // Solo categorie attive (per select)
      categorie = categorieRepository.findActive(committente_id);
    } else if (search) {
      // Ricerca testuale
      categorie = categorieRepository.search(committente_id, search);
    } else {
      // Lista completa con filtro attiva
      categorie = categorieRepository.findAll(committente_id);
      
      if (attiva !== null) {
        const isActive = attiva === 'true';
        categorie = categorie.filter(c => c.attiva === isActive);
      }
    }

    // Aggiungi statistiche
    const stats = categorieRepository.countByCommittente(committente_id);

    return json<ApiResponse>({
      success: true,
      data: {
        categorie,
        committente,
        stats
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/categorie:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
};

// POST - Crea nuova categoria per committente
export const POST: RequestHandler = async ({ params, request }) => {
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

    const data = await request.json();
    
    // Valida i dati
    const validation = validateCategoria(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }
    
    const validatedData = validation.data;
    
    // Verifica univocità codice per il committente
    if (!categorieRepository.isCodeAvailable(committente_id, validatedData.codice)) {
      return json<ApiResponse>({
        success: false,
        error: `Codice categoria '${validatedData.codice}' già esistente per questo committente`
      }, { status: 409 });
    }
    
    // Crea la categoria
    const categoria = categorieRepository.create(committente_id, validatedData);
    
    return json<ApiResponse>({
      success: true,
      data: categoria
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/committenti/[committente_id]/categorie:', error);
    
    // Gestione errori specifici del database
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return json<ApiResponse>({
          success: false,
          error: 'Codice categoria già esistente per questo committente'
        }, { status: 409 });
      }
    }
    
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella creazione della categoria'
    }, { status: 500 });
  }
};