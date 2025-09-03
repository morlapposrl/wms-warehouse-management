<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types.js';

  export let data: PageData;

  let ordiniSelezionati: number[] = [];
  let operatoreSelezionato: number | null = null;
  let tipoWave = 'STANDARD';
  let creatingWave = false;
  let ottimizzandoPercorso = false;

  // Formatters
  function formatCurrency(value: number) {
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function toggleOrdineSelezionato(ordineId: number) {
    if (ordiniSelezionati.includes(ordineId)) {
      ordiniSelezionati = ordiniSelezionati.filter(id => id !== ordineId);
    } else {
      ordiniSelezionati = [...ordiniSelezionati, ordineId];
    }
  }

  function selezionaTuttiOrdini() {
    if (ordiniSelezionati.length === data.ordiniPronti.length) {
      ordiniSelezionati = [];
    } else {
      ordiniSelezionati = data.ordiniPronti.map(o => o.id);
    }
  }

  function getUrgenzaClass(urgenza: string) {
    switch(urgenza) {
      case 'URGENTE': return 'badge-error';
      case 'NORMALE': return 'badge-warning';
      default: return 'badge-neutral';
    }
  }

  function getServiceLevelIcon(level: string) {
    switch(level) {
      case 'PRIME': return '⚡';
      case 'STANDARD': return '📦';
      case 'ECONOMY': return '🐌';
      default: return '📦';
    }
  }

  function getWaveStatusColor(status: string) {
    switch(status) {
      case 'IN_CORSO': return 'text-blue-600';
      case 'COMPLETATA': return 'text-green-600';
      case 'ASSEGNATA': return 'text-yellow-600';
      default: return 'text-neutral-600';
    }
  }

  // Calcola statistiche ordini selezionati
  $: ordiniSelezionatiData = data.ordiniPronti.filter(o => ordiniSelezionati.includes(o.id));
  $: valoreWave = ordiniSelezionatiData.reduce((sum, o) => sum + o.total_amount, 0);
  $: righeWave = ordiniSelezionatiData.reduce((sum, o) => sum + o.righe_ordine, 0);
  $: pezziWave = ordiniSelezionatiData.reduce((sum, o) => sum + o.pezzi_totali, 0);
</script>

<svelte:head>
  <title>Wave Planning - Ottimizzazione Picking | Gestionale Magazzino</title>
</svelte:head>

<div class="container mx-auto max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="flex items-center gap-3">
      <Icon name="adjustments-horizontal" class="w-8 h-8 text-primary-600" />
      Wave Planning - Ottimizzazione Picking
    </h1>
    <p class="text-neutral-600 mt-2">
      Crea e gestisci ondate di picking per massimizzare l'efficienza operativa
    </p>
  </div>

  <!-- Statistiche Magazzino -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {#each data.statsUbicazioni as zona}
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-600">Zona {zona.zona_velocita}</p>
            <p class="text-xl font-bold text-neutral-900">
              {zona.ubicazioni_occupate}/{zona.ubicazioni_totali}
            </p>
            <p class="text-sm text-neutral-500">
              {Math.round((zona.ubicazioni_occupate / zona.ubicazioni_totali) * 100)}% occupata
            </p>
            {#if zona.pezzi_totali}
              <p class="text-xs text-blue-600">{zona.pezzi_totali.toLocaleString()} pezzi</p>
            {/if}
          </div>
          <div class="stat-icon {zona.zona_velocita === 'HOT' ? 'bg-red-100' : zona.zona_velocita === 'WARM' ? 'bg-orange-100' : 'bg-blue-100'}">
            <Icon name="map" class="w-6 h-6 {zona.zona_velocita === 'HOT' ? 'text-red-600' : zona.zona_velocita === 'WARM' ? 'text-orange-600' : 'text-blue-600'}" />
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
    <!-- Ordini Pronti per Picking -->
    <div class="xl:col-span-2">
      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-2">
              <Icon name="shopping-cart" class="w-5 h-5" />
              Ordini Pronti per Picking
              <span class="badge badge-primary">{data.ordiniPronti.length}</span>
            </h2>
            <button 
              on:click={selezionaTuttiOrdini}
              class="btn btn-sm btn-secondary"
            >
              {ordiniSelezionati.length === data.ordiniPronti.length ? 'Deseleziona Tutti' : 'Seleziona Tutti'}
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          {#if data.ordiniPronti.length > 0}
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th class="w-12"></th>
                    <th>Ordine</th>
                    <th>Cliente</th>
                    <th>Servizio</th>
                    <th>Consegna</th>
                    <th>Valore</th>
                    <th>Righe/Pezzi</th>
                    <th>Urgenza</th>
                  </tr>
                </thead>
                <tbody>
                  {#each data.ordiniPronti as ordine}
                    <tr class="hover:bg-neutral-50 {ordiniSelezionati.includes(ordine.id) ? 'bg-primary-50' : ''}">
                      <td>
                        <input 
                          type="checkbox"
                          class="checkbox checkbox-primary"
                          checked={ordiniSelezionati.includes(ordine.id)}
                          on:change={() => toggleOrdineSelezionato(ordine.id)}
                        />
                      </td>
                      <td>
                        <div class="font-medium">{ordine.order_number}</div>
                        <div class="text-sm text-neutral-600">ID: {ordine.id}</div>
                      </td>
                      <td>
                        <div class="font-medium">{ordine.customer_name}</div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <span>{getServiceLevelIcon(ordine.service_level)}</span>
                          <span class="font-medium">{ordine.service_level}</span>
                        </div>
                      </td>
                      <td>
                        <div class="text-sm">
                          {formatDateTime(ordine.promised_date)}
                        </div>
                      </td>
                      <td>
                        <div class="font-medium">{formatCurrency(ordine.total_amount)}</div>
                      </td>
                      <td>
                        <div class="text-sm">
                          {ordine.righe_ordine} righe
                          <br>
                          <span class="text-neutral-600">{ordine.pezzi_totali} pezzi</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge {getUrgenzaClass(ordine.urgenza)}">
                          {ordine.urgenza}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="text-center py-12">
              <Icon name="shopping-cart" class="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p class="text-neutral-500 text-lg">Nessun ordine pronto per picking</p>
              <p class="text-sm text-neutral-400 mt-2">
                Gli ordini appariranno qui quando saranno confermati e le giacenze saranno sufficienti
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Pannello Creazione Wave -->
    <div>
      <div class="card">
        <div class="card-header">
          <h3 class="flex items-center gap-2">
            <Icon name="plus-circle" class="w-5 h-5" />
            Crea Nuova Wave
          </h3>
        </div>
        <div class="card-body">
          {#if ordiniSelezionati.length > 0}
            <!-- Statistiche Wave -->
            <div class="bg-primary-50 rounded-lg p-4 mb-6">
              <h4 class="font-semibold text-primary-900 mb-2">Riepilogo Wave</h4>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-neutral-600">Ordini:</span>
                  <span class="font-medium ml-1">{ordiniSelezionati.length}</span>
                </div>
                <div>
                  <span class="text-neutral-600">Righe:</span>
                  <span class="font-medium ml-1">{righeWave}</span>
                </div>
                <div>
                  <span class="text-neutral-600">Pezzi:</span>
                  <span class="font-medium ml-1">{pezziWave.toLocaleString()}</span>
                </div>
                <div>
                  <span class="text-neutral-600">Valore:</span>
                  <span class="font-medium ml-1">{formatCurrency(valoreWave)}</span>
                </div>
              </div>
            </div>

            <!-- Form Creazione -->
            <form 
              method="POST" 
              action="?/creaWave"
              use:enhance={() => {
                creatingWave = true;
                return ({ result, update }) => {
                  creatingWave = false;
                  if (result.type === 'success') {
                    ordiniSelezionati = [];
                    operatoreSelezionato = null;
                  }
                  update();
                };
              }}
            >
              <input type="hidden" name="ordini" value={JSON.stringify(ordiniSelezionati)} />
              
              <div class="form-group mb-4">
                <label class="form-label">Operatore Assegnato</label>
                <select 
                  name="operatore_id" 
                  class="form-select"
                  bind:value={operatoreSelezionato}
                  required
                >
                  <option value="">Seleziona operatore</option>
                  {#each data.operatori as operatore}
                    <option value={operatore.id}>
                      {operatore.nome} {operatore.cognome}
                      {#if operatore.specializzazione}({operatore.specializzazione}){/if}
                      {#if operatore.movimenti_attivi > 0}
                        - {operatore.movimenti_attivi} attivi
                      {/if}
                    </option>
                  {/each}
                </select>
              </div>

              <div class="form-group mb-6">
                <label class="form-label">Tipo Wave</label>
                <select name="tipo_wave" class="form-select" bind:value={tipoWave}>
                  <option value="STANDARD">Standard</option>
                  <option value="EXPRESS">Express</option>
                  <option value="BATCH">Batch</option>
                </select>
              </div>

              <button 
                type="submit"
                class="btn btn-primary w-full"
                disabled={creatingWave || !operatoreSelezionato}
              >
                {#if creatingWave}
                  <Icon name="loading" class="w-4 h-4 mr-2 animate-spin" />
                  Creando Wave...
                {:else}
                  <Icon name="play" class="w-4 h-4 mr-2" />
                  Crea Wave
                {/if}
              </button>
            </form>
          {:else}
            <div class="text-center py-8">
              <Icon name="cursor-arrow-rays" class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p class="text-neutral-500">Seleziona ordini per creare una wave</p>
              <p class="text-sm text-neutral-400 mt-1">
                Seleziona uno o più ordini dalla lista per iniziare
              </p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Operatori Disponibili -->
      <div class="card mt-6">
        <div class="card-header">
          <h3 class="flex items-center gap-2">
            <Icon name="users" class="w-5 h-5" />
            Operatori Disponibili
          </h3>
        </div>
        <div class="card-body">
          <div class="space-y-3">
            {#each data.operatori as operatore}
              <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <p class="font-medium">{operatore.nome} {operatore.cognome}</p>
                  {#if operatore.specializzazione}
                    <p class="text-sm text-neutral-600">{operatore.specializzazione}</p>
                  {/if}
                </div>
                <div class="text-right">
                  <span class="badge {operatore.movimenti_attivi === 0 ? 'badge-success' : 'badge-warning'}">
                    {operatore.movimenti_attivi} attivi
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Wave Attive -->
  {#if data.waveAttive.length > 0}
    <div class="card mt-8">
      <div class="card-header">
        <h2 class="flex items-center gap-2">
          <Icon name="bolt" class="w-5 h-5" />
          Wave in Corso
          <span class="badge badge-info">{data.waveAttive.length}</span>
        </h2>
      </div>
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Wave ID</th>
                <th>Ordini</th>
                <th>Valore</th>
                <th>Consegne</th>
                <th>Servizi</th>
                <th>Status</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each data.waveAttive as wave}
                <tr class="hover:bg-neutral-50">
                  <td>
                    <div class="font-medium">{wave.wave_id}</div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">{wave.ordini_count} ordini</span>
                  </td>
                  <td>
                    <div class="font-medium">{formatCurrency(wave.valore_totale)}</div>
                  </td>
                  <td>
                    <div class="text-sm">
                      <div>{formatDateTime(wave.prima_consegna)}</div>
                      {#if wave.ultima_consegna !== wave.prima_consegna}
                        <div class="text-neutral-500">→ {formatDateTime(wave.ultima_consegna)}</div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      {#each wave.livelli_servizio.split(',') as livello}
                        <span class="badge badge-sm badge-neutral">{livello}</span>
                      {/each}
                    </div>
                  </td>
                  <td>
                    <span class="font-medium {getWaveStatusColor(wave.status_wave)}">
                      {wave.status_wave}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <form method="POST" action="?/ottimizzaPercorso" class="inline">
                        <input type="hidden" name="wave_id" value={wave.wave_id} />
                        <button 
                          type="submit"
                          class="btn btn-sm btn-secondary"
                          disabled={wave.status_wave === 'COMPLETATA'}
                        >
                          <Icon name="route" class="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .checkbox {
    @apply w-5 h-5 rounded border-2 border-neutral-300;
  }
  
  .checkbox:checked {
    @apply bg-primary-600 border-primary-600;
  }
  
  .checkbox-primary:checked {
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-6 6a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7 8.293l5.646-5.647a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e");
  }
</style>