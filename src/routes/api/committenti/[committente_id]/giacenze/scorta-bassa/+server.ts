import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { giacenzeRepository } from '$lib/server/repositories/giacenzeRepository.js';

// GET - Prodotti con scorta bassa/critica
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    
    if (isNaN(committente_id)) {
      return json({ error: 'ID committente non valido' }, { status: 400 });
    }

    const prodottiScortaBassa = giacenzeRepository.getProdottiScortaBassa(committente_id);

    return json({
      prodotti: prodottiScortaBassa,
      totale: prodottiScortaBassa.length
    });

  } catch (error) {
    console.error('Errore nel recupero prodotti scorta bassa:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};