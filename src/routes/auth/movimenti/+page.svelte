<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import TransferModal from '$lib/components/TransferModal.svelte';
  import { t } from '$lib/i18n';
  
  export let data; // Dati dal server
  
  let loading = false;
  let movimentiOriginali = []; // Lista completa per filtri lato client
  let dateFilter = {
    from: '',
    to: ''
  };
  let selectedCommittente = '';
  
  // Sorting state
  let sortColumn = 'data_movimento';
  let sortDirection = 'desc';
  
  // Column filters state - Excel style
  let columnFilters = {
    tipo_movimento: [],
    committente_nome: [],
    prodotto_codice: [],
    operatore: [],
    ordine_numero: [],
    categoria_nome: [],
    fornitore_nome: []
  };
  
  // Filter dropdowns visibility
  let showFilters = {
    tipo_movimento: false,
    committente_nome: false,
    prodotto_codice: false,
    operatore: false,
    ordine_numero: false,
    categoria_nome: false,
    fornitore_nome: false
  };
  
  // Transfer modal state
  let showTransferModal = false;
  let selectedTransferProduct = null;
  let selectedTransferCommittente = null;
  
  // Load modal state
  let showLoadModal = false;
  let loadForm = {
    committente_id: '',
    ordine_id: '',
    prodotto_id: '',
    quantita: '',
    ubicazione_id: '',
    udc_id: '',
    tipo_udc_id: '1', // Default: Pallet EPAL
    prezzo: '',
    note: '',
    // Nuovi campi facoltativi
    lotto: '',
    data_scadenza: '',
    peso_lordo: '',
    peso_netto: ''
  };
  let ordiniDisponibili = [];
  let prodottiDisponibili = [];
  let ubicazioniDisponibili = [];
  let udcDisponibili = [];
  let tipiUdcDisponibili = [];
  
  // Filtri completi lato client con sorting
  function applyFiltersAndSort() {
    if (!data.movimenti || data.movimenti.length === 0) {
      movimenti = [];
      return;
    }
    
    let filtered = data.movimenti.filter(movimento => {
      // Filtro committente base
      if (selectedCommittente && selectedCommittente !== '' && movimento.committente_id != selectedCommittente) {
        return false;
      }
      
      // Filtri colonna Excel-style
      for (let column in columnFilters) {
        if (columnFilters[column].length > 0) {
          let value = movimento[column] || '-';
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
        
        // Handle dates
        if (sortColumn === 'data_movimento') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        // Handle numbers
        else if (['quantita', 'prezzo', 'valore_totale'].includes(sortColumn)) {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
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
    
    movimenti = filtered;
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
    if (!data.movimenti) return [];
    
    const values = data.movimenti.map(m => m[column] || '-');
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
    selectedCommittente = '';
    applyFiltersAndSort();
  }
  
  // Filtri date server-side
  function updateDateFilters() {
    const params = new URLSearchParams();
    if (dateFilter.from) params.append('data_da', dateFilter.from);
    if (dateFilter.to) params.append('data_a', dateFilter.to);
    if (selectedCommittente) params.append('committente', selectedCommittente);
    goto(`?${params.toString()}`);
  }
  
  // Usa i dati dal server
  let movimenti = [];
  $: committenti = data.committenti || [];
  $: apiStats = data.statistiche || {};
  
  // Applica filtri e sorting ai dati server
  $: if (data.movimenti || selectedCommittente !== undefined) {
    applyFiltersAndSort();
  }
  
  
  onMount(async () => {
    // Inizializza filtri date con valori di default
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter.from = lastWeek.toISOString().split('T')[0];
    dateFilter.to = today.toISOString().split('T')[0];
    applyFiltersAndSort();
    
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
  });
  
  
  
  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getMovementTypeLabel(tipo) {
    const labels = {
      'CARICO': { label: 'Carico', class: 'bg-green-100 text-green-800', icon: '📥' },
      'SCARICO': { label: 'Scarico', class: 'bg-red-100 text-red-800', icon: '📤' },
      'RETTIFICA_POSITIVA': { label: 'Rett. +', class: 'bg-blue-100 text-blue-800', icon: '➕' },
      'RETTIFICA_NEGATIVA': { label: 'Rett. -', class: 'bg-orange-100 text-orange-800', icon: '➖' },
      'TRASFERIMENTO': { label: 'Trasferimento', class: 'bg-purple-100 text-purple-800', icon: '🔄' },
      'RECEIVE': { label: 'Ricevimento', class: 'bg-green-100 text-green-800', icon: '📦' },
      'PUT_AWAY': { label: 'Stoccaggio', class: 'bg-blue-100 text-blue-800', icon: '🏠' },
      'PICK': { label: 'Prelievo', class: 'bg-orange-100 text-orange-800', icon: '👋' },
      'CROSS_DOCK': { label: 'Cross-dock', class: 'bg-yellow-100 text-yellow-800', icon: '⚡' }
    };
    return labels[tipo] || { label: tipo, class: 'bg-neutral-100 text-neutral-800', icon: '📋' };
  }
  
  function calculateStats() {
    // Se abbiamo statistiche dall'API, usale
    if (apiStats && typeof apiStats === 'object' && apiStats.totale_movimenti !== undefined) {
      return {
        totalMovimenti: apiStats.totale_movimenti || 0,
        carichi: apiStats.carichi || 0,
        scarichi: apiStats.scarichi || 0,
        valoreTotale: apiStats.valore_totale_movimenti || 0
      };
    }
    
    // Altrimenti calcola localmente (per API committente)
    const carichi = movimenti.filter(m => ['CARICO', 'RECEIVE', 'RETTIFICA_POSITIVA', 'RETTIFICA_POS'].includes(m.tipo_movimento));
    const scarichi = movimenti.filter(m => ['SCARICO', 'PICK', 'RETTIFICA_NEGATIVA', 'RETTIFICA_NEG'].includes(m.tipo_movimento));
    
    return {
      totalMovimenti: movimenti.length || 0,
      carichi: carichi.length || 0,
      scarichi: scarichi.length || 0,
      valoreTotale: movimenti.reduce((sum, m) => sum + ((m.quantita * (m.prezzo || m.costo_unitario || 0))), 0) || 0
    };
  }
  
  $: stats = calculateStats();
  
  // Transfer functions
  function openTransferModal(movimento) {
    selectedTransferProduct = {
      id: movimento.prodotto_id,
      codice: movimento.prodotto_codice,
      descrizione: movimento.prodotto_descrizione
    };
    selectedTransferCommittente = {
      id: movimento.committente_id,
      nome: movimento.committente_nome
    };
    showTransferModal = true;
  }
  
  function handleTransferSuccess(event) {
    // Ricarica la pagina per aggiornare i movimenti
    window.location.reload();
  }
  
  function handleTransferClose() {
    showTransferModal = false;
    selectedTransferProduct = null;
    selectedTransferCommittente = null;
  }

  // Load modal functions - reactive per committente
  $: if (loadForm.committente_id && showLoadModal) {
    loadOrdiniAndProdotti();
  }
  
  async function loadOrdiniAndProdotti() {
    if (!loadForm.committente_id) {
      ordiniDisponibili = [];
      prodottiDisponibili = [];
      return;
    }
    
    console.log('Caricamento dati per committente:', loadForm.committente_id);
    
    // Carica ordini per il committente selezionato
    try {
      const response = await fetch(`/api/ordini?committente=${loadForm.committente_id}&tipo=INBOUND&stato=NUOVO,IN_PREPARAZIONE`);
      if (response.ok) {
        ordiniDisponibili = await response.json();
        console.log('Ordini caricati:', ordiniDisponibili.length);
      } else {
        console.error('Errore risposta ordini:', response.status);
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    }
    
    // Carica prodotti per committente solo se non c'è un ordine selezionato
    if (!loadForm.ordine_id) {
      await loadProdottiCommittente();
    }
  }
  
  async function onOrdineChange() {
    if (!loadForm.ordine_id) {
      // Se deseleziono l'ordine, ricarico tutti i prodotti del committente
      if (loadForm.committente_id) {
        await loadProdottiCommittente();
      }
      return;
    }
    
    // Filtra i prodotti per mostrare solo quelli dell'ordine selezionato
    const ordineSelezionato = ordiniDisponibili.find(o => o.id == loadForm.ordine_id);
    if (ordineSelezionato && ordineSelezionato.prodotti) {
      // Sostituisci l'array prodotti con solo quelli dell'ordine
      prodottiDisponibili = ordineSelezionato.prodotti.map(p => ({
        id: p.id,
        codice: p.codice,
        descrizione: p.descrizione,
        prezzo_unitario: p.prezzo_unitario
      }));
      
      console.log(`Prodotti filtrati per ordine ${loadForm.ordine_id}:`, prodottiDisponibili.length);
      
      // Se l'ordine ha un solo prodotto, lo pre-seleziona
      if (prodottiDisponibili.length === 1) {
        loadForm.prodotto_id = prodottiDisponibili[0].id;
        loadForm.prezzo = prodottiDisponibili[0].prezzo_unitario;
      }
    }
  }
  
  async function loadProdottiCommittente() {
    try {
      const response = await fetch(`/api/prodotti?committente=${loadForm.committente_id}`);
      if (response.ok) {
        prodottiDisponibili = await response.json();
        console.log('Tutti i prodotti del committente caricati:', prodottiDisponibili.length);
      }
    } catch (error) {
      console.error('Errore caricamento prodotti committente:', error);
    }
  }
  
  async function loadUbicazioniAndUdc() {
    // Carica ubicazioni disponibili
    try {
      const response = await fetch('/api/ubicazioni?disponibili=true');
      if (response.ok) {
        ubicazioniDisponibili = await response.json();
      }
    } catch (error) {
      console.error('Errore caricamento ubicazioni:', error);
    }
    
    // Carica UDC disponibili
    try {
      const response = await fetch('/api/udc?stato=VUOTO,PARZIALE');
      if (response.ok) {
        udcDisponibili = await response.json();
      }
    } catch (error) {
      console.error('Errore caricamento UDC:', error);
    }
    
    // Carica tipi UDC disponibili
    try {
      const response = await fetch('/api/tipi-udc');
      if (response.ok) {
        const result = await response.json();
        tipiUdcDisponibili = result.success ? result.data : [];
        console.log('DEBUG: Caricati tipi UDC:', tipiUdcDisponibili.length);
      }
    } catch (error) {
      console.error('Errore caricamento tipi UDC:', error);
      tipiUdcDisponibili = [];
    }
  }
  
  function openLoadModal() {
    showLoadModal = true;
    loadUbicazioniAndUdc();
    // Reset form
    loadForm = {
      committente_id: '',
      ordine_id: '',
      prodotto_id: '',
      quantita: '',
      ubicazione_id: '',
      udc_id: '',
      tipo_udc_id: '1', // Default: Pallet EPAL
      prezzo: '',
      note: '',
      // Nuovi campi facoltativi
      lotto: '',
      data_scadenza: '',
      peso_lordo: '',
      peso_netto: ''
    };
  }
  
  function closeLoadModal() {
    showLoadModal = false;
    // Reset arrays
    ordiniDisponibili = [];
    prodottiDisponibili = [];
    ubicazioniDisponibili = [];
    udcDisponibili = [];
  }
  
  async function submitLoad() {
    console.log('=== SUBMIT LOAD - INIZIO ===');
    console.log('Form dati prima validazione:', loadForm);
    
    if (!loadForm.committente_id || !loadForm.ordine_id || !loadForm.prodotto_id || !loadForm.quantita || !loadForm.ubicazione_id) {
      console.log('❌ VALIDAZIONE FALLITA:', {
        committente_id: loadForm.committente_id,
        ordine_id: loadForm.ordine_id,
        prodotto_id: loadForm.prodotto_id,
        quantita: loadForm.quantita,
        ubicazione_id: loadForm.ubicazione_id
      });
      alert($t('validation.required'));
      return;
    }
    
    console.log('✅ VALIDAZIONE OK - Creazione FormData...');
    
    try {
      const formData = new FormData();
      formData.append('committente_id', loadForm.committente_id);
      formData.append('tipo_movimento', 'CARICO');
      formData.append('prodotto_id', loadForm.prodotto_id);
      formData.append('quantita', loadForm.quantita);
      formData.append('ubicazione_id', loadForm.ubicazione_id);
      if (loadForm.udc_id) formData.append('udc_id', loadForm.udc_id);
      formData.append('tipo_udc_id', loadForm.tipo_udc_id);
      formData.append('ordine_id', loadForm.ordine_id);
      if (loadForm.prezzo) formData.append('prezzo', loadForm.prezzo);
      formData.append('causale', 'Carico diretto da movimenti globali');
      formData.append('note', loadForm.note || 'Carico automatico via interfaccia web');
      
      // Campi facoltativi
      if (loadForm.lotto) formData.append('lotto', loadForm.lotto);
      if (loadForm.data_scadenza) formData.append('data_scadenza', loadForm.data_scadenza);
      if (loadForm.peso_lordo) formData.append('peso_lordo', loadForm.peso_lordo);
      if (loadForm.peso_netto) formData.append('peso_netto', loadForm.peso_netto);
      
      // Log dettagliato di tutti i campi
      console.log('📝 FORMDATA PREPARATA:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: "${value}"`);
      }
      
      const response = await fetch('/auth/movimenti/nuovo?/create', {
        method: 'POST',
        body: formData
      });
      
      console.log('Risposta ricevuta dal backend:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        console.log('=== SUCCESSO - CARICO COMPLETATO ===');
        closeLoadModal();
        // Ricarica la pagina per vedere il nuovo movimento
        window.location.reload();
      } else {
        console.error('ERRORE HTTP nella risposta:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('Dettagli errore JSON:', errorData);
          alert($t('errors.generic') + ': ' + (errorData.message || $t('errors.generic')));
        } catch (e) {
          console.error('Impossibile leggere dettagli errore come JSON, provo text:', e);
          const errorText = await response.text();
          console.error('Errore come testo:', errorText);
          alert($t('errors.generic') + ': ' + errorText);
        }
      }
    } catch (error) {
      console.error('Errore submit carico:', error);
      alert($t('errors.generic'));
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
  <!-- Header con filtri -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">
          📋 {$t('movements.title')}
        </h1>
        <p class="text-neutral-600 dark:text-gray-400">
          {$t('layout.globalMovementsDesc')}
        </p>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-3">
        <button 
          class="btn btn-neutral"
          on:click={() => window.location.reload()}
          title="{$t('common.refresh')}"
        >
          🔄 {$t('common.refresh')}
        </button>
        <button 
          class="btn btn-success"
          on:click={openLoadModal}
          title="{$t('movements.quickLoad')}"
        >
          📥 {$t('movements.quickLoad')}
        </button>
        <button 
          class="btn btn-primary"
          on:click={() => showTransferModal = true}
          title="{$t('movements.add')}"
        >
          🔄 {$t('movements.add')}
        </button>
      </div>
    </div>
    
    <!-- Pannello Filtri -->
    <div class="card mb-6">
      <div class="card-header py-3">
        <h3 class="text-md font-semibold text-neutral-900 flex items-center gap-2">
          <span class="text-lg">🔍</span>
          <span>{$t('common.filter')}</span>
        </h3>
      </div>
      <div class="card-body py-4">
        <div class="flex items-end gap-2 flex-nowrap">
          <!-- Filtro Committente -->
          <div class="min-w-36">
            <select 
              id="committente-filter"
              bind:value={selectedCommittente}
              class="form-input text-sm"
            >
              <option value="">{$t('common.all')} {$t('categories.client').toLowerCase()}</option>
              {#each committenti as committente}
                <option value={committente.id}>
                  {committente.ragione_sociale}
                </option>
              {/each}
            </select>
          </div>
          
          <!-- Filtro Data Da -->
          <div class="min-w-32">
            <input 
              type="date" 
              id="date-from"
              bind:value={dateFilter.from}
              on:change={updateDateFilters}
              class="form-input text-sm"
            />
          </div>
          
          <!-- Filtro Data A -->
          <div class="min-w-32">
            <input 
              type="date" 
              id="date-to"
              bind:value={dateFilter.to}
              on:change={updateDateFilters}
              class="form-input text-sm"
            />
          </div>
          
          <!-- Pulsante Reset -->
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={clearAllFilters}
              title="{$t('common.refresh')} {$t('common.filter').toLowerCase()}"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {movimenti.length} {$t('movements.title').toLowerCase()}
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600 dark:text-gray-400">{$t('common.loading')}</span>
    </div>
  {:else}
    <!-- Statistiche -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">📊</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('movements.title')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{stats.totalMovimenti}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">📥</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('movements.types.inbound')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{stats.carichi}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-red-100">
            <span class="text-red-600 text-xl">📤</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('movements.types.outbound')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{stats.scarichi}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">💰</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('movements.table.movementsValue')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">€ {(stats.valoreTotale || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista Movimenti -->
    {#if movimenti.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            {$t('movements.table.historyTitle')} {selectedCommittente ? `- ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : `(${$t('common.all')})`}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <!-- Data/Ora -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('data_movimento')}
                    >
                      {$t('movements.table.dateTime')}
                      {#if sortColumn === 'data_movimento'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                  </div>
                </th>
                
                <!-- Committente -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('committente_nome')}
                    >
                      {$t('movements.table.client')}
                      {#if sortColumn === 'committente_nome'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('committente_nome')}
                      title="{$t('movements.table.filterClient')}"
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
                          {$t('movements.table.clearFilter')}
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
                
                <!-- Tipo -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('tipo_movimento')}
                    >
                      {$t('movements.table.type')}
                      {#if sortColumn === 'tipo_movimento'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('tipo_movimento')}
                      title="{$t('movements.table.filterType')}"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.tipo_movimento}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-48 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('tipo_movimento')}
                        >
                          {$t('movements.table.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('tipo_movimento') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.tipo_movimento.includes(value)}
                            on:change={() => toggleFilterValue('tipo_movimento', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <!-- Ordine -->
                <th class="sortable-header">
                  <button 
                    class="flex items-center gap-1 hover:text-blue-600"
                    on:click={() => sortBy('ordine_numero')}
                  >
                    {$t('movements.table.order')}
                    {#if sortColumn === 'ordine_numero'}
                      <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    {/if}
                  </button>
                </th>
                
                <!-- Prodotto -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('prodotto_codice')}
                    >
                      {$t('movements.table.product')}
                      {#if sortColumn === 'prodotto_codice'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('prodotto_codice')}
                      title="{$t('movements.table.filterProduct')}"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.prodotto_codice}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-56 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('prodotto_codice')}
                        >
                          {$t('movements.table.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('prodotto_codice') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.prodotto_codice.includes(value)}
                            on:change={() => toggleFilterValue('prodotto_codice', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <!-- Quantità -->
                <th class="sortable-header">
                  <button 
                    class="flex items-center gap-1 hover:text-blue-600"
                    on:click={() => sortBy('quantita')}
                  >
                    {$t('movements.table.quantity')}
                    {#if sortColumn === 'quantita'}
                      <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    {/if}
                  </button>
                </th>
                
                <!-- Costo Unitario -->
                <th class="sortable-header">
                  <button 
                    class="flex items-center gap-1 hover:text-blue-600"
                    on:click={() => sortBy('prezzo')}
                  >
                    {$t('movements.table.unitCost')}
                    {#if sortColumn === 'prezzo'}
                      <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    {/if}
                  </button>
                </th>
                
                <!-- Valore Totale -->
                <th class="sortable-header">
                  <button 
                    class="flex items-center gap-1 hover:text-blue-600"
                    on:click={() => sortBy('valore_totale')}
                  >
                    {$t('movements.table.totalValue')}
                    {#if sortColumn === 'valore_totale'}
                      <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    {/if}
                  </button>
                </th>
                
                <th>{$t('movements.table.locations')}</th>
                <th>{$t('movements.table.udc')}</th>
                <th>{$t('movements.table.lot')}</th>
                <th>{$t('movements.table.expiry')}</th>
                <th>{$t('movements.table.weight')}</th>
                
                <!-- Operatore -->
                <th class="sortable-header relative">
                  <div class="flex items-center justify-between">
                    <button 
                      class="flex items-center gap-1 hover:text-blue-600"
                      on:click={() => sortBy('operatore')}
                    >
                      {$t('movements.table.operator')}
                      {#if sortColumn === 'operatore'}
                        <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      {/if}
                    </button>
                    <button 
                      class="ml-1 text-xs hover:text-blue-600" 
                      on:click={() => toggleColumnFilter('operatore')}
                      title="{$t('movements.table.filterOperator')}"
                    >
                      🔽
                    </button>
                  </div>
                  
                  {#if showFilters.operatore}
                    <div class="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded mt-1 w-48 max-h-64 overflow-y-auto">
                      <div class="p-2 border-b">
                        <button 
                          class="text-xs text-blue-600 hover:underline"
                          on:click={() => clearColumnFilter('operatore')}
                        >
                          {$t('movements.table.clearFilter')}
                        </button>
                      </div>
                      {#each getUniqueValues('operatore') as value}
                        <label class="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            class="mr-2"
                            checked={columnFilters.operatore.includes(value)}
                            on:change={() => toggleFilterValue('operatore', value)}
                          />
                          {value}
                        </label>
                      {/each}
                    </div>
                  {/if}
                </th>
                
                <th>{$t('common.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {#each movimenti as movimento}
                {@const movementType = getMovementTypeLabel(movimento.tipo_movimento)}
                <tr>
                  <td class="text-sm">
                    {movimento.data_movimento_formatted}
                  </td>
                  <td>
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span class="text-sm font-medium">
                        {movimento.committente_nome}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="badge text-xs {movementType.class}">
                      {movementType.icon} {movementType.label}
                    </span>
                  </td>
                  <td>
                    {#if movimento.ordine_numero}
                      <div class="text-xs">
                        <div class="font-mono text-sm text-blue-600">{movimento.ordine_numero}</div>
                        <div class="text-xs text-neutral-500 uppercase">
                          {movimento.ordine_tipo === 'INBOUND' ? '📥 IN' : movimento.ordine_tipo === 'OUTBOUND' ? '📤 OUT' : '-'}
                        </div>
                      </div>
                    {:else}
                      <span class="text-neutral-400 text-xs">-</span>
                    {/if}
                  </td>
                  <td>
                    <div>
                      <div class="font-mono text-sm">{movimento.prodotto_codice}</div>
                      <div class="text-xs text-neutral-600 dark:text-gray-400">{movimento.prodotto_descrizione || '-'}</div>
                    </div>
                  </td>
                  <td class="text-center font-bold">
                    <span class="{['SCARICO', 'PICK', 'RETTIFICA_NEGATIVA'].includes(movimento.tipo_movimento) ? 'text-red-600' : 'text-green-600'}">
                      {['SCARICO', 'PICK', 'RETTIFICA_NEGATIVA'].includes(movimento.tipo_movimento) ? '-' : '+'}{movimento.quantita}
                    </span>
                  </td>
                  <td class="text-right">
                    {movimento.prezzo > 0 ? `€ ${movimento.prezzo.toFixed(2)}` : '-'}
                  </td>
                  <td class="text-right font-semibold">
                    {movimento.valore_totale > 0 ? 
                      `€ ${movimento.valore_totale.toFixed(2)}` : '-'}
                  </td>
                  <td class="text-sm">
                    {#if movimento.ubicazione_da && movimento.ubicazione_a}
                      <div class="text-xs">
                        <div>{$t('movements.table.from')}: <span class="font-mono text-blue-600">{movimento.ubicazione_da}</span></div>
                        <div>{$t('movements.table.to')}: <span class="font-mono text-blue-600">{movimento.ubicazione_a}</span></div>
                      </div>
                    {:else if movimento.ubicazione_da}
                      <span class="font-mono text-blue-600">{movimento.ubicazione_da}</span>
                    {:else if movimento.ubicazione_a}
                      <span class="font-mono text-blue-600">{movimento.ubicazione_a}</span>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  <td class="text-sm">
                    {#if movimento.udc_barcode && movimento.udc_barcode !== '-'}
                      <div class="text-xs">
                        <div class="font-mono font-bold text-green-600">{movimento.udc_barcode}</div>
                        <div class="text-xs text-neutral-500 uppercase">{movimento.udc_tipo}</div>
                      </div>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  
                  <!-- Lotto -->
                  <td class="text-sm text-center">
                    {#if movimento.lotto && movimento.lotto !== '-'}
                      <span class="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-mono">
                        {movimento.lotto}
                      </span>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  
                  <!-- Scadenza -->
                  <td class="text-sm text-center">
                    {#if movimento.scadenza && movimento.scadenza !== '-'}
                      <span class="text-red-600 font-mono text-xs">
                        {movimento.scadenza}
                      </span>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  
                  <!-- Peso (Lordo / Netto) -->
                  <td class="text-sm text-center">
                    {#if movimento.peso_lordo > 0 || movimento.peso_netto > 0}
                      <div class="text-xs">
                        {#if movimento.peso_lordo > 0}
                          <div class="text-blue-600 font-semibold">{$t('movements.table.grossWeight')}: {movimento.peso_lordo}kg</div>
                        {/if}
                        {#if movimento.peso_netto > 0}
                          <div class="text-green-600">{$t('movements.table.netWeight')}: {movimento.peso_netto}kg</div>
                        {/if}
                      </div>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  
                  <td class="text-sm">
                    {movimento.operatore || $t('movements.table.system')}
                  </td>
                  <td class="text-sm w-full truncate" title={movimento.note || ''}>
                    {movimento.note || '-'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          {$t('movements.table.noMovements')}
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">
          {selectedCommittente ? $t('movements.table.noMovementsForClient') : $t('movements.table.noMovementsInPeriod')}
        </p>
      </div>
    {/if}
  {/if}
</div>

<!-- Transfer Modal -->
<TransferModal 
  bind:show={showTransferModal}
  prodotto={selectedTransferProduct}
  committente={selectedTransferCommittente}
  giacenzaDisponibile={0}
  on:success={handleTransferSuccess}
  on:close={handleTransferClose}
/>

<!-- Load Modal -->
{#if showLoadModal}
  <div class="modal-backdrop" on:click={closeLoadModal}>
    <div class="modal-content" on:click|stopPropagation>
      
      <!-- Header moderno -->
      <div class="modal-header bg-white dark:bg-gray-800">
        <h2 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">
          📥 {$t('movements.load.title')}
        </h2>
        <button 
          class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
          on:click={closeLoadModal}
        >
          ×
        </button>
      </div>
      
      <!-- Content scrollabile -->
      <div class="flex bg-white dark:bg-gray-800">
        <div class="flex-1 p-6">
          <form on:submit|preventDefault={submitLoad} class="space-y-4">
          
          <!-- Riga 1: Cliente e Ordine -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Cliente -->
            <div>
              <label class="form-label">{$t('movements.load.client')} *</label>
              <select 
                bind:value={loadForm.committente_id}
                class="form-input"
                required
              >
                <option value="">{$t('movements.load.selectClient')}</option>
                {#each committenti as committente}
                  <option value={committente.id}>{committente.ragione_sociale}</option>
                {/each}
              </select>
            </div>

            <!-- Ordine -->
            <div>
              <label class="form-label">{$t('movements.load.order')} *</label>
              <select 
                bind:value={loadForm.ordine_id}
                on:change={onOrdineChange}
                class="form-input"
                disabled={!loadForm.committente_id}
                required
              >
                <option value="">{$t('movements.load.selectOrder')}</option>
                {#each ordiniDisponibili as ordine}
                  <option value={ordine.id}>{ordine.numero_ordine} - {ordine.cliente_fornitore}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <!-- Riga 2: Prodotto -->
          <div>
            <label class="form-label">{$t('movements.load.product')} *</label>
            <select 
              bind:value={loadForm.prodotto_id}
              class="form-input"
              required
              disabled={!loadForm.committente_id}
            >
              <option value="">{$t('movements.load.selectProduct')}</option>
              {#each prodottiDisponibili as prodotto}
                <option value={prodotto.id}>{prodotto.codice} - {prodotto.descrizione}</option>
              {/each}
            </select>
          </div>
          
          <!-- Riga 3: Quantità, Prezzo, Ubicazione -->
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="form-label">{$t('movements.load.quantity')} *</label>
              <input 
                type="number" 
                bind:value={loadForm.quantita}
                class="form-input"
                placeholder="{$t('movements.load.quantityPlaceholder')}"
                min="1"
                required
              />
            </div>
            <div>
              <label class="form-label">{$t('movements.load.unitPrice')}</label>
              <input 
                type="number" 
                step="0.01"
                bind:value={loadForm.prezzo}
                class="form-input"
                placeholder="{$t('movements.load.pricePlaceholder')}"
              />
            </div>
            <div>
              <label class="form-label">{$t('movements.load.location')} *</label>
              <select 
                bind:value={loadForm.ubicazione_id}
                class="form-input"
                required
              >
                <option value="">{$t('movements.load.selectLocation')}</option>
                {#each ubicazioniDisponibili as ubicazione}
                  <option value={ubicazione.id}>{ubicazione.codice_ubicazione} - {ubicazione.zona}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <!-- Riga 4: UDC e Tipo UDC -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">{$t('movements.load.udc')}</label>
              <select 
                bind:value={loadForm.udc_id}
                class="form-input"
              >
                <option value="">{$t('movements.load.createNewUdc')}</option>
                {#each udcDisponibili as udc}
                  <option value={udc.id}>{udc.barcode} - {udc.tipo_udc ? $t(`udc.types.${udc.tipo_udc}`) || udc.tipo_udc : 'Standard'}</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="form-label">{$t('movements.load.udcType')}</label>
              <select 
                bind:value={loadForm.tipo_udc_id}
                class="form-input"
                required
              >
                {#each tipiUdcDisponibili as tipo}
                  <option value={tipo.id}>{tipo.nome}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <!-- Riga 5: Campi opzionali -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">{$t('movements.load.batch')}</label>
              <input 
                type="text" 
                bind:value={loadForm.lotto}
                class="form-input"
                placeholder="{$t('movements.load.batchPlaceholder')}"
              />
            </div>
            <div>
              <label class="form-label">{$t('movements.load.expiry')}</label>
              <input 
                type="date" 
                bind:value={loadForm.data_scadenza}
                class="form-input"
              />
            </div>
          </div>
          
          <!-- Riga 6: Pesi -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">{$t('movements.load.grossWeight')}</label>
              <input 
                type="number" 
                step="0.01"
                bind:value={loadForm.peso_lordo}
                class="form-input"
                placeholder="{$t('movements.load.weightPlaceholder')}"
              />
            </div>
            <div>
              <label class="form-label">{$t('movements.load.netWeight')}</label>
              <input 
                type="number" 
                step="0.01"
                bind:value={loadForm.peso_netto}
                class="form-input"
                placeholder="{$t('movements.load.weightPlaceholder')}"
              />
            </div>
          </div>
          
          <!-- Note -->
          <div>
            <label class="form-label">{$t('movements.load.notes')}</label>
            <textarea 
              bind:value={loadForm.note}
              class="form-input resize-none"
              rows="3"
              placeholder="{$t('movements.load.notesPlaceholder')}"
            ></textarea>
          </div>
          </form>
        </div>
      </div>

      <!-- Footer moderno -->
      <div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3">
        <button 
          type="button" 
          class="btn btn-secondary"
          on:click={closeLoadModal}
        >
          {$t('common.cancel')}
        </button>
        
        <button
          type="button"
          on:click={submitLoad}
          class="btn btn-primary"
        >
          {$t('movements.load.save')}
        </button>
      </div>
    </div>
  </div>
{/if}