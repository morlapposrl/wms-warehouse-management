import { json } from '@sveltejs/kit';
import database from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
  try {
    const committenti = database.prepare(`
      SELECT 
        id,
        codice as codice_committente,
        ragione_sociale,
        partita_iva,
        codice_fiscale,
        tipo_contratto,
        referente_principale,
        email,
        telefono,
        stato,
        (CASE WHEN stato = 'attivo' THEN 1 ELSE 0 END) as attivo,
        created_at
      FROM committenti 
      ORDER BY ragione_sociale ASC
    `).all();

    return json({
      success: true,
      data: committenti
    });
  } catch (error) {
    console.error('Errore recupero committenti:', error);
    return new Response('Errore interno del server', { 
      status: 500 
    });
  }
};