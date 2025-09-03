import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { giacenzeRepository } from '$lib/server/repositories/giacenzeRepository.js';

// GET - Lista giacenze per committente con filtri opzionali
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const committente_id = parseInt(params.committente_id);
    
    if (isNaN(committente_id)) {
      return json({ error: 'ID committente non valido' }, { status: 400 });
    }

    // Estrai parametri di filtro dalla query string
    const categoria_id = url.searchParams.get('categoria_id');
    const stato_scorta = url.searchParams.get('stato_scorta');
    const search = url.searchParams.get('search');
    const solo_attivi = url.searchParams.get('solo_attivi') !== 'false';

    // Prepara filtri
    const filters = {
      categoria_id: categoria_id ? parseInt(categoria_id) : undefined,
      stato_scorta: stato_scorta || undefined,
      search: search || undefined,
      solo_attivi
    };

    // Se ci sono filtri, usa la ricerca filtrata
    const hasFilters = filters.categoria_id || filters.stato_scorta || filters.search;
    
    const giacenze = hasFilters 
      ? giacenzeRepository.findByCommittenteFiltered(committente_id, filters)
      : giacenzeRepository.findByCommittenteWithDetails(committente_id);

    // Ottieni statistiche
    const statistiche = giacenzeRepository.getStatistiche(committente_id);

    // Ottieni valore per categoria
    const valorePerCategoria = giacenzeRepository.getValorePerCategoria(committente_id);

    // Ottieni categorie disponibili per filtri
    const categorie = giacenzeRepository.getCategorieDisponibili(committente_id);

    return json({
      giacenze,
      statistiche,
      valorePerCategoria,
      categorie
    });

  } catch (error) {
    console.error('Errore nel recupero giacenze:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
};