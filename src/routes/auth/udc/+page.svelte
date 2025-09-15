<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  
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

  // Traduzioni UDC
  function translateUdcStatus(stato: string): string {
    return $t(`udc.statuses.${stato}`);
  }

  function translateUdcType(tipo: string): string {
    if (!tipo || tipo === 'UNKNOWN') {
      return $t('udc.list.details.unknownType');
    }
    return $t(`udc.types.${tipo}`) || tipo.replace('_', ' ');
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
  <title>{$t('udc.pageTitle')}</title>
</svelte:head>

<div class="w-full p-6">
  
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">📦 {$t('udc.title')}</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">{$t('udc.subtitle')}</p>
    </div>
    <button 
      class="btn btn-ghost btn-sm"
      on:click={() => window.location.reload()}
      title="{$t('common.refresh')}"
    >
      🔄
    </button>
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


  <!-- Filtri Compatti -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
    <div class="p-4">
      <form method="GET" class="space-y-4">
        <!-- Filtri Principali - Una riga -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <!-- Committente -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              🏢 {$t('udc.filters.client')}
            </label>
            <select name="committente" class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">{$t('udc.filters.allClients')}</option>
              {#each data.committenti as committente}
                <option value={committente.id} selected={data.filtri.committente_filter == committente.id}>
                  {committente.ragione_sociale}
                </option>
              {/each}
            </select>
          </div>

          <!-- Stato -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              📊 {$t('udc.filters.status')}
            </label>
            <select name="stato" class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">{$t('udc.filters.allStatuses')}</option>
              <option value="VUOTO" selected={data.filtri.stato_filter === 'VUOTO'}>🟡 {$t('udc.statuses.VUOTO')}</option>
              <option value="PARZIALE" selected={data.filtri.stato_filter === 'PARZIALE'}>🟠 {$t('udc.statuses.PARZIALE')}</option>
              <option value="PIENO" selected={data.filtri.stato_filter === 'PIENO'}>🟢 {$t('udc.statuses.PIENO')}</option>
              <option value="IN_MOVIMENTO" selected={data.filtri.stato_filter === 'IN_MOVIMENTO'}>🔵 {$t('udc.statuses.IN_MOVIMENTO')}</option>
              <option value="BLOCCATO" selected={data.filtri.stato_filter === 'BLOCCATO'}>🔴 {$t('udc.statuses.BLOCCATO')}</option>
            </select>
          </div>

          <!-- Tipo -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              📦 {$t('udc.filters.type')}
            </label>
            <select name="tipo" class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">{$t('udc.filters.allTypes')}</option>
              <option value="PALLET_EPAL" selected={data.filtri.tipo_filter === 'PALLET_EPAL'}>🏗️ {$t('udc.types.PALLET_EPAL')}</option>
              <option value="PALLET_EUR" selected={data.filtri.tipo_filter === 'PALLET_EUR'}>📦 {$t('udc.types.PALLET_EUR')}</option>
              <option value="ROLL_CONTAINER" selected={data.filtri.tipo_filter === 'ROLL_CONTAINER'}>🛒 {$t('udc.types.ROLL_CONTAINER')}</option>
              <option value="BOX_STANDARD" selected={data.filtri.tipo_filter === 'BOX_STANDARD'}>📋 {$t('udc.types.BOX_STANDARD')}</option>
            </select>
          </div>

          <!-- Barcode -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              🔍 {$t('udc.filters.barcode')}
            </label>
            <input 
              type="text" 
              name="barcode" 
              placeholder="{$t('udc.filters.searchBarcode')}"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              value={data.filtri.barcode_search}
            />
          </div>

          <!-- Scadenza Da -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              📅 Scadenza Da
            </label>
            <input 
              type="date" 
              name="scadenza_da" 
              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={data.filtri.scadenza_da || ''}
            />
          </div>

          <!-- Pulsanti -->
          <div class="flex items-end">
            <div class="flex gap-2 w-full">
              <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded font-medium transition-colors flex items-center justify-center gap-1">
                🔍 {$t('common.filter')}
              </button>
              <button type="button" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" on:click={() => window.location.href = '/auth/udc'} title="Reset">
                🔄
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Lista UDC -->
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <h2 class="card-title">📋 {$t('udc.list.title')} ({data.udc_list.length})</h2>
      
      {#if data.udc_list.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{$t('udc.list.table.barcode')}</th>
                <th>{$t('udc.list.table.type')}</th>
                <th>{$t('udc.list.table.status')}</th>
                <th>{$t('udc.list.table.location')}</th>
                <th>{$t('udc.list.table.content')}</th>
                <th>{$t('udc.list.table.weight')}</th>
                <th>{$t('udc.list.table.filling')}</th>
                <th>{$t('udc.list.table.lastMovement')}</th>
                <th>{$t('udc.list.table.actions')}</th>
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
                        title="{$t('udc.list.details.viewDetail')}"
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
                      <span class="text-sm">{translateUdcType(udc.tipo_udc)}</span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {udc.lunghezza_cm || '?'}×{udc.larghezza_cm || '?'}×{udc.altezza_max_cm || '?'}cm
                    </div>
                  </td>
                  
                  <td>
                    <span class="{getStatoBadgeClass(udc.stato)}">
                      {translateUdcStatus(udc.stato)}
                    </span>
                  </td>
                  
                  <td>
                    {#if udc.codice_ubicazione}
                      <div class="font-mono text-sm">{udc.codice_ubicazione}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{$t('udc.list.details.zone')} {udc.zona}</div>
                    {:else}
                      <span class="text-gray-400 dark:text-gray-500">{$t('udc.list.details.notAssigned')}</span>
                    {/if}
                  </td>
                  
                  <td>
                    {#if udc.quantita_contenuto > 0}
                      <div class="text-sm font-semibold">{udc.quantita_contenuto} {$t('udc.list.details.pieces')}</div>
                      {#if udc.prodotto_contenuto}
                        <div class="text-xs text-gray-600 dark:text-gray-400 truncate" title={udc.prodotto_contenuto}>
                          {udc.prodotto_contenuto}
                        </div>
                      {/if}
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                        {#if udc.lotto}
                          <div>🏷️ {$t('udc.list.details.lot')}: {udc.lotto}</div>
                        {/if}
                        {#if udc.scadenza}
                          <div>📅 {$t('udc.list.details.expiry')}: {new Date(udc.scadenza).toLocaleDateString('it-IT')}</div>
                        {/if}
                        {#if udc.peso_netto > 0}
                          <div>⚖️ {$t('udc.list.details.netWeight')}: {udc.peso_netto}kg</div>
                        {/if}
                      </div>
                    {:else if udc.righe_contenuto > 0}
                      <div class="text-sm font-semibold">{udc.righe_contenuto} SKU</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{udc.pezzi_totali} pezzi</div>
                    {:else}
                      <span class="text-gray-400 dark:text-gray-500">{$t('udc.list.details.empty')}</span>
                    {/if}
                  </td>
                  
                  <td>
                    <div class="text-sm font-semibold">{udc.peso_attuale_kg || 0} kg</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{$t('udc.list.details.max')} {udc.peso_max_kg || '?'} kg</div>
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
                          <a href="/auth/udc/{udc.id}?back=udc-{udc.id}">👁️ {$t('udc.list.details.viewDetailAction')}</a>
                        </li>
                        <li>
                          <a href="/auth/transfer?type=byUdc&udc_id={udc.id}&udc_barcode={encodeURIComponent(udc.barcode)}">
                            🚚 {$t('udc.list.details.moveUdc')}
                          </a>
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
            {$t('udc.list.empty.title')}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {$t('udc.list.empty.description')}
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Dashboard UDC per Zone -->
  {#if data.udc_per_zona.length > 0}
    <div class="card bg-base-100 shadow-sm mt-6">
      <div class="card-body">
        <h2 class="card-title">🏢 {$t('udc.list.zones.title')}</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each data.udc_per_zona as zona}
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title dark:text-gray-300">{$t('udc.list.zones.zone')} {zona.zona || $t('udc.list.zones.notAssignedZone')}</div>
              <div class="stat-value text-primary">{zona.numero_udc}</div>
              <div class="stat-desc dark:text-gray-400">
                {zona.udc_pieni} {$t('udc.list.zones.full')}, {zona.udc_vuoti} {$t('udc.list.zones.empty')}
                <br>
                {$t('udc.list.zones.weight')}: {Math.round(zona.peso_totale || 0)} kg
                <br>
                {$t('udc.list.zones.filling')}: {Math.round(zona.riempimento_medio || 0)}%
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
              <span class="label-text">{$t('udc.form.barcode')} *</span>
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
              <span class="label-text">{$t('udc.form.type')} *</span>
            </label>
            <select name="tipo_udc" class="select select-bordered" required>
              <option value="">{$t('common.select')} tipo...</option>
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
              <span class="label-text">{$t('udc.form.client')}</span>
            </label>
            <select name="committente_id" class="select select-bordered">
              <option value="">{$t('common.none')} proprietario</option>
              {#each data.committenti as committente}
                <option value={committente.id}>{committente.ragione_sociale}</option>
              {/each}
            </select>
          </div>

          <!-- Ubicazione -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">{$t('udc.form.location')}</span>
            </label>
            <select name="ubicazione_id" class="select select-bordered">
              <option value="">{$t('common.select')} ubicazione...</option>
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
              <span class="label-text">{$t('udc.form.length')}</span>
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
              <span class="label-text">{$t('udc.form.width')}</span>
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
              <span class="label-text">{$t('udc.form.height')}</span>
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
              <span class="label-text">{$t('udc.form.weight')}</span>
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
            <span class="label-text">{$t('udc.form.notes')}</span>
          </label>
          <textarea name="note" class="textarea textarea-bordered" placeholder="{$t('udc.form.notesPlaceholder')}"></textarea>
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

