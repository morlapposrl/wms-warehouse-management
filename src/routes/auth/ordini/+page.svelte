<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

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
    return tipo === 'INBOUND' ? 'In Entrata' : 'In Uscita';
  }

  // Gestione filtri
  function applyFilters() {
    const form = document.getElementById('filtersForm') as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    // Mantieni il committente corrente
    if (data.filters && data.filters.committente_id) {
      params.set('committente', data.filters.committente_id.toString());
    }
    
    for (const [key, value] of formData.entries()) {
      if (value && value !== '') {
        params.set(key, value.toString());
      }
    }
    
    goto(`?${params.toString()}`);
  }

  function resetFilters() {
    const committente_id = data.filters && data.filters.committente_id ? data.filters.committente_id : '';
    goto(`?committente=${committente_id}`);
  }

  function changePage(newPage: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', newPage.toString());
    goto(`?${params.toString()}`);
  }

  // Controlla se ci sono filtri attivi
  $: hasActiveFilters = data.filters && (data.filters.search || data.filters.stato || data.filters.tipo_ordine || data.filters.data_da || data.filters.data_a);
</script>

<div class="flex justify-between items-center mb-6">
  <div>
    <h1 class="h1">Gestione Ordini</h1>
    {#if data.stats}
      <p class="text-neutral-600 mt-1">
        Committente: <strong>{data.ordini[0]?.committente_nome || 'N/D'}</strong>
      </p>
    {/if}
  </div>
  <a href="/auth/ordini/nuovo?committente={data.committente_id}" class="btn btn-primary">
    + Nuovo Ordine
  </a>
</div>

<!-- Statistiche Ordini -->
{#if data.stats}
  <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
    <div class="stat-card">
      <div class="stat-icon bg-blue-100">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div class="mt-3">
        <div class="text-2xl font-bold text-gray-900">{data.stats.totale_ordini || 0}</div>
        <div class="text-sm text-gray-600">Ordini Totali</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-yellow-100">
        <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="mt-3">
        <div class="text-2xl font-bold text-gray-900">{data.stats.ordini_nuovi || 0}</div>
        <div class="text-sm text-gray-600">Nuovi</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-orange-100">
        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </div>
      <div class="mt-3">
        <div class="text-2xl font-bold text-gray-900">{data.stats.ordini_in_preparazione || 0}</div>
        <div class="text-sm text-gray-600">In Preparazione</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-green-100">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div class="mt-3">
        <div class="text-2xl font-bold text-gray-900">{data.stats.ordini_spediti || 0}</div>
        <div class="text-sm text-gray-600">Spediti</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-purple-100">
        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>
      <div class="mt-3">
        <div class="text-2xl font-bold text-gray-900">€ {(data.stats.valore_totale || 0).toFixed(2)}</div>
        <div class="text-sm text-gray-600">Valore Totale</div>
      </div>
    </div>
  </div>
{/if}

<!-- Filtri Avanzati -->
<div class="card mb-6">
  <div class="card-header">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">Filtri</h2>
      {#if hasActiveFilters}
        <button type="button" on:click={resetFilters} class="btn btn-sm btn-secondary">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reset
        </button>
      {/if}
    </div>
  </div>
  <div class="card-body">
    <form id="filtersForm" on:submit|preventDefault={applyFilters}>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <!-- Ricerca -->
        <div class="lg:col-span-2">
          <label class="form-label">Ricerca</label>
          <input 
            type="text" 
            name="search" 
            class="form-input" 
            placeholder="Numero ordine, cliente, tracking..."
            value={data.filters ? data.filters.search || '' : ''}
          />
        </div>

        <!-- Stato -->
        <div>
          <label class="form-label">Stato</label>
          <select name="stato" class="form-input">
            <option value="">Tutti gli stati</option>
            {#each data.options.stati_disponibili as stato}
              <option value={stato} selected={data.filters.stato === stato}>
                {stato}
              </option>
            {/each}
          </select>
        </div>

        <!-- Tipo Ordine -->
        <div>
          <label class="form-label">Tipo</label>
          <select name="tipo" class="form-input">
            <option value="">Tutti i tipi</option>
            {#each data.options.tipi_disponibili as tipo}
              <option value={tipo} selected={data.filters.tipo_ordine === tipo}>
                {formatTipoOrdine(tipo)}
              </option>
            {/each}
          </select>
        </div>

        <!-- Data Da -->
        <div>
          <label class="form-label">Data Da</label>
          <input 
            type="date" 
            name="data_da" 
            class="form-input"
            value={data.filters.data_da}
          />
        </div>

        <!-- Data A -->
        <div>
          <label class="form-label">Data A</label>
          <input 
            type="date" 
            name="data_a" 
            class="form-input"
            value={data.filters.data_a}
          />
        </div>
      </div>

      <div class="flex justify-end mt-4">
        <button type="submit" class="btn btn-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Filtra
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Tabella Ordini -->
<div class="card">
  <div class="card-header">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">Lista Ordini</h2>
      <div class="text-sm text-neutral-600">
        {#if data.pagination.total_count > 0}
          Mostrando {((data.pagination.current_page - 1) * data.pagination.limit) + 1}-{Math.min(data.pagination.current_page * data.pagination.limit, data.pagination.total_count)} di {data.pagination.total_count} ordini
        {:else}
          Nessun ordine trovato
        {/if}
      </div>
    </div>
  </div>
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Numero Ordine</th>
          <th>Tipo</th>
          <th>Cliente/Fornitore</th>
          <th>Stato</th>
          <th>Data Ordine</th>
          <th>Data Richiesta</th>
          <th>Colli</th>
          <th>Valore</th>
          <th>Corriere</th>
          <th>Tracking</th>
        </tr>
      </thead>
      <tbody>
        {#each data.ordini as ordine}
          <tr class="hover:bg-neutral-50 cursor-pointer" on:click={() => goto(`/auth/ordini/${ordine.id}?committente=${data.filters && data.filters.committente_id ? data.filters.committente_id : ''}`)}>
            <td class="font-mono font-medium">{ordine.numero_ordine}</td>
            <td>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {ordine.tipo_ordine === 'INBOUND' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                {formatTipoOrdine(ordine.tipo_ordine)}
              </span>
            </td>
            <td class="max-w-xs truncate">{ordine.cliente_fornitore || '-'}</td>
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
                <a href="#" class="text-primary-600 hover:text-primary-800 underline">
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
                <p class="font-medium">Nessun ordine trovato</p>
                <p class="text-sm">
                  {#if hasActiveFilters}
                    Prova a modificare i filtri o <button type="button" on:click={resetFilters} class="text-primary-600 hover:underline">resettali</button>
                  {:else}
                    Crea il tuo primo ordine per iniziare
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
{#if data.pagination.total_pages > 1}
  <div class="flex justify-between items-center mt-6">
    <div class="text-sm text-neutral-600">
      Pagina {data.pagination.current_page} di {data.pagination.total_pages}
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
