import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { wavePlanningRepository } from '$lib/server/repositories/wavePlanningRepository';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    
    // Parametri dal form
    const committente_id = searchParams.get('committente_id');
    const tipo_wave = searchParams.get('tipo_wave') || 'BATCH_PICKING';
    const selected_orders = searchParams.getAll('selected_orders');
    const operatore_id = searchParams.get('operatore_id');
    const max_ordini = parseInt(searchParams.get('max_ordini') || '20');

    // Se non ci sono ordini selezionati, usa il sistema automatico
    let ordini_per_report;
    if (selected_orders.length > 0) {
      // Carica gli ordini selezionati
      const orderIds = selected_orders.map(id => parseInt(id)).filter(id => !isNaN(id));
      const placeholders = orderIds.map(() => '?').join(',');
      
      const stmt = db.prepare(`
        SELECT 
          o.*,
          c.ragione_sociale as committente_nome,
          COUNT(od.id) as righe_totali,
          SUM(od.quantita_ordinata) as quantita_totale
        FROM ordini o
        JOIN committenti c ON o.committente_id = c.id
        LEFT JOIN ordini_dettaglio_new od ON o.id = od.ordine_id
        WHERE o.id IN (${placeholders}) AND o.tipo_ordine = 'OUTBOUND'
        GROUP BY o.id, c.ragione_sociale
        ORDER BY o.data_ordine ASC
      `);
      
      ordini_per_report = stmt.all(...orderIds);
    } else {
      // Usa sistema automatico
      ordini_per_report = wavePlanningRepository.getOrdersForWaveCreation({
        committente_id: committente_id ? parseInt(committente_id) : undefined,
        stato: ['NUOVO', 'CONFERMATO']
      }).slice(0, max_ordini);
    }

    // Informazioni operatore
    let operatore_info = null;
    if (operatore_id) {
      const operatoreStmt = db.prepare('SELECT * FROM utenti WHERE id = ?');
      operatore_info = operatoreStmt.get(parseInt(operatore_id));
    }

    // Calcoli di stima per il report
    const totale_ordini = ordini_per_report.length;
    const totale_righe = ordini_per_report.reduce((sum, o) => sum + (o.righe_totali || 0), 0);
    const totale_pezzi = ordini_per_report.reduce((sum, o) => sum + (o.quantita_totale || 0), 0);
    
    // Stima tempo e distanza (semplificata per il report)
    let tempo_stimato_minuti = 0;
    let distanza_stimata_metri = 0;
    
    switch (tipo_wave) {
      case 'BATCH_PICKING':
        tempo_stimato_minuti = 45 + (totale_ordini * 15);
        distanza_stimata_metri = totale_righe * 25; // ~25m per riga
        break;
      case 'ZONE_PICKING':
        tempo_stimato_minuti = 35 + (totale_ordini * 12);
        distanza_stimata_metri = totale_righe * 20;
        break;
      case 'DISCRETE_PICKING':
        tempo_stimato_minuti = 60 + (totale_ordini * 25);
        distanza_stimata_metri = totale_righe * 30;
        break;
      default: // WAVE_PICKING
        tempo_stimato_minuti = 40 + (totale_ordini * 18);
        distanza_stimata_metri = totale_righe * 22;
    }

    const report = {
      parametri_wave: {
        tipo_wave,
        committente_id: committente_id || 'GLOBALE',
        operatore_assegnato: operatore_info?.nome || 'Non assegnato',
        ordini_selezionati: selected_orders.length > 0 ? 'Selezione manuale' : 'Automatica',
        max_ordini
      },
      statistiche_ordini: {
        totale_ordini,
        totale_righe,
        totale_pezzi,
        tempo_stimato_minuti,
        distanza_stimata_metri,
        efficienza_stimata: Math.round((totale_pezzi / tempo_stimato_minuti) * 60) + ' pz/h'
      },
      dettaglio_ordini: ordini_per_report.map(ordine => ({
        numero_ordine: ordine.numero_ordine,
        committente: ordine.committente_nome,
        cliente: ordine.cliente_fornitore || 'N/D',
        righe: ordine.righe_totali || 0,
        quantita: ordine.quantita_totale || 0,
        data_ordine: ordine.data_ordine,
        stato: ordine.stato
      })),
      algoritmo_info: {
        nome: tipo_wave,
        descrizione: getAlgoritmoDescription(tipo_wave),
        vantaggi: getAlgoritmoVantaggi(tipo_wave)
      }
    };

    return json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore generazione anteprima report:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore interno del server'
    }, { status: 500 });
  }
};

function getAlgoritmoDescription(tipo: string): string {
  switch (tipo) {
    case 'BATCH_PICKING':
      return 'Raggruppa ordini che condividono gli stessi prodotti/ubicazioni per ridurre movimenti ripetuti';
    case 'ZONE_PICKING':
      return 'Divide il magazzino in zone, ogni operatore gestisce una zona specifica';
    case 'DISCRETE_PICKING':
      return 'Processa un ordine alla volta con percorso ottimizzato, ideale per ordini urgenti';
    case 'WAVE_PICKING':
      return 'Picking coordinato di più ordini con sincronizzazione per massima efficienza operativa';
    default:
      return 'Algoritmo di picking ottimizzato per il magazzino';
  }
}

function getAlgoritmoVantaggi(tipo: string): string[] {
  switch (tipo) {
    case 'BATCH_PICKING':
      return [
        'Riduce spostamenti verso ubicazioni comuni',
        'Ottimizza il tempo per prodotti condivisi',
        'Ideale per magazzini con alta densità SKU'
      ];
    case 'ZONE_PICKING':
      return [
        'Riduce spostamenti cross-zone',
        'Aumenta specializzazione operatori',
        'Scalabile per team multipli'
      ];
    case 'DISCRETE_PICKING':
      return [
        'Controllo totale su singoli ordini',
        'Ideale per ordini urgenti/prioritari',
        'Minimizza errori di picking'
      ];
    case 'WAVE_PICKING':
      return [
        'Bilanciamento ottimale carico di lavoro',
        'Flessibilità operativa',
        'Adatto a mix di tipologie ordine'
      ];
    default:
      return ['Ottimizzazione generale del processo di picking'];
  }
}