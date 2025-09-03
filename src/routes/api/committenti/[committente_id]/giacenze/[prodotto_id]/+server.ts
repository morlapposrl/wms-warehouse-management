import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { giacenzeRepository } from '$lib/server/repositories/giacenzeRepository.js';

// GET - Dettaglio giacenza per prodotto specifico
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const prodotto_id = parseInt(params.prodotto_id);
    
    if (isNaN(committente_id) || isNaN(prodotto_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    // Ottieni giacenza con dettagli
    const giacenza = giacenzeRepository.findByProdotto(committente_id, prodotto_id);

    if (!giacenza) {
      return json({ error: 'Giacenza non trovata' }, { status: 404 });
    }

    // Ottieni cronologia movimenti se richiesta
    const include_movimenti = url.searchParams.get('include_movimenti') === 'true';
    let movimenti = [];

    if (include_movimenti) {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      movimenti = giacenzeRepository.getUltimiMovimenti(committente_id, prodotto_id, limit);
    }

    return json({
      giacenza,
      movimenti: include_movimenti ? movimenti : undefined
    });

  } catch (error) {
    console.error('Errore nel recupero dettaglio giacenza:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};

// PUT - Aggiorna scorte minime/massime
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    const prodotto_id = parseInt(params.prodotto_id);
    
    if (isNaN(committente_id) || isNaN(prodotto_id)) {
      return json({ error: 'ID non validi' }, { status: 400 });
    }

    const body = await request.json();
    const { scorta_minima, scorta_massima } = body;

    // Validazione input
    if (typeof scorta_minima !== 'number' || typeof scorta_massima !== 'number') {
      return json({ error: 'Scorte minima e massima devono essere numeri' }, { status: 400 });
    }

    if (scorta_minima < 0 || scorta_massima < 0) {
      return json({ error: 'Le scorte non possono essere negative' }, { status: 400 });
    }

    if (scorta_minima > scorta_massima && scorta_massima > 0) {
      return json({ error: 'La scorta minima non può essere maggiore della massima' }, { status: 400 });
    }

    // Aggiorna le scorte
    const updated = giacenzeRepository.updateScorteMinMax(
      committente_id,
      prodotto_id,
      scorta_minima,
      scorta_massima
    );

    if (!updated) {
      return json({ error: 'Prodotto non trovato o non aggiornabile' }, { status: 404 });
    }

    // Restituisci giacenza aggiornata
    const giacenza = giacenzeRepository.findByProdotto(committente_id, prodotto_id);

    return json({
      message: 'Scorte minime/massime aggiornate con successo',
      giacenza
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento scorte:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};