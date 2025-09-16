<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';

  export let data: PageData;

  // Funzione per ottenere classe badge basata sullo stato
  function getBadgeClass(stato: string): string {
    switch (stato) {
      case 'NUOVO': return 'badge-info';
      case 'CONFERMATO': return 'badge-warning';
      case 'IN_PREPARAZIONE': return 'badge-warning';
      case 'PRONTO': return 'badge-success';
      case 'SPEDITO': return 'badge-success';
      case 'CONSEGNATO': return 'badge-success';
      case 'ANNULLATO': return 'badge-danger';
      case 'RESO': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  // Funzione per formattare il tipo ordine
  function formatTipoOrdine(tipo: string): string {
    return tipo === 'INBOUND' ? $t('movements.types.inbound') : $t('movements.types.outbound');
  }

  // Gestione filtri
  function applyFilters() {
    const form = document.getElementById('filtersForm') as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      if (value && value !== '') {
        params.set(key, value.toString());
      }
    }
    
    goto(`?${params.toString()}`);
  }

  function resetFilters() {
    goto('/auth/ordini');
  }

  function changePage(newPage: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', newPage.toString());
    goto(`?${params.toString()}`);
  }

  // Controlla se ci sono filtri attivi
  $: hasActiveFilters = data?.filters && (data.filters.search || data.filters.stato || data.filters.tipo_ordine || data.filters.data_da || data.filters.data_a);
</script>

<div class="flex justify-between items-center mb-6">
  <div>
    <h1 class="h1">{$t('orders.title')}</h1>
  </div>
  <a href="/auth/ordini/nuovo?committente={data.committente_id}" class="btn btn-primary">
    + {$t('orders.add')}
  </a>
</div>

<!-- Statistiche Ordini -->
{#if data.stats}
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="stat-card">
      <div class="flex items-center">
        <div class="stat-icon bg-blue-100">
          <span class="text-blue-600 text-xl">📋</span>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('orders.total')}</p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{data.stats.totale_ordini || 0}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center">
        <div class="stat-icon bg-yellow-100">
          <span class="text-yellow-600 text-xl">🆕</span>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('common.add')}</p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{data.stats.ordini_nuovi || 0}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center">
        <div class="stat-icon bg-orange-100">
          <span class="text-orange-600 text-xl">⚙️</span>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('movements.types.inbound')}</p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{data.stats.ordini_in_preparazione || 0}</p>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="flex items-center">
        <div class="stat-icon bg-green-100">
          <span class="text-green-600 text-xl">🚚</span>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('movements.types.outbound')}</p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{data.stats.ordini_spediti || 0}</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Filtri Avanzati -->
