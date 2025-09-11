<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  export let data: PageData;
  export let form: ActionData;

  let showCreateForm = false;
  let creating = false;
  let updatingUDCId: number | null = null;

  // Funzioni helper
  function getStatoBadgeClass(stato: string): string {
    switch (stato) {
      case 'VUOTO': return 'badge bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      case 'PARZIALE': return 'badge bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'PIENO': return 'badge bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'IN_MOVIMENTO': return 'badge bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'BLOCCATO': return 'badge bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'DANNEGGIATO': return 'badge bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'badge bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }

  function getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'PALLET_EPAL': return '🏗️';
      case 'PALLET_EUR': return '📦';
      case 'ROLL_CONTAINER': return '🛒';
      case 'BOX_STANDARD': return '📋';
      case 'CONTAINER_20': return '🚢';
      case 'CONTAINER_40': return '🚛';
      case 'CASSA_PLASTICA': return '🧰';
      default: return '📦';
    }
  }

  // Scroll automatico all'UDC quando si torna dal dettaglio
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const backParam = urlParams.get('back');
    
    if (backParam) {
      // Rimuovi il parametro dall'URL senza ricaricare la pagina
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('back');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Scroll all'elemento target dopo un breve delay per permettere il render
      setTimeout(() => {
        const targetElement = document.getElementById(backParam);
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
          
          // Evidenzia temporaneamente la riga
          targetElement.classList.add('bg-blue-100', 'ring-2', 'ring-blue-400', 'ring-opacity-75');
          setTimeout(() => {
            targetElement.classList.remove('bg-blue-100', 'ring-2', 'ring-blue-400', 'ring-opacity-75');
          }, 3000);
        }
      }, 100);
    }
  });

</script>

<svelte:head>
  <title>Gestione UDC - Unità Di Carico</title>
</svelte:head>

