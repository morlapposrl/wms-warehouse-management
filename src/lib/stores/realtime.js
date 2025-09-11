import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Store per dati real-time
export const realtimeData = writable({
  kpi: {},
  operatori: [],
  giacenze: [],
  movimenti: [],
  alerts: [],
  lastUpdate: null,
  connected: false
});

// Store per stato connessione
export const connectionStatus = writable('disconnected');

// Simulazione WebSocket per aggiornamenti real-time
class RealTimeManager {
  constructor() {
    this.interval = null;
    this.isConnected = false;
    this.updateFrequency = 5000; // 5 secondi invece di 30
  }

  connect() {
    if (!browser) return;
    
    this.isConnected = true;
    connectionStatus.set('connected');
    
    // ENABLED: Database connection issues resolved, re-enabling polling
    this.interval = setInterval(() => {
      this.fetchUpdates();
    }, this.updateFrequency);
    
    // ENABLED: primo aggiornamento immediato
    this.fetchUpdates();
    
    console.log('Realtime manager connected - polling every', this.updateFrequency, 'ms');
  }

  disconnect() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isConnected = false;
    connectionStatus.set('disconnected');
  }

  async fetchUpdates() {
    try {
      // Fetch dati dashboard
      const [kpiResponse, operatoriResponse, giacenzeResponse, alertsResponse] = await Promise.all([
        fetch('/api/dashboard/kpi-live'),
        fetch('/api/dashboard/operatori-live'),
        fetch('/api/dashboard/giacenze-live'),
        fetch('/api/dashboard/alerts-live')
      ]);

      const updates = {
        kpi: kpiResponse.ok ? await kpiResponse.json() : {},
        operatori: operatoriResponse.ok ? await operatoriResponse.json() : [],
        giacenze: giacenzeResponse.ok ? await giacenzeResponse.json() : [],
        alerts: alertsResponse.ok ? await alertsResponse.json() : [],
        lastUpdate: new Date().toISOString(),
        connected: true
      };

      realtimeData.set(updates);
      connectionStatus.set('connected');
      
    } catch (error) {
      console.error('Errore aggiornamento real-time:', error);
      connectionStatus.set('error');
    }
  }

  // Metodo per forzare aggiornamento
  forceUpdate() {
    this.fetchUpdates();
  }
}

export const realtimeManager = new RealTimeManager();

// Auto-connessione quando il modulo viene importato
if (browser) {
  realtimeManager.connect();
}