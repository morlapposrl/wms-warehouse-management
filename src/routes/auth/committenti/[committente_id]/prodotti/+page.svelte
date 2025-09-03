<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import type { Prodotto } from '$lib/types';
  
  const committente_id = parseInt($page.params.committente_id);
  
  // Stato principale
  let prodotti: Array<Prodotto & {
    categoria_descrizione: string;
    unita_misura_codice: string;
    unita_misura_descrizione: string;
    giacenza_attuale: number;
    valore_giacenza: number;
  }> = [];
  let categorie: any[] = [];
  let unitaMisura: any[] = [];
  let loading = false;
  let error = '';
  let success = '';
  let searchQuery = '';
  let selectedCategoriaId = '';
  let showScorteBasse = false;
  
  // Stato form
  let showForm = false;
  let editingId: number | null = null;
  let formData = {
    codice: '',
    descrizione: '',
    categoria_id: '',
    unita_misura_id: '',
    prezzo_acquisto: '',
    prezzo_vendita: '',
    scorta_minima: '',
    scorta_massima: '',
    ubicazione: '',
    lotto_partita: '',
    note: '',
    attivo: true
  };
  let formErrors: Record<string, string> = {};
  
  // Stato eliminazione
  let deleteId: number | null = null;
  let deleteInfo = { codice: '', descrizione: '' };
  
  // Statistiche
  let stats = { 
    totali: 0, 
    attivi: 0, 
    inattivi: 0, 
    con_prezzo_acquisto: 0,
    con_prezzo_vendita: 0,
    con_scorta_minima: 0,
    prezzo_medio: 0,
    valore_totale: 0,
    quantita_totale: 0,
    prodotti_con_giacenza: 0
  };
  
  onMount(() => {
    loadInitialData();
  });
  
  async function loadInitialData() {
    await Promise.all([
      loadProdotti(),
      loadCategorie(),
      loadUnitaMisura()
    ]);
  }
  
  async function loadProdotti() {
    loading = true;
    error = '';
    
    try {
      let url = `/api/committenti/${committente_id}/prodotti`;
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      if (selectedCategoriaId) {
        params.append('categoria_id', selectedCategoriaId);
      }
      if (showScorteBasse) {
        params.append('scorte_basse', 'true');
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
        
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        prodotti = result.data.prodotti || [];
        stats = result.data.statistiche || {};
      } else {
        error = result.error || 'Errore nel caricamento dei prodotti';
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    } finally {
      loading = false;
    }
  }
  
  async function loadCategorie() {
    try {
      const response = await fetch(`/api/committenti/${committente_id}/categorie`);
      const result = await response.json();
      
      if (result.success) {
        categorie = result.data.categorie;
      }
    } catch (err) {
      console.error('Errore caricamento categorie:', err);
    }
  }
  
  async function loadUnitaMisura() {
    try {
      const response = await fetch(`/api/committenti/${committente_id}/unita-misura`);
      const result = await response.json();
      
      if (result.success) {
        unitaMisura = result.data.unita_misura;
      }
    } catch (err) {
      console.error('Errore caricamento unità di misura:', err);
    }
  }
  
  async function handleSearch() {
    await loadProdotti();
  }
  
  function resetFilters() {
    searchQuery = '';
    selectedCategoriaId = '';
    showScorteBasse = false;
    loadProdotti();
  }
  
  function openCreateForm() {
    showForm = true;
    editingId = null;
    formData = {
      codice: '',
      descrizione: '',
      categoria_id: '',
      unita_misura_id: '',
      prezzo_acquisto: '',
      prezzo_vendita: '',
      scorta_minima: '',
      scorta_massima: '',
      ubicazione: '',
      lotto_partita: '',
      note: '',
      attivo: true
    };
    formErrors = {};
  }
  
  function openEditForm(prodotto: any) {
    console.log('openEditForm chiamata con prodotto:', prodotto);
    console.log('Categorie disponibili:', categorie);
    console.log('Unità misura disponibili:', unitaMisura);
    
    // Verifica che i dati di supporto siano caricati
    if (!categorie || categorie.length === 0) {
      error = 'Errore: categorie non caricate. Ricarica la pagina.';
      return;
    }
    
    if (!unitaMisura || unitaMisura.length === 0) {
      error = 'Errore: unità di misura non caricate. Ricarica la pagina.';
      return;
    }
    
    showForm = true;
    editingId = prodotto.id;
    
    // Gestione sicura dei valori null/undefined
    formData = {
      codice: prodotto.codice || '',
      descrizione: prodotto.descrizione || '',
      categoria_id: (prodotto.categoria_id !== null && prodotto.categoria_id !== undefined) ? prodotto.categoria_id.toString() : '',
      unita_misura_id: (prodotto.unita_misura_id !== null && prodotto.unita_misura_id !== undefined) ? prodotto.unita_misura_id.toString() : '',
      prezzo_acquisto: (prodotto.prezzo_acquisto !== null && prodotto.prezzo_acquisto !== undefined) ? prodotto.prezzo_acquisto.toString() : '',
      prezzo_vendita: (prodotto.prezzo_vendita !== null && prodotto.prezzo_vendita !== undefined) ? prodotto.prezzo_vendita.toString() : '',
      scorta_minima: (prodotto.scorta_minima !== null && prodotto.scorta_minima !== undefined) ? prodotto.scorta_minima.toString() : '',
      scorta_massima: (prodotto.scorta_massima !== null && prodotto.scorta_massima !== undefined) ? prodotto.scorta_massima.toString() : '',
      ubicazione: prodotto.ubicazione || '',
      lotto_partita: prodotto.lotto_partita || '',
      note: prodotto.note || '',
      attivo: prodotto.attivo === 1 || prodotto.attivo === true
    };
    formErrors = {};
    
    console.log('FormData popolato:', formData);
  }
  
  function closeForm() {
    showForm = false;
    editingId = null;
    formErrors = {};
  }
  
  async function saveProdotto() {
    error = '';
    success = '';
    formErrors = {};
    
    try {
      const url = editingId 
        ? `/api/committenti/${committente_id}/prodotti/${editingId}`
        : `/api/committenti/${committente_id}/prodotti`;
        
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        categoria_id: parseInt(formData.categoria_id),
        unita_misura_id: parseInt(formData.unita_misura_id),
        prezzo_acquisto: parseFloat(formData.prezzo_acquisto) || 0,
        prezzo_vendita: parseFloat(formData.prezzo_vendita) || 0,
        scorta_minima: parseInt(formData.scorta_minima) || 0,
        scorta_massima: parseInt(formData.scorta_massima) || 0
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = result.data.message;
        closeForm();
        await loadProdotti();
      } else {
        if (result.errors) {
          result.errors.forEach((err: any) => {
            formErrors[err.field] = err.message;
          });
        } else {
          error = result.error;
        }
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    }
  }
  
  function openDeleteModal(prodotto: any) {
    deleteId = prodotto.id;
    deleteInfo = {
      codice: prodotto.codice,
      descrizione: prodotto.descrizione
    };
  }
  
  function closeDeleteModal() {
    deleteId = null;
    deleteInfo = { codice: '', descrizione: '' };
  }
  
  async function confirmDelete() {
    if (!deleteId) return;
    
    error = '';
    success = '';
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/prodotti/${deleteId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = result.data.message;
        closeDeleteModal();
        await loadProdotti();
      } else {
        error = result.error;
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    }
  }
  
  function getStatusBadgeClass(attivo: boolean): string {
    return attivo ? 'badge-success' : 'badge-danger';
  }
  
  function getStockBadgeClass(giacenza: number, scorta_minima: number): string {
    if (scorta_minima === 0) return 'badge-neutral';
    if (giacenza === 0) return 'badge-danger';
    if (giacenza < scorta_minima) return 'badge-warning';
    return 'badge-success';
  }
  
  function getStockText(giacenza: number, scorta_minima: number): string {
    if (scorta_minima === 0) return 'N/A';
    if (giacenza === 0) return 'Esaurito';
    if (giacenza < scorta_minima) return 'Basso';
    return 'OK';
  }
  
  function formatPrice(price: number): string {
    return price > 0 ? `€${price.toFixed(2)}` : '-';
  }
  
  function formatQuantity(qty: number, um: string): string {
    return `${qty} ${um}`;
  }
</script>

<svelte:head>
  <title>Prodotti - Gestionale Magazzino</title>
</svelte:head>

<div class="min-h-screen py-8 slide-up">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-6">
        <div class="p-3 bg-gradient-primary rounded-xl shadow-lg">
          <Icon name="products" size={28} className="text-white" />
        </div>
        <div>
          <h1 class="text-4xl font-bold text-neutral-900 tracking-tight">Prodotti</h1>
          <p class="text-lg text-neutral-600 mt-1">
            Gestione catalogo prodotti del committente
          </p>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          on:click={openCreateForm}
          class="btn btn-primary btn-lg flex items-center space-x-2 bounce-subtle"
        >
          <Icon name="add" size={20} />
          <span>Nuovo Prodotto</span>
        </button>
      </div>
    </div>

    <!-- Statistiche moderne -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stat-card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-primary-700 mb-1">Prodotti Totali</p>
            <p class="text-3xl font-bold text-primary-900">{stats.totali}</p>
          </div>
          <div class="stat-icon bg-primary-600 text-white">
            <Icon name="products" size={24} />
          </div>
        </div>
      </div>

      <div class="stat-card bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-secondary-700 mb-1">Valore Magazzino</p>
            <p class="text-3xl font-bold text-secondary-900">{formatPrice(stats.valore_totale)}</p>
            <p class="text-xs text-secondary-600 mt-1">
              Valore totale inventario
            </p>
          </div>
          <div class="stat-icon bg-secondary-600 text-white">
            <Icon name="trendUp" size={24} />
          </div>
        </div>
      </div>

      <div class="stat-card bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-accent-700 mb-1">Con Giacenza</p>
            <p class="text-3xl font-bold text-accent-900">{stats.prodotti_con_giacenza}</p>
            <p class="text-xs text-accent-600 mt-1">
              {stats.totali > 0 ? Math.round((stats.prodotti_con_giacenza / stats.totali) * 100) : 0}% del totale
            </p>
          </div>
          <div class="stat-icon bg-accent-600 text-white">
            <Icon name="inventory" size={24} />
          </div>
        </div>
      </div>

      <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-blue-700 mb-1">Prezzo Medio</p>
            <p class="text-3xl font-bold text-blue-900">{formatPrice(stats.prezzo_medio)}</p>
            <p class="text-xs text-blue-600 mt-1">
              Media prezzi catalogo
            </p>
          </div>
          <div class="stat-icon bg-blue-600 text-white">
            <Icon name="calendar" size={24} />
          </div>
        </div>
      </div>
    </div>

  <!-- Filtri moderni -->
  <div class="card mb-8">
    <div class="card-header">
      <div class="flex items-center space-x-2">
        <Icon name="search" size={20} className="text-neutral-600" />
        <h3 class="text-lg font-semibold text-neutral-900">Filtri di Ricerca</h3>
      </div>
    </div>
    
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label for="search" class="form-label">
            Ricerca per codice o descrizione
          </label>
          <div class="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              id="search"
              type="text"
              bind:value={searchQuery}
              placeholder="Codice, descrizione, lotto..."
              class="form-input pl-10"
              on:keydown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        
        <div>
          <label for="categoria-filter" class="form-label">
            Filtra per categoria
          </label>
          <div class="relative">
            <Icon name="categories" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <select
              id="categoria-filter"
              bind:value={selectedCategoriaId}
              class="form-input pl-10 appearance-none"
            >
              <option value="">Tutte le categorie</option>
              {#each categorie as categoria}
                <option value={categoria.id}>{categoria.descrizione}</option>
              {/each}
            </select>
            <Icon name="chevronDown" size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>
        
        <div>
          <label for="scorte-filter" class="form-label">
            Filtro scorte
          </label>
          <label class="flex items-center space-x-2 mt-2">
            <input
              id="scorte-filter"
              type="checkbox"
              bind:checked={showScorteBasse}
              class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm font-medium text-neutral-700">Solo scorte basse</span>
          </label>
        </div>
        
        <div class="flex items-end space-x-2">
          <button
            on:click={handleSearch}
            class="btn btn-primary btn-md flex items-center space-x-2"
          >
            <Icon name="search" size={16} />
            <span>Cerca</span>
          </button>
          <button
            on:click={resetFilters}
            class="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Icon name="cancel" size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Alert messaggi moderni -->
  {#if error}
    <div class="alert alert-error mb-6 fade-in">
      <Icon name="error" size={20} />
      <span>{error}</span>
    </div>
  {/if}

  {#if success}
    <div class="alert alert-success mb-6 fade-in">
      <Icon name="success" size={20} />
      <span>{success}</span>
    </div>
  {/if}

  <!-- Tabella prodotti -->
  <div class="card overflow-hidden">
    <div class="card-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="products" size={20} className="text-neutral-600" />
          <h3 class="text-lg font-semibold text-neutral-900">
            Elenco Prodotti ({prodotti.length})
          </h3>
        </div>
        {#if prodotti.length > 0}
          <div class="text-sm text-neutral-500">
            {prodotti.length} prodott{prodotti.length === 1 ? 'o' : 'i'}
          </div>
        {/if}
      </div>
    </div>

    {#if loading}
      <div class="p-12 text-center">
        <div class="spinner w-10 h-10 mx-auto"></div>
        <p class="text-neutral-600 mt-4 font-medium">Caricamento prodotti...</p>
        <p class="text-sm text-neutral-500 mt-1">Attendere prego</p>
      </div>
    {:else if prodotti.length === 0}
      <div class="p-12 text-center">
        <div class="p-4 bg-neutral-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Icon name="products" size={32} className="text-neutral-400" />
        </div>
        <p class="text-lg font-medium text-neutral-700 mb-2">Nessun prodotto trovato</p>
        {#if searchQuery || selectedCategoriaId || showScorteBasse}
          <p class="text-neutral-500 mb-4">Prova a modificare i filtri di ricerca</p>
          <button on:click={resetFilters} class="btn btn-primary btn-md flex items-center space-x-2 mx-auto">
            <Icon name="filter" size={16} />
            <span>Reset Filtri</span>
          </button>
        {:else}
          <p class="text-neutral-500 mb-4">Inizia creando il tuo primo prodotto</p>
          <button on:click={openCreateForm} class="btn btn-primary btn-md flex items-center space-x-2 mx-auto">
            <Icon name="add" size={16} />
            <span>Crea Primo Prodotto</span>
          </button>
        {/if}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Codice</th>
              <th>Descrizione</th>
              <th>Categoria</th>
              <th>Giacenza</th>
              <th>Prezzo</th>
              <th>Stato</th>
              <th class="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {#each prodotti as prodotto (prodotto.id)}
              <tr>
                <td>
                  <div class="font-mono font-medium text-neutral-900">
                    {prodotto.codice}
                  </div>
                  {#if prodotto.lotto_partita}
                    <div class="text-xs text-neutral-500">
                      Lotto: {prodotto.lotto_partita}
                    </div>
                  {/if}
                </td>
                <td>
                  <div class="text-neutral-900 font-medium">
                    {prodotto.descrizione}
                  </div>
                  {#if prodotto.ubicazione}
                    <div class="flex items-center text-sm text-neutral-500 mt-1">
                      <Icon name="warehouse" size={14} className="mr-1" />
                      {prodotto.ubicazione}
                    </div>
                  {/if}
                </td>
                <td>
                  <span class="badge badge-primary">
                    {prodotto.categoria_descrizione}
                  </span>
                </td>
                <td>
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-neutral-900">
                      {formatQuantity(prodotto.giacenza_attuale || 0, prodotto.unita_misura_codice)}
                    </span>
                    <span class="badge {getStockBadgeClass(prodotto.giacenza_attuale || 0, prodotto.scorta_minima)}">
                      {getStockText(prodotto.giacenza_attuale || 0, prodotto.scorta_minima)}
                    </span>
                  </div>
                  {#if prodotto.scorta_minima > 0}
                    <div class="text-xs text-neutral-500 mt-1">
                      Min: {prodotto.scorta_minima}
                    </div>
                  {/if}
                </td>
                <td>
                  <div class="text-neutral-900 font-medium">
                    {formatPrice(prodotto.prezzo_vendita)}
                  </div>
                  {#if prodotto.prezzo_acquisto > 0}
                    <div class="text-xs text-neutral-500 mt-1">
                      Acq: {formatPrice(prodotto.prezzo_acquisto)}
                    </div>
                  {/if}
                </td>
                <td>
                  <span class="badge {getStatusBadgeClass(prodotto.attivo)}">
                    <Icon name={prodotto.attivo ? 'active' : 'inactive'} size={14} className="mr-1" />
                    {prodotto.attivo ? 'Attivo' : 'Inattivo'}
                  </span>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      on:click={() => openEditForm(prodotto)}
                      class="btn btn-sm btn-secondary flex items-center space-x-1"
                    >
                      <Icon name="edit" size={14} />
                      <span>Modifica</span>
                    </button>
                    <button
                      on:click={() => openDeleteModal(prodotto)}
                      class="btn btn-sm btn-danger flex items-center space-x-1"
                    >
                      <Icon name="delete" size={14} />
                      <span>Elimina</span>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
</div>

<!-- Modal form prodotto -->
{#if showForm}
  <div class="modal-backdrop fade-in">
    <div class="modal-content slide-up">
      <div class="modal-header">
        <h3 class="modal-title">
          <Icon name={editingId ? 'edit' : 'add'} size={20} className="mr-2" />
          {editingId ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
        </h3>
        <button on:click={closeForm} class="modal-close">
          <Icon name="cancel" size={18} />
        </button>
      </div>
      
      <form on:submit|preventDefault={saveProdotto} class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="codice" class="form-label">Codice *</label>
            <input
              id="codice"
              type="text"
              bind:value={formData.codice}
              class="form-input font-mono"
              class:border-red-500={formErrors.codice}
              placeholder="es. PROD001"
              required
            />
            {#if formErrors.codice}
              <div class="form-error">{formErrors.codice}</div>
            {/if}
          </div>
          
          <div>
            <label for="categoria_id" class="form-label">Categoria *</label>
            <select
              id="categoria_id"
              bind:value={formData.categoria_id}
              class="form-input"
              class:border-red-500={formErrors.categoria_id}
              required
            >
              <option value="">Seleziona categoria</option>
              {#each categorie as categoria}
                <option value={categoria.id}>{categoria.descrizione}</option>
              {/each}
            </select>
            {#if formErrors.categoria_id}
              <div class="form-error">{formErrors.categoria_id}</div>
            {/if}
          </div>
        </div>
        
        <div>
          <label for="descrizione" class="form-label">Descrizione *</label>
          <input
            id="descrizione"
            type="text"
            bind:value={formData.descrizione}
            class="form-input"
            class:border-red-500={formErrors.descrizione}
            placeholder="Descrizione completa del prodotto"
            required
          />
          {#if formErrors.descrizione}
            <div class="form-error">{formErrors.descrizione}</div>
          {/if}
        </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="unita_misura_id" class="block text-sm font-medium text-gray-700 mb-1">
                Unità di Misura *
              </label>
              <select
                id="unita_misura_id"
                bind:value={formData.unita_misura_id}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                class:border-red-300={formErrors.unita_misura_id}
                required
              >
                <option value="">Seleziona unità</option>
                {#each unitaMisura as unita}
                  <option value={unita.id}>
                    {unita.codice} - {unita.descrizione}
                    {#if unita.committente_id === null} (Globale){/if}
                  </option>
                {/each}
              </select>
              {#if formErrors.unita_misura_id}
                <p class="mt-1 text-sm text-red-600">{formErrors.unita_misura_id}</p>
              {/if}
            </div>
            
            <div>
              <label for="ubicazione" class="block text-sm font-medium text-gray-700 mb-1">
                Ubicazione
              </label>
              <input
                id="ubicazione"
                type="text"
                bind:value={formData.ubicazione}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="es. Scaffale A-1, Banco 3"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="prezzo_acquisto" class="block text-sm font-medium text-gray-700 mb-1">
                Prezzo Acquisto (€)
              </label>
              <input
                id="prezzo_acquisto"
                type="number"
                step="0.01"
                min="0"
                bind:value={formData.prezzo_acquisto}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label for="prezzo_vendita" class="block text-sm font-medium text-gray-700 mb-1">
                Prezzo Vendita (€)
              </label>
              <input
                id="prezzo_vendita"
                type="number"
                step="0.01"
                min="0"
                bind:value={formData.prezzo_vendita}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                class:border-red-300={formErrors.prezzo_vendita}
                placeholder="0.00"
              />
              {#if formErrors.prezzo_vendita}
                <p class="mt-1 text-sm text-red-600">{formErrors.prezzo_vendita}</p>
              {/if}
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="scorta_minima" class="block text-sm font-medium text-gray-700 mb-1">
                Scorta Minima
              </label>
              <input
                id="scorta_minima"
                type="number"
                min="0"
                bind:value={formData.scorta_minima}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label for="scorta_massima" class="block text-sm font-medium text-gray-700 mb-1">
                Scorta Massima
              </label>
              <input
                id="scorta_massima"
                type="number"
                min="0"
                bind:value={formData.scorta_massima}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                class:border-red-300={formErrors.scorta_massima}
                placeholder="0"
              />
              {#if formErrors.scorta_massima}
                <p class="mt-1 text-sm text-red-600">{formErrors.scorta_massima}</p>
              {/if}
            </div>
            
            <div>
              <label for="lotto_partita" class="block text-sm font-medium text-gray-700 mb-1">
                Lotto/Partita
              </label>
              <input
                id="lotto_partita"
                type="text"
                bind:value={formData.lotto_partita}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Lotto o partita"
              />
            </div>
          </div>
          
          <div>
            <label for="note" class="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              id="note"
              bind:value={formData.note}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Note aggiuntive sul prodotto"
              rows="3"
            ></textarea>
          </div>
          
          <div class="flex items-center">
            <input
              type="checkbox"
              id="attivo"
              bind:checked={formData.attivo}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="attivo" class="ml-2 block text-sm text-gray-700">
              Prodotto attivo
            </label>
          </div>
          
        <div class="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
          <button
            type="button"
            on:click={closeForm}
            class="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Icon name="cancel" size={16} />
            <span>Annulla</span>
          </button>
          <button
            type="submit"
            class="btn btn-primary btn-md flex items-center space-x-2"
          >
            <Icon name={editingId ? "save" : "add"} size={16} />
            <span>{editingId ? 'Aggiorna' : 'Crea'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal conferma eliminazione -->
{#if deleteId}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mt-2">Conferma Eliminazione</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            Sei sicuro di voler eliminare il prodotto<br/>
            <strong>{deleteInfo.codice} - {deleteInfo.descrizione}</strong>?<br/>
            <span class="text-red-600">Questa azione non può essere annullata.</span>
          </p>
        </div>
        <div class="flex justify-center space-x-3 px-4 py-3">
          <button
            on:click={closeDeleteModal}
            class="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400"
          >
            Annulla
          </button>
          <button
            on:click={confirmDelete}
            class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}