<div class="card mb-6">
  <div class="card-header py-3">
    <div class="flex justify-between items-center">
      <h2 class="text-md font-semibold flex items-center gap-2">
        <span class="text-lg">🔍</span>
        <span>{$t('common.filter')}</span>
      </h2>
      {#if hasActiveFilters}
        <button type="button" on:click={resetFilters} class="btn btn-sm btn-secondary">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {$t('common.refresh')}
        </button>
      {/if}
    </div>
  </div>
  <div class="card-body py-4">
    <form id="filtersForm" on:submit|preventDefault={applyFilters}>
      <div class="grid grid-cols-8 gap-3 items-end">
        <!-- Committente -->
        <div>
          <label class="form-label">{$t('categories.client')}</label>
          <select name="committente" class="form-select">
            <option value="">{$t('common.all')} {$t('categories.client').toLowerCase()}</option>
            {#each data.options?.committenti || [] as committente}
              <option value={committente.id} selected={data.filters?.committente_id === committente.id}>
                {committente.ragione_sociale}
              </option>
            {/each}
          </select>
        </div>
        <!-- Ricerca -->
        <div>
          <label class="form-label">{$t('common.search')}</label>
          <input 
            type="text" 
            name="search" 
            class="form-input" 
            placeholder="{$t('orders.number')}, {$t('orders.client')}, tracking..."
            value={data.filters ? data.filters.search || '' : ''}
          />
        </div>

        <!-- Stato -->
        <div>
          <label class="form-label">{$t('common.status')}</label>
          <select name="stato" class="form-input">
            <option value="">{$t('common.all')} {$t('common.status').toLowerCase()}</option>
            {#each data.options?.stati_disponibili || [] as stato}
              <option value={stato} selected={data.filters?.stato === stato}>
                {stato}
              </option>
            {/each}
          </select>
        </div>

        <!-- Tipo Ordine -->
        <div>
          <label class="form-label">{$t('movements.filters.type')}</label>
          <select name="tipo" class="form-input">
            <option value="">{$t('common.all')} {$t('movements.filters.type').toLowerCase()}</option>
            {#each data.options?.tipi_disponibili || [] as tipo}
              <option value={tipo} selected={data.filters?.tipo_ordine === tipo}>
                {formatTipoOrdine(tipo)}
              </option>
            {/each}
          </select>
        </div>

        <!-- Data Da -->
        <div>
          <label class="form-label">{$t('movements.filters.dateFrom')}</label>
          <input 
            type="date" 
            name="data_da" 
            class="form-input"
            value={data.filters?.data_da || ''}
          />
        </div>

        <!-- Data A -->
        <div>
          <label class="form-label">{$t('movements.filters.dateTo')}</label>
          <input 
            type="date" 
            name="data_a" 
            class="form-input"
            value={data.filters?.data_a || ''}
          />
        </div>

        <!-- Pulsanti -->
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {$t('common.filter')}
          </button>
          <button type="button" on:click={resetFilters} class="btn btn-secondary">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {$t('common.refresh')}
          </button>
        </div>
      </div>
    </form>
  </div>
</div>

<!-- Tabella Ordini -->
<div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  <div class="card-header border-b border-gray-200 dark:border-gray-700">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">{$t('orders.title')}</h2>
      <div class="text-sm text-neutral-600 dark:text-gray-400">
        {#if data.pagination?.total_count > 0}
          {((data.pagination.current_page - 1) * data.pagination.limit) + 1}-{Math.min(data.pagination.current_page * data.pagination.limit, data.pagination.total_count)} / {data.pagination.total_count} {$t('orders.title').toLowerCase()}
        {:else}
          {$t('common.noData')}
        {/if}
      </div>
    </div>
  </div>
  <div class="overflow-x-auto">
    <table class="table table-zebra">
      <thead>
        <tr>
          <th>{$t('orders.number')}</th>
          <th>{$t('movements.filters.type')}</th>
          <th>{$t('orders.client')}</th>
          <th>{$t('orders.status')}</th>
          <th>{$t('orders.date')}</th>
          <th>{$t('common.date')}</th>
          <th>{$t('common.quantity')}</th>
          <th>{$t('orders.total')}</th>
          <th>{$t('suppliers.contact')}</th>
          <th>{$t('orders.labels.tracking')}</th>
        </tr>
      </thead>
      <tbody>
        {#each data.ordini || [] as ordine}
          <tr class="hover:bg-neutral-50 cursor-pointer" on:click={() => goto(`/auth/ordini/${ordine.id}?committente=${data.filters?.committente_id || ''}`)}>
            <td class="font-mono font-medium">{ordine.numero_ordine}</td>
            <td>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {ordine.tipo_ordine === 'INBOUND' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                {formatTipoOrdine(ordine.tipo_ordine)}
              </span>
            </td>
            <td class="w-full">{ordine.cliente_fornitore || '-'}</td>
            <td>
              <span class="badge {getBadgeClass(ordine.stato)}">{ordine.stato}</span>
            </td>
            <td>{ordine.data_ordine ? new Date(ordine.data_ordine).toLocaleDateString('it-IT') : '-'}</td>
            <td>{ordine.data_richiesta ? new Date(ordine.data_richiesta).toLocaleDateString('it-IT') : '-'}</td>
            <td class="text-center">{ordine.totale_colli || 0}</td>
            <td class="text-right font-mono">
              {ordine.totale_valore ? `€ ${ordine.totale_valore.toFixed(2)}` : '-'}
            </td>
            <td>{ordine.corriere || '-'}</td>
            <td class="font-mono text-sm">
              {#if ordine.tracking_number}
                <a href="#" class="text-blue-600 hover:text-blue-800 underline">
                  {ordine.tracking_number}
                </a>
              {:else}
                -
              {/if}
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="10" class="text-center py-8 text-neutral-500">
              <div class="flex flex-col items-center">
                <svg class="w-12 h-12 mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="font-medium">{$t('common.noData')}</p>
                <p class="text-sm">
                  {#if hasActiveFilters}
                    {$t('common.filter')} <button type="button" on:click={resetFilters} class="text-blue-600 hover:underline">{$t('common.refresh')}</button>
                  {:else}
                    {$t('orders.add')}
                  {/if}
                </p>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Paginazione -->
{#if data.pagination?.total_pages > 1}
  <div class="flex justify-between items-center mt-6">
    <div class="text-sm text-neutral-600 dark:text-gray-400">
      {data.pagination.current_page} / {data.pagination.total_pages}
    </div>
    
    <nav class="flex items-center space-x-2">
      <!-- Precedente -->
      <button 
        type="button"
        class="btn btn-sm btn-secondary"
        disabled={data.pagination.current_page === 1}
        on:click={() => changePage(data.pagination.current_page - 1)}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Numeri di pagina -->
      {#each Array.from({length: Math.min(5, data.pagination.total_pages)}, (_, i) => {
        const start = Math.max(1, data.pagination.current_page - 2);
        return Math.min(start + i, data.pagination.total_pages);
      }) as pageNum}
        <button 
          type="button"
          class="btn btn-sm {pageNum === data.pagination.current_page ? 'btn-primary' : 'btn-secondary'}"
          on:click={() => changePage(pageNum)}
        >
          {pageNum}
        </button>
      {/each}

      <!-- Successiva -->
      <button 
        type="button"
        class="btn btn-sm btn-secondary"
        disabled={data.pagination.current_page === data.pagination.total_pages}
        on:click={() => changePage(data.pagination.current_page + 1)}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  </div>
{/if}
