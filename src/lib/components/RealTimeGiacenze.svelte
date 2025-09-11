<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { giacenzeStore, criticalAlerts, lowStockProducts, recentChanges } from '$lib/stores/giacenzeStore';
  import type { AlertGiacenza } from '$lib/stores/giacenzeStore';

  export let committente_id: number | undefined = undefined;
  export let showAlerts = true;
  export let showStats = true;
  export let autoRefresh = true;
  export let refreshInterval = 30; // secondi
  export let compact = false;

  let isInitialized = false;
  let showAlertsPanel = false;

  // Reactive store subscriptions
  $: alerts = $criticalAlerts;
  $: lowStock = $lowStockProducts;
  $: changes = $recentChanges;
  $: store = $giacenzeStore;

  onMount(() => {
    // Inizializza il store per il real-time
    giacenzeStore.init({
      committente_id,
      autoRefresh,
      interval: refreshInterval
    });
    isInitialized = true;
  });

  onDestroy(() => {
    if (isInitialized) {
      giacenzeStore.destroy();
    }
  });

  // Gestione alerts
  function acknowledgeAlert(alertId: string) {
    giacenzeStore.acknowledgeAlert(alertId);
  }

  function clearAllAcknowledgedAlerts() {
    giacenzeStore.clearAcknowledgedAlerts();
  }

  function toggleAlertsPanel() {
    showAlertsPanel = !showAlertsPanel;
  }

  function refreshManually() {
    giacenzeStore.refresh(committente_id);
  }

  function toggleAutoRefresh() {
    giacenzeStore.setAutoRefresh(!store.autoRefreshEnabled, refreshInterval);
  }

  function getAlertIcon(tipo: AlertGiacenza['tipo']): string {
    switch (tipo) {
      case 'SCORTA_CRITICA': return '🚨';
      case 'SCORTA_BASSA': return '⚠️';
      case 'MOVIMENTO_ANOMALO': return '📊';
      case 'ECCESSO_STOCK': return '📦';
      default: return 'ℹ️';
    }
  }

  function getAlertColor(tipo: AlertGiacenza['tipo']): string {
    switch (tipo) {
      case 'SCORTA_CRITICA': return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'SCORTA_BASSA': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'MOVIMENTO_ANOMALO': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      case 'ECCESSO_STOCK': return 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200';
    }
  }

  function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function getConnectionStatusColor(): string {
    return store.isConnected ? 'text-green-600' : 'text-red-600';
  }

  function clearChangeHighlights() {
    setTimeout(() => {
      giacenzeStore.clearChangeFlags();
    }, 3000); // Rimuovi highlights dopo 3 secondi
  }

  // Auto-clear change highlights when new changes arrive
  $: if (changes.length > 0) {
    clearChangeHighlights();
  }
</script>

