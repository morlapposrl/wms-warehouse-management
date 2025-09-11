import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import database from '$lib/server/database';

export const GET: RequestHandler = async () => {
  try {
    const causali = database.prepare(`
      SELECT 
        id,
        codice,
        descrizione,
        richiede_autorizzazione,
        attiva,
        created_at
      FROM causali_trasferimento 
      WHERE attiva = 1
      ORDER BY codice
    `).all();

    return json(causali);

  } catch (error) {
    console.error('Errore caricamento causali:', error);
    return json({ error: 'Errore nel caricamento delle causali' }, { status: 500 });
  }
};