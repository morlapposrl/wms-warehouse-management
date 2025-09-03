import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { movimentiRepository } from '$lib/server/repositories/movimentiRepository.js';

// GET - Dati per i dropdown del form movimento
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    
    if (isNaN(committente_id)) {
      return json({ error: 'ID committente non valido' }, { status: 400 });
    }

    // Recupera prodotti e fornitori disponibili per il committente
    const prodotti = movimentiRepository.getProdottiDisponibili(committente_id);
    const fornitori = movimentiRepository.getFornitoriDisponibili(committente_id);

    return json({
      prodotti,
      fornitori
    });

  } catch (error) {
    console.error('Errore nel recupero dati dropdown:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};