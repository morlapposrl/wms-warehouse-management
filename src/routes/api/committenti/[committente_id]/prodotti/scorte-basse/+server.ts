import { json } from '@sveltejs/kit';
import { prodottiRepository } from '$lib/server/repositories/prodottiRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista prodotti con scorte sotto minimo per committente
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

    const prodottiScorteBasse = prodottiRepository.findWithLowStock(committente_id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        prodotti_scorte_basse: prodottiScorteBasse.map(prodotto => ({
          ...prodotto,
          differenza_scorta: prodotto.giacenza_attuale - prodotto.scorta_minima,
          percentuale_scorta: prodotto.scorta_minima > 0 
            ? Math.round((prodotto.giacenza_attuale / prodotto.scorta_minima) * 100)
            : 0
        })),
        totali: prodottiScorteBasse.length,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/prodotti/scorte-basse:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero prodotti con scorte basse'
    }, { status: 500 });
  }
};