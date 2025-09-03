import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { movimentiRepository } from '$lib/server/repositories/movimentiRepository.js';
import { createMovimentoSchema, filterMovimentiSchema } from '$lib/validations/movimento.js';
import { z } from 'zod';

// GET - Lista movimenti per committente con filtri opzionali
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    
    if (isNaN(committente_id)) {
      return json({ error: 'ID committente non valido' }, { status: 400 });
    }

    // Estrai parametri di filtro dalla query string
    const data_inizio = url.searchParams.get('data_inizio');
    const data_fine = url.searchParams.get('data_fine');
    const tipo_movimento = url.searchParams.get('tipo_movimento');
    const prodotto_id = url.searchParams.get('prodotto_id');
    const fornitore_id = url.searchParams.get('fornitore_id');

    // Se ci sono filtri, validali
    if (data_inizio || data_fine || tipo_movimento || prodotto_id || fornitore_id) {
      const filterData = {
        data_inizio: data_inizio || undefined,
        data_fine: data_fine || undefined,
        tipo_movimento: tipo_movimento || undefined,
        prodotto_id: prodotto_id ? parseInt(prodotto_id) : undefined,
        fornitore_id: fornitore_id ? parseInt(fornitore_id) : undefined
      };

      try {
        filterMovimentiSchema.parse(filterData);
        
        // Usa filtri se data_inizio e data_fine sono forniti
        if (data_inizio && data_fine) {
          const movimenti = movimentiRepository.findByCommittenteAndPeriod(
            committente_id,
            data_inizio,
            data_fine
          );
          
          // Applica filtri aggiuntivi se specificati
          let movimentiFiltrati = movimenti;
          
          if (tipo_movimento) {
            movimentiFiltrati = movimentiFiltrati.filter(m => m.tipo_movimento === tipo_movimento);
          }
          
          if (prodotto_id) {
            movimentiFiltrati = movimentiFiltrati.filter(m => m.prodotto_id === parseInt(prodotto_id));
          }
          
          if (fornitore_id) {
            movimentiFiltrati = movimentiFiltrati.filter(m => m.fornitore_id === parseInt(fornitore_id));
          }
          
          return json({
            movimenti: movimentiFiltrati,
            statistiche: movimentiRepository.getStatistiche(committente_id)
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json({
            error: 'Parametri di filtro non validi',
            details: error.errors?.map(e => e.message).join(', ')
          }, { status: 400 });
        }
      }
    }

    // Senza filtri, restituisci tutti i movimenti
    const movimenti = movimentiRepository.findByCommittente(committente_id);
    const statistiche = movimentiRepository.getStatistiche(committente_id);

    return json({
      movimenti,
      statistiche
    });

  } catch (error) {
    console.error('Errore nel recupero movimenti:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};

// POST - Crea nuovo movimento
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    
    if (isNaN(committente_id)) {
      return json({ error: 'ID committente non valido' }, { status: 400 });
    }

    const body = await request.json();
    
    // Assicurati che il committente_id_origine corrisponda al parametro URL
    body.committente_id_origine = committente_id;

    // Valida i dati
    const validatedData = createMovimentoSchema.parse(body);

    // Crea il movimento
    const movimentoId = movimentiRepository.create(validatedData);

    // Recupera il movimento creato con tutti i dettagli
    const movimento = movimentiRepository.findById(movimentoId, committente_id);

    return json({
      message: 'Movimento creato con successo',
      movimento
    }, { status: 201 });

  } catch (error) {
    console.error('Errore nella creazione movimento:', error);
    
    if (error instanceof z.ZodError) {
      return json({
        error: 'Dati non validi',
        details: error.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 });
    }

    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};