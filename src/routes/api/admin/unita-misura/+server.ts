import { json } from '@sveltejs/kit';
import { unitaMisuraRepository } from '$lib/server/repositories/unitaMisuraRepository';
import { validateCreateUnitaMisura, validateSearchUnitaMisura } from '$lib/validations/unitaMisura';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista tutte le unità di misura con info committente (solo admin)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchQuery = url.searchParams.get('q');
    const tipo = url.searchParams.get('tipo') as 'globali' | 'all' | null;
    
    let unita: any[];
    
    if (searchQuery) {
      // Ricerca
      const validation = validateSearchUnitaMisura({ 
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
      
      // Ricerca globale (senza filtro committente)
      unita = unitaMisuraRepository.search(validation.data.query);
    } else if (tipo === 'globali') {
      // Solo unità globali
      unita = unitaMisuraRepository.findGlobali();
    } else {
      // Tutte le unità con info committente
      unita = unitaMisuraRepository.findAllWithCommittente();
    }
    
    // Statistiche generali
    const stats = unitaMisuraRepository.getStats();
    
    return json<ApiResponse>({
      success: true,
      data: {
        unita_misura: unita,
        totali: unita.length,
        statistiche: stats
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/unita-misura:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella ricerca delle unità di misura'
    }, { status: 500 });
  }
};

// POST - Crea unità di misura globale (solo admin)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Forza unità globale (committente_id = null) e tipo sistema se richiesto
    const unitaData = {
      ...data,
      committente_id: undefined, // null per unità globale
      tipo: data.tipo || 'sistema'
    };
    
    // Valida i dati
    const validation = validateCreateUnitaMisura(unitaData);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Verifica disponibilità codice a livello globale
    if (!unitaMisuraRepository.isCodeAvailable(validation.data.codice)) {
      return json<ApiResponse>({
        success: false,
        error: `Il codice "${validation.data.codice}" è già utilizzato a livello globale`
      }, { status: 409 });
    }

    // Crea l'unità di misura globale
    const nuovaUnita = unitaMisuraRepository.create({
      ...validation.data,
      committente_id: undefined // null per unità globale
    });
    
    return json<ApiResponse>({
      success: true,
      data: {
        unita_misura: nuovaUnita,
        message: `Unità di misura globale "${nuovaUnita.descrizione}" creata con successo`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/admin/unita-misura:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella creazione dell\'unità di misura globale'
    }, { status: 500 });
  }
};