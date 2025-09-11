import type * as Kit from '@sveltejs/kit';

type RouteParams = {};

export type PageServerData = {
  kpiSummary: {
    ordini_oggi: number;
    movimenti_oggi: number;
    operatori_attivi: number;
    spedizioni_oggi: number;
  };
  operatoriPerformance: Array<{
    nome: string;
    movimenti_completati: number;
    zona: string;
    status: 'ATTIVO' | 'RECENTE' | 'INATTIVO';
  }>;
  zoneStatus: Array<{
    zona: string;
    percentuale_occupazione: number;
    prodotti_diversi: number;
  }>;
  alertsOperatori: Array<{
    tipo_alert: string;
    priorita: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BASSO';
    messaggio: string;
    timestamp_alert: string;
  }>;
  giacenzeCritiche: Array<{
    prodotto_codice: string;
    prodotto_descrizione: string;
    quantita: number;
    scorta_minima: number;
    livello_criticita: 'ESAURITO' | 'CRITICO' | 'BASSO';
  }>;
  movimentiRecenti: Array<{
    tipo_movimento: string;
    prodotto_codice: string;
    quantita: number;
    data_movimento: string;
    operatore: string;
  }>;
};

export type PageData = PageServerData;