<div class="w-full p-6">
  
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">📦 UDC Globali</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Gestione completa di tutte le UDC con filtri avanzati</p>
    </div>
  </div>

  <!-- Messaggi -->
  {#if form?.success}
    <div class="alert bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-200 mb-4">
      <span>✅ {form.success}</span>
    </div>
  {/if}
  
  {#if form?.error}
    <div class="alert bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-200 mb-4">
      <span>❌ {form.error}</span>
    </div>
  {/if}


  <!-- Filtri -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
    <!-- Header Filtri -->
    <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-gray-900 dark:text-gray-100 font-semibold text-lg">Filtri di Ricerca</h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Filtra e cerca tra tutte le UDC</p>
          </div>
        </div>
        <div class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 text-sm font-medium">
          UDC Globali
        </div>
      </div>
    </div>
    <!-- Contenuto Filtri -->
    <div class="p-6">
      <form method="GET" class="space-y-6">
        <!-- Prima sezione: Filtri Principali -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Filtro Committente -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Committente
              </span>
            </label>
            <select name="committente" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">Tutti i committenti</option>
              {#each data.committenti as committente}
                <option value={committente.id} selected={data.filtri.committente_filter == committente.id}>
                  {committente.ragione_sociale}
                </option>
              {/each}
            </select>
          </div>

          <!-- Filtro Stato -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Stato UDC
              </span>
            </label>
            <select name="stato" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">Tutti gli stati</option>
              <option value="VUOTO" selected={data.filtri.stato_filter === 'VUOTO'}>🟡 Vuoto</option>
              <option value="PARZIALE" selected={data.filtri.stato_filter === 'PARZIALE'}>🟠 Parziale</option>
              <option value="PIENO" selected={data.filtri.stato_filter === 'PIENO'}>🟢 Pieno</option>
              <option value="IN_MOVIMENTO" selected={data.filtri.stato_filter === 'IN_MOVIMENTO'}>🔵 In Movimento</option>
              <option value="BLOCCATO" selected={data.filtri.stato_filter === 'BLOCCATO'}>🔴 Bloccato</option>
            </select>
          </div>

          <!-- Filtro Tipo -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                Tipo UDC
              </span>
            </label>
            <select name="tipo" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">Tutti i tipi</option>
              <option value="PALLET_EPAL" selected={data.filtri.tipo_filter === 'PALLET_EPAL'}>🏗️ Pallet EPAL</option>
              <option value="PALLET_EUR" selected={data.filtri.tipo_filter === 'PALLET_EUR'}>📦 Pallet EUR</option>
              <option value="ROLL_CONTAINER" selected={data.filtri.tipo_filter === 'ROLL_CONTAINER'}>🛒 Roll Container</option>
              <option value="BOX_STANDARD" selected={data.filtri.tipo_filter === 'BOX_STANDARD'}>📋 Box Standard</option>
            </select>
          </div>

          <!-- Ricerca Barcode -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Ricerca Barcode
              </span>
            </label>
            <input 
              type="text" 
              name="barcode" 
              placeholder="Inserisci barcode o codice UDC..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              value={data.filtri.barcode_search}
            />
          </div>
        </div>

        <!-- Seconda sezione: Filtri Avanzati -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
            </svg>
            Filtri Avanzati
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Data Scadenza Da -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Scadenza Da
                </span>
              </label>
              <input 
                type="date" 
                name="scadenza_da" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={data.filtri.scadenza_da || ''}
              />
            </div>

            <!-- Data Scadenza A -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Scadenza A
                </span>
              </label>
              <input 
                type="date" 
                name="scadenza_a" 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={data.filtri.scadenza_a || ''}
              />
            </div>

            <!-- Pulsanti Azione -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0">Azioni</label>
              <div class="flex gap-3">
                <button type="submit" class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  Filtra
                </button>
                <button type="button" class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2" on:click={() => window.location.href = '/auth/udc'}>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Lista UDC -->
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <h2 class="card-title">📋 Lista UDC ({data.udc_list.length})</h2>
      
      {#if data.udc_list.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Tipo</th>
                <th>Stato</th>
                <th>Ubicazione</th>
                <th>Contenuto</th>
                <th>Peso</th>
                <th>Riempimento</th>
                <th>Ultimo Movimento</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each data.udc_list as udc}
                <tr id="udc-{udc.id}" class="scroll-target">
                  <td>
                    <div class="font-mono text-lg font-bold">
                      <a 
                        href="/auth/udc/{udc.id}?back=udc-{udc.id}" 
                        class="text-primary hover:text-blue-focus hover:underline"
                        title="Visualizza dettaglio UDC"
                      >
                        {udc.barcode}
                      </a>
                    </div>
                    {#if udc.committente_nome}
                      <div class="text-xs text-gray-500 dark:text-gray-400">{udc.committente_nome}</div>
                    {/if}
                  </td>
                  
                  <td>
                    <div class="flex items-center">
                      <span class="text-xl mr-2">{getTipoIcon(udc.tipo_udc || 'UNKNOWN')}</span>
                      <span class="text-sm">{udc.tipo_udc ? udc.tipo_udc.replace('_', ' ') : 'Tipo sconosciuto'}</span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {udc.lunghezza_cm || '?'}×{udc.larghezza_cm || '?'}×{udc.altezza_max_cm || '?'}cm
                    </div>
                  </td>
                  
                  <td>
                    <span class="{getStatoBadgeClass(udc.stato)}">
                      {udc.stato}
                    </span>
                  </td>
                  
                  <td>
                    {#if udc.codice_ubicazione}
                      <div class="font-mono text-sm">{udc.codice_ubicazione}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">Zona {udc.zona}</div>
                    {:else}
                      <span class="text-gray-400 dark:text-gray-500">Non assegnata</span>
                    {/if}
                  </td>
                  
                  <td>
                    {#if udc.quantita_contenuto > 0}
                      <div class="text-sm font-semibold">{udc.quantita_contenuto} pz</div>
                      {#if udc.prodotto_contenuto}
                        <div class="text-xs text-gray-600 dark:text-gray-400 truncate" title={udc.prodotto_contenuto}>
                          {udc.prodotto_contenuto}
                        </div>
                      {/if}
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                        {#if udc.lotto}
                          <div>🏷️ {udc.lotto}</div>
                        {/if}
                        {#if udc.scadenza}
                          <div>📅 {new Date(udc.scadenza).toLocaleDateString('it-IT')}</div>
                        {/if}
                        {#if udc.peso_netto > 0}
                          <div>⚖️ Netto: {udc.peso_netto}kg</div>
                        {/if}
                      </div>
                    {:else if udc.righe_contenuto > 0}
                      <div class="text-sm font-semibold">{udc.righe_contenuto} SKU</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{udc.pezzi_totali} pezzi</div>
                    {:else}
                      <span class="text-gray-400 dark:text-gray-500">Vuoto</span>
                    {/if}
                  </td>
                  
                  <td>
                    <div class="text-sm font-semibold">{udc.peso_attuale_kg || 0} kg</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">max {udc.peso_max_kg || '?'} kg</div>
                  </td>
                  
                  <td>
                    <div class="flex items-center">
                      <div class="radial-progress text-xs" style="--value:{udc.percentuale_riempimento || 0};" role="progressbar">
                        {Math.round(udc.percentuale_riempimento || 0)}%
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div class="text-xs">
                      {udc.ultimo_movimento_formatted}
                    </div>
                  </td>
                  
                  <td>
                    <div class="dropdown dropdown-left">
                      <label tabindex="0" class="btn btn-ghost btn-sm">
                        ⚙️
                      </label>
                      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-box w-52">
                        <li>
                          <a href="/auth/udc/{udc.id}?back=udc-{udc.id}">👁️ Visualizza Dettaglio</a>
                        </li>
                        <li>
                          <button on:click={() => {/* TODO: Sposta UDC */}}>
                            🚚 Sposta UDC
                          </button>
                        </li>
                        <li>
                          <button class="text-error" on:click={() => {/* TODO: Blocca UDC */}}>
                            🚫 Blocca UDC
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📦</div>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nessun UDC trovato
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Non ci sono UDC che corrispondono ai filtri selezionati
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Dashboard UDC per Zone -->
  {#if data.udc_per_zona.length > 0}
    <div class="card bg-base-100 shadow-sm mt-6">
      <div class="card-body">
        <h2 class="card-title">🏢 UDC per Zone</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each data.udc_per_zona as zona}
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title dark:text-gray-300">Zona {zona.zona || 'Non assegnata'}</div>
              <div class="stat-value text-primary">{zona.numero_udc}</div>
              <div class="stat-desc dark:text-gray-400">
                {zona.udc_pieni} pieni, {zona.udc_vuoti} vuoti
                <br>
                Peso: {Math.round(zona.peso_totale || 0)} kg
                <br>
                Riempimento: {Math.round(zona.riempimento_medio || 0)}%
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Modal Creazione UDC -->
{#if showCreateForm}
  <div class="modal modal-open">
    <div class="modal-box max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <h3 class="font-bold text-lg mb-4">➕ Nuovo UDC</h3>
      
      <form method="POST" action="?/createUDC" use:enhance={() => {
        creating = true;
        return async ({ update }) => {
          await update();
          creating = false;
          showCreateForm = false;
        };
      }}>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Barcode -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Barcode *</span>
            </label>
            <input 
              type="text" 
              name="barcode" 
              placeholder="UDC001PALLET"
              class="input input-bordered"
              required
            />
          </div>

          <!-- Tipo UDC -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Tipo UDC *</span>
            </label>
            <select name="tipo_udc" class="select select-bordered" required>
              <option value="">Seleziona tipo...</option>
              <option value="PALLET_EPAL">🏗️ Pallet EPAL</option>
              <option value="PALLET_EUR">📦 Pallet EUR</option>
              <option value="ROLL_CONTAINER">🛒 Roll Container</option>
              <option value="BOX_STANDARD">📋 Box Standard</option>
              <option value="CONTAINER_20">🚢 Container 20ft</option>
              <option value="CONTAINER_40">🚛 Container 40ft</option>
              <option value="CASSA_PLASTICA">🧰 Cassa Plastica</option>
              <option value="CUSTOM">⚙️ Personalizzato</option>
            </select>
          </div>

          <!-- Committente -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Committente Proprietario</span>
            </label>
            <select name="committente_id" class="select select-bordered">
              <option value="">Nessun proprietario</option>
              {#each data.committenti as committente}
                <option value={committente.id}>{committente.ragione_sociale}</option>
              {/each}
            </select>
          </div>

          <!-- Ubicazione -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Ubicazione Iniziale</span>
            </label>
            <select name="ubicazione_id" class="select select-bordered">
              <option value="">Seleziona ubicazione...</option>
              {#each data.ubicazioni as ubicazione}
                <option value={ubicazione.id}>
                  {ubicazione.codice_ubicazione} - Zona {ubicazione.zona}
                </option>
              {/each}
            </select>
          </div>

          <!-- Dimensioni -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Lunghezza (cm)</span>
            </label>
            <input 
              type="number" 
              name="lunghezza_cm" 
              value="120"
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Larghezza (cm)</span>
            </label>
            <input 
              type="number" 
              name="larghezza_cm" 
              value="80"
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Altezza Max (cm)</span>
            </label>
            <input 
              type="number" 
              name="altezza_max_cm" 
              value="180"
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Peso Max (kg)</span>
            </label>
            <input 
              type="number" 
              name="peso_max_kg" 
              step="0.01"
              value="1000"
              class="input input-bordered"
            />
          </div>
        </div>

        <!-- Note -->
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">Note</span>
          </label>
          <textarea name="note" class="textarea textarea-bordered" placeholder="Note aggiuntive..."></textarea>
        </div>

        <!-- Operatore -->
        <input type="hidden" name="operatore_id" value="1" />

        <div class="modal-action">
          <button type="button" class="btn btn-outline" on:click={() => showCreateForm = false}>
            Annulla
          </button>
          <button type="submit" class="btn btn-primary" disabled={creating}>
            {creating ? 'Creazione...' : 'Crea UDC'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

