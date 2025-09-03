import database from '$lib/server/database.js';
import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const committente_id = parseInt(params.committente_id);

  if (isNaN(committente_id)) {
    throw error(400, 'ID committente non valido');
  }

  try {
    // Verifica esistenza committente
    const committente = database.prepare(`
      SELECT * FROM committenti WHERE id = ? AND stato = 'attivo'
    `).get(committente_id);

    if (!committente) {
      throw error(404, 'Committente non trovato');
    }

    // Statistiche prodotti
    const prodottiStats = database.prepare(`
      SELECT 
        COUNT(*) as totali,
        COUNT(CASE WHEN attivo = 1 THEN 1 END) as attivi,
        COUNT(CASE WHEN attivo = 0 THEN 1 END) as inattivi
      FROM prodotti 
      WHERE committente_id = ?
    `).get(committente_id);

    // Statistiche categorie
    const categorieStats = database.prepare(`
      SELECT 
        COUNT(*) as totali,
        COUNT(CASE WHEN attiva = 1 THEN 1 END) as attive,
        COUNT(CASE WHEN attiva = 0 THEN 1 END) as inattive
      FROM categorie 
      WHERE committente_id = ?
    `).get(committente_id);

    // Statistiche fornitori
    const fornitoriStats = database.prepare(`
      SELECT COUNT(*) as totali
      FROM fornitori f
      INNER JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      WHERE cf.committente_id = ?
    `).get(committente_id);

    // Giacenze totali (modello multicommittente - giacenze logiche)
    const giacenzeStats = database.prepare(`
      SELECT 
        COALESCE(SUM(gl.quantita_disponibile), 0) as totale_pezzi,
        COALESCE(SUM(gl.quantita_riservata), 0) as totale_riservato,
        COALESCE(SUM(gl.quantita_in_transito), 0) as totale_in_transito,
        COUNT(DISTINCT gl.sku_code) as prodotti_con_giacenza,
        COALESCE(SUM(gl.valore_totale), 0) as valore_totale,
        COALESCE(SUM(CASE WHEN gl.quantita_disponibile <= COALESCE(pc.scorta_minima, 0) AND pc.scorta_minima > 0 THEN 1 ELSE 0 END), 0) as sotto_scorta
      FROM giacenze_logiche gl
      LEFT JOIN prodotti_committente_v2 pc ON gl.committente_id = pc.committente_id AND gl.sku_code = pc.sku_code
      WHERE gl.committente_id = ? AND gl.quantita_disponibile > 0
    `).get(committente_id);

    // Movimenti recenti (ultimi 7 giorni) - usando movimenti_ottimizzati
    const movimentiRecenti = database.prepare(`
      SELECT 
        COUNT(*) as totali,
        COUNT(CASE WHEN tipo_movimento IN ('RECEIVE', 'PUT_AWAY', 'ADJUST_PLUS') THEN 1 END) as carichi,
        COUNT(CASE WHEN tipo_movimento IN ('PICK', 'DISPOSE', 'ADJUST_MINUS') THEN 1 END) as scarichi,
        COUNT(CASE WHEN tipo_movimento IN ('TRANSFER', 'REPLENISH') THEN 1 END) as trasferimenti
      FROM movimenti_ottimizzati mo
      WHERE mo.committente_id = ? 
      AND date(mo.timestamp_inizio) >= date('now', '-7 days')
    `).get(committente_id);

    // Top 5 prodotti per giacenza (modello multicommittente)
    const topProdotti = database.prepare(`
      SELECT 
        sm.sku_code,
        sm.descrizione,
        pc.codice_interno,
        gl.quantita_disponibile as quantita,
        gl.quantita_riservata,
        gl.valore_totale,
        um.descrizione as unita_misura
      FROM giacenze_logiche gl
      INNER JOIN sku_master sm ON gl.sku_code = sm.sku_code
      LEFT JOIN prodotti_committente_v2 pc ON gl.committente_id = pc.committente_id AND gl.sku_code = pc.sku_code
      LEFT JOIN unita_misura um ON pc.categoria_id = um.id
      WHERE gl.committente_id = ? AND gl.quantita_disponibile > 0
      ORDER BY gl.quantita_disponibile DESC
      LIMIT 5
    `).all(committente_id);

    // Movimenti recenti (ultimi 10) - modello ottimizzato
    const ultimiMovimenti = database.prepare(`
      SELECT 
        mo.id,
        mo.tipo_movimento,
        mo.quantita,
        mo.timestamp_inizio as data_movimento,
        mo.note,
        mo.sku_code,
        sm.descrizione as prodotto_descrizione,
        pc.codice_interno as prodotto_codice,
        uf.codice_ubicazione as from_ubicazione,
        ut.codice_ubicazione as to_ubicazione,
        u.nome as operatore_nome,
        mo.durata_secondi
      FROM movimenti_ottimizzati mo
      INNER JOIN sku_master sm ON mo.sku_code = sm.sku_code
      LEFT JOIN prodotti_committente_v2 pc ON mo.committente_id = pc.committente_id AND mo.sku_code = pc.sku_code
      LEFT JOIN ubicazioni uf ON mo.from_ubicazione_id = uf.id
      LEFT JOIN ubicazioni ut ON mo.to_ubicazione_id = ut.id
      LEFT JOIN utenti u ON mo.operatore_id = u.id
      WHERE mo.committente_id = ?
      ORDER BY mo.timestamp_inizio DESC, mo.id DESC
      LIMIT 10
    `).all(committente_id);

    return {
      committente,
      stats: {
        prodotti: prodottiStats,
        categorie: categorieStats,
        fornitori: fornitoriStats,
        giacenze: giacenzeStats,
        movimenti: movimentiRecenti
      },
      topProdotti,
      ultimiMovimenti
    };

  } catch (err) {
    console.error('Errore caricamento dashboard:', err);
    throw error(500, 'Errore interno del server');
  }
};