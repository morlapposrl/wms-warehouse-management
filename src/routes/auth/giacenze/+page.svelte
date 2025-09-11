<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import TransferModal from '$lib/components/TransferModal.svelte';
  
  export let data: PageData;

  // Stato per controllare l'espansione delle righe UDC
  let expanded: { [key: string]: boolean } = {};
  
  // Transfer modal state
  let showTransferModal = false;
  let selectedTransferProduct = null;
  let selectedTransferCommittente = null;
  let selectedUdc = null;

  // Toggle espansione singola riga
  function toggleExpansion(key: string) {
    expanded[key] = !expanded[key];
  }

  // Espandi/Comprimi tutto
  function expandAll() {
    data.giacenze.forEach(g => {
      if (g.dettagli_udc.length > 0) {
        const key = `${g.committente.id}_${g.prodotto.id}`;
        expanded[key] = true;
      }
    });
  }

  function collapseAll() {
    expanded = {};
  }

  // Formattazione valori
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  }

  // Calcola colore badge per UDC count
  function getUdcBadgeColor(count: number): string {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    if (count === 1) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    if (count <= 3) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  }
  
  // Transfer functions
  function openTransferModal(giacenza: any) {
    selectedTransferProduct = {
      id: giacenza.prodotto.id,
      codice: giacenza.prodotto.codice,
      descrizione: giacenza.prodotto.descrizione,
      unita_misura: giacenza.prodotto.unita_misura
    };
    selectedTransferCommittente = {
      id: giacenza.committente.id,
      nome: giacenza.committente.nome
    };
    selectedUdc = null; // Reset UDC selection
    showTransferModal = true;
  }
  
  function openTransferModalUdc(giacenza: any, udc: any) {
    selectedTransferProduct = {
      id: giacenza.prodotto.id,
      codice: giacenza.prodotto.codice,
      descrizione: giacenza.prodotto.descrizione,
      unita_misura: giacenza.prodotto.unita_misura
    };
    selectedTransferCommittente = {
      id: giacenza.committente.id,
      nome: giacenza.committente.nome
    };
    selectedUdc = udc; // Pre-select UDC for transfer
    showTransferModal = true;
  }
  
  function handleTransferSuccess(event: any) {
    // Ricarica la pagina per aggiornare le giacenze
    window.location.reload();
  }
  
  function handleTransferClose() {
    showTransferModal = false;
    selectedTransferProduct = null;
    selectedTransferCommittente = null;
    selectedUdc = null;
  }

  // Colore badge per stato scorta
  function getStatoScortaColor(stato: string): string {
    switch (stato) {
      case 'BASSA': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'ALTA': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default: return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
  }

  // Gestione filtri lato client
  let giacenzeOriginali = [];
  let giacenzeFiltrate = [];
  let searchTerm = '';
  let selectedCommittente = '';
  let selectedCategoria = '';
  let soloScorteBasse = false;
  
  // Categorie dinamiche
  let categorieComplete = []; // Lista completa delle categorie
  let categorieFiltrate = []; // Categorie filtrate per committente
  
  // Gestione provenienza da Prodotti Globali
  let isFromProdotti = false;
  let prodottoProvenienza = null;
  let committenteProvenienza = null;
  
  // Filtri lato client - definita prima per evitare errori
  function applyClientFilters() {
    if (!giacenzeOriginali || giacenzeOriginali.length === 0) {
      giacenzeFiltrate = [];
      return;
    }
    
    giacenzeFiltrate = giacenzeOriginali.filter(giacenza => {
      // Filtro ricerca
      if (searchTerm && !giacenza.prodotto.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !giacenza.prodotto.descrizione.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro committente
      if (selectedCommittente && giacenza.committente.id != selectedCommittente) {
        return false;
      }
      
      // Filtro categoria  
      if (selectedCategoria && giacenza.prodotto.categoria_id != selectedCategoria) {
        return false;
      }
      
      // Filtro scorte basse
      if (soloScorteBasse && giacenza.totale.quantita > (giacenza.prodotto.scorta_minima || 0)) {
        return false;
      }
      
      return true;
    });
  }
  
  // Carica categorie globali al mount e gestisce provenienza
  onMount(async () => {
    try {
      // Controlla se si arriva da Prodotti Globali
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      const committenteParam = urlParams.get('committente');
      
      if (searchParam && committenteParam) {
        // Provenienza da Prodotti Globali
        isFromProdotti = true;
        prodottoProvenienza = searchParam;
        committenteProvenienza = committenteParam;
        
        // Pre-imposta i filtri dal prodotto di origine
        searchTerm = searchParam;
        selectedCommittente = committenteParam;
        
        console.log('Navigazione da Prodotti Globali per:', searchParam);
      }
      
      const catResponse = await fetch('/api/categorie/global');
      if (catResponse.ok) {
        const catData = await catResponse.json();
        if (catData.success && catData.data) {
          categorieComplete = catData.data;
          updateCategorieFiltrate();
          console.log('Categorie caricate:', categorieComplete.length);
        } else {
          console.error('Errore formato risposta categorie:', catData);
        }
      } else {
        console.error('Errore fetch categorie:', catResponse.status);
      }
    } catch (err) {
      console.error('Errore caricamento categorie:', err);
    }
  });

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

  // Gestione cambio committente
  function onCommittenteChange() {
    updateCategorieFiltrate();
    applyClientFilters();
  }

  // Inizializza con i dati del server
  $: if (data.giacenze) {
    giacenzeOriginali = data.giacenze;
    applyClientFilters();
  }

  function resetFilters() {
    searchTerm = '';
    selectedCommittente = '';
    selectedCategoria = '';
    soloScorteBasse = false;
    isFromProdotti = false;
    prodottoProvenienza = null;
    committenteProvenienza = null;
    updateCategorieFiltrate();
    applyClientFilters();
    
    // Pulisci URL dai parametri di provenienza
    const url = new URL(window.location);
    url.searchParams.delete('search');
    url.searchParams.delete('committente');
    window.history.replaceState({}, '', url);
  }

  // Funzione per tornare alla pagina Prodotti Globali e riposizionarsi sul prodotto
  function tornaAiProdotti() {
    if (prodottoProvenienza) {
      // Passa il codice prodotto come hash per il riposizionamento
      window.location.href = `/auth/prodotti#${prodottoProvenienza}`;
    } else {
      window.location.href = '/auth/prodotti';
    }
  }
  
  // Funzione per abilitare i filtri (uscire dalla modalità "da prodotti")
  function abilitaFiltri() {
    isFromProdotti = false;
    
    // Pulisci URL dai parametri di provenienza
    const url = new URL(window.location);
    url.searchParams.delete('search');
    url.searchParams.delete('committente');
    window.history.replaceState({}, '', url);
  }
</script>

<svelte:head>
  <title>Giacenze Globali - Gestionale Magazzino</title>
</svelte:head>

<div class="w-full px-4 py-6">
  <!-- Header e controlli -->
  <div class="flex justify-between items-center mb-6">
    <div>
      {#if isFromProdotti}
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Giacenze Globali</h1>
          <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
            📦 Vista da Prodotto: {prodottoProvenienza}
          </span>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <button 
            on:click={tornaAiProdotti}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ← Torna ai Prodotti Globali
          </button>
        </div>
        <p class="text-gray-600 dark:text-gray-400">
          Visualizzazione giacenze per il prodotto <strong>{prodottoProvenienza}</strong>
          {#if committenteProvenienza}
            del committente selezionato
          {/if}
        </p>
      {:else}
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Giacenze Globali</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Vista completa di tutti i committenti con sistema UDC</p>
      {/if}
    </div>
    
    <div class="flex space-x-2">
      <button 
        on:click={expandAll}
        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        📋 Espandi Tutto
      </button>
      <button 
        on:click={collapseAll}
        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
      >
        📋 Comprimi Tutto
      </button>
    </div>
  </div>

  <!-- Statistiche Globali -->
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
    <div class="stat-card">
      <div class="text-2xl font-bold text-blue-600">{data.statistiche.totale_giacenze || 0}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Giacenze Totali</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-purple-600">{data.statistiche.totale_committenti || 0}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Committenti</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-green-600">{data.statistiche.totale_prodotti || 0}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Prodotti</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-yellow-600">{data.statistiche.totale_udc || 0}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">UDC Totali</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-orange-600">{data.statistiche.prodotti_distribuiti || 0}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Multi-UDC</div>
    </div>
    <div class="stat-card">
      <div class="text-2xl font-bold text-indigo-600">{formatCurrency(data.statistiche.valore_totale_magazzino || 0)}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Valore Totale</div>
    </div>
  </div>

  <!-- Filtri -->
  <div class="card mb-6">
    <div class="card-body">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span class="text-lg">🔍</span>
          <span>Filtri</span>
          {#if isFromProdotti}
            <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-normal">
              🔒 Filtri limitati - Vista prodotto specifico
            </span>
          {/if}
        </h3>
        
      </div>
    
    <div class="flex items-end gap-2 flex-nowrap">
      <!-- Ricerca -->
      <div class="min-w-24">
        <input 
          type="text" 
          bind:value={searchTerm}
          on:input={applyClientFilters}
          placeholder="Codice..."
          class="form-input text-sm"
          disabled={isFromProdotti}
        >
      </div>
      
      <!-- Committente -->
      <div class="min-w-36">
        <select name="committente" class="form-input text-sm" bind:value={selectedCommittente} on:change={onCommittenteChange} disabled={isFromProdotti}>
          <option value="">Tutti committenti</option>
          {#each data.committenti as committente}
            <option value={committente.id.toString()}>
              {committente.ragione_sociale}
            </option>
          {/each}
        </select>
      </div>
      
      <!-- Categoria -->
      <div class="min-w-32">
        <select name="categoria" class="form-input text-sm" bind:value={selectedCategoria} on:change={applyClientFilters} disabled={isFromProdotti}>
          <option value="">Tutte categorie</option>
          {#each categorieFiltrate as categoria}
            <option value={categoria.id.toString()}>
              {categoria.descrizione}
              {#if selectedCommittente === ''}
                - {categoria.committente_ragione_sociale}
              {/if}
            </option>
          {/each}
        </select>
      </div>
      
      <!-- Checkbox scorte basse -->
      <div class="flex items-center">
        <input 
          type="checkbox" 
          bind:checked={soloScorteBasse}
          on:change={applyClientFilters}
          class="mr-1"
          disabled={isFromProdotti}
        >
        <label class="text-xs text-neutral-600 dark:text-gray-400 whitespace-nowrap">Scorte basse</label>
      </div>

      <!-- Azioni -->
      <div class="flex gap-1">
        <button
          on:click={resetFilters}
          class="btn btn-secondary btn-sm px-2"
          title="Reset filtri"
          disabled={isFromProdotti}
        >
          ↻
        </button>
      </div>
    </div>
    
    {#if isFromProdotti}
      <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div class="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
          <span class="text-lg">ℹ️</span>
          <div>
            <strong>Filtri automatici attivi:</strong> 
            Ricerca per "<strong>{prodottoProvenienza}</strong>"
            {#if committenteProvenienza}
              presso il committente selezionato
            {/if}
          </div>
        </div>
      </div>
    {/if}
    </div>
  </div>

  <!-- Tabella Giacenze Globali con UDC -->
  <div class="card">
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
      <thead class="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Committente & Prodotto
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Quantità & Stato
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Valore
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            UDC/Ubicazioni
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Azioni
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {#each giacenzeFiltrate as giacenza}
          {@const key = `${giacenza.committente.id}_${giacenza.prodotto.id}`}
          
          <!-- Riga principale -->
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 {giacenza.is_distributed ? 'bg-blue-50 dark:bg-blue-900/20' : ''}">
            <td class="px-6 py-4">
              <div class="flex items-center">
                {#if giacenza.dettagli_udc.length > 0}
                  <button 
                    on:click={() => toggleExpansion(key)}
                    class="mr-3 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-400"
                  >
                    {expanded[key] ? '📖' : '📕'}
                  </button>
                {/if}
                <div>
                  <!-- Info committente -->
                  <div class="text-xs font-medium text-indigo-600 mb-1">
                    🏢 {giacenza.committente.nome} ({giacenza.committente.codice})
                  </div>
                  <!-- Info prodotto -->
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{giacenza.prodotto.codice}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{giacenza.prodotto.descrizione}</div>
                  <div class="text-xs text-gray-400 dark:text-gray-500">{giacenza.prodotto.categoria}</div>
                </div>
              </div>
            </td>
            
            <td class="px-6 py-4">
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {giacenza.totale.quantita} {giacenza.prodotto.unita_misura}
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatoScortaColor(giacenza.totale.stato_scorta)}">
                {giacenza.totale.stato_scorta}
              </span>
            </td>
            
            <td class="px-6 py-4">
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(giacenza.totale.valore_totale)}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Medio: {formatCurrency(giacenza.totale.valore_medio)}
              </div>
            </td>
            
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getUdcBadgeColor(giacenza.udc_count)}">
                  🏗️ {giacenza.udc_count} UDC
                </span>
                {#if giacenza.ubicazioni_count > 0}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    📍 {giacenza.ubicazioni_count} Ubic.
                  </span>
                {/if}
                {#if giacenza.is_distributed}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                    🔀 Distribuito
                  </span>
                {/if}
              </div>
            </td>
            
            <td class="px-6 py-4">
              <div class="flex flex-col gap-2">
                {#if giacenza.dettagli_udc.length > 0}
                  <button 
                    on:click={() => toggleExpansion(key)}
                    class="text-blue-600 hover:text-blue-900 text-sm font-medium text-left"
                  >
                    {expanded[key] ? 'Nascondi' : 'Dettagli'} UDC
                  </button>
                {:else}
                  <span class="text-gray-400 dark:text-gray-500 text-sm">Nessun UDC</span>
                {/if}
                
                <button 
                  class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  on:click={() => openTransferModal(giacenza)}
                  title="Trasferisci prodotto (per quantità)"
                >
                  🔄 Trasferimento
                </button>
              </div>
            </td>
          </tr>

          <!-- Righe espanse con dettagli UDC -->
          {#if expanded[key] && giacenza.dettagli_udc.length > 0}
            {#each giacenza.dettagli_udc as dettaglio}
              <tr class="bg-gray-50 dark:bg-gray-700 border-l-4 border-blue-400">
                <td class="px-6 py-3 pl-20">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <div class="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                        🏗️ {dettaglio.udc_barcode}
                      </div>
                      <div class="text-xs text-gray-500">
                        {dettaglio.tipo_udc} • Stato: {dettaglio.stato} • Pos: {dettaglio.posizione}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-3">
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    {dettaglio.quantita} {giacenza.prodotto.unita_misura}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>🏷️ Lotto: {dettaglio.lotto || '-'}</div>
                    <div>📅 Scadenza: {dettaglio.scadenza ? new Date(dettaglio.scadenza).toLocaleDateString('it-IT') : '-'}</div>
                    <div>⚖️ Peso: 
                      {#if dettaglio.peso_lordo > 0 || dettaglio.peso_kg > 0}
                        <span class="text-blue-600">L:{dettaglio.peso_lordo || 0}kg</span>
                        <span class="text-green-600 ml-1">N:{dettaglio.peso_kg || 0}kg</span>
                      {:else}
                        -
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-3">
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    {formatCurrency(dettaglio.valore || 0)}
                  </div>
                </td>
                <td class="px-6 py-3">
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {#if dettaglio.ubicazione}
                      📍 {dettaglio.ubicazione} ({dettaglio.zona})
                    {:else}
                      📍 Non assegnato
                    {/if}
                  </div>
                  <div class="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(dettaglio.data_inserimento)}
                  </div>
                </td>
                <td class="px-6 py-3">
                  <button 
                    class="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                    on:click={() => openTransferModalUdc(giacenza, dettaglio)}
                    title="Trasferisci questo UDC intero"
                  >
                    🔄 UDC
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        {/each}
      </tbody>
    </table>
    </div>
  </div>

  {#if data.giacenze.length === 0}
    <div class="text-center py-12">
      <div class="text-gray-500 dark:text-gray-400 text-lg mb-4">Nessuna giacenza trovata</div>
      <button
        on:click={resetFilters}
        class="text-blue-600 hover:text-blue-900 font-medium"
      >
        Rimuovi filtri
      </button>
    </div>
  {/if}

  <!-- Paginazione -->
  {#if data.pagination.totalPages > 1}
    <div class="mt-6 flex justify-center">
      <nav class="flex space-x-2">
        {#each Array.from({length: data.pagination.totalPages}, (_, i) => i + 1) as pageNum}
          <a 
            href="/auth/giacenze?page={pageNum}{data.filters.search ? `&search=${data.filters.search}` : ''}{data.filters.committente_filter ? `&committente=${data.filters.committente_filter}` : ''}{data.filters.categoria_id ? `&categoria=${data.filters.categoria_id}` : ''}{data.filters.solo_scorte_basse ? `&solo_scorte_basse=true` : ''}"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {pageNum === data.pagination.page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}"
          >
            {pageNum}
          </a>
        {/each}
      </nav>
    </div>
  {/if}
</div>

<!-- Transfer Modal -->
<TransferModal 
  bind:show={showTransferModal}
  prodotto={selectedTransferProduct}
  committente={selectedTransferCommittente}
  udc={selectedUdc}
  giacenzaDisponibile={selectedTransferProduct?.quantita || 0}
  on:success={handleTransferSuccess}
  on:close={handleTransferClose}
/>

<style>
  .form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
  }
  
  .form-input {
    @apply w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  }
  
  tr {
    transition: all 0.2s ease;
  }
</style>