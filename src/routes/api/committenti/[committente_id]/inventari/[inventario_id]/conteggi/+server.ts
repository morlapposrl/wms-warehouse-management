import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventariRepository } from '$lib/server/repositories/inventariRepository.js';
import { updateConteggioSchema } from '$lib/validations/inventario.js';
import { z } from 'zod';

// GET: Lista conteggi per inventario
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id!);
    const inventario_id = parseInt(params.inventario_id!);
    
    if (isNaN(committente_id) || isNaN(inventario_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const conteggi = inventariRepository.getConteggi(inventario_id, committente_id);
    
    return json({ 
      success: true, 
      conteggi: conteggi
    });

  } catch (error) {
    console.error('Errore nel caricamento conteggi:', error);
    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};