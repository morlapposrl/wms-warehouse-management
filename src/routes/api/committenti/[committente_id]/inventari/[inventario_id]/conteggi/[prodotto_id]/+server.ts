import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventariRepository } from '$lib/server/repositories/inventariRepository.js';
import { updateConteggioSchema } from '$lib/validations/inventario.js';
import { z } from 'zod';

// PUT: Aggiorna conteggio prodotto
export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const committente_id = parseInt(params.committente_id!);
    const inventario_id = parseInt(params.inventario_id!);
    const prodotto_id = parseInt(params.prodotto_id!);
    
    if (isNaN(committente_id) || isNaN(inventario_id) || isNaN(prodotto_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validazione dati
    const validatedData = updateConteggioSchema.parse(body);

    // Aggiornamento conteggio
    const success = inventariRepository.updateConteggio(
      inventario_id,
      prodotto_id,
      committente_id,
      validatedData
    );

    if (!success) {
      return json({ 
        error: 'Impossibile aggiornare conteggio (inventario non trovato o non in corso)' 
      }, { status: 400 });
    }

    // Recupera conteggi aggiornati
    const conteggi = inventariRepository.getConteggi(inventario_id, committente_id);
    
    return json({
      success: true,
      message: 'Conteggio aggiornato con successo',
      conteggi: conteggi
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento conteggio:', error);
    
    if (error instanceof z.ZodError) {
      return json({ 
        error: 'Dati non validi', 
        details: error.errors 
      }, { status: 400 });
    }

    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};