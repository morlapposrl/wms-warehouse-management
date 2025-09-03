import { json } from '@sveltejs/kit';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateUpdateAssociation } from '$lib/validations/fornitore';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Dettaglio fornitore per committente
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const fornitore_id = parseInt(params.fornitore_id);
    
    if (isNaN(committente_id) || isNaN(fornitore_id)) {
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

    // Cerca fornitore tra quelli associati al committente
    const fornitori = fornitoriRepository.findByCommittente(committente_id);
    const fornitore = fornitori.find(f => f.id === fornitore_id);
    
    if (!fornitore) {
      return json<ApiResponse>({
        success: false,
        error: 'Fornitore non trovato o non associato a questo committente'
      }, { status: 404 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitore,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/fornitori/[fornitore_id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero del fornitore'
    }, { status: 500 });
  }
};

// PUT - Aggiorna associazione fornitore-committente
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const fornitore_id = parseInt(params.fornitore_id);
    
    if (isNaN(committente_id) || isNaN(fornitore_id)) {
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

    // Verifica esistenza fornitore e associazione
    const fornitori = fornitoriRepository.findByCommittente(committente_id);
    const fornitoreEsistente = fornitori.find(f => f.id === fornitore_id);
    
    if (!fornitoreEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Fornitore non trovato o non associato a questo committente'
      }, { status: 404 });
    }

    const data = await request.json();
    
    // Valida i dati
    const validation = validateUpdateAssociation(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Aggiorna l'associazione
    const associazioneAggiornata = fornitoriRepository.updateAssociation(
      fornitore_id, 
      committente_id, 
      validation.data
    );
    
    if (!associazioneAggiornata) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'aggiornamento dell\'associazione'
      }, { status: 500 });
    }

    // Recupera il fornitore aggiornato
    const fornitoriAggiornati = fornitoriRepository.findByCommittente(committente_id);
    const fornitoreAggiornato = fornitoriAggiornati.find(f => f.id === fornitore_id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitore: fornitoreAggiornato,
        associazione: associazioneAggiornata,
        message: `Associazione con "${fornitoreEsistente.ragione_sociale}" aggiornata con successo`
      }
    });
    
  } catch (error) {
    console.error('Errore PUT /api/committenti/[committente_id]/fornitori/[fornitore_id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'associazione'
    }, { status: 500 });
  }
};

// DELETE - Rimuovi associazione fornitore-committente
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const fornitore_id = parseInt(params.fornitore_id);
    
    if (isNaN(committente_id) || isNaN(fornitore_id)) {
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

    // Verifica esistenza fornitore e associazione
    const fornitori = fornitoriRepository.findByCommittente(committente_id);
    const fornitoreEsistente = fornitori.find(f => f.id === fornitore_id);
    
    if (!fornitoreEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Fornitore non trovato o non associato a questo committente'
      }, { status: 404 });
    }

    // Rimuovi l'associazione
    const rimossa = fornitoriRepository.dissociateFromCommittente(fornitore_id, committente_id);
    
    if (!rimossa) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nella rimozione dell\'associazione'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        message: `Associazione con fornitore "${fornitoreEsistente.ragione_sociale}" rimossa con successo`
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('movimenti registrati')) {
      return json<ApiResponse>({
        success: false,
        error: error.message
      }, { status: 409 });
    }
    
    console.error('Errore DELETE /api/committenti/[committente_id]/fornitori/[fornitore_id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella rimozione dell\'associazione'
    }, { status: 500 });
  }
};