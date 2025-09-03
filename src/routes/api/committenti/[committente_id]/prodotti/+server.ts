import { json } from '@sveltejs/kit';
import { prodottiRepository } from '$lib/server/repositories/prodottiRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateCreateProdotto, validateSearchProdotto } from '$lib/validations/prodotto';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista prodotti per committente
export const GET: RequestHandler = async ({ params, url }) => {
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

    const searchQuery = url.searchParams.get('q');
    const categoriaId = url.searchParams.get('categoria_id');
    const attivo = url.searchParams.get('attivo');
    const scorteBasse = url.searchParams.get('scorte_basse');
    
    let prodotti: any[];
    
    if (searchQuery) {
      // Ricerca
      const validation = validateSearchProdotto({ 
        query: searchQuery,
        categoria_id: categoriaId ? parseInt(categoriaId) : undefined,
        attivo: attivo ? attivo === 'true' : undefined,
        scorte_basse: scorteBasse ? scorteBasse === 'true' : undefined,
        limit: parseInt(url.searchParams.get('limit') || '50')
      });
      
      if (!validation.success) {
        return json<ApiResponse>({
          success: false,
          error: 'Parametri di ricerca non validi',
          errors: validation.errors
        }, { status: 400 });
      }
      
      prodotti = prodottiRepository.search(committente_id, validation.data.query);
    } else if (scorteBasse === 'true') {
      // Prodotti con scorte basse
      prodotti = prodottiRepository.findWithLowStock(committente_id);
    } else if (categoriaId) {
      // Filtro per categoria
      prodotti = prodottiRepository.findByCategoria(committente_id, parseInt(categoriaId));
    } else if (attivo !== null) {
      // Filtro per stato
      prodotti = prodottiRepository.findByStatus(committente_id, attivo === 'true');
    } else {
      // Lista completa con dettagli
      prodotti = prodottiRepository.findByCommittenteWithDetails(committente_id);
    }

    // Statistiche prodotti per committente
    const stats = prodottiRepository.countByCommittente(committente_id);
    const stockValue = prodottiRepository.getStockValue(committente_id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        prodotti,
        totali: prodotti.length,
        statistiche: {
          ...stats,
          ...stockValue
        },
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/prodotti:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella ricerca dei prodotti'
    }, { status: 500 });
  }
};

// POST - Crea nuovo prodotto per committente
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
    const validation = validateCreateProdotto(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }

    // Verifica disponibilità codice per il committente
    if (!prodottiRepository.isCodeAvailable(committente_id, validation.data.codice)) {
      return json<ApiResponse>({
        success: false,
        error: `Il codice "${validation.data.codice}" è già utilizzato per questo committente`
      }, { status: 409 });
    }

    // Verifica che categoria appartenga al committente
    const checkCategoria = prodottiRepository.findById(committente_id, 0); // Usa query diretta per verificare
    const categoriaCheck = committentiRepository.findById(committente_id); // Placeholder - implementare controllo
    
    // Crea il prodotto
    const nuovoProdotto = prodottiRepository.create(committente_id, validation.data);
    
    return json<ApiResponse>({
      success: true,
      data: {
        prodotto: nuovoProdotto,
        message: `Prodotto "${nuovoProdotto.descrizione}" creato con successo`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/committenti/[committente_id]/prodotti:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella creazione del prodotto'
    }, { status: 500 });
  }
};