import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventariRepository } from '$lib/server/repositories/inventariRepository.js';

// POST: Azioni su inventario (avvia, completa, annulla)
export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const committente_id = parseInt(params.committente_id!);
    const inventario_id = parseInt(params.inventario_id!);
    
    if (isNaN(committente_id) || isNaN(inventario_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const body = await request.json();
    const { action, applica_rettifiche } = body;

    let success = false;
    let message = '';

    switch (action) {
      case 'avvia':
        success = inventariRepository.avviaInventario(inventario_id, committente_id);
        message = success ? 'Inventario avviato con successo' : 'Impossibile avviare inventario';
        break;

      case 'completa':
        const applicaRettifiche = applica_rettifiche !== false; // Default true
        success = inventariRepository.completaInventario(inventario_id, committente_id, applicaRettifiche);
        message = success ? 'Inventario completato con successo' : 'Impossibile completare inventario';
        break;

      case 'annulla':
        success = inventariRepository.annullaInventario(inventario_id, committente_id);
        message = success ? 'Inventario annullato con successo' : 'Impossibile annullare inventario';
        break;

      default:
        return json({ 
          error: 'Azione non valida. Azioni disponibili: avvia, completa, annulla' 
        }, { status: 400 });
    }

    if (!success) {
      return json({ 
        error: message 
      }, { status: 400 });
    }

    // Recupera inventario aggiornato
    const inventario = inventariRepository.findById(inventario_id, committente_id);

    return json({
      success: true,
      message: message,
      inventario: inventario
    });

  } catch (error) {
    console.error('Errore nell\'esecuzione azione inventario:', error);
    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};