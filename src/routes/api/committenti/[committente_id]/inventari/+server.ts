import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventariRepository } from '$lib/server/repositories/inventariRepository.js';
import { createInventarioSchema, filterInventariSchema } from '$lib/validations/inventario.js';
import { z } from 'zod';

// GET: Lista inventari per committente
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const committente_id = parseInt(params.committente_id!);
    
    if (isNaN(committente_id)) {
      return json({ error: 'ID committente non valido' }, { status: 400 });
    }

    // Parsing filtri opzionali
    const filtri = {
      stato: url.searchParams.get('stato') || undefined,
      tipo: url.searchParams.get('tipo') || undefined,
      data_inizio: url.searchParams.get('data_inizio') || undefined,
      data_fine: url.searchParams.get('data_fine') || undefined,
      operatore_responsabile: url.searchParams.get('operatore_responsabile') || undefined
    };

    // Rimuovi parametri undefined
    const filtriPuliti = Object.fromEntries(
      Object.entries(filtri).filter(([_, value]) => value !== undefined)
    );

    // Validazione filtri se presenti
    if (Object.keys(filtriPuliti).length > 0) {
      try {
        filterInventariSchema.parse(filtriPuliti);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json({ 
            error: 'Filtri non validi', 
            details: error.errors 
          }, { status: 400 });
        }
      }
    }

    const inventari = inventariRepository.findByCommittente(committente_id);
    
    return json({ 
      success: true, 
      inventari: inventari,
      filtri: filtriPuliti
    });

  } catch (error) {
    console.error('Errore nel caricamento inventari:', error);
    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};

// POST: Crea nuovo inventario
export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const committente_id = parseInt(params.committente_id!);
    
    if (isNaN(committente_id)) {
      return json({ error: 'ID committente non valido' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validazione dati
    const validatedData = createInventarioSchema.parse({
      ...body,
      committente_id: committente_id
    });

    // Creazione inventario
    const inventarioId = inventariRepository.create({
      committente_id: validatedData.committente_id,
      codice_inventario: validatedData.codice_inventario,
      descrizione: validatedData.descrizione,
      tipo: validatedData.tipo,
      data_pianificazione: validatedData.data_pianificazione,
      operatore_responsabile: validatedData.operatore_responsabile,
      categoria_id: validatedData.categoria_id,
      ubicazione_filtro: validatedData.ubicazione_filtro,
      note: validatedData.note
    });

    // Recupera inventario creato
    const inventario = inventariRepository.findById(inventarioId, committente_id);

    return json({
      success: true,
      message: 'Inventario creato con successo',
      inventario: inventario
    }, { status: 201 });

  } catch (error) {
    console.error('Errore nella creazione inventario:', error);
    
    if (error instanceof z.ZodError) {
      return json({ 
        error: 'Dati non validi', 
        details: error.errors 
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return json({ 
        error: 'Codice inventario già esistente per questo committente' 
      }, { status: 409 });
    }

    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};