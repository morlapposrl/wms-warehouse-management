import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventariRepository } from '$lib/server/repositories/inventariRepository.js';

// GET: Dettaglio inventario per committente
export const GET: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id!);
    const inventario_id = parseInt(params.inventario_id!);
    
    if (isNaN(committente_id) || isNaN(inventario_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const inventario = inventariRepository.findById(inventario_id, committente_id);
    
    if (!inventario) {
      return json({ 
        error: 'Inventario non trovato' 
      }, { status: 404 });
    }

    return json({ 
      success: true, 
      inventario: inventario
    });

  } catch (error) {
    console.error('Errore nel caricamento inventario:', error);
    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};

// DELETE: Elimina inventario (solo se pianificato)
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const committente_id = parseInt(params.committente_id!);
    const inventario_id = parseInt(params.inventario_id!);
    
    if (isNaN(committente_id) || isNaN(inventario_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const success = inventariRepository.delete(inventario_id, committente_id);
    
    if (!success) {
      return json({ 
        error: 'Impossibile eliminare inventario (non trovato o non in stato PIANIFICATO)' 
      }, { status: 400 });
    }

    return json({
      success: true,
      message: 'Inventario eliminato con successo'
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione inventario:', error);
    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};