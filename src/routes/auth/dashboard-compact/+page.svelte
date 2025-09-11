<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from '../dashboard/$types.js';

  export let data: PageData;

  let autoRefresh = true;
  let refreshInterval: NodeJS.Timeout;
  let lastUpdate = new Date();
  let isRefreshing = false;

  import { realtimeData, connectionStatus, realtimeManager } from '$lib/stores/realtime.js';

  // Real-time data subscription
  $: rtData = $realtimeData;
  $: isConnected = $connectionStatus === 'connected';

  // Alert counters
  $: critici = data.alertsOperatori ? data.alertsOperatori.filter(a => a.priorita === 'CRITICO').length : 0;
  $: alti = data.alertsOperatori ? data.alertsOperatori.filter(a => a.priorita === 'ALTO').length : 0;
  $: medi = data.alertsOperatori ? data.alertsOperatori.filter(a => a.priorita === 'MEDIO').length : 0;

  onMount(() => {
    startAutoRefresh();
  });
  
  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        refreshData();
      }, 5000);
    }
  }
  
  $: {
    if (autoRefresh !== undefined) {
      startAutoRefresh();
    }
  }
  
  async function refreshData() {
    if (isRefreshing) return;
    isRefreshing = true;
    try {
      realtimeManager.forceUpdate();
      lastUpdate = new Date();
    } finally {
      isRefreshing = false;
    }
  }

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  function getPriorityColor(priorita: string): string {
    switch(priorita) {
      case 'CRITICO': return 'text-red-600 bg-red-100 border-red-200';
      case 'ALTO': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'MEDIO': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'BASSO': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-neutral-600 bg-neutral-100 border-neutral-200';
    }
  }

  function getOperatorStatusColor(status: string): string {
    switch(status) {
      case 'ATTIVO': return 'text-green-600 bg-green-100';
      case 'RECENTE': return 'text-blue-600 bg-blue-100';
      case 'INATTIVO': return 'text-neutral-600 bg-neutral-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calcolo statistiche live
  $: efficienzaOperatori = data.operatoriPerformance.length > 0 ? 
    data.operatoriPerformance.reduce((sum, op) => sum + (op.movimenti_completati || 0), 0) / data.operatoriPerformance.length : 0;

  $: occupazioneMediaMagazzino = data.zoneStatus.length > 0 ?
    data.zoneStatus.reduce((sum, zone) => sum + zone.percentuale_occupazione, 0) / data.zoneStatus.length : 0;
</script>

<svelte:head>
  <title>Dashboard Compatta | Gestionale Magazzino</title>
</svelte:head>

<!-- Dashboard compatta ottimizzata per MacBook Pro 15" (1440x900) -->
<div class="w-full h-screen flex flex-col p-4 overflow-hidden bg-gray-50">
  
  <!-- Header compatto -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <Icon name="chart-bar" class="w-6 h-6 text-blue-600" />
      <h1 class="text-xl font-bold text-gray-900">Dashboard Real-Time</h1>
      <span class="px-2 py-1 text-xs rounded-full {isConnected ? 'bg-green-100 text-green-800 animate-pulse' : 'bg-red-100 text-red-800'}">
        {isConnected ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
    
    <div class="flex items-center gap-3 text-sm">
      <span class="text-gray-500">Aggiornato: {lastUpdate.toLocaleTimeString('it-IT')}</span>
      <label class="flex items-center gap-2">
        <input type="checkbox" bind:checked={autoRefresh} class="rounded">
        <span class="text-gray-600">Auto-refresh</span>
      </label>
    </div>
  </div>

  <!-- Grid principale 3 colonne -->
  <div class="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
    
    <!-- Colonna 1: KPI e Statistiche -->
    <div class="flex flex-col gap-4 overflow-y-auto">
      
      <!-- KPI Cards compatte -->
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          📊 KPI Operativi
        </h3>
        
        <div class="grid grid-cols-2 gap-3">
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{data.kpiSummary.ordini_oggi || 0}</div>
            <div class="text-xs text-blue-700">Ordini Oggi</div>
          </div>
          
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{data.kpiSummary.movimenti_oggi || 0}</div>
            <div class="text-xs text-green-700">Movimenti</div>
          </div>
          
          <div class="text-center p-3 bg-orange-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">{data.kpiSummary.operatori_attivi || 0}</div>
            <div class="text-xs text-orange-700">Op. Attivi</div>
          </div>
          
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{Math.round(efficienzaOperatori)}</div>
            <div class="text-xs text-purple-700">Efficienza</div>
          </div>
        </div>
      </div>

      <!-- Alert Summary compatto -->
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          🚨 Alert Attivi
        </h3>
        
        <div class="flex justify-between items-center">
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">{critici} Critici</span>
            <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">{alti} Alti</span>
            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{medi} Medi</span>
          </div>
          <div class="text-xs text-gray-500">Tot: {critici + alti + medi}</div>
        </div>
      </div>

      <!-- Giacenze critiche -->
      <div class="bg-white rounded-lg shadow-sm border p-4 flex-1 min-h-0">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          📦 Giacenze Critiche
        </h3>
        
        <div class="space-y-2 overflow-y-auto max-h-48">
          {#each data.giacenzeCritiche.slice(0, 8) as giacenza}
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div class="flex-1 truncate">
                <div class="font-medium text-gray-900 truncate">{giacenza.prodotto_descrizione}</div>
                <div class="text-xs text-gray-500">{giacenza.prodotto_codice}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-red-600 font-bold">{giacenza.quantita}</div>
                <div class="text-xs text-gray-500">Min: {giacenza.scorta_minima}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Colonna 2: Operatori e Zone -->
    <div class="flex flex-col gap-4 overflow-y-auto">
      
      <!-- Operatori Performance -->
      <div class="bg-white rounded-lg shadow-sm border p-4 flex-1 min-h-0">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          👥 Operatori Live
        </h3>
        
        <div class="space-y-2 overflow-y-auto">
          {#each data.operatoriPerformance.slice(0, 10) as operatore}
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div class="flex items-center gap-2 flex-1">
                <span class="w-2 h-2 rounded-full {operatore.status === 'ATTIVO' ? 'bg-green-500' : operatore.status === 'RECENTE' ? 'bg-blue-500' : 'bg-gray-400'}"></span>
                <span class="font-medium text-gray-900 truncate">{operatore.nome}</span>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                <span class="text-blue-600 font-bold">{operatore.movimenti_completati || 0}</span>
                <span class="text-xs text-gray-500">{operatore.zona || 'N/A'}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Zone Status -->
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          🏭 Zone Magazzino
        </h3>
        
        <div class="grid grid-cols-2 gap-2">
          {#each data.zoneStatus.slice(0, 8) as zona}
            <div class="p-2 bg-gray-50 rounded text-sm">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-gray-900">{zona.zona}</span>
                <span class="text-xs font-bold {zona.percentuale_occupazione > 85 ? 'text-red-600' : zona.percentuale_occupazione > 70 ? 'text-orange-600' : 'text-green-600'}">
                  {zona.percentuale_occupazione}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-300 {zona.percentuale_occupazione > 85 ? 'bg-red-500' : zona.percentuale_occupazione > 70 ? 'bg-orange-500' : 'bg-green-500'}" 
                     style="width: {zona.percentuale_occupazione}%"></div>
              </div>
              <div class="text-xs text-gray-500 mt-1">{zona.prodotti_diversi || 0} SKU</div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Colonna 3: Alert e Movimenti -->
    <div class="flex flex-col gap-4 overflow-y-auto">
      
      <!-- Alert Live -->
      <div class="bg-white rounded-lg shadow-sm border p-4 flex-1 min-h-0">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          🔔 Alert Live
        </h3>
        
        <div class="space-y-2 overflow-y-auto">
          {#each data.alertsOperatori.slice(0, 12) as alert}
            <div class="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
              <span class="text-xs {getPriorityColor(alert.priorita)} px-2 py-1 rounded-full font-medium flex-shrink-0">
                {alert.priorita}
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-gray-900 text-xs leading-tight">{alert.messaggio || alert.tipo_alert}</div>
                <div class="text-xs text-gray-500 mt-1">{formatDateTime(alert.timestamp_alert)}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Movimenti Recenti -->
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          📋 Movimenti Recenti
        </h3>
        
        <div class="space-y-2 max-h-32 overflow-y-auto">
          {#each data.movimentiRecenti.slice(0, 6) as movimento}
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <div class="flex-1 truncate">
                <span class="font-medium text-gray-900">{movimento.tipo_movimento}</span>
                <span class="text-gray-500 ml-2 truncate">{movimento.prodotto_codice}</span>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="font-bold {movimento.tipo_movimento.includes('CARICO') || movimento.tipo_movimento.includes('IN') ? 'text-green-600' : 'text-red-600'}">
                  {movimento.tipo_movimento.includes('CARICO') || movimento.tipo_movimento.includes('IN') ? '+' : '-'}{movimento.quantita}
                </span>
                <span class="text-gray-500">{formatDateTime(movimento.data_movimento)}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>