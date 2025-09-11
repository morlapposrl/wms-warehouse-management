import { json } from '@sveltejs/kit';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import { validateCreateFornitore, validateSearchFornitore } from '$lib/validations/fornitore';
import { createAuditTracker } from '$lib/server/middleware/auditMiddleware';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista tutti i fornitori (solo admin)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchQuery = url.searchParams.get('q');
    
    let fornitori: any[];
    
    if (searchQuery) {
      // Ricerca
      const validation = validateSearchFornitore({ 
        query: searchQuery,
        limit: parseInt(url.searchParams.get('limit') || '50')
      });
      
      if (!validation.success) {
        return json<ApiResponse>({
          success: false,
          error: 'Parametri di ricerca non validi',
          errors: validation.errors
        }, { status: 400 });
      }
      
      fornitori = fornitoriRepository.search(validation.data.query);
    } else {
      // Lista completa con conteggio committenti
      fornitori = fornitoriRepository.findAllWithCommittentiCount();
    }
    
    // Statistiche generali
    const stats = fornitoriRepository.getStats();
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitori,
        totali: fornitori.length,
        statistiche: stats
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/fornitori:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella ricerca dei fornitori'
    }, { status: 500 });
  }
};

// POST - Crea nuovo fornitore (solo admin)
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    
    // Valida i dati
    const validation = validateCreateFornitore(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Verifica disponibilità codice
    if (!fornitoriRepository.isCodeAvailable(validation.data.codice)) {
      return json<ApiResponse>({
        success: false,
        error: `Il codice "${validation.data.codice}" è già utilizzato`
      }, { status: 409 });
    }

    // Crea il fornitore
    const nuovoFornitore = fornitoriRepository.create(validation.data);
    
    // Log audit per creazione fornitore
    const tracker = createAuditTracker(request, cookies);
    if (tracker) {
      await tracker.logOperation({
        table: 'fornitori',
        operation: 'CREATE',
        description: `Creato fornitore "${nuovoFornitore.ragione_sociale}" (${nuovoFornitore.codice})`,
        module: 'FORNITORI',
        functionality: 'create_fornitore',
        importance: 'MEDIA',
        entities_involved: { 
          fornitore_id: nuovoFornitore.id,
          codice: nuovoFornitore.codice,
          ragione_sociale: nuovoFornitore.ragione_sociale
        },
        data_before: null,
        data_after: nuovoFornitore
      });
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        fornitore: nuovoFornitore,
        message: `Fornitore "${nuovoFornitore.ragione_sociale}" creato con successo`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/admin/fornitori:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella creazione del fornitore'
    }, { status: 500 });
  }
};