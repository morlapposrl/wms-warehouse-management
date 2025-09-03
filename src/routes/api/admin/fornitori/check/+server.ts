import { json } from '@sveltejs/kit';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Verifica disponibilità codice fornitore
export const GET: RequestHandler = async ({ url }) => {
  try {
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

    const disponibile = fornitoriRepository.isCodeAvailable(
      codiceNormalized,
      excludeIdNum
    );

    // Se non disponibile, trova fornitore con stesso codice per riferimento
    let conflitto = null;
    if (!disponibile) {
      const allFornitori = fornitoriRepository.findAll();
      const existing = allFornitori.find(f => f.codice.toLowerCase() === codiceNormalized.toLowerCase());
      if (existing && (!excludeIdNum || existing.id !== excludeIdNum)) {
        conflitto = {
          id: existing.id,
          ragione_sociale: existing.ragione_sociale,
          codice: existing.codice
        };
      }
    }
    
    return json<ApiResponse>({
      success: true,
      data: {
        codice: codiceNormalized,
        disponibile,
        conflitto
      }
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/fornitori/check:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella verifica di disponibilità'
    }, { status: 500 });
  }
};