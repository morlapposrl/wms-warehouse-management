import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const operatore_id = searchParams.get('operatore_id');
    const tipo_wave = searchParams.get('tipo_wave') || 'BATCH_PICKING';

    // Performance storiche dell'operatore (se specificato)
    let performance_operatore = null;
    if (operatore_id) {
      const performanceStmt = db.prepare(`
        SELECT 
          COUNT(*) as waves_completate,
          AVG(durata_effettiva_minuti) as durata_media,
          AVG(tempo_stimato_minuti) as tempo_stimato_medio,
          AVG(CASE WHEN durata_effettiva_minuti <= tempo_stimato_minuti THEN 100.0 
                   ELSE (tempo_stimato_minuti * 100.0 / durata_effettiva_minuti) 
              END) as efficienza_media,
          MIN(data_inizio) as prima_wave,
          MAX(data_fine) as ultima_wave
        FROM wave_planning 
        WHERE operatore_principale_id = ? 
          AND stato = 'COMPLETATA'
          AND durata_effettiva_minuti IS NOT NULL
      `);
      
      const performance_data = performanceStmt.get(parseInt(operatore_id));
      
      if (performance_data && performance_data.waves_completate > 0) {
        performance_operatore = {
          waves_completate: performance_data.waves_completate,
          durata_media_minuti: Math.round(performance_data.durata_media || 0),
          tempo_stimato_medio: Math.round(performance_data.tempo_stimato_medio || 0),
          efficienza_media: Math.round(performance_data.efficienza_media || 0),
          periodo_attivita: {
            dal: performance_data.prima_wave,
            al: performance_data.ultima_wave
          }
        };
      }
    }

    // Performance per tipo di wave
    const performance_tipo_wave = db.prepare(`
      SELECT 
        tipo_wave,
        COUNT(*) as numero_wave,
        AVG(durata_effettiva_minuti) as durata_media,
        AVG(tempo_stimato_minuti) as tempo_stimato_medio,
        AVG(totale_picks) as picks_medi,
        AVG(distanza_stimata_metri) as distanza_media,
        AVG(CASE WHEN durata_effettiva_minuti <= tempo_stimato_minuti THEN 100.0 
                 ELSE (tempo_stimato_minuti * 100.0 / durata_effettiva_minuti) 
            END) as efficienza_media
      FROM wave_planning 
      WHERE stato = 'COMPLETATA'
        AND durata_effettiva_minuti IS NOT NULL
      GROUP BY tipo_wave
      ORDER BY numero_wave DESC
    `).all();

    // Statistiche generali sistema
    const stats_sistema = db.prepare(`
      SELECT 
        COUNT(*) as totale_wave_completate,
        AVG(durata_effettiva_minuti) as durata_media_sistema,
        AVG(totale_ordini) as ordini_medi_per_wave,
        AVG(totale_picks) as picks_medi_per_wave,
        SUM(totale_ordini) as totale_ordini_processati,
        COUNT(DISTINCT operatore_principale_id) as operatori_attivi
      FROM wave_planning 
      WHERE stato = 'COMPLETATA'
    `).get();

    // Trend performance ultimi 30 giorni
    const trend_performance = db.prepare(`
      SELECT 
        DATE(data_fine) as data,
        COUNT(*) as wave_completate,
        AVG(durata_effettiva_minuti) as durata_media,
        AVG(CASE WHEN durata_effettiva_minuti <= tempo_stimato_minuti THEN 100.0 
                 ELSE (tempo_stimato_minuti * 100.0 / durata_effettiva_minuti) 
            END) as efficienza_media
      FROM wave_planning 
      WHERE stato = 'COMPLETATA'
        AND data_fine >= date('now', '-30 days')
        AND durata_effettiva_minuti IS NOT NULL
      GROUP BY DATE(data_fine)
      ORDER BY data DESC
      LIMIT 30
    `).all();

    // Raccomandazioni basate sui dati
    const raccomandazioni = [];
    
    if (performance_operatore) {
      if (performance_operatore.efficienza_media > 90) {
        raccomandazioni.push('✅ Operatore altamente efficiente, ideale per wave complesse');
      } else if (performance_operatore.efficienza_media > 75) {
        raccomandazioni.push('👍 Buone performance dell\'operatore, continua così');
      } else {
        raccomandazioni.push('⚠️ Performance operatore sotto la media, considera formazione aggiuntiva');
      }
    }

    // Raccomandazione tipo wave
    const best_performing_wave = performance_tipo_wave.reduce((best, current) => {
      return (current.efficienza_media > (best?.efficienza_media || 0)) ? current : best;
    }, null);

    if (best_performing_wave && best_performing_wave.tipo_wave !== tipo_wave) {
      raccomandazioni.push(`💡 Tipo wave ${best_performing_wave.tipo_wave} ha mostrato efficienza migliore (${Math.round(best_performing_wave.efficienza_media)}%)`);
    }

    const report = {
      parametri_analisi: {
        operatore_id,
        tipo_wave_selezionato: tipo_wave,
        data_analisi: new Date().toISOString()
      },
      performance_operatore,
      performance_per_tipo: performance_tipo_wave.map(p => ({
        tipo: p.tipo_wave,
        wave_completate: p.numero_wave,
        durata_media: Math.round(p.durata_media || 0),
        tempo_stimato: Math.round(p.tempo_stimato_medio || 0),
        efficienza_percentuale: Math.round(p.efficienza_media || 0),
        picks_medi: Math.round(p.picks_medi || 0),
        distanza_media_metri: Math.round(p.distanza_media || 0)
      })),
      statistiche_sistema: {
        wave_completate_totali: stats_sistema?.totale_wave_completate || 0,
        durata_media_minuti: Math.round(stats_sistema?.durata_media_sistema || 0),
        ordini_medi_per_wave: Math.round(stats_sistema?.ordini_medi_per_wave || 0),
        picks_medi_per_wave: Math.round(stats_sistema?.picks_medi_per_wave || 0),
        ordini_processati_totali: stats_sistema?.totale_ordini_processati || 0,
        operatori_attivi: stats_sistema?.operatori_attivi || 0
      },
      trend_30_giorni: trend_performance.map(t => ({
        data: t.data,
        wave_completate: t.wave_completate,
        durata_media: Math.round(t.durata_media || 0),
        efficienza: Math.round(t.efficienza_media || 0)
      })),
      raccomandazioni,
      kpi_chiave: {
        migliore_tipo_wave: best_performing_wave?.tipo_wave || 'N/D',
        efficienza_migliore: Math.round(best_performing_wave?.efficienza_media || 0),
        trend_efficienza: calcolaTrendEfficienza(trend_performance)
      }
    };

    return json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore generazione report performance:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore interno del server'
    }, { status: 500 });
  }
};

function calcolaTrendEfficienza(trend_data: any[]): string {
  if (trend_data.length < 2) return 'Dati insufficienti';
  
  const recent = trend_data.slice(0, 7); // Ultimi 7 giorni
  const previous = trend_data.slice(7, 14); // 7 giorni precedenti
  
  if (recent.length === 0 || previous.length === 0) return 'Dati insufficienti';
  
  const recentAvg = recent.reduce((sum, d) => sum + (d.efficienza_media || 0), 0) / recent.length;
  const previousAvg = previous.reduce((sum, d) => sum + (d.efficienza_media || 0), 0) / previous.length;
  
  if (recentAvg > previousAvg + 2) return '📈 In miglioramento';
  if (recentAvg < previousAvg - 2) return '📉 In calo';
  return '➡️ Stabile';
}