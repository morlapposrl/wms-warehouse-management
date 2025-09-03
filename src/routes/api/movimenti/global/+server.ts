import { json } from '@sveltejs/kit';
import database from '$lib/server/database';

export async function GET({ url }) {
  try {
    const searchParams = url.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (from) {
      whereClause += ' AND DATE(m.data_movimento) >= ?';
      params.push(from);
    }
    
    if (to) {
      whereClause += ' AND DATE(m.data_movimento) <= ?';
      params.push(to);
    }
    
    const query = `
      SELECT 
        m.id,
        m.committente_id_origine as committente_id,
        m.tipo_movimento,
        p.codice as prodotto_codice,
        p.descrizione as prodotto_descrizione,
        m.quantita,
        m.prezzo,
        m.operatore,
        m.data_movimento,
        m.note,
        m.numero_documento,
        m.causale,
        c.ragione_sociale as committente_ragione_sociale,
        cat.descrizione as categoria_descrizione,
        um.codice as unita_misura_codice
      FROM movimenti m
      LEFT JOIN prodotti p ON m.prodotto_id = p.id AND m.committente_id_origine = p.committente_id
      LEFT JOIN committenti c ON m.committente_id_origine = c.id
      LEFT JOIN categorie cat ON p.categoria_id = cat.id AND p.committente_id = cat.committente_id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      ${whereClause}
      ORDER BY m.data_movimento DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    const movimenti = database.prepare(query).all(...params);
    
    // Calcola statistiche globali
    const stats = {
      totale_movimenti: movimenti.length,
      movimenti_carico: movimenti.filter(m => m.tipo_movimento === 'CARICO').length,
      movimenti_scarico: movimenti.filter(m => m.tipo_movimento === 'SCARICO').length,
      rettifiche_totali: movimenti.filter(m => m.tipo_movimento.includes('RETTIFICA')).length,
      valore_totale_movimenti: movimenti.reduce((sum, m) => sum + (m.prezzo * m.quantita), 0),
      committenti_unici: [...new Set(movimenti.map(m => m.committente_id))].length,
      ultimo_movimento: movimenti.length > 0 ? movimenti[0].data_movimento : null
    };

    return json({
      movimenti,
      statistiche: stats
    });
  } catch (error) {
    console.error('Errore API movimenti globali:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
}