<div class="real-time-giacenze {compact ? 'compact' : ''}">
  
  <!-- Status Bar -->
  <div class="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm">
    <div class="flex items-center gap-4">
      <!-- Connection Status -->
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full {store.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}" 
             title="{store.isConnected ? 'Connesso' : 'Disconnesso'}">
        </div>
        <span class="text-sm font-medium {getConnectionStatusColor()}">
          {store.isConnected ? 'Real-time' : 'Offline'}
        </span>
      </div>

      <!-- Last Update -->
      {#if store.lastUpdate}
        <div class="text-xs text-gray-500">
          Ultimo aggiornamento: {formatTimestamp(store.lastUpdate)}
        </div>
      {/if}

      <!-- Auto Refresh Toggle -->
      <label class="flex items-center gap-2 text-sm">
        <input 
          type="checkbox" 
          bind:checked={store.autoRefreshEnabled}
          on:change={toggleAutoRefresh}
          class="rounded border-gray-300"
        />
        <span>Auto-refresh ({refreshInterval}s)</span>
      </label>
    </div>

    <div class="flex items-center gap-2">
      <!-- Manual Refresh -->
      <button 
        type="button" 
        on:click={refreshManually}
        class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        title="Aggiorna manualmente"
      >
        <svg class="w-4 h-4 {store.isConnected ? '' : 'animate-spin'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <!-- Alerts Toggle -->
      {#if showAlerts && alerts.length > 0}
        <button 
          type="button"
          on:click={toggleAlertsPanel}
          class="relative p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Mostra alerts critici"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="absolute -top-1 -right-1 bg-red-500 dark:bg-red-400 text-white dark:text-gray-900 text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center">
            {alerts.length}
          </div>
        </button>
      {/if}
    </div>
  </div>

  <!-- Error Message -->
  {#if store.errorMessage}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 m-4" transition:fade>
      <div class="flex items-center">
        <svg class="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm text-red-800">
          <strong>Errore connessione:</strong> {store.errorMessage}
        </span>
      </div>
    </div>
  {/if}

  <!-- Quick Stats -->
  {#if showStats && !compact}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-gray-50 dark:bg-gray-800">
      <div class="text-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <div class="text-lg font-bold text-blue-600">{store.giacenze.length}</div>
        <div class="text-xs text-gray-600">Prodotti</div>
      </div>
      <div class="text-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <div class="text-lg font-bold text-red-600">{lowStock.length}</div>
        <div class="text-xs text-gray-600">Scorte basse</div>
      </div>
      <div class="text-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <div class="text-lg font-bold text-green-600">{changes.length}</div>
        <div class="text-xs text-gray-600">Modifiche</div>
      </div>
      <div class="text-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <div class="text-lg font-bold text-orange-600">{alerts.length}</div>
        <div class="text-xs text-gray-600">Alert attivi</div>
      </div>
    </div>
  {/if}

  <!-- Recent Changes Indicator -->
  {#if changes.length > 0}
    <div class="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2" transition:fly={{ y: -20, duration: 300 }}>
      <div class="flex items-center gap-2 text-sm text-blue-800">
        <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span><strong>{changes.length}</strong> prodotti modificati di recente</span>
        <button 
          type="button" 
          on:click={() => giacenzeStore.clearChangeFlags()}
          class="text-xs text-blue-600 hover:underline ml-auto"
        >
          Nascondi
        </button>
      </div>
    </div>
  {/if}

  <!-- Alerts Panel -->
  {#if showAlertsPanel && showAlerts}
    <div class="alerts-panel border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" transition:fly={{ y: -100, duration: 300 }}>
      <div class="px-4 py-3 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800">Alert Critici ({alerts.length})</h3>
          <div class="flex items-center gap-2">
            <button 
              type="button"
              on:click={clearAllAcknowledgedAlerts}
              class="text-xs text-gray-600 hover:text-blue-600 hover:underline"
            >
              Pulisci confermati
            </button>
            <button 
              type="button" 
              on:click={toggleAlertsPanel}
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="max-h-64 overflow-y-auto">
        {#each alerts as alert (alert.id)}
          <div class="px-4 py-3 border-b border-gray-100 {getAlertColor(alert.tipo)} border-l-4" 
               transition:fly={{ x: -100, duration: 300 }}>
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-lg">{getAlertIcon(alert.tipo)}</span>
                  <span class="text-sm font-medium">{alert.prodotto_codice}</span>
                  <span class="text-xs bg-white dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-50 px-2 py-0.5 rounded">
                    {alert.committente_nome}
                  </span>
                </div>
                <p class="text-sm mb-1">{alert.messaggio}</p>
                <div class="flex items-center gap-4 text-xs opacity-75">
                  <span>Qta: {alert.quantita_attuale}</span>
                  {#if alert.quantita_soglia !== undefined}
                    <span>Soglia: {alert.quantita_soglia}</span>
                  {/if}
                  <span>{formatTimestamp(alert.timestamp)}</span>
                </div>
              </div>
              <button 
                type="button"
                on:click={() => acknowledgeAlert(alert.id)}
                class="text-xs bg-white dark:bg-gray-700 bg-opacity-25 dark:bg-opacity-25 hover:bg-opacity-50 dark:hover:bg-opacity-50 px-2 py-1 rounded transition-colors"
                title="Conferma alert"
              >
                ✓
              </button>
            </div>
          </div>
        {:else}
          <div class="px-4 py-6 text-center text-sm text-gray-500">
            Nessun alert critico al momento
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .real-time-giacenze {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm;
  }
  
  .real-time-giacenze.compact {
    @apply border-0 shadow-none rounded-none;
  }
  
  .alerts-panel {
    max-height: 300px;
    overflow-y: auto;
  }
  
  /* Animazioni per cambiamenti */
  :global(.changed-row) {
    @apply bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-md;
    animation: highlight-change 2s ease-out;
  }
  
  @keyframes highlight-change {
    0% { 
      background-color: theme('colors.blue.100');
      transform: scale(1.01);
    }
    50% { 
      background-color: theme('colors.blue.75');
    }
    100% { 
      background-color: theme('colors.blue.50');
      transform: scale(1);
    }
  }
</style>