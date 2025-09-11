<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import DashboardCompact from '$lib/components/DashboardCompact.svelte';
  import { dashboardMode } from '$lib/stores/dashboard.js';
  import type { PageData } from './$types.js';

  export let data: PageData;

  let autoRefresh = true;
  let refreshInterval: NodeJS.Timeout;
  let lastUpdate = new Date();
  let isRefreshing = false;
  let showAllAlerts = false;

  import { realtimeData, connectionStatus, realtimeManager } from '$lib/stores/realtime.js';

  // Real-time data subscription
  $: rtData = $realtimeData;
  $: isConnected = $connectionStatus === 'connected';

  // Alert counters
  $: critici = data.alertsOperatori ? data.alertsOperatori.filter(a => a.priorita === 'CRITICO').length : 0;
  $: alti = data.alertsOperatori ? data.alertsOperatori.filter(a => a.priorita === 'ALTO').length : 0;
  $: medi = data.alertsOperatori ? data.alertsOperatori.filter(a => a.priorita === 'MEDIO').length : 0;

  // Auto-refresh ogni 5 secondi invece di 30
  onMount(() => {
    // Il real-time manager si connette automaticamente
    startAutoRefresh();
    // Inizializza la modalità dashboard dal localStorage
    dashboardMode.init();
  });
  
  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        refreshData();
      }, 5000); // 5 secondi invece di 30
    }
  }
  
  // Watch autoRefresh changes
  $: {
    if (autoRefresh !== undefined) {
      startAutoRefresh();
    }
  }
  
  async function refreshData() {
    if (isRefreshing) return;
    
    isRefreshing = true;
    try {
      // Usa il real-time manager per aggiornamenti più veloci
      await realtimeManager.forceUpdate();
      
      // Aggiorna anche i dati della pagina se necessario
      const response = await fetch('/api/dashboard/full-data');
      if (response.ok) {
        const newData = await response.json();
        // Aggiorna solo i dati necessari senza ricaricare la pagina
        data = { ...data, ...newData };
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => {
        isRefreshing = false;
        lastUpdate = new Date();
      }, 500); // Ridotto a 500ms
    }
  }

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  // Formatters
  function formatDuration(seconds: number): string {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function getAlertColor(priorita: string): string {
    switch(priorita) {
      case 'CRITICO': return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'ALTO': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200';
      case 'MEDIO': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
    }
  }

  function getAlertIcon(tipo: string): string {
    switch(tipo) {
      case 'SCORTA_BASSA': return '📦';
      case 'OPERATORE_INATTIVO': return '👤';
      case 'ZONA_SATURA': return '🏭';
      case 'MOVIMENTO_BLOCCATO': return '⚠️';
      case 'PERFORMANCE_BASSA': return '📊';
      case 'SISTEMA': return '⚙️';
      case 'URGENTE': return '🚨';
      default: return '🔔';
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

  function getZoneColor(zona: string): string {
    switch(zona) {
      case 'HOT': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-600';
      case 'WARM': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-600';
      case 'COLD': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-600';
      default: return 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600';
    }
  }

  function getZoneIcon(zona: string): string {
    switch(zona) {
      case 'HOT': return '🔥';
      case 'WARM': return '🌡️';
      case 'COLD': return '❄️';
      default: return '📦';
    }
  }

  function getOccupancyLevel(percentage: number): { color: string; label: string; pulse: boolean } {
    if (percentage >= 95) return { color: 'bg-red-500', label: 'Critico', pulse: true };
    if (percentage >= 85) return { color: 'bg-orange-500', label: 'Alto', pulse: false };
    if (percentage >= 70) return { color: 'bg-yellow-500', label: 'Medio', pulse: false };
    return { color: 'bg-green-500', label: 'Normale', pulse: false };
  }

  function getAbcBadge(classe: string): string {
    switch(classe) {
      case 'A': return 'badge-error';
      case 'B': return 'badge-warning';
      case 'C': return 'badge-success';
      default: return 'badge-neutral';
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
  <title>Dashboard Real-Time Operatori | Gestionale Magazzino</title>
</svelte:head>

<div class="w-full">
  <!-- Header con controlli -->
  <div class="mb-2">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-3">
          <Icon name="chart-bar" class="w-8 h-8 text-blue-600" />
          Dashboard Real-Time
          <span class="badge {isConnected ? 'badge-success animate-pulse' : 'badge-danger'}">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </h1>
        <p class="text-neutral-600 mt-2">
          Centro di controllo operativo - Aggiornamento automatico ogni 5s
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="text-sm text-neutral-500">
          Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
        </div>
        <div class="flex items-center gap-4">
          <!-- Dashboard Mode Toggle -->
          <button 
            on:click={() => dashboardMode.toggle()}
            class="flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
            title="Cambia modalità visualizzazione"
          >
            {#if $dashboardMode === 'compact'}
              <Icon name="expand" class="w-4 h-4" />
              Espandi
            {:else}
              <Icon name="compress" class="w-4 h-4" />
              Compatta
            {/if}
          </button>
          
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              bind:checked={autoRefresh}
              class="checkbox"
            />
            <span class="text-sm {isRefreshing ? 'text-blue-600' : ''}">
              {isRefreshing ? '🔄 Aggiornando...' : 'Auto-refresh'}
            </span>
          </div>
        </div>
        <button 
          on:click={refreshData}
          disabled={isRefreshing}
          class="btn btn-sm btn-secondary {isRefreshing ? 'loading' : ''}"
        >
          <Icon name="arrow-clockwise" class="w-4 h-4 mr-2 {isRefreshing ? 'animate-spin' : ''}" />
          {isRefreshing ? 'Aggiornando...' : 'Aggiorna'}
        </button>
      </div>
    </div>
  </div>

  <!-- Dashboard Content - Conditional Rendering -->
  {#if $dashboardMode === 'compact'}
    <DashboardCompact {data} />
  {:else}
  <!-- KPI Cards principali -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
    <!-- Ordini Today -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Ordini Oggi</p>
          <p class="text-3xl font-bold text-neutral-900 dark:text-gray-100">{data.kpiData.ordini_oggi}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-orange-600">{data.kpiData.ordini_in_picking} picking</span>
            <span class="text-xs text-blue-600">{data.kpiData.ordini_packed} packed</span>
          </div>
        </div>
        <div class="stat-icon bg-blue-100 dark:bg-blue-900">
          <Icon name="shopping-bag" class="w-6 h-6 text-blue-700 dark:text-blue-300" />
        </div>
      </div>
    </div>

    <!-- Movimenti -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Movimenti</p>
          <p class="text-3xl font-bold text-neutral-900 dark:text-gray-100">{data.kpiData.movimenti_oggi}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">{data.kpiData.movimenti_completati} completati</span>
            <span class="text-xs text-orange-600">{data.kpiData.movimenti_in_corso} in corso</span>
          </div>
        </div>
        <div class="stat-icon bg-blue-100 dark:bg-blue-900">
          <Icon name="arrows-right-left" class="w-6 h-6 text-blue-700 dark:text-blue-300" />
        </div>
      </div>
    </div>

    <!-- Operatori Attivi -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Operatori Attivi</p>
          <p class="text-3xl font-bold text-neutral-900 dark:text-gray-100">{data.kpiData.operatori_attivi}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-blue-600">Efficienza: {efficienzaOperatori.toFixed(1)}</span>
          </div>
        </div>
        <div class="stat-icon bg-green-100 dark:bg-green-900">
          <Icon name="users" class="w-6 h-6 text-green-700 dark:text-green-300" />
        </div>
      </div>
    </div>

    <!-- Wave Attive -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Wave Attive</p>
          <p class="text-3xl font-bold text-neutral-900 dark:text-gray-100">{data.kpiData.wave_attive}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">{data.kpiData.spedizioni_oggi} spedite oggi</span>
          </div>
        </div>
        <div class="stat-icon bg-purple-100 dark:bg-purple-900">
          <Icon name="bolt" class="w-6 h-6 text-purple-700 dark:text-purple-300" />
        </div>
      </div>
    </div>
  </div>

  <!-- Alert System - Enhanced -->
  {#if data.alertsOperatori.length > 0}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-2">
      <!-- Header con statistiche -->
      <div class="border-b border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Icon name="exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Alert Operativi</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {data.alertsOperatori.length} alert attivi richiedono attenzione
              </p>
            </div>
          </div>
          
          <!-- Counter per priorità -->
          <div class="flex gap-2">
            {#if critici > 0}
              <div class="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/20 rounded-full">
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-xs font-semibold text-red-800 dark:text-red-200">{critici} Critici</span>
              </div>
            {/if}
            {#if alti > 0}
              <div class="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-xs font-semibold text-orange-800 dark:text-orange-200">{alti} Alti</span>
              </div>
            {/if}
            {#if medi > 0}
              <div class="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span class="text-xs font-semibold text-yellow-800 dark:text-yellow-200">{medi} Medi</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Lista Alert - Layout a due colonne -->
      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {#each (showAllAlerts ? data.alertsOperatori : data.alertsOperatori.slice(0, 2)) as alert, index}
            <div class="group relative p-4 border-l-4 rounded-xl {getAlertColor(alert.priorita)} 
                        hover:shadow-md transition-all duration-200 
                        {alert.priorita === 'CRITICO' ? 'animate-pulse' : ''}">
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3 flex-1">
                  <!-- Icona Alert -->
                  <div class="text-2xl mt-0.5 flex-shrink-0">
                    {getAlertIcon(alert.tipo_alert)}
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-semibold text-sm">
                        {alert.tipo_alert.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      {#if alert.priorita === 'CRITICO'}
                        <span class="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">
                          URGENTE
                        </span>
                      {/if}
                    </div>
                    <p class="text-sm mb-2 leading-relaxed">{alert.messaggio}</p>
                    
                    <!-- Footer con timestamp e azioni -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-xs opacity-75">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                        </svg>
                        {#if alert.timestamp_alert}
                          {formatDateTime(alert.timestamp_alert)}
                        {:else}
                          Ora sconosciuta
                        {/if}
                      </div>
                      
                      <!-- Azioni rapide -->
                      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10" title="Visualizza dettagli">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                        <button class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10" title="Risolvi alert">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Badge priorità -->
                <div class="flex-shrink-0 ml-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                              {alert.priorita === 'CRITICO' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 ring-1 ring-red-600 dark:ring-red-400' : 
                                alert.priorita === 'ALTO' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' : 
                                'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}">
                    {alert.priorita}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Controlli espandi/comprimi -->
        {#if data.alertsOperatori.length > 3}
          <div class="mt-6 text-center">
            <button 
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg 
                     hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              on:click={() => showAllAlerts = !showAllAlerts}
            >
              {#if showAllAlerts}
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                </svg>
                Mostra meno alert
                <span class="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
                  -{data.alertsOperatori.length - 2}
                </span>
              {:else}
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
                Mostra tutti gli alert
                <span class="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  +{data.alertsOperatori.length - 2}
                </span>
              {/if}
            </button>
          </div>
        {/if}
        
        <!-- Quick Actions Footer -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Aggiornamento automatico ogni 5 secondi
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800">
                Risolvi tutti i Medi
              </button>
              <button class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                Esporta Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-2">
    <!-- Performance Operatori -->
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h2 class="flex items-center gap-2">
          <Icon name="users" class="w-5 h-5" />
          Performance Operatori Today
        </h2>
      </div>
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Operatore</th>
                <th>Status</th>
                <th>Movimenti</th>
                <th>Picks/h</th>
                <th>Durata Media</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {#each data.operatoriPerformance as operatore}
                <tr class="hover:bg-neutral-50 dark:bg-gray-800">
                  <td>
                    <div>
                      <div class="font-medium">{operatore.nome} {operatore.cognome}</div>
                      {#if operatore.specializzazione}
                        <div class="text-xs text-blue-600">{operatore.specializzazione}</div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-sm {getOperatorStatusColor(operatore.status_operatore)}">
                      {operatore.status_operatore}
                    </span>
                  </td>
                  <td>
                    <div class="text-sm">
                      <div class="font-medium">{operatore.movimenti_completati}/{operatore.movimenti_oggi}</div>
                      {#if operatore.movimenti_in_corso > 0}
                        <div class="text-orange-600 text-xs">+{operatore.movimenti_in_corso} in corso</div>
                      {/if}
                      {#if operatore.pezzi_prelevati > 0}
                        <div class="text-xs text-neutral-600 dark:text-gray-400">{operatore.pezzi_prelevati} pezzi</div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <span class="font-medium {operatore.picks_per_ora >= 20 ? 'text-green-600' : operatore.picks_per_ora >= 10 ? 'text-blue-600' : 'text-orange-600'}">
                      {operatore.picks_per_ora || '-'}
                    </span>
                  </td>
                  <td>
                    <span class="text-sm">{formatDuration(operatore.durata_media_secondi)}</span>
                  </td>
                  <td>
                    <span class="badge badge-xs badge-neutral">
                      {operatore.device_corrente || '-'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Zone Status - Enhanced -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <!-- Header con overview -->
      <div class="border-b border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Icon name="map" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Status Zone Magazzino</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Monitoraggio real-time dell'occupazione e performance per zona
              </p>
            </div>
          </div>
          
          <!-- Overview metrics -->
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercentage(occupazioneMediaMagazzino)}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Occupazione Media</div>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <!-- Zone Grid -->
        <div class="grid grid-cols-1 gap-4 mb-6">
          {#each data.zoneStatus as zona}
            {@const occupancyLevel = getOccupancyLevel(zona.percentuale_occupazione)}
            <div class="relative group">
              <!-- Zona Card -->
              <div class="p-5 bg-gray-200 dark:bg-gray-600 rounded-xl border-l-4 {getZoneColor(zona.zona_velocita)} 
                          hover:shadow-lg transition-all duration-300 {occupancyLevel.pulse ? 'animate-pulse' : ''}">
                
                <!-- Header zona -->
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">{getZoneIcon(zona.zona_velocita)}</span>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-lg text-gray-900 dark:text-gray-100">
                            Zona {zona.zona_velocita}
                          </span>
                          <span class="px-2 py-1 text-xs font-semibold rounded-full {getZoneColor(zona.zona_velocita)}">
                            {zona.zona_velocita === 'HOT' ? 'Alta Rotazione' : 
                             zona.zona_velocita === 'WARM' ? 'Media Rotazione' : 
                             'Bassa Rotazione'}
                          </span>
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          {zona.ubicazioni_occupate} di {zona.ubicazioni_totali} ubicazioni occupate
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Status indicators -->
                  <div class="flex gap-2">
                    {#if zona.percentuale_occupazione >= 95}
                      <div class="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-xs font-bold rounded-full animate-pulse">
                        CRITICO
                      </div>
                    {:else if zona.percentuale_occupazione >= 85}
                      <div class="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-xs font-bold rounded-full">
                        ALTO
                      </div>
                    {/if}
                  </div>
                </div>
                
                <!-- Progress bar con dettagli -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Occupazione: {formatPercentage(zona.percentuale_occupazione)}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 {occupancyLevel.pulse ? 'animate-pulse' : ''}">
                      {occupancyLevel.label}
                    </span>
                  </div>
                  
                  <!-- Barra progresso avanzata -->
                  <div class="relative w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-1000 ease-out {occupancyLevel.color} {occupancyLevel.pulse ? 'animate-pulse' : ''}"
                      style="width: {zona.percentuale_occupazione}%"
                    ></div>
                    <!-- Marker a 80% e 90% -->
                    <div class="absolute top-0 left-[80%] w-0.5 h-full bg-orange-400 opacity-50"></div>
                    <div class="absolute top-0 left-[90%] w-0.5 h-full bg-red-400 opacity-50"></div>
                  </div>
                  
                  <!-- Legend per i marker -->
                  <div class="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <div class="flex gap-4">
                      <span class="text-orange-400">⚠️ 80%</span>
                      <span class="text-red-400">🚨 90%</span>
                    </div>
                    <span>100%</span>
                  </div>
                </div>
                
                <!-- Metrics Grid -->
                <div class="grid grid-cols-3 gap-4">
                  <!-- Movimenti in corso -->
                  <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div class="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {zona.movimenti_in_corso}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">In Corso</div>
                    {#if zona.movimenti_in_corso > 0}
                      <div class="text-xs text-orange-600 dark:text-orange-400">🔄 Attivi</div>
                    {/if}
                  </div>
                  
                  <!-- Movimenti completati -->
                  <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">
                      {zona.movimenti_completati_oggi}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Completati</div>
                    <div class="text-xs text-green-600 dark:text-green-400">✅ Oggi</div>
                  </div>
                  
                  <!-- Prime picking -->
                  <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 
                              {zona.prime_picking > 0 ? 'ring-2 ring-red-400 dark:ring-red-500' : ''}">
                    <div class="text-lg font-bold text-red-600 dark:text-red-400">
                      {zona.prime_picking}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">PRIME</div>
                    {#if zona.prime_picking > 0}
                      <div class="text-xs text-red-600 dark:text-red-400 animate-pulse">⚡ Urgenti</div>
                    {:else}
                      <div class="text-xs text-gray-500">-</div>
                    {/if}
                  </div>
                </div>
                
                <!-- Quick Actions (visibili on hover) -->
                <div class="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div class="flex gap-2 justify-end">
                    <button class="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 
                                   rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                      Vedi Dettagli
                    </button>
                    <button class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                                   rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      Mappa Zone
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Summary Footer -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                    rounded-xl p-4 border border-blue-200 dark:border-blue-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div>
                <div class="font-semibold text-blue-900 dark:text-blue-100">
                  Riepilogo Magazzino
                </div>
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  {data.zoneStatus.length} zone monitorate • Aggiornamento real-time
                </div>
              </div>
            </div>
            
            <div class="text-right">
              <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatPercentage(occupazioneMediaMagazzino)}
              </div>
              <div class="text-sm text-blue-700 dark:text-blue-300">
                Occupazione Globale
              </div>
              <div class="text-xs text-blue-600 dark:text-blue-400">
                {data.zoneStatus.reduce((sum, z) => sum + z.ubicazioni_occupate, 0)} / 
                {data.zoneStatus.reduce((sum, z) => sum + z.ubicazioni_totali, 0)} ubicazioni
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Throughput e Velocity -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
    <!-- Throughput Orario -->
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h2 class="flex items-center gap-2">
          <Icon name="chart-line" class="w-5 h-5" />
          Throughput Ultime 24h
        </h2>
      </div>
      <div class="card-body">
        <div class="space-y-3">
          {#each data.throughputOrario.slice(0, 12) as slot}
            <div class="flex items-center justify-between p-2 hover:bg-neutral-50 rounded">
              <div class="flex items-center gap-3">
                <span class="font-medium text-sm w-12">{slot.ora}</span>
                <div class="text-sm text-neutral-600 dark:text-gray-400">
                  {slot.operatori_attivi_ora} operatori attivi
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="font-semibold text-sm">
                    {slot.movimenti_completati} movimenti
                  </div>
                  <div class="text-xs text-neutral-600 dark:text-gray-400">
                    {slot.picks_completati} picks • {slot.putaways_completati} put-away
                  </div>
                </div>
                
                <div class="text-right">
                  <div class="text-sm font-medium">
                    {formatDuration(slot.durata_media_secondi)}
                  </div>
                  <div class="text-xs text-neutral-500">media</div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Inventory Velocity -->
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h2 class="flex items-center gap-2">
          <Icon name="fire" class="w-5 h-5" />
          Top Velocity Products
        </h2>
      </div>
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Prodotto</th>
                <th>Classe</th>
                <th>Giacenza</th>
                <th>Mov. 7gg</th>
                <th>Velocity</th>
              </tr>
            </thead>
            <tbody>
              {#each data.inventoryVelocity.slice(0, 10) as prodotto}
                <tr class="hover:bg-neutral-50 dark:bg-gray-800">
                  <td>
                    <div>
                      <div class="font-medium text-sm">{prodotto.sku_code}</div>
                      <div class="text-xs text-neutral-600 truncate w-32">
                        {prodotto.descrizione}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-xs {getAbcBadge(prodotto.classe_abc)}">
                      {prodotto.classe_abc}
                    </span>
                  </td>
                  <td>
                    <div class="text-sm">
                      <div class="font-medium">{prodotto.quantita_disponibile}</div>
                      {#if prodotto.quantita_riservata > 0}
                        <div class="text-xs text-yellow-600">+{prodotto.quantita_riservata} ris.</div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <div class="text-sm">
                      <div class="text-green-600">+{prodotto.entrate_7gg}</div>
                      <div class="text-red-600">-{prodotto.uscite_7gg}</div>
                    </div>
                  </td>
                  <td>
                    <span class="font-semibold {prodotto.velocity_score > 0.5 ? 'text-red-600' : prodotto.velocity_score > 0.2 ? 'text-orange-600' : 'text-green-600'}">
                      {prodotto.velocity_score?.toFixed(2) || '0.00'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  {/if}
</div>

<style>
  .checkbox {
    @apply w-4 h-4 rounded border-2 border-neutral-300;
  }
  
  .checkbox:checked {
    @apply bg-blue-600 border-blue-600;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .loading {
    @apply opacity-75 cursor-not-allowed;
  }
</style>