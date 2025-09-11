import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const stato = url.searchParams.get('stato') || '';
    
    let query = `
      SELECT 
        u.id,
        u.barcode,
        u.stato,
        u.volume_occupato_cm3,
        u.volume_max_cm3,
        u.percentuale_riempimento,
        tu.nome as tipo_udc,
        ub.codice_ubicazione as ubicazione_codice
      FROM udc u
      JOIN tipi_udc tu ON u.tipo_udc_id = tu.id
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (stato) {
      const stati = stato.split(',');
      query += ` AND u.stato IN (${stati.map(() => '?').join(',')})`;
      params.push(...stati);
    }
    
    // Solo UDC con spazio residuo (< 95% riempimento)
    query += ` AND u.percentuale_riempimento < 95`;
    
    query += ` ORDER BY u.stato, u.barcode`;
    
    const udc = db.prepare(query).all(...params);
    
    return json(udc);
    
  } catch (error) {
    console.error('Errore API UDC:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};