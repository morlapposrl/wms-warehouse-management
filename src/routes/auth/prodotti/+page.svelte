<script>
  import { onMount, onDestroy } from 'svelte';
  import { realtimeData, realtimeManager } from '$lib/stores/realtime.js';
  import { t } from '$lib/i18n';
  
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
  
  // Form modal state
  let showForm = false;
  let editingId = null;
  let formData = {
    codice: '',
    descrizione: '',
    categoria_id: '',
    unita_misura_id: '',
    prezzo_vendita: '',
    scorta_minima: '',
    scorta_massima: '',
    committente_id: '',
    // Campi compatibilità
    richiede_temperatura_controllata: false,
    temperatura_min: null,
    temperatura_max: null,
    categoria_sicurezza: 'STANDARD',
    classe_pericolo: '',
    codice_adr: '',
    peso_unitario_kg: 0,
    volume_unitario_cm3: 0,
    altezza_cm: 0,
    richiede_accesso_controllato: false,
    incompatibile_con_alimentari: false,
    shelf_life_giorni: null,
    tracking_lotto_obbligatorio: false
  };
  let formErrors = {};
  let formLoading = false;
  let unitaMisura = [];
  
  onMount(async () => {
    try {
      // Carica committenti per filtro
      const commitResponse = await fetch('/api/committenti');
      if (commitResponse.ok) {
        const commitData = await commitResponse.json();
        if (commitData.success && commitData.data) {
          committenti = commitData.data;
          console.log('Committenti caricati:', committenti.length);
        } else {
          console.error('Errore formato risposta committenti:', commitData);
        }
      } else {
        console.error('Errore fetch committenti:', commitResponse.status);
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
      }
      
      // Carica unità di misura per form
      const umResponse = await fetch('/api/unita-misura/global');
      if (umResponse.ok) {
        const umData = await umResponse.json();
        if (umData.success && umData.data) {
          unitaMisura = umData.data;
          console.log('Unità di misura caricate:', unitaMisura.length);
        } else {
          console.error('Errore formato risposta unità misura:', umData);
        }
      } else {
        console.error('Errore fetch unità misura:', umResponse.status);
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
            value = value ? $t('globalProducts.active') : $t('globalProducts.inactive');
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
        value = value ? $t('globalProducts.active') : $t('globalProducts.inactive');
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
  
  // Form modal functions
  function openForm(prodotto = null) {
    editingId = prodotto ? prodotto.id : null;
    if (prodotto) {
      console.log('🔧 DEBUG COMPATIBILITY - Prodotto completo:', prodotto);
      console.log('🔧 CATEGORIA_SICUREZZA:', prodotto.categoria_sicurezza);
      console.log('🔧 RICHIEDE_TEMPERATURA:', prodotto.richiede_temperatura_controllata);
      console.log('🔧 PESO_UNITARIO_KG:', prodotto.peso_unitario_kg);
      formData = {
        codice: prodotto.codice || '',
        descrizione: prodotto.descrizione || '',
        categoria_id: prodotto.categoria_id || '',
        unita_misura_id: prodotto.unita_misura_id || '',
        prezzo_vendita: prodotto.prezzo_vendita || '',
        scorta_minima: prodotto.scorta_minima || '',
        scorta_massima: prodotto.scorta_massima || '',
        committente_id: prodotto.committente_id || '',
        // Campi compatibilità
        richiede_temperatura_controllata: prodotto.richiede_temperatura_controllata || false,
        temperatura_min: prodotto.temperatura_min || null,
        temperatura_max: prodotto.temperatura_max || null,
        categoria_sicurezza: prodotto.categoria_sicurezza || 'STANDARD',
        classe_pericolo: prodotto.classe_pericolo || '',
        codice_adr: prodotto.codice_adr || '',
        peso_unitario_kg: prodotto.peso_unitario_kg || 0,
        volume_unitario_cm3: prodotto.volume_unitario_cm3 || 0,
        altezza_cm: prodotto.altezza_cm || 0,
        richiede_accesso_controllato: prodotto.richiede_accesso_controllato || false,
        incompatibile_con_alimentari: prodotto.incompatibile_con_alimentari || false,
        shelf_life_giorni: prodotto.shelf_life_giorni || null,
        tracking_lotto_obbligatorio: prodotto.tracking_lotto_obbligatorio || false
      };
    } else {
      formData = {
        codice: '',
        descrizione: '',
        categoria_id: '',
        unita_misura_id: '',
        prezzo_vendita: '',
        scorta_minima: '',
        scorta_massima: '',
        committente_id: '',
        // Campi compatibilità
        richiede_temperatura_controllata: false,
        temperatura_min: null,
        temperatura_max: null,
        categoria_sicurezza: 'STANDARD',
        classe_pericolo: '',
        codice_adr: '',
        peso_unitario_kg: 0,
        volume_unitario_cm3: 0,
        altezza_cm: 0,
        richiede_accesso_controllato: false,
        incompatibile_con_alimentari: false,
        shelf_life_giorni: null,
        tracking_lotto_obbligatorio: false
      };
    }
    formErrors = {};
    showForm = true;
  }
  
  function resetForm() {
    showForm = false;
    editingId = null;
    formData = {
      codice: '',
      descrizione: '',
      categoria_id: '',
      unita_misura_id: '',
      prezzo_vendita: '',
      scorta_minima: '',
      scorta_massima: '',
      committente_id: '',
      // Campi compatibilità
      richiede_temperatura_controllata: false,
      temperatura_min: null,
      temperatura_max: null,
      categoria_sicurezza: 'STANDARD',
      classe_pericolo: '',
      codice_adr: '',
      peso_unitario_kg: 0,
      volume_unitario_cm3: 0,
      altezza_cm: 0,
      richiede_accesso_controllato: false,
      incompatibile_con_alimentari: false,
      shelf_life_giorni: null,
      tracking_lotto_obbligatorio: false
    };
    formErrors = {};
    formLoading = false;
  }
  
  async function handleSubmit() {
    formErrors = {};
    
    // Validazione base
    if (!formData.codice.trim()) {
      formErrors.codice = [$t('validation.required')];
    }
    if (!formData.descrizione.trim()) {
      formErrors.descrizione = [$t('validation.required')];
    }
    if (!formData.committente_id) {
      formErrors.committente_id = [$t('validation.required')];
    }
    if (!formData.categoria_id) {
      formErrors.categoria_id = [$t('validation.required')];
    }
    if (!formData.unita_misura_id) {
      formErrors.unita_misura_id = [$t('validation.required')];
    }
    
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    
    formLoading = true;
    
    try {
      const url = editingId ? `/api/prodotti/${editingId}` : '/api/prodotti';
      const method = editingId ? 'PUT' : 'POST';
      
      console.log('🔧 DEBUG COMPATIBILITY SUBMIT - FormData:', formData);
      console.log('🔧 CATEGORIA_SICUREZZA submit:', formData.categoria_sicurezza);
      console.log('🔧 RICHIEDE_TEMPERATURA submit:', formData.richiede_temperatura_controllata);
      console.log('🔧 PESO_UNITARIO_KG submit:', formData.peso_unitario_kg);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        resetForm();
        await loadProdotti();
        // Success feedback could be added here
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          formErrors = errorData.errors;
        } else {
          formErrors.general = [errorData.error || $t('errors.saveError')];
        }
      }
    } catch (error) {
      console.error('Errore salvataggio prodotto:', error);
      formErrors.general = [$t('errors.connectionError')];
    } finally {
      formLoading = false;
    }
  }
  
  async function deleteProdotto(prodotto) {
    if (!confirm($t('globalProducts.form.deleteConfirm', { descrizione: prodotto.descrizione }))) {
      return;
    }
    
    try {
      const response = await fetch(`/api/prodotti/${prodotto.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadProdotti();
      } else {
        const errorData = await response.json();
        alert(errorData.error || $t('errors.deleteError'));
      }
    } catch (error) {
      console.error('Errore eliminazione prodotto:', error);
      alert($t('errors.connectionError'));
    }
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
  
  /* Modal styles */
  .modal-backdrop {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
  }
  
  .modal-content {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-header {
    @apply flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700;
  }
</style>

<div class="w-full">
  <!-- Header con filtro committente -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          🎯 {$t('globalProducts.title')}
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">
        {$t('globalProducts.subtitle')}
      </p>
    </div>
    
    <!-- Controlli -->
    <div class="flex items-center gap-4">
      <!-- Nuovo Prodotto -->
      <button 
        on:click={() => openForm()}
        class="btn btn-sm btn-primary"
      >
        {$t('globalProducts.actions.addProduct')}
      </button>
      
      <!-- Refresh manuale -->
      <button 
        on:click={loadProdotti}
        class="btn btn-sm btn-secondary"
        title="{$t('globalProducts.refresh')}"
      >
        🔄
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600 dark:text-gray-400">{$t('globalProducts.loading')}</span>
    </div>
  {:else}
    <!-- Filtri -->
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">{$t('globalProducts.filters')}</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          
          <!-- Ricerca -->
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="{$t('globalProducts.search')}"
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
              <option value="">{$t('globalProducts.allClients')}</option>
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
              <option value="">{$t('globalProducts.allCategories')}</option>
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
              <option value="">{$t('globalProducts.allStates')}</option>
              <option value="1">✅ {$t('globalProducts.active')}</option>
              <option value="0">❌ {$t('globalProducts.inactive')}</option>
            </select>
          </div>
          
          <!-- Reset -->
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={clearAllFilters}
              title="{$t('globalProducts.resetFilters')}"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {prodotti.length} {$t('globalProducts.productsCount')}
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('globalProducts.statistics.totalProducts')}</p>
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('globalProducts.statistics.active')}</p>
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('globalProducts.statistics.clients')}</p>
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('globalProducts.statistics.lowStock')}</p>
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
            {$t('globalProducts.table.title')} {selectedCommittente ? `${$t('globalProducts.table.titleWithClient')} ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : $t('globalProducts.table.titleAll')}
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
                      {$t('globalProducts.table.headers.client')}
                      {#if sortColumn === 'committente_nome'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('committente_nome')}
                      title="{$t('globalProducts.table.filters.filterClient')}"
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
                          {$t('globalProducts.table.filters.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('committente_nome') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2 rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
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
                      {$t('globalProducts.table.headers.code')}
                      {#if sortColumn === 'codice'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('codice')}
                      title="{$t('globalProducts.table.filters.filterCode')}"
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
                          {$t('globalProducts.table.filters.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('codice') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2 rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
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
                      {$t('globalProducts.table.headers.description')}
                      {#if sortColumn === 'descrizione'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('descrizione')}
                      title="{$t('globalProducts.table.filters.filterDescription')}"
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
                          {$t('globalProducts.table.filters.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('descrizione') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2 rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
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
                      {$t('globalProducts.table.headers.category')}
                      {#if sortColumn === 'categoria_descrizione'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('categoria_descrizione')}
                      title="{$t('globalProducts.table.filters.filterCategory')}"
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
                          {$t('globalProducts.table.filters.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('categoria_descrizione') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2 rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
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
                    {$t('globalProducts.table.headers.currentStock')}
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
                    {$t('globalProducts.table.headers.minStock')}
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
                    {$t('globalProducts.table.headers.value')}
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
                      {$t('globalProducts.table.headers.status')}
                      {#if sortColumn === 'attivo'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('attivo')}
                      title="{$t('globalProducts.table.filters.filterStatus')}"
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
                          {$t('globalProducts.table.filters.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('attivo') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2 rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                            checked={columnFilters.attivo.includes(value)}
                            on:change={() => toggleFilterValue('attivo', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <th>{$t('globalProducts.table.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each prodotti as prodotto}
                <tr 
                  class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors"
                  on:click={() => viewGiacenze(prodotto)}
                  title="{$t('globalProducts.table.actions.viewStock')} - {prodotto.descrizione}"
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
                        class="btn btn-success btn-sm"
                        on:click|stopPropagation={() => openForm(prodotto)}
                        title="{$t('common.edit')}"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click|stopPropagation={() => deleteProdotto(prodotto)}
                        title="{$t('common.delete')}"
                      >
                        🗑️
                      </button>
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click|stopPropagation={() => viewGiacenze(prodotto)}
                        title="{$t('globalProducts.table.actions.viewStock')}"
                      >
                        📦
                      </button>
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
          {$t('globalProducts.emptyState.title')}
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">
          {$t('globalProducts.emptyState.description')}
        </p>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal Form Prodotti -->
{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header bg-white dark:bg-gray-800">
        <h2 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">
          {editingId ? $t('globalProducts.form.edit') : $t('globalProducts.form.add')}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200">
          ✖️
        </button>
      </div>
      
      <div class="flex bg-white dark:bg-gray-800">
        <!-- Colonna sinistra - Form principale -->
        <div class="flex-1 p-6">
          <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            
            <!-- Committente -->
            <div>
              <label class="form-label">{$t('globalProducts.form.client')} *</label>
              <select
                bind:value={formData.committente_id}
                class="form-input"
                class:border-red-500={formErrors.committente_id}
                class:bg-gray-100={editingId}
                class:dark:bg-gray-600={editingId}
                disabled={editingId}
                required
              >
                <option value="">{$t('globalProducts.form.selectClient')}</option>
                {#each committenti as committente}
                  <option value={committente.id}>{committente.ragione_sociale}</option>
                {/each}
              </select>
              {#if editingId}
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {$t('globalProducts.form.clientReadOnly')}
                </p>
              {/if}
              {#if formErrors.committente_id}
                <p class="form-error">{formErrors.committente_id.join(', ')}</p>
              {/if}
            </div>

            <!-- Codice -->
            <div>
              <label class="form-label">{$t('globalProducts.form.code')} *</label>
              <input
                type="text"
                bind:value={formData.codice}
                class="form-input"
                class:border-red-500={formErrors.codice}
                class:bg-gray-100={editingId}
                class:dark:bg-gray-600={editingId}
                placeholder="{$t('globalProducts.form.codePlaceholder')}"
                readonly={editingId}
                required
              />
              {#if editingId}
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {$t('globalProducts.form.codeReadOnly')}
                </p>
              {/if}
              {#if formErrors.codice}
                <p class="form-error">{formErrors.codice.join(', ')}</p>
              {/if}
            </div>

            <!-- Descrizione -->
            <div>
              <label class="form-label">{$t('globalProducts.form.description')} *</label>
              <input
                type="text"
                bind:value={formData.descrizione}
                class="form-input"
                class:border-red-500={formErrors.descrizione}
                placeholder="{$t('globalProducts.form.descriptionPlaceholder')}"
                required
              />
              {#if formErrors.descrizione}
                <p class="form-error">{formErrors.descrizione.join(', ')}</p>
              {/if}
            </div>

            <!-- Categoria -->
            <div>
              <label class="form-label">{$t('globalProducts.form.category')} *</label>
              <select
                bind:value={formData.categoria_id}
                class="form-input"
                class:border-red-500={formErrors.categoria_id}
                required
              >
                <option value="">{$t('globalProducts.form.selectCategory')}</option>
                {#each categorieComplete.filter(c => !formData.committente_id || c.committente_id == formData.committente_id) as categoria}
                  <option value={categoria.id}>{categoria.descrizione}</option>
                {/each}
              </select>
              {#if formErrors.categoria_id}
                <p class="form-error">{formErrors.categoria_id.join(', ')}</p>
              {/if}
            </div>

            <!-- Unità di Misura -->
            <div>
              <label class="form-label">{$t('globalProducts.form.unitOfMeasure')} *</label>
              <select
                bind:value={formData.unita_misura_id}
                class="form-input"
                class:border-red-500={formErrors.unita_misura_id}
                required
              >
                <option value="">{$t('globalProducts.form.selectUnit')}</option>
                {#each unitaMisura as um}
                  <option value={um.id}>{um.codice} - {um.descrizione}</option>
                {/each}
              </select>
              {#if formErrors.unita_misura_id}
                <p class="form-error">{formErrors.unita_misura_id.join(', ')}</p>
              {/if}
            </div>

            <!-- Prezzo Vendita -->
            <div>
              <label class="form-label">{$t('globalProducts.form.salePrice')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                bind:value={formData.prezzo_vendita}
                class="form-input"
                class:border-red-500={formErrors.prezzo_vendita}
                placeholder="{$t('globalProducts.form.salePricePlaceholder')}"
              />
              {#if formErrors.prezzo_vendita}
                <p class="form-error">{formErrors.prezzo_vendita.join(', ')}</p>
              {/if}
            </div>

            <!-- Scorte -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">{$t('globalProducts.form.minStock')}</label>
                <input
                  type="number"
                  min="0"
                  bind:value={formData.scorta_minima}
                  class="form-input"
                  class:border-red-500={formErrors.scorta_minima}
                  placeholder="{$t('globalProducts.form.minStockPlaceholder')}"
                />
                {#if formErrors.scorta_minima}
                  <p class="form-error">{formErrors.scorta_minima.join(', ')}</p>
                {/if}
              </div>
              
              <div>
                <label class="form-label">{$t('globalProducts.form.maxStock')}</label>
                <input
                  type="number"
                  min="0"
                  bind:value={formData.scorta_massima}
                  class="form-input"
                  class:border-red-500={formErrors.scorta_massima}
                  placeholder="{$t('globalProducts.form.maxStockPlaceholder')}"
                />
                {#if formErrors.scorta_massima}
                  <p class="form-error">{formErrors.scorta_massima.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Errori generali -->
            {#if formErrors.general}
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-600 text-sm">{formErrors.general.join(', ')}</p>
              </div>
            {/if}

            <!-- Bottoni -->
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" on:click={resetForm} class="btn btn-secondary">
                {$t('common.cancel')}
              </button>
              <button type="submit" disabled={formLoading} class="btn btn-primary">
                {#if formLoading}<div class="spinner w-4 h-4 mr-2"></div>{/if}
                {editingId ? $t('common.save') : $t('common.add')}
              </button>
            </div>
          </form>
        </div>

        <!-- Colonna destra - Controlli di Compatibilità -->
        <div class="w-80 bg-gray-50 dark:bg-gray-700 p-4 border-l">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-gray-100 mb-4 border-b pb-2">
            🔒 {$t('globalProducts.form.compatibility.title')}
          </h3>

          <div class="space-y-4">
            
            <!-- Categoria Sicurezza -->
            <div>
              <label class="form-label text-xs">🚨 {$t('globalProducts.form.compatibility.securityCategory')}</label>
              <select bind:value={formData.categoria_sicurezza} class="form-input text-xs">
                <option value="STANDARD">🟢 {$t('globalProducts.form.compatibility.standard')}</option>
                <option value="CHIMICO">🔴 {$t('globalProducts.form.compatibility.chemical')}</option>
                <option value="ALIMENTARE">🟡 {$t('globalProducts.form.compatibility.food')}</option>
                <option value="FARMACEUTICO">💊 {$t('globalProducts.form.compatibility.pharmaceutical')}</option>
                <option value="INFIAMMABILE">🔥 {$t('globalProducts.form.compatibility.flammable')}</option>
              </select>
            </div>

            <!-- Controlli Temperatura -->
            <div>
              <div class="flex items-center space-x-2 mb-2">
                <input type="checkbox" id="temp_ctrl" bind:checked={formData.richiede_temperatura_controllata} class="rounded text-blue-600" />
                <label for="temp_ctrl" class="text-xs font-medium">🌡️ {$t('globalProducts.form.compatibility.temperatureControl')}</label>
              </div>
              
              {#if formData.richiede_temperatura_controllata}
                <div class="grid grid-cols-2 gap-2 ml-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div>
                    <label class="form-label text-xs">{$t('globalProducts.form.compatibility.minTemp')}</label>
                    <input type="number" step="0.1" bind:value={formData.temperatura_min} class="form-input text-xs" placeholder="2" />
                  </div>
                  <div>
                    <label class="form-label text-xs">{$t('globalProducts.form.compatibility.maxTemp')}</label>
                    <input type="number" step="0.1" bind:value={formData.temperatura_max} class="form-input text-xs" placeholder="8" />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Controlli Accesso -->
            <div>
              <label class="form-label text-xs mb-2 block">🔐 {$t('globalProducts.form.compatibility.accessControls')}</label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <input type="checkbox" id="acc_ctrl" bind:checked={formData.richiede_accesso_controllato} class="rounded text-red-600" />
                  <label for="acc_ctrl" class="text-xs">🔐 {$t('globalProducts.form.compatibility.controlledAccess')}</label>
                </div>
                <div class="flex items-center space-x-2">
                  <input type="checkbox" id="incomp_alim" bind:checked={formData.incompatibile_con_alimentari} class="rounded text-orange-600" />
                  <label for="incomp_alim" class="text-xs">🚫 {$t('globalProducts.form.compatibility.incompatibleFood')}</label>
                </div>
                <div class="flex items-center space-x-2">
                  <input type="checkbox" id="track_lotto" bind:checked={formData.tracking_lotto_obbligatorio} class="rounded text-purple-600" />
                  <label for="track_lotto" class="text-xs">📋 {$t('globalProducts.form.compatibility.batchTracking')}</label>
                </div>
              </div>
            </div>

            <!-- Dimensioni Fisiche -->
            <div>
              <label class="form-label text-xs mb-2 block">📦 {$t('globalProducts.form.compatibility.physicalDimensions')}</label>
              <div class="space-y-2">
                <div>
                  <label class="form-label text-xs">⚖️ {$t('globalProducts.form.compatibility.unitWeight')}</label>
                  <input type="number" step="0.001" bind:value={formData.peso_unitario_kg} class="form-input text-xs" placeholder="0.000" />
                </div>
                <div>
                  <label class="form-label text-xs">📦 {$t('globalProducts.form.compatibility.unitVolume')}</label>
                  <input type="number" bind:value={formData.volume_unitario_cm3} class="form-input text-xs" placeholder="0" />
                </div>
                <div>
                  <label class="form-label text-xs">📏 {$t('globalProducts.form.compatibility.height')}</label>
                  <input type="number" step="0.1" bind:value={formData.altezza_cm} class="form-input text-xs" placeholder="0.0" />
                </div>
              </div>
            </div>

            <!-- Shelf Life -->
            <div>
              <label class="form-label text-xs">📅 {$t('globalProducts.form.compatibility.shelfLife')}</label>
              <input type="number" bind:value={formData.shelf_life_giorni} class="form-input text-xs" placeholder="365 (opzionale)" />
            </div>

            <!-- Codici per sostanze pericolose -->
            {#if formData.categoria_sicurezza === 'CHIMICO' || formData.categoria_sicurezza === 'INFIAMMABILE'}
              <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded border">
                <label class="form-label text-xs">⚠️ {$t('globalProducts.form.compatibility.adrCode')}</label>
                <input type="text" bind:value={formData.codice_adr} class="form-input text-xs mt-1" placeholder="UN1203, UN1805" />
                <p class="text-xs text-red-600 mt-1">{$t('globalProducts.form.compatibility.adrCodeDesc')}</p>
              </div>
            {/if}

            {#if formData.categoria_sicurezza === 'CHIMICO'}
              <div>
                <label class="form-label text-xs">⚠️ {$t('globalProducts.form.compatibility.dangerClass')}</label>
                <select bind:value={formData.classe_pericolo} class="form-input text-xs">
                  <option value="">{$t('globalProducts.form.compatibility.selectDangerClass')}</option>
                  <option value="CLASSE_1">{$t('globalProducts.form.compatibility.class1')}</option>
                  <option value="CLASSE_2">{$t('globalProducts.form.compatibility.class2')}</option>
                  <option value="CLASSE_3">{$t('globalProducts.form.compatibility.class3')}</option>
                  <option value="CLASSE_4">{$t('globalProducts.form.compatibility.class4')}</option>
                  <option value="CLASSE_5">{$t('globalProducts.form.compatibility.class5')}</option>
                  <option value="CLASSE_6">{$t('globalProducts.form.compatibility.class6')}</option>
                  <option value="CLASSE_8">{$t('globalProducts.form.compatibility.class8')}</option>
                  <option value="CLASSE_9">{$t('globalProducts.form.compatibility.class9')}</option>
                </select>
              </div>
            {/if}

          </div>
        </div>
      </div>
    </div>
  </div>
{/if}