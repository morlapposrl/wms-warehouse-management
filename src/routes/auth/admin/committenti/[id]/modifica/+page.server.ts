import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      throw error(400, 'ID committente non valido');
    }
    
    const committente = committentiRepository.findById(id);
    
    if (!committente) {
      throw error(404, 'Committente non trovato');
    }
    
    return {
      committente
    };
    
  } catch (err) {
    console.error('Errore caricamento committente:', err);
    throw error(500, 'Errore nel caricamento del committente');
  }
};