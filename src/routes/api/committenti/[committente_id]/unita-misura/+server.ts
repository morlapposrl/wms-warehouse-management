import { json } from '@sveltejs/kit';
import { unitaMisuraRepository } from '$lib/server/repositories/unitaMisuraRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateCreateUnitaMisura, validateSearchUnitaMisura } from '$lib/validations/unitaMisura';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista unità di misura disponibili per committente (globali + specifiche)
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
    
    let unita: any[];
    
    if (searchQuery) {
      // Ricerca
      const validation = validateSearchUnitaMisura({ 
        query: searchQuery, 
        committente_id,
        limit: parseInt(url.searchParams.get('limit') || '10')
      });
      
      if (!validation.success) {
        return json<ApiResponse>({
          success: false,
          error: 'Parametri di ricerca non validi',
          errors: validation.errors
        }, { status: 400 });
      }
      
      unita = unitaMisuraRepository.search(validation.data.query, committente_id);
    } else {
      // Lista completa
      unita = unitaMisuraRepository.findAvailableForCommittente(committente_id);
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        unita_misura: unita,
        totali: unita.length,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/unita-misura:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella ricerca delle unità di misura'
    }, { status: 500 });
  }
};

// POST - Crea nuova unità di misura per committente
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
    const validation = validateCreateUnitaMisura({
      ...data,
      committente_id // Forza l'ID committente dalla URL
    });
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Verifica disponibilità codice
    if (!unitaMisuraRepository.isCodeAvailable(validation.data.codice, undefined, committente_id)) {
      return json<ApiResponse>({
        success: false,
        error: `Il codice "${validation.data.codice}" è già utilizzato`
      }, { status: 409 });
    }

    // Crea l'unità di misura
    const nuovaUnita = unitaMisuraRepository.create({
      ...validation.data,
      committente_id
    });
    
    return json<ApiResponse>({
      success: true,
      data: {
        unita_misura: nuovaUnita,
        message: `Unità di misura "${nuovaUnita.descrizione}" creata con successo`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/committenti/[committente_id]/unita-misura:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella creazione dell\'unità di misura'
    }, { status: 500 });
  }
};