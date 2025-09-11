import { json } from '@sveltejs/kit';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateCommittente, validateCommittenteFilters } from '$lib/validations/committente';
import { createAuditTracker } from '$lib/server/middleware/auditMiddleware';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista committenti con filtri e paginazione
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Estrae parametri dalla query string
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Converti parametri numerici
    if (searchParams.page) searchParams.page = parseInt(searchParams.page);
    if (searchParams.limit) searchParams.limit = parseInt(searchParams.limit);
    
    // Valida i filtri
    const filterValidation = validateCommittenteFilters(searchParams);
    
    if (!filterValidation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Filtri non validi',
        errors: filterValidation.errors
      }, { status: 400 });
    }
    
    const { page, limit, ...filters } = filterValidation.data;
    
    // Se richiesta paginazione
    if (page && limit) {
      const result = committentiRepository.findPaginated(page, limit, filters);
      return json<ApiResponse>({
        success: true,
        data: result
      });
    }
    
    // Altrimenti lista completa
    const committenti = committentiRepository.findAll(filters);
    return json<ApiResponse>({
      success: true,
      data: committenti
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/committenti:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
};

// POST - Crea nuovo committente
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    
    // Valida i dati
    const validation = validateCommittente(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }
    
    const validatedData = validation.data;
    
    // Verifica univocità codice
    if (!committentiRepository.isCodeAvailable(validatedData.codice)) {
      return json<ApiResponse>({
        success: false,
        error: 'Codice committente già esistente'
      }, { status: 409 });
    }
    
    // Verifica univocità email (se presente)
    if (validatedData.email && !committentiRepository.isEmailAvailable(validatedData.email)) {
      return json<ApiResponse>({
        success: false,
        error: 'Email già associata a un altro committente'
      }, { status: 409 });
    }
    
    // Crea il committente
    const committente = committentiRepository.create(validatedData);
    
    // Log audit per creazione committente
    try {
      const tracker = createAuditTracker(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'committenti',
          operation: 'CREATE',
          description: `Creato committente "${committente.ragione_sociale}" (${committente.codice})`,
          module: 'COMMITTENTI',
          functionality: 'create_committente',
          importance: 'ALTA',
          entities_involved: { 
            committente_id: committente.id,
            codice: committente.codice,
            ragione_sociale: committente.ragione_sociale
          },
          data_before: null,
          data_after: committente
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json<ApiResponse>({
      success: true,
      data: committente
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/admin/committenti:', error);
    
    // Gestione errori specifici del database
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed: committenti.codice')) {
        return json<ApiResponse>({
          success: false,
          error: 'Codice committente già esistente'
        }, { status: 409 });
      }
      
      if (error.message.includes('UNIQUE constraint failed: committenti.email')) {
        return json<ApiResponse>({
          success: false,
          error: 'Email già esistente'
        }, { status: 409 });
      }
    }
    
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella creazione del committente'
    }, { status: 500 });
  }
};