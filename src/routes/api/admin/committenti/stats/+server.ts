import { json } from '@sveltejs/kit';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// GET - Statistiche committenti
export const GET: RequestHandler = async () => {
  try {
    const stats = committentiRepository.getStats();
    
    return json<ApiResponse>({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Errore GET /api/admin/committenti/stats:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nel recupero delle statistiche'
    }, { status: 500 });
  }
};