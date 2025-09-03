<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let data: PageData;

  // Funzioni utility
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT');
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('it-IT');
  }

  function getStockStatusClass(stato: string): string {
    switch (stato) {
      case 'BASSA': return 'bg-red-100 text-red-800';
      case 'ALTA': return 'bg-blue-100 text-blue-800';
      case 'NORMALE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStockStatusText(stato: string): string {
    switch (stato) {
      case 'BASSA': return 'Scorta Bassa';
      case 'ALTA': return 'Scorta Alta';
      case 'NORMALE': return 'Normale';
      default: return 'N/D';
    }
  }

  // Naviga ai movimenti del prodotto
  function goToMovimenti(prodotto_id: number, prodotto_codice: string) {
    const params = new URLSearchParams({
      committente: data.filters.committente_filter || '1',
      prodotto: prodotto_id.toString(),
      search: prodotto_codice
    });
    goto(`/auth/movimenti?${params.toString()}`);
  }

  // Gestione filtri
  function applyFilters() {
    const form = document.getElementById('filtersForm') as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    // Mantieni il committente corrente
    params.set('committente', data.filters.committente_filter || '');
    
    for (const [key, value] of formData.entries()) {
      if (value && value !== '') {
        params.set(key, value.toString());
      }
    }
    
    goto(`?${params.toString()}`);
  }

  function resetFilters() {
    goto(`?committente=${data.filters.committente_filter || ''}`);
  }

  function changePage(newPage: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', newPage.toString());
    goto(`?${params.toString()}`);
  }

  // Controlla se ci sono filtri attivi
  $: hasActiveFilters = data.filters.search || data.filters.categoria_id || data.filters.solo_scorte_basse;
</script>

<div class="flex justify-between items-center mb-6">
  <div>
    <h1 class="h1">Giacenze Real-time - Vista Globale</h1>
    <p class="text-neutral-600 mt-1">
      {#if data.filters.committente_filter}
        {#each data.committenti as committente}
          {#if committente.id.toString() === data.filters.committente_filter}
            Committente: <strong>{committente.ragione_sociale}</strong>
          {/if}
        {/each}
      {:else}
        Visualizzazione di tutti i committenti attivi
      {/if}
    </p>
  </div>
  <div class="flex gap-2">
    <a href="/auth/movimenti/nuovo?committente={data.filters.committente_filter || '1'}" class="btn btn-success">
      📦 Nuovo Movimento
    </a>
    <button class="btn btn-secondary" on:click={() => window.location.reload()}>
      🔄 Aggiorna
    </button>
  </div>
</div>

<!-- Statistiche Giacenze -->
<div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
  <div class="stat-card text-center">
    <div class="stat-icon bg-blue-100 mb-2 mx-auto">
      <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
    </div>
    <div class="text-2xl font-bold text-blue-900">{data.stats.totale_prodotti}</div>
    <div class="text-sm text-blue-700">Prodotti</div>
  </div>

  <div class="stat-card text-center">
    <div class="stat-icon bg-green-100 mb-2 mx-auto">
      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
      </svg>
    </div>
    <div class="text-2xl font-bold text-green-900">{data.stats.totale_quantita}</div>
    <div class="text-sm text-green-700">Pezzi Totali</div>
  </div>

  <div class="stat-card text-center">
    <div class="stat-icon bg-purple-100 mb-2 mx-auto">
      <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
      </svg>
    </div>
    <div class="text-2xl font-bold text-purple-900">€ {data.stats.valore_totale?.toFixed(2) || '0.00'}</div>
    <div class="text-sm text-purple-700">Valore Totale</div>
  </div>

  <div class="stat-card text-center">
    <div class="stat-icon bg-red-100 mb-2 mx-auto">
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
    </div>
    <div class="text-2xl font-bold text-red-900">{data.stats.scorte_basse}</div>
    <div class="text-sm text-red-700">Scorte Basse</div>
  </div>

  <div class="stat-card text-center">
    <div class="stat-icon bg-gray-100 mb-2 mx-auto">
      <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12"/>
      </svg>
    </div>
    <div class="text-2xl font-bold text-gray-900">{data.stats.prodotti_esauriti}</div>
    <div class="text-sm text-gray-700">Esauriti</div>
  </div>

  <div class="stat-card text-center">
    <div class="stat-icon bg-yellow-100 mb-2 mx-auto">
      <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <div class="text-2xl font-bold text-yellow-900">{data.stats.scorte_eccessive}</div>
    <div class="text-sm text-yellow-700">Eccessive</div>
  </div>
</div>

<!-- Filtri Avanzati -->
<div class="card mb-6">
  <div class="card-header">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">Filtri Giacenze</h2>
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <!-- Ricerca -->
        <div class="lg:col-span-2 xl:col-span-2">
          <label class="form-label">Ricerca Prodotto</label>
          <input 
            type="text" 
            name="search" 
            class="form-input" 
            placeholder="Codice o descrizione prodotto..."
            value={data.filters.search}
          />
        </div>

        <!-- Committente -->
        <div>
          <label class="form-label">Committente</label>
          <select name="committente" class="form-input">
            <option value="">Tutti i committenti</option>
            {#each data.committenti as committente}
              <option value={committente.id} selected={data.filters.committente_filter === committente.id.toString()}>
                {committente.ragione_sociale} ({committente.prodotti_count || 0})
              </option>
            {/each}
          </select>
        </div>

        <!-- Categoria -->
        <div>
          <label class="form-label">Categoria</label>
          <select name="categoria" class="form-input">
            <option value="">Tutte le categorie</option>
            {#each data.categorie as categoria}
              <option value={categoria.id} selected={data.filters.categoria_id === categoria.id}>
                {categoria.descrizione} ({categoria.prodotti_count})
              </option>
            {/each}
          </select>
        </div>

        <!-- Solo scorte basse -->
        <div>
          <label class="form-label">Filtro Speciale</label>
          <label class="inline-flex items-center">
            <input 
              type="checkbox" 
              name="solo_scorte_basse" 
              value="true"
              class="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
              checked={data.filters.solo_scorte_basse}
            />
            <span class="ml-2 text-sm text-gray-600">Solo scorte basse</span>
          </label>
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

<!-- Informazione Click -->
<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
  <div class="flex items-center">
    <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    <span class="text-sm text-blue-800">
      <strong>Suggerimento:</strong> Clicca su una riga per vedere tutti i movimenti di quel prodotto
    </span>
  </div>
</div>

<!-- Tabella Giacenze -->
<div class="card">
  <div class="card-header">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">Giacenze Attuali</h2>
      <div class="text-sm text-neutral-600">
        {#if data.pagination.total_count > 0}
          Mostrando {((data.pagination.current_page - 1) * data.pagination.limit) + 1}-{Math.min(data.pagination.current_page * data.pagination.limit, data.pagination.total_count)} di {data.pagination.total_count} prodotti
        {:else}
          Nessun prodotto trovato
        {/if}
      </div>
    </div>
  </div>
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Prodotto</th>
          <th>Quantità</th>
          <th>Stato Scorta</th>
          <th>Min/Max</th>
          <th>Valore Unit.</th>
          <th>Valore Totale</th>
          <th>Ubicazione</th>
          <th>Lotto/Scadenza</th>
          <th>Ultima Modifica</th>
          <th>Mov. Recenti</th>
        </tr>
      </thead>
      <tbody>
        {#each data.giacenze as giacenza}
          <tr class="hover:bg-neutral-50 cursor-pointer transition-colors duration-200" 
              class:bg-red-25={giacenza.stato_scorta === 'BASSA'}
              on:click={() => goToMovimenti(giacenza.prodotto_id, giacenza.prodotto_codice)}
              title="Clicca per vedere i movimenti di questo prodotto">
            <!-- Prodotto -->
            <td>
              <div>
                <div class="font-medium">{giacenza.prodotto_codice}</div>
                <div class="text-sm text-neutral-600 max-w-xs truncate">{giacenza.prodotto_descrizione}</div>
                {#if giacenza.categoria_nome}
                  <div class="text-xs text-neutral-500">({giacenza.categoria_nome})</div>
                {/if}
              </div>
            </td>
            
            <!-- Quantità -->
            <td class="text-center">
              <div class="font-mono font-bold text-lg" 
                   class:text-red-600={giacenza.quantita === 0}
                   class:text-yellow-600={giacenza.stato_scorta === 'BASSA'}
                   class:text-green-600={giacenza.stato_scorta === 'NORMALE'}>
                {giacenza.quantita}
              </div>
              {#if giacenza.unita_misura}
                <div class="text-xs text-neutral-500">{giacenza.unita_misura}</div>
              {/if}
            </td>
            
            <!-- Stato Scorta -->
            <td class="text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStockStatusClass(giacenza.stato_scorta)}">
                {getStockStatusText(giacenza.stato_scorta)}
              </span>
            </td>
            
            <!-- Min/Max -->
            <td class="text-center text-sm">
              <div>Min: {giacenza.scorta_minima || 'N/D'}</div>
              <div>Max: {giacenza.scorta_massima || 'N/D'}</div>
            </td>
            
            <!-- Valore Unitario -->
            <td class="text-right font-mono">
              {#if giacenza.valore_medio > 0}
                € {giacenza.valore_medio.toFixed(2)}
              {:else if giacenza.prezzo_acquisto}
                € {giacenza.prezzo_acquisto.toFixed(2)}
              {:else}
                -
              {/if}
            </td>
            
            <!-- Valore Totale -->
            <td class="text-right font-mono font-medium">
              € {giacenza.valore_totale.toFixed(2)}
            </td>
            
            <!-- Ubicazione -->
            <td class="text-sm">
              {giacenza.ubicazione || 'N/D'}
            </td>
            
            <!-- Lotto/Scadenza -->
            <td class="text-sm">
              {#if giacenza.lotto}
                <div>Lotto: {giacenza.lotto}</div>
              {/if}
              {#if giacenza.scadenza}
                <div class="text-xs" class:text-red-600={new Date(giacenza.scadenza) <= new Date()}>
                  Scad: {formatDate(giacenza.scadenza)}
                </div>
              {/if}
              {#if !giacenza.lotto && !giacenza.scadenza}-{/if}
            </td>
            
            <!-- Ultima Modifica -->
            <td class="text-sm">
              {formatDateTime(giacenza.ultima_modifica)}
            </td>
            
            <!-- Movimenti Recenti -->
            <td class="text-center">
              <div class="flex items-center justify-center gap-2">
                {#if giacenza.movimenti_recenti > 0}
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {giacenza.movimenti_recenti} mov.
                  </span>
                {:else}
                  <span class="text-neutral-400">0 mov.</span>
                {/if}
                <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="10" class="text-center py-8 text-neutral-500">
              <div class="flex flex-col items-center">
                <svg class="w-12 h-12 mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <p class="font-medium">Nessuna giacenza trovata</p>
                <p class="text-sm">
                  {#if hasActiveFilters}
                    Prova a modificare i filtri o <button type="button" on:click={resetFilters} class="text-primary-600 hover:underline">resettali</button>
                  {:else}
                    Aggiungi prodotti e movimenti per vedere le giacenze
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