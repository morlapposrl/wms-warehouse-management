<script>
  import { onMount, onDestroy } from 'svelte';
  import { realtimeData, realtimeManager } from '$lib/stores/realtime.js';
  
  let prodotti = [];
  let prodottiOriginali = []; // Lista completa per filtri lato client
  let committenti = [];
  let loading = true;
  let selectedCommittente = '';
  let searchTerm = '';
  let selectedCategoria = '';
  let selectedStato = '';
  let categorie = [];
  let categorieComplete = []; // Lista completa delle categorie
  let categorieFiltrate = []; // Categorie filtrate per committente
  
  // Sorting state
  let sortColumn = 'codice';
  let sortDirection = 'asc';
  
  // Column filters state - Excel style
  let columnFilters = {
    committente_nome: [],
    codice: [],
    descrizione: [],
    categoria_descrizione: [],
    attivo: []
  };
  
  // Filter dropdowns visibility
  let showFilters = {
    committente_nome: false,
    codice: false,
    descrizione: false,
    categoria_descrizione: false,
    attivo: false
  };
  
  // Real-time data subscription
  $: rtData = $realtimeData;
  
  onMount(async () => {
    try {
      // Carica committenti per filtro
      const commitResponse = await fetch('/api/committenti');
      if (commitResponse.ok) {
        committenti = await commitResponse.json();
      }
      
      // Carica categorie per filtro
      const catResponse = await fetch('/api/categorie/global');
      if (catResponse.ok) {
        const catData = await catResponse.json();
        if (catData.success && catData.data) {
          categorieComplete = catData.data;
          // Inizialmente mostra tutte le categorie
          updateCategorieFiltrate();
          console.log('Categorie caricate:', categorieComplete.length);
        } else {
          console.error('Errore formato risposta categorie:', catData);
        }
      } else {
        console.error('Errore fetch categorie:', catResponse.status);
      }
      
      // Carica prodotti globali
      await loadProdotti();
      
      // Controlla se c'è un hash per riposizionamento da Giacenze
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const codiceRicerca = hash.substring(1); // Rimuovi il #
        console.log('Riposizionamento su prodotto:', codiceRicerca);
        
        // Aspetta un po' per il rendering della tabella
        setTimeout(() => {
          scrollToProdotto(codiceRicerca);
          // Pulisce l'hash dall'URL
          window.history.replaceState('', document.title, window.location.pathname + window.location.search);
        }, 500);
      }
      
      // Close dropdowns when clicking outside
      const handleClickOutside = (event) => {
        if (!event.target.closest('.sortable-header')) {
          for (let key in showFilters) {
            showFilters[key] = false;
          }
        }
      };
      
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
      
    } catch (err) {
      console.error('Errore caricamento:', err);
    }
  });

  // Funzione per scorrere al prodotto specifico
  function scrollToProdotto(codice) {
    // Trova la riga del prodotto nella tabella
    const rows = document.querySelectorAll('tbody tr');
    for (let row of rows) {
      const codiceCell = row.querySelector('td:nth-child(2)'); // Colonna codice
      if (codiceCell && codiceCell.textContent.trim() === codice) {
        // Scrolla alla riga
        row.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Evidenzia temporaneamente la riga
        row.style.backgroundColor = '#dbeafe';
        row.style.transition = 'background-color 0.5s ease';
        
        setTimeout(() => {
          row.style.backgroundColor = '';
        }, 2000);
        
        console.log('Trovato e evidenziato prodotto:', codice);
        break;
      }
    }
  }
  
  async function loadProdotti() {
    loading = true;
    try {
      // Carica sempre tutti i prodotti per filtri lato client
      const response = await fetch('/api/prodotti/global');
      if (response.ok) {
        prodottiOriginali = await response.json();
        applyClientFilters();
      }
    } catch (err) {
      console.error('Errore prodotti:', err);
    } finally {
      loading = false;
    }
  }
  
  // Filtri completi lato client con sorting
  function applyFiltersAndSort() {
    if (!prodottiOriginali || prodottiOriginali.length === 0) {
      prodotti = [];
      return;
    }
    
    let filtered = prodottiOriginali.filter(prodotto => {
      // Filtro ricerca base
      if (searchTerm && !prodotto.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !prodotto.descrizione.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro committente base
      if (selectedCommittente && prodotto.committente_id != selectedCommittente) {
        return false;
      }
      
      // Filtro categoria base  
      if (selectedCategoria && prodotto.categoria_id != selectedCategoria) {
        return false;
      }
      
      // Filtro stato base
      if (selectedStato !== '' && prodotto.attivo != selectedStato) {
        return false;
      }
      
      // Filtri colonna Excel-style
      for (let column in columnFilters) {
        if (columnFilters[column].length > 0) {
          let value = prodotto[column] || '-';
          if (column === 'attivo') {
            value = value ? 'Attivo' : 'Inattivo';
          }
          if (!columnFilters[column].includes(value)) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal = a[sortColumn] || '';
        let bVal = b[sortColumn] || '';
        
        // Handle numbers
        if (['giacenza_attuale', 'scorta_minima', 'valore_giacenza'].includes(sortColumn)) {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }
        // Handle boolean (attivo)
        else if (sortColumn === 'attivo') {
          aVal = a.attivo ? 1 : 0;
          bVal = b.attivo ? 1 : 0;
        }
        // Handle strings
        else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    prodotti = filtered;
  }
  
  // Sort function
  function sortBy(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    applyFiltersAndSort();
  }
  
  // Toggle column filter dropdown
  function toggleColumnFilter(column) {
    // Close all other filters
    for (let key in showFilters) {
      if (key !== column) {
        showFilters[key] = false;
      }
    }
    showFilters[column] = !showFilters[column];
  }
  
  // Get unique values for column filter
  function getUniqueValues(column) {
    if (!prodottiOriginali) return [];
    
    const values = prodottiOriginali.map(p => {
      let value = p[column] || '-';
      if (column === 'attivo') {
        value = value ? 'Attivo' : 'Inattivo';
      }
      return value;
    });
    return [...new Set(values)].sort();
  }
  
  // Toggle filter value
  function toggleFilterValue(column, value) {
    if (columnFilters[column].includes(value)) {
      columnFilters[column] = columnFilters[column].filter(v => v !== value);
    } else {
      columnFilters[column] = [...columnFilters[column], value];
    }
    applyFiltersAndSort();
  }
  
  // Clear column filter
  function clearColumnFilter(column) {
    columnFilters[column] = [];
    showFilters[column] = false;
    applyFiltersAndSort();
  }
  
  // Clear all filters
  function clearAllFilters() {
    for (let column in columnFilters) {
      columnFilters[column] = [];
    }
    for (let column in showFilters) {
      showFilters[column] = false;
    }
    searchTerm = '';
    selectedCommittente = '';
    selectedCategoria = '';
    selectedStato = '';
    applyFiltersAndSort();
  }
  
  // Filtri lato client - legacy per compatibilità
  function applyClientFilters() {
    applyFiltersAndSort();
  }
  
  // Rimuovo il reactive statement che causa problemi SSR
  // $: if (selectedCommittente !== undefined) {
  //   loadProdotti();
  // }
  
  // Aggiorna le categorie filtrate in base al committente selezionato
  function updateCategorieFiltrate() {
    if (selectedCommittente === '' || !selectedCommittente) {
      // Tutti i committenti: mostra tutte le categorie
      categorieFiltrate = categorieComplete;
    } else {
      // Committente specifico: filtra per committente_id
      categorieFiltrate = categorieComplete.filter(cat => 
        cat.committente_id == selectedCommittente
      );
    }
    
    // Reset categoria selezionata se non più valida
    if (selectedCategoria && !categorieFiltrate.find(cat => cat.id == selectedCategoria)) {
      selectedCategoria = '';
    }
  }

  // Gestione cambio committente - ora usa filtri client-side
  function onCommittenteChange() {
    updateCategorieFiltrate();
    applyClientFilters();
  }
  
  
  function viewGiacenze(prodotto) {
    // Naviga alle giacenze globali filtrate per questo prodotto
    const params = new URLSearchParams();
    params.append('search', prodotto.codice);
    if (prodotto.committente_id) {
      params.append('committente', prodotto.committente_id);
    }
    window.location.href = `/auth/giacenze?${params.toString()}`;
  }
</script>

<style>
  .sortable-header {
    @apply relative;
  }
  
  .sortable-header button {
    @apply text-sm font-medium cursor-pointer transition-colors;
  }
  
  .sortable-header button:hover {
    @apply text-blue-600;
  }
  
  /* Filter dropdown styles */
  .sortable-header .absolute {
    z-index: 1000;
  }
</style>

<div class="w-full">
  <!-- Header con filtro committente -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          🎯 Prodotti Globali - Vista Multicommittente
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">
        Gestione prodotti aggregata di tutti i committenti
      </p>
    </div>
    
    <!-- Controlli -->
    <div class="flex items-center gap-4">
      <!-- Refresh manuale -->
      <button 
        on:click={loadProdotti}
        class="btn btn-sm btn-secondary"
        title="Ricarica prodotti"
      >
        🔄
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600 dark:text-gray-400">Caricamento prodotti...</span>
    </div>
  {:else}
    <!-- Filtri -->
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">Filtri</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          
          <!-- Ricerca -->
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="Cerca prodotto..."
              class="form-input text-sm"
            >
          </div>
          
          <!-- Committente -->
          <div class="min-w-36">
            <select 
              bind:value={selectedCommittente}
              on:change={onCommittenteChange}
              class="form-input text-sm"
            >
              <option value="">Tutti committenti</option>
              {#each committenti as committente}
                <option value={committente.id}>
                  {committente.ragione_sociale}
                </option>
              {/each}
            </select>
          </div>
          
          <!-- Categoria -->
          <div class="min-w-32">
            <select 
              bind:value={selectedCategoria}
              on:change={applyClientFilters}
              class="form-input text-sm"
            >
              <option value="">Tutte categorie</option>
              {#each categorieFiltrate as categoria}
                <option value={categoria.id}>
                  {categoria.descrizione}
                  {#if selectedCommittente === ''}
                    - {categoria.committente_ragione_sociale}
                  {/if}
                </option>
              {/each}
            </select>
          </div>
          
          <!-- Stato -->
          <div class="min-w-24">
            <select 
              bind:value={selectedStato}
              on:change={applyClientFilters}
              class="form-input text-sm"
            >
              <option value="">Tutti stati</option>
              <option value="1">✅ Attivo</option>
              <option value="0">❌ Non attivo</option>
            </select>
          </div>
          
          <!-- Reset -->
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={clearAllFilters}
              title="Reset filtri"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {prodotti.length} prodotti
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiche -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">📦</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Prodotti Totali</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{prodotti.length}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">✅</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Attivi</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {prodotti.filter(p => p.attivo).length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">🏢</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Committenti</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {selectedCommittente ? 1 : committenti.length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-yellow-100">
            <span class="text-yellow-600 text-xl">⚠️</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Scorta Bassa</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {prodotti.filter(p => p.giacenza_attuale <= p.scorta_minima).length}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista Prodotti -->
    {#if prodotti.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            Lista Prodotti {selectedCommittente ? `- ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : '(Tutti)'}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <!-- Committente -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('committente_nome')}
                    >
                      Committente
                      {#if sortColumn === 'committente_nome'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('committente_nome')}
                      title="Filtra committente"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.committente_nome}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-64 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('committente_nome')}
                        >
                          Cancella filtro
                        </button>
                      </div>
                      {#each getUniqueValues('committente_nome') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.committente_nome.includes(value)}
                            on:change={() => toggleFilterValue('committente_nome', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <!-- Codice -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('codice')}
                    >
                      Codice
                      {#if sortColumn === 'codice'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('codice')}
                      title="Filtra codice"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.codice}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-48 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('codice')}
                        >
                          Cancella filtro
                        </button>
                      </div>
                      {#each getUniqueValues('codice') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.codice.includes(value)}
                            on:change={() => toggleFilterValue('codice', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <!-- Descrizione -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('descrizione')}
                    >
                      Descrizione
                      {#if sortColumn === 'descrizione'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('descrizione')}
                      title="Filtra descrizione"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.descrizione}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-56 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('descrizione')}
                        >
                          Cancella filtro
                        </button>
                      </div>
                      {#each getUniqueValues('descrizione') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.descrizione.includes(value)}
                            on:change={() => toggleFilterValue('descrizione', value)}
                          />
                          {value.length > 30 ? value.substring(0, 30) + '...' : value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <!-- Categoria -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('categoria_descrizione')}
                    >
                      Categoria
                      {#if sortColumn === 'categoria_descrizione'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('categoria_descrizione')}
                      title="Filtra categoria"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.categoria_descrizione}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-48 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('categoria_descrizione')}
                        >
                          Cancella filtro
                        </button>
                      </div>
                      {#each getUniqueValues('categoria_descrizione') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.categoria_descrizione.includes(value)}
                            on:change={() => toggleFilterValue('categoria_descrizione', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <!-- Giacenza -->
                <th class="sortable-header">
                  <button 
                    class="flex items-center gap-1 hover:text-blue-600"
                    on:click={() => sortBy('giacenza_attuale')}
                  >
                    Giacenza
                    {#if sortColumn === 'giacenza_attuale'}
                      <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    {/if}
                  </button>
                </th>
                
                <!-- Scorta Min -->
                <th class="sortable-header">
                  <button 
                    class="flex items-center gap-1 hover:text-blue-600"
                    on:click={() => sortBy('scorta_minima')}
                  >
                    Scorta Min
                    {#if sortColumn === 'scorta_minima'}
                      <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    {/if}
                  </button>
                </th>
                
                <!-- Valore -->
                <th class="sortable-header">
                  <button 
                    class="flex items-center gap-1 hover:text-blue-600"
                    on:click={() => sortBy('valore_giacenza')}
                  >
                    Valore €
                    {#if sortColumn === 'valore_giacenza'}
                      <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    {/if}
                  </button>
                </th>
                
                <!-- Stato -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('attivo')}
                    >
                      Stato
                      {#if sortColumn === 'attivo'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('attivo')}
                      title="Filtra stato"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.attivo}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-36 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('attivo')}
                        >
                          Cancella filtro
                        </button>
                      </div>
                      {#each getUniqueValues('attivo') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.attivo.includes(value)}
                            on:change={() => toggleFilterValue('attivo', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each prodotti as prodotto}
                <tr 
                  class="cursor-pointer hover:bg-neutral-50 transition-colors"
                  on:click={() => viewGiacenze(prodotto)}
                  title="Clicca per vedere giacenze di {prodotto.descrizione}"
                >
                  <td>
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span class="text-sm font-medium">
                        {prodotto.committente_nome || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td class="font-mono">{prodotto.codice}</td>
                  <td>{prodotto.descrizione}</td>
                  <td>{prodotto.categoria_descrizione}</td>
                  <td class="text-center font-bold {prodotto.giacenza_attuale <= prodotto.scorta_minima ? 'text-red-600' : 'text-green-600'}">
                    {prodotto.giacenza_attuale || 0}
                  </td>
                  <td class="text-center">{prodotto.scorta_minima || 0}</td>
                  <td class="text-right font-semibold">€ {(prodotto.valore_giacenza || 0).toFixed(2)}</td>
                  <td>
                    <span class="badge {prodotto.attivo ? 'badge-success' : 'badge-danger'}">
                      {prodotto.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click|stopPropagation={() => viewGiacenze(prodotto)}
                        title="Vedi giacenze di {prodotto.descrizione}"
                      >
                        📦
                      </button>
                      <a 
                        href="/auth/committenti/{prodotto.committente_id}/prodotti"
                        class="btn btn-secondary btn-sm"
                        title="Gestisci nel contesto committente"
                        on:click|stopPropagation
                      >
                        🔧
                      </a>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📦</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          Nessun prodotto trovato
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">
          {selectedCommittente ? 'Il committente selezionato non ha prodotti' : 'Non ci sono prodotti nel sistema'}
        </p>
      </div>
    {/if}
  {/if}
</div>