import { json } from '@sveltejs/kit';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Verifica disponibilità codice/email
export const GET: RequestHandler = async ({ url }) => {
  try {
    const codice = url.searchParams.get('codice');
    const email = url.searchParams.get('email');
    const excludeId = url.searchParams.get('exclude_id');
    
    const result: { codice_disponibile?: boolean; email_disponibile?: boolean } = {};
    
    if (codice) {
      result.codice_disponibile = committentiRepository.isCodeAvailable(
        codice, 
        excludeId ? parseInt(excludeId) : undefined
      );
    }
    
    if (email) {
      result.email_disponibile = committentiRepository.isEmailAvailable(
        email, 
        excludeId ? parseInt(excludeId) : undefined
      );
    }
    
    if (!codice && !email) {
      return json<ApiResponse>({
        success: false,
        error: 'Specificare codice o email da verificare'
      }, { status: 400 });
    }
    
    return json<ApiResponse>({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/committenti/check:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella verifica di disponibilità'
    }, { status: 500 });
  }
};