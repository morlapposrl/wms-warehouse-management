import { json } from '@sveltejs/kit';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Lista committenti con statistiche aggregate
export const GET: RequestHandler = async () => {
  try {
    const committenti = committentiRepository.findWithStats();
    
    return json<ApiResponse>({
      success: true,
      data: committenti
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/committenti/with-stats:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero dei committenti con statistiche'
    }, { status: 500 });
  }
};