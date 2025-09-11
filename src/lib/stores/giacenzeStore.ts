import { writable, readable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface GiacenzaRealTime {
  id: number;
  committente_id: number;
  prodotto_id: number;
  prodotto_codice: string;
  prodotto_descrizione: string;
  quantita: number;
  quantita_precedente?: number;
  valore_medio: number;
  stato_scorta: 'OK' | 'BASSA' | 'CRITICA' | 'ECCESSIVA';
  stato_scorta_precedente?: string;
  ultima_modifica: string;
  ultima_sincronizzazione?: string;
  changed?: boolean; // Flag per evidenziare cambiamenti
}

export interface AlertGiacenza {
  id: string;
  tipo: 'SCORTA_BASSA' | 'SCORTA_CRITICA' | 'MOVIMENTO_ANOMALO' | 'ECCESSO_STOCK';
  prodotto_codice: string;
  prodotto_descrizione: string;
  committente_nome: string;
  messaggio: string;
  quantita_attuale: number;
  quantita_soglia?: number;
  timestamp: string;
  acknowledged?: boolean;
}

interface StoreState {
  giacenze: GiacenzaRealTime[];
  alerts: AlertGiacenza[];
  lastUpdate: string | null;
  isConnected: boolean;
  autoRefreshEnabled: boolean;
  refreshInterval: number; // secondi
  errorMessage: string | null;
}

// Store principale
const createGiacenzeStore = () => {
  const initialState: StoreState = {
    giacenze: [],
    alerts: [],
    lastUpdate: null,
    isConnected: false,
    autoRefreshEnabled: true,
    refreshInterval: 30,
    errorMessage: null
  };

  const { subscribe, set, update } = writable(initialState);

  let refreshTimer: NodeJS.Timeout | null = null;

  // Funzioni private
  const startPolling = (interval: number) => {
    if (refreshTimer) clearInterval(refreshTimer);
    if (browser && interval > 0) {
      refreshTimer = setInterval(() => {
        fetchGiacenzeUpdates();
      }, interval * 1000);
    }
  };

  const stopPolling = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  const fetchGiacenzeUpdates = async (committente_id?: number) => {
    try {
      const url = committente_id 
        ? `/api/giacenze/realtime?committente_id=${committente_id}`
        : '/api/giacenze/realtime';
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      update(state => {
        // Identifica cambiamenti rispetto allo stato precedente
        const updatedGiacenze = data.giacenze.map((newGiacenza: GiacenzaRealTime) => {
          const existing = state.giacenze.find(g => 
            g.prodotto_id === newGiacenza.prodotto_id && 
            g.committente_id === newGiacenza.committente_id
          );
          
          if (existing) {
            // Controlla se ci sono stati cambiamenti
            const quantityChanged = existing.quantita !== newGiacenza.quantita;
            const statusChanged = existing.stato_scorta !== newGiacenza.stato_scorta;
            
            if (quantityChanged || statusChanged) {
              return {
                ...newGiacenza,
                quantita_precedente: existing.quantita,
                stato_scorta_precedente: existing.stato_scorta,
                changed: true,
                ultima_sincronizzazione: new Date().toISOString()
              };
            }
          }
          
          return {
            ...newGiacenza,
            changed: false,
            ultima_sincronizzazione: new Date().toISOString()
          };
        });

        return {
          ...state,
          giacenze: updatedGiacenze,
          alerts: [...state.alerts, ...(data.new_alerts || [])],
          lastUpdate: new Date().toISOString(),
          isConnected: true,
          errorMessage: null
        };
      });

    } catch (error) {
      console.error('Errore fetch giacenze real-time:', error);
      update(state => ({
        ...state,
        isConnected: false,
        errorMessage: error instanceof Error ? error.message : 'Errore sconosciuto'
      }));
    }
  };

  // API pubbliche
  return {
    subscribe,
    
    // Inizializza il sistema real-time
    init: (options?: { committente_id?: number; autoRefresh?: boolean; interval?: number }) => {
      update(state => ({
        ...state,
        autoRefreshEnabled: options?.autoRefresh ?? state.autoRefreshEnabled,
        refreshInterval: options?.interval ?? state.refreshInterval
      }));
      
      if (options?.autoRefresh !== false) {
        startPolling(options?.interval ?? 30);
      }
      
      // Primo fetch immediato
      fetchGiacenzeUpdates(options?.committente_id);
    },

    // Aggiorna manualmente
    refresh: (committente_id?: number) => {
      return fetchGiacenzeUpdates(committente_id);
    },

    // Configura auto-refresh
    setAutoRefresh: (enabled: boolean, interval?: number) => {
      update(state => {
        const newState = {
          ...state,
          autoRefreshEnabled: enabled,
          refreshInterval: interval ?? state.refreshInterval
        };
        
        if (enabled) {
          startPolling(newState.refreshInterval);
        } else {
          stopPolling();
        }
        
        return newState;
      });
    },

    // Aggiorna singola giacenza (per movimenti in tempo reale)
    updateGiacenza: (giacenza: Partial<GiacenzaRealTime>) => {
      update(state => {
        const giacenze = [...state.giacenze];
        const index = giacenze.findIndex(g => 
          g.prodotto_id === giacenza.prodotto_id && 
          g.committente_id === giacenza.committente_id
        );
        
        if (index >= 0) {
          const existing = giacenze[index];
          giacenze[index] = {
            ...existing,
            ...giacenza,
            quantita_precedente: existing.quantita,
            stato_scorta_precedente: existing.stato_scorta,
            changed: true,
            ultima_sincronizzazione: new Date().toISOString()
          };
        } else if (giacenza.prodotto_id && giacenza.committente_id) {
          // Nuova giacenza
          giacenze.push({
            id: giacenze.length + 1,
            prodotto_codice: '',
            prodotto_descrizione: '',
            quantita: 0,
            valore_medio: 0,
            stato_scorta: 'OK',
            ultima_modifica: new Date().toISOString(),
            ...giacenza,
            changed: true,
            ultima_sincronizzazione: new Date().toISOString()
          } as GiacenzaRealTime);
        }
        
        return {
          ...state,
          giacenze,
          lastUpdate: new Date().toISOString()
        };
      });
    },

    // Rimuovi flag di cambiamento
    clearChangeFlags: () => {
      update(state => ({
        ...state,
        giacenze: state.giacenze.map(g => ({ ...g, changed: false }))
      }));
    },

    // Gestione alerts
    acknowledgeAlert: (alertId: string) => {
      update(state => ({
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      }));
    },

    clearAcknowledgedAlerts: () => {
      update(state => ({
        ...state,
        alerts: state.alerts.filter(alert => !alert.acknowledged)
      }));
    },

    // Cleanup
    destroy: () => {
      stopPolling();
      set(initialState);
    }
  };
};

// Store singleton
export const giacenzeStore = createGiacenzeStore();

// Store derivati per filtri e statistiche
export const criticalAlerts = derived(giacenzeStore, $giacenzeStore => 
  $giacenzeStore.alerts.filter(alert => 
    ['SCORTA_CRITICA', 'MOVIMENTO_ANOMALO'].includes(alert.tipo) && 
    !alert.acknowledged
  )
);

export const lowStockProducts = derived(giacenzeStore, $giacenzeStore =>
  $giacenzeStore.giacenze.filter(giacenza => 
    ['BASSA', 'CRITICA'].includes(giacenza.stato_scorta)
  )
);

export const recentChanges = derived(giacenzeStore, $giacenzeStore =>
  $giacenzeStore.giacenze.filter(giacenza => giacenza.changed)
);

// Store per configurazione utente
export const userPreferences = writable({
  showRealTimeIndicators: true,
  highlightChanges: true,
  alertSounds: true,
  compactView: false,
  autoAcknowledgeAfter: 300 // secondi
});