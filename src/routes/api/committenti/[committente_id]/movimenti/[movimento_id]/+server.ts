import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { movimentiRepository } from '$lib/server/repositories/movimentiRepository.js';
import { updateMovimentoSchema } from '$lib/validations/movimento.js';
import { z } from 'zod';

// GET - Dettaglio movimento singolo
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const movimento_id = parseInt(params.movimento_id);
    
    if (isNaN(committente_id) || isNaN(movimento_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const movimento = movimentiRepository.findById(movimento_id, committente_id);

    if (!movimento) {
      return json({ error: 'Movimento non trovato' }, { status: 404 });
    }

    return json({ movimento });

  } catch (error) {
    console.error('Errore nel recupero movimento:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};

// PUT - Aggiorna movimento (solo campi modificabili)
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const movimento_id = parseInt(params.movimento_id);
    
    if (isNaN(committente_id) || isNaN(movimento_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const body = await request.json();

    // Valida i dati
    const validatedData = updateMovimentoSchema.parse(body);

    // Aggiorna il movimento
    const updated = movimentiRepository.update(movimento_id, committente_id, validatedData);

    if (!updated) {
      return json({ error: 'Movimento non trovato o non aggiornabile' }, { status: 404 });
    }

    // Recupera il movimento aggiornato
    const movimento = movimentiRepository.findById(movimento_id, committente_id);

    return json({
      message: 'Movimento aggiornato con successo',
      movimento
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento movimento:', error);
    
    if (error instanceof z.ZodError) {
      return json({
        error: 'Dati non validi',
        details: error.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 });
    }

    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};

// DELETE - Elimina movimento (attenzione alle giacenze)
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const movimento_id = parseInt(params.movimento_id);
    
    if (isNaN(committente_id) || isNaN(movimento_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    // Verifica che il movimento esista e appartenga al committente
    const movimento = movimentiRepository.findById(movimento_id, committente_id);
    if (!movimento) {
      return json({ error: 'Movimento non trovato' }, { status: 404 });
    }

    // ATTENZIONE: L'eliminazione di un movimento può influire sulle giacenze
    // In un sistema reale, si dovrebbe creare un movimento di rettifica opposto
    // Per ora procediamo con l'eliminazione diretta
    const deleted = movimentiRepository.delete(movimento_id, committente_id);

    if (!deleted) {
      return json({ error: 'Errore nell\'eliminazione del movimento' }, { status: 500 });
    }

    return json({
      message: 'Movimento eliminato con successo. ATTENZIONE: Le giacenze potrebbero essere state influenzate.'
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione movimento:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};