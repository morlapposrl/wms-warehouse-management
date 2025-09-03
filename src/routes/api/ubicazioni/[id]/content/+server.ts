import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ubicazioniRepository } from '$lib/server/repositories/ubicazioniRepository.js';
import db from '$lib/server/database.js';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const ubicazioneId = parseInt(params.id);
    
    if (isNaN(ubicazioneId)) {
      return json({ error: 'Invalid ubicazione ID' }, { status: 400 });
    }

    // Get the content using the chaotic storage system
    const content = db.prepare(`
      SELECT 
        go.sku_code,
        sm.descrizione,
        go.committente_id,
        c.ragione_sociale as committente_nome,
        go.quantita,
        go.lotto,
        go.data_carico as data_posizionamento,
        go.data_scadenza,
        go.costo_acquisto,
        go.stato,
        (go.quantita * COALESCE(sm.volume_cm3, 1000)) as volume,
        (go.quantita * COALESCE(sm.peso_kg, 1)) as peso
      FROM giacenze_ownership go
      LEFT JOIN sku_master sm ON go.sku_code = sm.sku_code
      LEFT JOIN committenti c ON go.committente_id = c.id
      WHERE go.ubicazione_id = ?
        AND go.stato IN ('DISPONIBILE', 'RISERVATO')
      ORDER BY go.data_carico ASC, go.sku_code
    `).all(ubicazioneId);

    // Get ubicazione info
    const ubicazione = ubicazioniRepository.findById(ubicazioneId);

    if (!ubicazione) {
      return json({ error: 'Ubicazione not found' }, { status: 404 });
    }

    // Calculate summary stats
    const totalItems = content.reduce((sum, item) => sum + item.quantita, 0);
    const totalVolume = content.reduce((sum, item) => sum + (item.volume || 0), 0);
    const totalWeight = content.reduce((sum, item) => sum + (item.peso || 0), 0);
    const uniqueSkus = new Set(content.map(item => item.sku_code)).size;
    const uniqueCommittenti = new Set(content.map(item => item.committente_id)).size;

    return json({
      content,
      ubicazione,
      summary: {
        total_items: totalItems,
        total_volume_cm3: Math.round(totalVolume),
        total_weight_kg: Math.round(totalWeight * 100) / 100,
        unique_skus: uniqueSkus,
        unique_committenti: uniqueCommittenti,
        occupation_percentage: ubicazione.percentuale_occupazione
      }
    });

  } catch (error) {
    console.error('Error loading ubicazione content:', error);
    return json({ error: 'Failed to load content' }, { status: 500 });
  }
};