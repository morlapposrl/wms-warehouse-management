import { json } from '@sveltejs/kit';
import { prodottiRepository } from '$lib/server/repositories/prodottiRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateUpdateProdotto } from '$lib/validations/prodotto';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Dettaglio singolo prodotto
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

    const prodotto = prodottiRepository.findById(committente_id, id);
    
    if (!prodotto) {
      return json<ApiResponse>({
        success: false,
        error: 'Prodotto non trovato'
      }, { status: 404 });
    }

    // Recupera anche i dati correlati
    const prodottiDettaglio = prodottiRepository.findByCommittenteWithDetails(committente_id);
    const prodottoConDettagli = prodottiDettaglio.find(p => p.id === id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        prodotto: prodottoConDettagli || prodotto,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/prodotti/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero del prodotto'
    }, { status: 500 });
  }
};

// PUT - Aggiorna prodotto
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

    const prodottoEsistente = prodottiRepository.findById(committente_id, id);
    
    if (!prodottoEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Prodotto non trovato'
      }, { status: 404 });
    }

    const data = await request.json();
    
    // Controllo di sicurezza per dati malformatti
    if (!data || typeof data !== 'object') {
      return json<ApiResponse>({
        success: false,
        error: 'Dati di richiesta non validi'
      }, { status: 400 });
    }
    
    // Valida i dati
    const validation = validateUpdateProdotto(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Se viene cambiato il codice, verifica disponibilità
    if (validation.data.codice && validation.data.codice !== prodottoEsistente.codice) {
      if (!prodottiRepository.isCodeAvailable(committente_id, validation.data.codice, id)) {
        return json<ApiResponse>({
          success: false,
          error: `Il codice "${validation.data.codice}" è già utilizzato per questo committente`
        }, { status: 409 });
      }
    }

    // Aggiorna il prodotto
    const prodottoAggiornato = prodottiRepository.update(committente_id, id, validation.data);
    
    if (!prodottoAggiornato) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'aggiornamento del prodotto'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        prodotto: prodottoAggiornato,
        message: `Prodotto "${prodottoAggiornato.descrizione}" aggiornato con successo`
      }
    });
    
  } catch (error) {
    console.error('Errore PUT /api/committenti/[committente_id]/prodotti/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'aggiornamento del prodotto'
    }, { status: 500 });
  }
};

// DELETE - Elimina prodotto
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

    const prodottoEsistente = prodottiRepository.findById(committente_id, id);
    
    if (!prodottoEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Prodotto non trovato'
      }, { status: 404 });
    }

    // Elimina il prodotto
    const eliminato = prodottiRepository.delete(committente_id, id);
    
    if (!eliminato) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'eliminazione del prodotto'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        message: `Prodotto "${prodottoEsistente.descrizione}" eliminato con successo`
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('prodotto utilizzato in')) {
      return json<ApiResponse>({
        success: false,
        error: error.message
      }, { status: 409 });
    }
    
    console.error('Errore DELETE /api/committenti/[committente_id]/prodotti/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'eliminazione del prodotto'
    }, { status: 500 });
  }
};