<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types.js';

  export let data: PageData;

  let autoRefresh = true;
  let refreshInterval: NodeJS.Timeout;
  let lastUpdate = new Date();

  // Auto-refresh ogni 30 secondi
  onMount(() => {
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        location.reload();
      }, 30000);
    }
  });

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
      case 'CRITICO': return 'border-red-500 bg-red-50 text-red-800';
      case 'ALTO': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'MEDIO': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      default: return 'border-blue-500 bg-blue-50 text-blue-800';
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
      case 'HOT': return 'text-red-600 bg-red-100';
      case 'WARM': return 'text-orange-600 bg-orange-100';
      case 'COLD': return 'text-blue-600 bg-blue-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
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
  <meta http-equiv="refresh" content="30" />
</svelte:head>

<div class="container mx-auto max-w-7xl">
  <!-- Header con controlli -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-3">
          <Icon name="chart-bar" class="w-8 h-8 text-primary-600" />
          Dashboard Real-Time
          <span class="badge badge-success animate-pulse">LIVE</span>
        </h1>
        <p class="text-neutral-600 mt-2">
          Centro di controllo operativo - Aggiornamento automatico ogni 30s
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="text-sm text-neutral-500">
          Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
        </div>
        <div class="flex items-center gap-2">
          <input 
            type="checkbox" 
            bind:checked={autoRefresh}
            class="checkbox"
          />
          <span class="text-sm">Auto-refresh</span>
        </div>
        <button 
          on:click={() => location.reload()}
          class="btn btn-sm btn-secondary"
        >
          <Icon name="arrow-clockwise" class="w-4 h-4 mr-2" />
          Aggiorna
        </button>
      </div>
    </div>
  </div>

  <!-- KPI Cards principali -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Ordini Today -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Ordini Oggi</p>
          <p class="text-3xl font-bold text-neutral-900">{data.kpiData.ordini_oggi}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-orange-600">{data.kpiData.ordini_in_picking} picking</span>
            <span class="text-xs text-blue-600">{data.kpiData.ordini_packed} packed</span>
          </div>
        </div>
        <div class="stat-icon bg-primary-100">
          <Icon name="shopping-bag" class="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>

    <!-- Movimenti -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Movimenti</p>
          <p class="text-3xl font-bold text-neutral-900">{data.kpiData.movimenti_oggi}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">{data.kpiData.movimenti_completati} completati</span>
            <span class="text-xs text-orange-600">{data.kpiData.movimenti_in_corso} in corso</span>
          </div>
        </div>
        <div class="stat-icon bg-blue-100">
          <Icon name="arrows-right-left" class="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>

    <!-- Operatori Attivi -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Operatori Attivi</p>
          <p class="text-3xl font-bold text-neutral-900">{data.kpiData.operatori_attivi}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-blue-600">Efficienza: {efficienzaOperatori.toFixed(1)}</span>
          </div>
        </div>
        <div class="stat-icon bg-green-100">
          <Icon name="users" class="w-6 h-6 text-green-600" />
        </div>
      </div>
    </div>

    <!-- Wave Attive -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Wave Attive</p>
          <p class="text-3xl font-bold text-neutral-900">{data.kpiData.wave_attive}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">{data.kpiData.spedizioni_oggi} spedite oggi</span>
          </div>
        </div>
        <div class="stat-icon bg-purple-100">
          <Icon name="bolt" class="w-6 h-6 text-purple-600" />
        </div>
      </div>
    </div>
  </div>

  <!-- Alert System -->
  {#if data.alertsOperatori.length > 0}
    <div class="card mb-8">
      <div class="card-header">
        <h2 class="flex items-center gap-2">
          <Icon name="exclamation-triangle" class="w-5 h-5 text-red-600" />
          Alert Operativi
          <span class="badge badge-error animate-pulse">{data.alertsOperatori.length}</span>
        </h2>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {#each data.alertsOperatori as alert}
            <div class="p-4 border-l-4 rounded-lg {getAlertColor(alert.priorita)}">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-sm mb-1">
                    {alert.tipo_alert.replace('_', ' ')}
                  </p>
                  <p class="text-sm">{alert.messaggio}</p>
                  {#if alert.timestamp_alert}
                    <p class="text-xs mt-2 opacity-75">
                      {formatDateTime(alert.timestamp_alert)}
                    </p>
                  {/if}
                </div>
                <span class="badge badge-sm {alert.priorita === 'CRITICO' ? 'badge-error' : alert.priorita === 'ALTO' ? 'badge-warning' : 'badge-info'}">
                  {alert.priorita}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
    <!-- Performance Operatori -->
    <div class="card">
      <div class="card-header">
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
                <tr class="hover:bg-neutral-50">
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
                        <div class="text-xs text-neutral-600">{operatore.pezzi_prelevati} pezzi</div>
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

    <!-- Zone Status -->
    <div class="card">
      <div class="card-header">
        <h2 class="flex items-center gap-2">
          <Icon name="map" class="w-5 h-5" />
          Status Zone Magazzino
        </h2>
      </div>
      <div class="card-body">
        <div class="space-y-4">
          {#each data.zoneStatus as zona}
            <div class="p-4 bg-neutral-50 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="badge {getZoneColor(zona.zona_velocita)} font-semibold">
                    {zona.zona_velocita}
                  </span>
                  <div>
                    <div class="font-medium">
                      {zona.ubicazioni_occupate}/{zona.ubicazioni_totali} ubicazioni
                    </div>
                    <div class="text-sm text-neutral-600">
                      Occupazione {formatPercentage(zona.percentuale_occupazione)}
                    </div>
                  </div>
                </div>
                
                <div class="text-right">
                  {#if zona.movimenti_in_corso > 0}
                    <div class="text-sm text-orange-600">
                      🔄 {zona.movimenti_in_corso} in corso
                    </div>
                  {/if}
                  {#if zona.prime_picking > 0}
                    <div class="text-sm text-red-600">
                      ⚡ {zona.prime_picking} PRIME
                    </div>
                  {/if}
                  <div class="text-sm text-green-600">
                    ✅ {zona.movimenti_completati_oggi} completati
                  </div>
                </div>
              </div>
              
              <!-- Barra progresso occupazione -->
              <div class="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full {zona.percentuale_occupazione > 90 ? 'bg-red-500' : zona.percentuale_occupazione > 75 ? 'bg-yellow-500' : 'bg-green-500'}"
                  style="width: {zona.percentuale_occupazione}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
        
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="font-medium text-blue-900">Occupazione Media Magazzino:</span>
            <span class="text-xl font-bold text-blue-600">
              {formatPercentage(occupazioneMediaMagazzino)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Throughput e Velocity -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
    <!-- Throughput Orario -->
    <div class="card">
      <div class="card-header">
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
                <div class="text-sm text-neutral-600">
                  {slot.operatori_attivi_ora} operatori attivi
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="font-semibold text-sm">
                    {slot.movimenti_completati} movimenti
                  </div>
                  <div class="text-xs text-neutral-600">
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
    <div class="card">
      <div class="card-header">
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
                <tr class="hover:bg-neutral-50">
                  <td>
                    <div>
                      <div class="font-medium text-sm">{prodotto.sku_code}</div>
                      <div class="text-xs text-neutral-600 truncate max-w-32">
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
</div>

<style>
  .checkbox {
    @apply w-4 h-4 rounded border-2 border-neutral-300;
  }
  
  .checkbox:checked {
    @apply bg-primary-600 border-primary-600;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>