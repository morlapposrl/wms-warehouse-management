import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const GET: RequestHandler = ({ params }) => {
  try {
    const fornitoreId = parseInt(params.fornitore_id);
    if (isNaN(fornitoreId)) {
      throw error(400, 'ID Fornitore non valido');
    }

    // Find products that have this supplier as their preferred supplier
    const prodotti = db.prepare(`
      SELECT
        sm.sku_code,
        sm.descrizione
      FROM sku_master sm
      JOIN prodotti_committente_v2 pcv ON sm.sku_code = pcv.sku_code
      WHERE pcv.fornitore_preferito_id = ?
      ORDER BY sm.sku_code
    `).all(fornitoreId);

    return json(prodotti);
  } catch (err: any) {
    console.error('Errore API prodotti per fornitore:', err);
    // Don't throw the original error to avoid exposing DB details
    throw error(500, 'Errore nel recupero dei prodotti per il fornitore');
  }
};
