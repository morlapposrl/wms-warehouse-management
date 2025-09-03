import { json } from '@sveltejs/kit';
import { unitaMisuraRepository } from '$lib/server/repositories/unitaMisuraRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateUpdateUnitaMisura } from '$lib/validations/unitaMisura';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Dettaglio singola unità di misura
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const id = parseInt(params.id);
    
    if (isNaN(committente_id) || isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'Parametri non validi'
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

    const unita = unitaMisuraRepository.findById(id);
    
    if (!unita) {
      return json<ApiResponse>({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }

    // Verifica che l'unità sia accessibile al committente
    // (globale o specifica per questo committente)
    if (unita.committente_id !== null && unita.committente_id !== committente_id) {
      return json<ApiResponse>({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        unita_misura: unita,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/unita-misura/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero dell\'unità di misura'
    }, { status: 500 });
  }
};

// PUT - Aggiorna unità di misura
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const id = parseInt(params.id);
    
    if (isNaN(committente_id) || isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'Parametri non validi'
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

    const unitaEsistente = unitaMisuraRepository.findById(id);
    
    if (!unitaEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }

    // Verifica che l'unità appartenga al committente (solo unità specifiche possono essere modificate)
    if (unitaEsistente.committente_id !== committente_id) {
      return json<ApiResponse>({
        success: false,
        error: 'Non è possibile modificare questa unità di misura'
      }, { status: 403 });
    }

    const data = await request.json();
    
    // Valida i dati
    const validation = validateUpdateUnitaMisura(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Se viene cambiato il codice, verifica disponibilità
    if (validation.data.codice && validation.data.codice !== unitaEsistente.codice) {
      if (!unitaMisuraRepository.isCodeAvailable(validation.data.codice, id, committente_id)) {
        return json<ApiResponse>({
          success: false,
          error: `Il codice "${validation.data.codice}" è già utilizzato`
        }, { status: 409 });
      }
    }

    // Aggiorna l'unità di misura
    const unitaAggiornata = unitaMisuraRepository.update(id, validation.data);
    
    if (!unitaAggiornata) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'aggiornamento dell\'unità di misura'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        unita_misura: unitaAggiornata,
        message: `Unità di misura "${unitaAggiornata.descrizione}" aggiornata con successo`
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Non è possibile modificare le unità di misura di sistema')) {
      return json<ApiResponse>({
        success: false,
        error: error.message
      }, { status: 403 });
    }
    
    console.error('Errore PUT /api/committenti/[committente_id]/unita-misura/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'unità di misura'
    }, { status: 500 });
  }
};

// DELETE - Elimina unità di misura
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const id = parseInt(params.id);
    
    if (isNaN(committente_id) || isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'Parametri non validi'
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

    const unitaEsistente = unitaMisuraRepository.findById(id);
    
    if (!unitaEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Unità di misura non trovata'
      }, { status: 404 });
    }

    // Verifica che l'unità appartenga al committente
    if (unitaEsistente.committente_id !== committente_id) {
      return json<ApiResponse>({
        success: false,
        error: 'Non è possibile eliminare questa unità di misura'
      }, { status: 403 });
    }

    // Elimina l'unità di misura
    const eliminata = unitaMisuraRepository.delete(id);
    
    if (!eliminata) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'eliminazione dell\'unità di misura'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        message: `Unità di misura "${unitaEsistente.descrizione}" eliminata con successo`
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Non è possibile eliminare le unità di misura di sistema')) {
      return json<ApiResponse>({
        success: false,
        error: error.message
      }, { status: 403 });
    }
    
    if (error instanceof Error && error.message.includes('unità di misura utilizzata da')) {
      return json<ApiResponse>({
        success: false,
        error: error.message
      }, { status: 409 });
    }
    
    console.error('Errore DELETE /api/committenti/[committente_id]/unita-misura/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'eliminazione dell\'unità di misura'
    }, { status: 500 });
  }
};