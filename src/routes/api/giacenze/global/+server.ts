import { json } from '@sveltejs/kit';
import database from '$lib/server/database';

export async function GET() {
  try {
    const giacenze = database.prepare(`
      SELECT 
        p.committente_id,
        p.codice,
        p.descrizione,
        c.descrizione as categoria_descrizione,
        p.scorta_minima,
        COALESCE(g.quantita, 0) as giacenza_attuale,
        0 as quantita_riservata,
        COALESCE(g.quantita * p.prezzo_acquisto, 0) as valore_giacenza,
        p.ubicazione,
        com.ragione_sociale as committente_ragione_sociale
      FROM prodotti p
      LEFT JOIN categorie c ON p.categoria_id = c.id AND p.committente_id = c.committente_id  
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND p.committente_id = g.committente_id
      LEFT JOIN committenti com ON p.committente_id = com.id
      WHERE p.attivo = 1
      ORDER BY p.committente_id, p.codice
    `).all();
    
    // Calcola statistiche globali
    const stats = {
      totale_prodotti: giacenze.length,
      prodotti_con_giacenza: giacenze.filter(g => g.giacenza_attuale > 0).length,
      prodotti_senza_giacenza: giacenze.filter(g => g.giacenza_attuale === 0).length,
      prodotti_scorta_bassa: giacenze.filter(g => g.scorta_minima > 0 && g.giacenza_attuale <= g.scorta_minima).length,
      giacenza_totale: giacenze.reduce((sum, g) => sum + g.giacenza_attuale, 0),
      valore_totale: giacenze.reduce((sum, g) => sum + g.valore_giacenza, 0),
      committenti_unici: [...new Set(giacenze.map(g => g.committente_id))].length
    };

    return json({
      giacenze,
      statistiche: stats
    });
  } catch (error) {
    console.error('Errore API giacenze globali:', error);
    return json({ error: 'Errore interno del server' }, { status: 500 });
  }
}