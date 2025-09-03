import { json } from '@sveltejs/kit';
import { categorieRepository } from '$lib/server/repositories/categorieRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateUpdateCategoria } from '$lib/validations/categoria';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Singola categoria per committente e ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const categoria_id = parseInt(params.id);
    
    if (isNaN(committente_id) || isNaN(categoria_id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID committente o categoria non valido'
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

    // Recupera categoria (già filtrata per committente)
    const categoria = categorieRepository.findById(committente_id, categoria_id);
    
    if (!categoria) {
      return json<ApiResponse>({
        success: false,
        error: 'Categoria non trovata per questo committente'
      }, { status: 404 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        categoria,
        committente
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/categorie/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
};

// PUT - Aggiorna categoria per committente
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const categoria_id = parseInt(params.id);
    
    if (isNaN(committente_id) || isNaN(categoria_id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID committente o categoria non valido'
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

    // Verifica esistenza categoria per il committente
    const existing = categorieRepository.findById(committente_id, categoria_id);
    if (!existing) {
      return json<ApiResponse>({
        success: false,
        error: 'Categoria non trovata per questo committente'
      }, { status: 404 });
    }

    const data = await request.json();
    
    // Valida i dati
    const validation = validateUpdateCategoria(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }
    
    const validatedData = validation.data;
    
    // Se il codice è cambiato, verifica univocità
    if (validatedData.codice && 
        validatedData.codice !== existing.codice && 
        !categorieRepository.isCodeAvailable(committente_id, validatedData.codice, categoria_id)) {
      return json<ApiResponse>({
        success: false,
        error: `Codice categoria '${validatedData.codice}' già esistente per questo committente`
      }, { status: 409 });
    }
    
    // Aggiorna la categoria
    const categoria = categorieRepository.update(committente_id, categoria_id, validatedData);
    
    if (!categoria) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'aggiornamento della categoria'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: categoria
    });
    
  } catch (error) {
    console.error('Errore PUT /api/committenti/[committente_id]/categorie/[id]:', error);
    
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
      error: 'Errore nell\'aggiornamento della categoria'
    }, { status: 500 });
  }
};

// DELETE - Elimina categoria per committente
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const categoria_id = parseInt(params.id);
    
    if (isNaN(committente_id) || isNaN(categoria_id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID committente o categoria non valido'
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

    // Verifica esistenza categoria per il committente
    const existing = categorieRepository.findById(committente_id, categoria_id);
    if (!existing) {
      return json<ApiResponse>({
        success: false,
        error: 'Categoria non trovata per questo committente'
      }, { status: 404 });
    }

    try {
      const success = categorieRepository.delete(committente_id, categoria_id);
      
      if (!success) {
        return json<ApiResponse>({
          success: false,
          error: 'Errore nell\'eliminazione della categoria'
        }, { status: 500 });
      }
      
      return json<ApiResponse>({
        success: true,
        data: { message: 'Categoria eliminata con successo' }
      });
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('utilizzata da')) {
        return json<ApiResponse>({
          success: false,
          error: error.message
        }, { status: 409 });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Errore DELETE /api/committenti/[committente_id]/categorie/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'eliminazione della categoria'
    }, { status: 500 });
  }
};