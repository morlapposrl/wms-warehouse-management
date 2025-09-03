import { json } from '@sveltejs/kit';
import { unitaMisuraRepository } from '$lib/server/repositories/unitaMisuraRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateCheckCodeUnitaMisura } from '$lib/validations/unitaMisura';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Verifica disponibilità codice unità di misura per committente
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

    const disponibile = unitaMisuraRepository.isCodeAvailable(
      codiceNormalized,
      excludeIdNum,
      committente_id
    );

    // Se non disponibile, trova unità con stesso codice per riferimento
    let conflitto = null;
    if (!disponibile) {
      const existing = unitaMisuraRepository.findByCodice(codiceNormalized, committente_id);
      if (existing) {
        conflitto = {
          id: existing.id,
          descrizione: existing.descrizione,
          tipo: existing.tipo,
          is_global: existing.committente_id === null
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
    console.error('Errore GET /api/committenti/[committente_id]/unita-misura/check:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella verifica di disponibilità'
    }, { status: 500 });
  }
};