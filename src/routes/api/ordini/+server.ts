import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente = url.searchParams.get('committente');
    const tipo = url.searchParams.get('tipo') || '';
    const stato = url.searchParams.get('stato') || '';
    
    if (!committente) {
      return json({ error: 'Committente richiesto' }, { status: 400 });
    }
    
    // Prima query per ottenere gli ordini base
    let query = `
      SELECT 
        o.id,
        o.numero_ordine,
        o.tipo_ordine,
        o.stato,
        o.data_ordine,
        o.data_richiesta,
        o.cliente_fornitore,
        o.totale_colli,
        o.totale_valore
      FROM ordini o
      WHERE o.committente_id = ?
    `;
    
    const params = [parseInt(committente)];
    
    if (tipo) {
      const tipi = tipo.split(',');
      query += ` AND o.tipo_ordine IN (${tipi.map(() => '?').join(',')})`;
      params.push(...tipi);
    }
    
    if (stato) {
      const stati = stato.split(',');
      query += ` AND o.stato IN (${stati.map(() => '?').join(',')})`;
      params.push(...stati);
    }
    
    query += ` ORDER BY o.data_ordine DESC, o.numero_ordine`;
    
    const ordini = db.prepare(query).all(...params);
    
    // Per ogni ordine, carica i prodotti separatamente
    const ordiniWithProdotti = ordini.map(ordine => {
      const prodotti = db.prepare(`
        SELECT 
          p.id,
          p.codice,
          p.descrizione,
          od.quantita_ordinata,
          od.quantita_evasa,
          od.prezzo_unitario
        FROM ordini_dettaglio_new od
        JOIN prodotti p ON od.prodotto_id = p.id
        WHERE od.ordine_id = ?
      `).all(ordine.id);
      
      return {
        ...ordine,
        prodotti
      };
    });
    
    return json(ordiniWithProdotti);
    
  } catch (error) {
    console.error('Errore API ordini:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};