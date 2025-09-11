import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const disponibili = url.searchParams.get('disponibili');
    
    let query = `
      SELECT 
        u.id,
        u.codice_ubicazione,
        u.zona,
        u.tipo,
        u.attiva,
        u.volume_max_cm3,
        COALESCE(gf.volume_occupato_totale, 0) as volume_occupato_cm3,
        ROUND(
          CASE 
            WHEN u.volume_max_cm3 > 0 THEN (COALESCE(gf.volume_occupato_totale, 0) * 100.0 / u.volume_max_cm3)
            ELSE 0
          END, 1
        ) as percentuale_occupazione
      FROM ubicazioni u
      LEFT JOIN (
        SELECT 
          ubicazione_id,
          SUM(volume_occupato_cm3) as volume_occupato_totale,
          SUM(quantita_totale) as quantita_totale
        FROM giacenze_fisiche 
        WHERE quantita_totale > 0
        GROUP BY ubicazione_id
      ) gf ON u.id = gf.ubicazione_id
      WHERE u.attiva = 1
    `;
    
    if (disponibili === 'true') {
      // Solo ubicazioni con spazio disponibile (< 95% occupazione)
      query += ` AND (
        CASE 
          WHEN u.volume_max_cm3 > 0 THEN (COALESCE(gf.volume_occupato_totale, 0) * 100.0 / u.volume_max_cm3)
          ELSE 0
        END
      ) < 95`;
    }
    
    query += ` ORDER BY u.zona, u.codice_ubicazione`;
    
    const ubicazioni = db.prepare(query).all();
    
    return json(ubicazioni);
    
  } catch (error) {
    console.error('Errore API ubicazioni:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};