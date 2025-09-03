import { json } from '@sveltejs/kit';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import { validateUpdateFornitore } from '$lib/validations/fornitore';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Dettaglio fornitore (admin)
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID fornitore non valido'
      }, { status: 400 });
    }

    const fornitore = fornitoriRepository.findById(id);
    
    if (!fornitore) {
      return json<ApiResponse>({
        success: false,
        error: 'Fornitore non trovato'
      }, { status: 404 });
    }

    // Recupera anche informazioni sui committenti associati
    const fornitoreConCommittenti = fornitoriRepository.findAllWithCommittentiCount()
      .find(f => f.id === id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitore: fornitoreConCommittenti || fornitore
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/fornitori/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero del fornitore'
    }, { status: 500 });
  }
};

// PUT - Aggiorna fornitore (admin)
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID fornitore non valido'
      }, { status: 400 });
    }

    const fornitoreEsistente = fornitoriRepository.findById(id);
    
    if (!fornitoreEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Fornitore non trovato'
      }, { status: 404 });
    }

    const data = await request.json();
    
    // Valida i dati
    const validation = validateUpdateFornitore(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Se viene cambiato il codice, verifica disponibilità
    if (validation.data.codice && validation.data.codice !== fornitoreEsistente.codice) {
      if (!fornitoriRepository.isCodeAvailable(validation.data.codice, id)) {
        return json<ApiResponse>({
          success: false,
          error: `Il codice "${validation.data.codice}" è già utilizzato`
        }, { status: 409 });
      }
    }

    // Aggiorna il fornitore
    const fornitoreAggiornato = fornitoriRepository.update(id, validation.data);
    
    if (!fornitoreAggiornato) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'aggiornamento del fornitore'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitore: fornitoreAggiornato,
        message: `Fornitore "${fornitoreAggiornato.ragione_sociale}" aggiornato con successo`
      }
    });
    
  } catch (error) {
    console.error('Errore PUT /api/admin/fornitori/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'aggiornamento del fornitore'
    }, { status: 500 });
  }
};

// DELETE - Elimina fornitore (admin)
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID fornitore non valido'
      }, { status: 400 });
    }

    const fornitoreEsistente = fornitoriRepository.findById(id);
    
    if (!fornitoreEsistente) {
      return json<ApiResponse>({
        success: false,
        error: 'Fornitore non trovato'
      }, { status: 404 });
    }

    // Elimina il fornitore
    const eliminato = fornitoriRepository.delete(id);
    
    if (!eliminato) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'eliminazione del fornitore'
      }, { status: 500 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        message: `Fornitore "${fornitoreEsistente.ragione_sociale}" eliminato con successo`
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('fornitore associato a')) {
      return json<ApiResponse>({
        success: false,
        error: error.message
      }, { status: 409 });
    }
    
    if (error instanceof Error && error.message.includes('fornitore utilizzato in')) {
      return json<ApiResponse>({
        success: false,
        error: error.message
      }, { status: 409 });
    }
    
    console.error('Errore DELETE /api/admin/fornitori/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'eliminazione del fornitore'
    }, { status: 500 });
  }
};