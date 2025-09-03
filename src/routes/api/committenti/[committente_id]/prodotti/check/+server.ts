import { json } from '@sveltejs/kit';
import { prodottiRepository } from '$lib/server/repositories/prodottiRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Verifica disponibilità codice prodotto per committente
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

    const codice = url.searchParams.get('codice');
    const excludeId = url.searchParams.get('exclude_id');
    
    if (!codice) {
      return json<ApiResponse>({
        success: false,
        error: 'Specificare il codice da verificare'
      }, { status: 400 });
    }

    // Valida il codice
    if (!codice || codice.trim() === '') {
      return json<ApiResponse>({
        success: false,
        error: 'Codice non valido'
      }, { status: 400 });
    }

    const codiceNormalized = codice.toUpperCase();
    const excludeIdNum = excludeId ? parseInt(excludeId) : undefined;
    
    if (excludeId && isNaN(excludeIdNum!)) {
      return json<ApiResponse>({
        success: false,
        error: 'ID esclusione non valido'
      }, { status: 400 });
    }

    const disponibile = prodottiRepository.isCodeAvailable(
      committente_id,
      codiceNormalized,
      excludeIdNum
    );

    // Se non disponibile, trova prodotto con stesso codice per riferimento
    let conflitto = null;
    if (!disponibile) {
      const prodotti = prodottiRepository.findByCommittente(committente_id);
      const existing = prodotti.find(p => 
        p.codice.toLowerCase() === codiceNormalized.toLowerCase() &&
        (!excludeIdNum || p.id !== excludeIdNum)
      );
      if (existing) {
        conflitto = {
          id: existing.id,
          descrizione: existing.descrizione,
          codice: existing.codice,
          categoria_id: existing.categoria_id
        };
      }
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        codice: codiceNormalized,
        disponibile,
        conflitto,
        committente: {
          id: committente.id,
          ragione_sociale: committente.ragione_sociale
        }
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/committenti/[committente_id]/prodotti/check:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella verifica di disponibilità'
    }, { status: 500 });
  }
};