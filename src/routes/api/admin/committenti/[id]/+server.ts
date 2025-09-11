import { json } from '@sveltejs/kit';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateUpdateCommittente } from '$lib/validations/committente';
import { createAuditTracker } from '$lib/server/middleware/auditMiddleware';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Singolo committente per ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID committente non valido'
      }, { status: 400 });
    }
    
    const committente = committentiRepository.findById(id);
    
    if (!committente) {
      return json<ApiResponse>({
        success: false,
        error: 'Committente non trovato'
      }, { status: 404 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: committente
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/committenti/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
};

// PUT - Aggiorna committente
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID committente non valido'
      }, { status: 400 });
    }
    
    // Verifica esistenza committente
    const existing = committentiRepository.findById(id);
    if (!existing) {
      return json<ApiResponse>({
        success: false,
        error: 'Committente non trovato'
      }, { status: 404 });
    }
    
    const data = await request.json();
    
    // Valida i dati
    const validation = validateUpdateCommittente(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }
    
    const validatedData = validation.data;
    
    // Verifica univocità email (se presente e diversa da quella attuale)
    if (validatedData.email && 
        validatedData.email !== existing.email && 
        !committentiRepository.isEmailAvailable(validatedData.email, id)) {
      return json<ApiResponse>({
        success: false,
        error: 'Email già associata a un altro committente'
      }, { status: 409 });
    }
    
    // Aggiorna il committente
    const committente = committentiRepository.update(id, validatedData);
    
    if (!committente) {
      return json<ApiResponse>({
        success: false,
        error: 'Errore nell\'aggiornamento del committente'
      }, { status: 500 });
    }
    
    // Log audit per modifica committente
    try {
      const tracker = createAuditTracker(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'committenti',
          operation: 'UPDATE',
          description: `Modificato committente "${committente.ragione_sociale}" (${committente.codice})`,
          module: 'COMMITTENTI',
          functionality: 'update_committente',
          importance: 'MEDIA',
          entities_involved: { 
            committente_id: committente.id,
            codice: committente.codice,
            ragione_sociale: committente.ragione_sociale
          },
          data_before: existing,
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
    });
    
  } catch (error) {
    console.error('Errore PUT /api/admin/committenti/[id]:', error);
    
    // Gestione errori specifici del database
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed: committenti.email')) {
        return json<ApiResponse>({
          success: false,
          error: 'Email già esistente'
        }, { status: 409 });
      }
    }
    
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'aggiornamento del committente'
    }, { status: 500 });
  }
};

// DELETE - Elimina committente (soft delete)
export const DELETE: RequestHandler = async ({ params, url, request, cookies }) => {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID committente non valido'
      }, { status: 400 });
    }
    
    // Verifica esistenza committente
    const existing = committentiRepository.findById(id);
    if (!existing) {
      return json<ApiResponse>({
        success: false,
        error: 'Committente non trovato'
      }, { status: 404 });
    }
    
    // Controlla se è richiesta eliminazione definitiva (hard delete)
    const hardDelete = url.searchParams.get('hard') === 'true';
    
    if (hardDelete) {
      try {
        const success = committentiRepository.delete(id);
        
        if (!success) {
          return json<ApiResponse>({
            success: false,
            error: 'Errore nell\'eliminazione del committente'
          }, { status: 500 });
        }
        
        // Log audit per eliminazione definitiva committente
        try {
          const tracker = createAuditTracker(request, cookies);
          if (tracker) {
            await tracker.logOperation({
              table: 'committenti',
              operation: 'DELETE',
              description: `Eliminato definitivamente committente "${existing.ragione_sociale}" (${existing.codice})`,
              module: 'COMMITTENTI',
              functionality: 'delete_hard_committente',
              importance: 'CRITICA',
              entities_involved: { 
                committente_id: id,
                codice: existing.codice,
                ragione_sociale: existing.ragione_sociale
              },
              data_before: existing,
              data_after: null
            });
          }
        } catch (auditError) {
          console.error('Errore audit:', auditError);
          // Non bloccare l'operazione per errori di audit
        }
        
        return json<ApiResponse>({
          success: true,
          data: { message: 'Committente eliminato definitivamente' }
        });
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('dati collegati')) {
          return json<ApiResponse>({
            success: false,
            error: 'Impossibile eliminare definitivamente: committente ha dati collegati'
          }, { status: 409 });
        }
        throw error;
      }
    } else {
      // Soft delete (cambia stato a 'cessato')
      const success = committentiRepository.softDelete(id);
      
      if (!success) {
        return json<ApiResponse>({
          success: false,
          error: 'Errore nell\'eliminazione del committente'
        }, { status: 500 });
      }
      
      // Log audit per soft delete committente
      try {
        const tracker = createAuditTracker(request, cookies);
        if (tracker) {
          await tracker.logOperation({
            table: 'committenti',
            operation: 'UPDATE',
            description: `Disattivato committente "${existing.ragione_sociale}" (${existing.codice}) - Stato: cessato`,
            module: 'COMMITTENTI',
            functionality: 'soft_delete_committente',
            importance: 'ALTA',
            entities_involved: { 
              committente_id: id,
              codice: existing.codice,
              ragione_sociale: existing.ragione_sociale
            },
            data_before: existing,
            data_after: { ...existing, stato: 'cessato', attivo: false }
          });
        }
      } catch (auditError) {
        console.error('Errore audit:', auditError);
        // Non bloccare l'operazione per errori di audit
      }
      
      return json<ApiResponse>({
        success: true,
        data: { message: 'Committente disattivato (stato: cessato)' }
      });
    }
    
  } catch (error) {
    console.error('Errore DELETE /api/admin/committenti/[id]:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nell\'eliminazione del committente'
    }, { status: 500 });
  }
};