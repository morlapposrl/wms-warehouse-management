import { json } from '@sveltejs/kit';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateAssociateFornitore } from '$lib/validations/fornitore';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista fornitori NON associati al committente
export const GET: RequestHandler = async ({ params }) => {
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

    const fornitoriDisponibili = fornitoriRepository.findNotAssociatedToCommittente(committente_id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitori_disponibili: fornitoriDisponibili,
        totali: fornitoriDisponibili.length,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/fornitori/associate:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero fornitori disponibili'
    }, { status: 500 });
  }
};

// POST - Associa fornitore esistente a committente
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
    const validation = validateAssociateFornitore(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    const { fornitore_id, attivo, condizioni_specifiche } = validation.data;

    // Verifica esistenza fornitore
    const fornitore = fornitoriRepository.findById(fornitore_id);
    if (!fornitore) {
      return json<ApiResponse>({
        success: false,
        error: 'Fornitore non trovato'
      }, { status: 404 });
    }

    // Crea l'associazione
    const associazione = fornitoriRepository.associateToCommittente(
      fornitore_id, 
      committente_id, 
      { attivo, condizioni_specifiche }
    );
    
    return json<ApiResponse>({
      success: true,
      data: {
        associazione,
        fornitore,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        },
        message: `Fornitore "${fornitore.ragione_sociale}" associato con successo a "${committente.ragione_sociale}"`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/committenti/[committente_id]/fornitori/associate:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'associazione del fornitore'
    }, { status: 500 });
  }
};