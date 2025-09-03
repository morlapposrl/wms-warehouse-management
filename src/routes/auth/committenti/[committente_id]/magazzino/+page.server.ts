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

    // Dati magazzino principale
    const magazzino = database.prepare(`
      SELECT * FROM magazzini WHERE id = 1 AND attivo = 1
    `).get();

    if (!magazzino) {
      throw error(404, 'Magazzino non trovato');
    }

    // Zone logiche del magazzino
    const zone = database.prepare(`
      SELECT * FROM zone_magazzino WHERE magazzino_id = ? AND attiva = 1
      ORDER BY priorita DESC, nome
    `).all(magazzino.id);

    // Corridoi
    const corridoi = database.prepare(`
      SELECT * FROM corridoi WHERE magazzino_id = ? AND attivo = 1
      ORDER BY codice
    `).all(magazzino.id);

    // Ubicazioni con giacenze del committente
    const ubicazioni = database.prepare(`
      SELECT 
        u.*,
        COALESCE(gl.quantita_disponibile, 0) as giacenza_committente,
        COALESCE(gl.quantita_riservata, 0) as giacenza_riservata,
        COUNT(DISTINCT go.sku_code) as sku_diversi,
        MAX(go.data_carico) as ultimo_carico
      FROM ubicazioni u
      LEFT JOIN giacenze_ownership go ON u.id = go.ubicazione_id AND go.committente_id = ?
      LEFT JOIN giacenze_logiche gl ON go.sku_code = gl.sku_code AND gl.committente_id = ?
      WHERE u.magazzino_id = ? AND u.attiva = 1
      GROUP BY u.id
      ORDER BY u.zona, u.codice_ubicazione
    `).all(committente_id, committente_id, magazzino.id);

    // Top 10 ubicazioni per occupazione del committente
    const topUbicazioni = database.prepare(`
      SELECT 
        u.codice_ubicazione,
        u.zona,
        u.tipo,
        u.coordinata_x,
        u.coordinata_y,
        u.percentuale_occupazione,
        SUM(go.quantita) as quantita_committente,
        COUNT(DISTINCT go.sku_code) as sku_diversi,
        GROUP_CONCAT(DISTINCT sm.descrizione, ' | ') as prodotti_presenti
      FROM ubicazioni u
      INNER JOIN giacenze_ownership go ON u.id = go.ubicazione_id
      INNER JOIN sku_master sm ON go.sku_code = sm.sku_code
      WHERE go.committente_id = ? AND u.magazzino_id = ?
      GROUP BY u.id
      ORDER BY quantita_committente DESC
      LIMIT 10
    `).all(committente_id, magazzino.id);

    // Statistiche occupazione per zone
    const statisticheZone = database.prepare(`
      SELECT 
        u.zona,
        COUNT(DISTINCT u.id) as totale_ubicazioni,
        COUNT(DISTINCT CASE WHEN go.quantita > 0 THEN u.id END) as ubicazioni_occupate,
        SUM(COALESCE(go.quantita, 0)) as quantita_totale,
        AVG(u.percentuale_occupazione) as occupazione_media,
        MAX(u.percentuale_occupazione) as occupazione_massima
      FROM ubicazioni u
      LEFT JOIN giacenze_ownership go ON u.id = go.ubicazione_id AND go.committente_id = ?
      WHERE u.magazzino_id = ? AND u.attiva = 1
      GROUP BY u.zona
      ORDER BY quantita_totale DESC
    `).all(committente_id, magazzino.id);

    // Movimenti recenti del committente con ubicazioni
    const movimentiRecenti = database.prepare(`
      SELECT 
        mo.*,
        sm.descrizione as prodotto_descrizione,
        uf.codice_ubicazione as from_ubicazione,
        ut.codice_ubicazione as to_ubicazione,
        u.nome as operatore_nome
      FROM movimenti_ottimizzati mo
      INNER JOIN sku_master sm ON mo.sku_code = sm.sku_code
      LEFT JOIN ubicazioni uf ON mo.from_ubicazione_id = uf.id
      LEFT JOIN ubicazioni ut ON mo.to_ubicazione_id = ut.id
      LEFT JOIN utenti u ON mo.operatore_id = u.id
      WHERE mo.committente_id = ?
      ORDER BY mo.timestamp_inizio DESC
      LIMIT 20
    `).all(committente_id);

    return {
      committente,
      magazzino,
      zone: zone.map(z => ({
        ...z,
        poligono: JSON.parse(z.poligono_json)
      })),
      corridoi: corridoi.map(c => ({
        ...c,
        percorso: c.percorso_json ? JSON.parse(c.percorso_json) : []
      })),
      ubicazioni,
      topUbicazioni,
      statisticheZone,
      movimentiRecenti
    };

  } catch (err) {
    console.error('Errore caricamento magazzino:', err);
    throw error(500, 'Errore interno del server');
  }
};