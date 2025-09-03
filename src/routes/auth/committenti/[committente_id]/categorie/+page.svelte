<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import type { Categoria, Committente, ApiResponse } from '$lib/types';
  import { validateCategoria, generateCategoriaCode } from '$lib/validations/categoria';
  
  // Parametri URL
  $: committente_id = parseInt($page.params.committente_id);
  
  // State management
  let committente: Committente | null = null;
  let categorie: Categoria[] = [];
  let filteredCategorie: Categoria[] = [];
  let loading = false;
  let error = '';
  let success = '';
  
  // Form state
  let showForm = false;
  let editingId: number | null = null;
  let formData = {
    codice: '',
    descrizione: '',
    attiva: true
  };
  let formErrors: Record<string, string[]> = {};
  
  // Filtri
  let searchTerm = '';
  let statusFilter = '';
  let autoGenerateCode = true;

  // Statistiche
  let stats = { totali: 0, attive: 0, inattive: 0 };

  onMount(() => {
    if (committente_id && !isNaN(committente_id)) {
      loadCategorie();
    } else {
      error = 'ID committente non valido';
    }
  });

  $: {
    filteredCategorie = categorie.filter(c => {
      const matchesSearch = !searchTerm || 
        c.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codice.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || 
        (statusFilter === 'attiva' && c.attiva) ||
        (statusFilter === 'inattiva' && !c.attiva);
      
      return matchesSearch && matchesStatus;
    });
  }

  // Auto-genera codice dalla descrizione
  $: {
    if (autoGenerateCode && formData.descrizione && !editingId) {
      formData.codice = generateCategoriaCode(formData.descrizione);
    }
  }

  async function loadCategorie() {
    loading = true;
    error = '';
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/categorie`);
      const result: ApiResponse<{categorie: Categoria[], committente: Committente, stats: typeof stats}> = await response.json();
      
      if (result.success && result.data) {
        categorie = result.data.categorie || [];
        committente = result.data.committente || null;
        stats = result.data.stats || { totali: 0, attive: 0, inattive: 0 };
      } else {
        error = result.error || 'Errore nel caricamento';
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    loading = true;
    error = '';
    success = '';
    formErrors = {};
    
    // Valida i dati
    const validation = validateCategoria(formData);
    
    if (!validation.success) {
      formErrors = validation.errors || {};
      loading = false;
      return;
    }
    
    try {
      const url = editingId 
        ? `/api/committenti/${committente_id}/categorie/${editingId}` 
        : `/api/committenti/${committente_id}/categorie`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result: ApiResponse<Categoria> = await response.json();

      if (result.success) {
        success = editingId ? 'Categoria aggiornata con successo' : 'Categoria creata con successo';
        await loadCategorie();
        resetForm();
      } else {
        if (result.errors) {
          formErrors = result.errors;
        } else {
          error = result.error || 'Errore nel salvataggio';
        }
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id: number, descrizione: string) {
    if (!confirm(`Sei sicuro di voler eliminare la categoria "${descrizione}"?\n\nATTENZIONE: Non sarà possibile eliminarla se è utilizzata da prodotti.`)) return;
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/categorie/${id}`, { 
        method: 'DELETE' 
      });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        success = 'Categoria eliminata con successo';
        await loadCategorie();
      } else {
        error = result.error || 'Errore nell\'eliminazione';
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  async function toggleStatus(categoria: Categoria) {
    const newStatus = !categoria.attiva;
    const action = newStatus ? 'attivare' : 'disattivare';
    
    if (!confirm(`Confermi di voler ${action} la categoria "${categoria.descrizione}"?`)) return;
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/categorie/${categoria.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attiva: newStatus })
      });

      const result: ApiResponse<Categoria> = await response.json();

      if (result.success) {
        success = `Categoria ${newStatus ? 'attivata' : 'disattivata'} con successo`;
        await loadCategorie();
      } else {
        error = result.error || 'Errore nel cambio di stato';
      }
    } catch (e) {
      error = 'Errore di connessione';
    }
  }

  function handleEdit(categoria: Categoria) {
    editingId = categoria.id;
    formData = {
      codice: categoria.codice,
      descrizione: categoria.descrizione,
      attiva: categoria.attiva
    };
    autoGenerateCode = false; // Disabilita auto-generazione in modifica
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      descrizione: '',
      attiva: true
    };
    editingId = null;
    showForm = false;
    formErrors = {};
    error = '';
    success = '';
    autoGenerateCode = true;
  }

  async function checkCodeAvailability() {
    if (!formData.codice || formData.codice.length < 2) return;
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/categorie/check?codice=${encodeURIComponent(formData.codice)}${editingId ? `&exclude_id=${editingId}` : ''}`);
      const result = await response.json();
      
      if (result.success && !result.data.disponibile) {
        formErrors.codice = ['Codice già esistente per questo committente'];
      } else {
        // Rimuovi errore se il codice è disponibile
        if (formErrors.codice) {
          delete formErrors.codice;
          formErrors = { ...formErrors };
        }
      }
    } catch (e) {
      console.error('Errore verifica codice:', e);
    }
  }
</script>

<svelte:head>
  <title>Categorie - {committente?.ragione_sociale || 'Committente'}</title>
</svelte:head>

<div class="min-h-screen py-8 slide-up">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="mb-8">
      <!-- Breadcrumbs moderni -->
      <nav class="mb-6">
        <ol class="flex items-center space-x-2 text-sm text-neutral-500">
          <li class="flex items-center">
            <a href="/admin/committenti" class="flex items-center space-x-1 hover:text-primary-600 transition-colors">
              <Icon name="home" size={16} />
              <span>Committenti</span>
            </a>
          </li>
          <li class="flex items-center">
            <Icon name="chevronRight" size={16} className="text-neutral-400" />
            <span class="text-neutral-700 font-medium">{committente?.ragione_sociale || 'Caricamento...'}</span>
          </li>
          <li class="flex items-center">
            <Icon name="chevronRight" size={16} className="text-neutral-400" />
            <span class="text-neutral-600">Categorie</span>
          </li>
        </ol>
      </nav>
      
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-4">
            <div class="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <Icon name="categories" size={28} className="text-white" />
            </div>
            <div>
              <h1 class="text-4xl font-bold text-neutral-900 tracking-tight">Categorie Prodotti</h1>
              {#if committente}
                <p class="text-lg text-neutral-600 mt-1">
                  Gestione categorie per <span class="font-semibold text-primary-700">{committente.ragione_sociale}</span>
                </p>
              {/if}
            </div>
          </div>

          <!-- Quick navigation links -->
          <div class="flex flex-wrap gap-3">
            <a href="/committenti/{committente_id}/unita-misura" class="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-all duration-200 border border-primary-200">
              <Icon name="units" size={16} />
              <span class="font-medium">Unità di Misura</span>
            </a>
            <a href="/committenti/{committente_id}/fornitori" class="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-all duration-200 border border-primary-200">
              <Icon name="suppliers" size={16} />
              <span class="font-medium">Fornitori</span>
            </a>
            <a href="/committenti/{committente_id}/prodotti" class="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-all duration-200 border border-primary-200">
              <Icon name="products" size={16} />
              <span class="font-medium">Prodotti</span>
            </a>
          </div>
        </div>
        
        <button
          on:click={() => showForm = true}
          disabled={loading || !committente}
          class="btn btn-primary btn-lg flex items-center space-x-2 bounce-subtle"
        >
          <Icon name="add" size={20} />
          <span>Nuova Categoria</span>
        </button>
      </div>
    </div>

    <!-- Statistiche moderne -->
    {#if committente}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat-card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-primary-700 mb-1">Categorie Totali</p>
              <p class="text-3xl font-bold text-primary-900">{stats.totali}</p>
            </div>
            <div class="stat-icon bg-primary-600 text-white">
              <Icon name="categories" size={24} />
            </div>
          </div>
        </div>

        <div class="stat-card bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-secondary-700 mb-1">Categorie Attive</p>
              <p class="text-3xl font-bold text-secondary-900">{stats.attive}</p>
              <p class="text-xs text-secondary-600 mt-1">
                {stats.totali > 0 ? Math.round((stats.attive / stats.totali) * 100) : 0}% del totale
              </p>
            </div>
            <div class="stat-icon bg-secondary-600 text-white">
              <Icon name="active" size={24} />
            </div>
          </div>
        </div>

        <div class="stat-card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-700 mb-1">Categorie Inattive</p>
              <p class="text-3xl font-bold text-red-900">{stats.inattive}</p>
              <p class="text-xs text-red-600 mt-1">
                {stats.totali > 0 ? Math.round((stats.inattive / stats.totali) * 100) : 0}% del totale
              </p>
            </div>
            <div class="stat-icon bg-red-600 text-white">
              <Icon name="inactive" size={24} />
            </div>
          </div>
        </div>

        <div class="stat-card bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-accent-700 mb-1">Tasso di Utilizzo</p>
              <p class="text-3xl font-bold text-accent-900">{stats.totali > 0 ? Math.round((stats.attive / stats.totali) * 100) : 0}%</p>
              <p class="text-xs text-accent-600 mt-1">
                Performance categoria
              </p>
            </div>
            <div class="stat-icon bg-accent-600 text-white">
              <Icon name="trendUp" size={24} />
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Messaggi moderni -->
    {#if error}
      <div class="alert alert-error mb-6 fade-in">
        <div class="flex items-center space-x-3">
          <Icon name="error" size={20} className="flex-shrink-0" />
          <div>
            <p class="font-semibold">Si è verificato un errore</p>
            <p class="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if success}
      <div class="alert alert-success mb-6 fade-in">
        <div class="flex items-center space-x-3">
          <Icon name="success" size={20} className="flex-shrink-0" />
          <div>
            <p class="font-semibold">Operazione completata</p>
            <p class="text-sm mt-1">{success}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Filtri moderni -->
    <div class="card mb-8">
      <div class="card-header">
        <div class="flex items-center space-x-2">
          <Icon name="search" size={20} className="text-neutral-600" />
          <h3 class="text-lg font-semibold text-neutral-900">Filtri di Ricerca</h3>
        </div>
      </div>
      
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="search" class="form-label">
              Ricerca per nome o codice
            </label>
            <div class="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                id="search"
                type="text"
                bind:value={searchTerm}
                placeholder="Inserisci codice o descrizione..."
                class="form-input pl-10"
              />
            </div>
          </div>
          
          <div>
            <label for="status-filter" class="form-label">
              Filtra per stato
            </label>
            <div class="relative">
              <Icon name="filter" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <select
                id="status-filter"
                bind:value={statusFilter}
                class="form-input pl-10 appearance-none"
              >
                <option value="">Tutte le categorie</option>
                <option value="attiva">Solo Attive</option>
                <option value="inattiva">Solo Inattive</option>
              </select>
              <Icon name="chevronDown" size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          
          <div class="flex items-end">
            <button
              on:click={() => { searchTerm = ''; statusFilter = ''; }}
              class="btn btn-secondary btn-md w-full flex items-center justify-center space-x-2"
            >
              <Icon name="cancel" size={16} />
              <span>Pulisci Filtri</span>
            </button>
          </div>
        </div>
        
        <!-- Risultati filtri -->
        {#if searchTerm || statusFilter}
          <div class="mt-4 p-3 bg-neutral-50 rounded-lg border">
            <div class="flex items-center justify-between text-sm text-neutral-600">
              <span>
                Mostrando {filteredCategorie.length} di {categorie.length} categorie
              </span>
              {#if searchTerm}
                <div class="flex items-center space-x-1">
                  <span>Ricerca:</span>
                  <span class="bg-primary-100 text-primary-800 px-2 py-1 rounded font-medium">"{searchTerm}"</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Form Modale Moderno -->
    {#if showForm}
      <div class="modal-backdrop fade-in">
        <div class="modal-content slide-up">
          <div class="modal-header">
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <Icon name={editingId ? "edit" : "add"} size={20} className="text-primary-600" />
                </div>
                <h2 class="text-xl font-semibold text-neutral-900">
                  {editingId ? 'Modifica Categoria' : 'Nuova Categoria'}
                </h2>
              </div>
              <button
                on:click={resetForm}
                class="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Icon name="cancel" size={20} />
              </button>
            </div>
          </div>
          
          <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
            
            {#if !editingId}
              <div class="alert alert-info">
                <div class="flex items-center space-x-3">
                  <Icon name="info" size={20} className="flex-shrink-0" />
                  <div class="flex-1">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        id="auto-generate"
                        bind:checked={autoGenerateCode}
                        class="mr-3 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label for="auto-generate" class="text-sm font-medium">
                        Genera automaticamente il codice dalla descrizione
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="descrizione" class="form-label">
                  Descrizione *
                </label>
                <input
                  id="descrizione"
                  type="text"
                  bind:value={formData.descrizione}
                  required
                  maxlength="100"
                  class="form-input"
                  class:border-red-500={formErrors.descrizione}
                  placeholder="Es: Elettronica, Abbigliamento, Casa e Giardino"
                />
                {#if formErrors.descrizione}
                  <p class="form-error">{formErrors.descrizione.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="codice" class="form-label">
                  Codice *
                </label>
                <input
                  id="codice"
                  type="text"
                  bind:value={formData.codice}
                  on:blur={checkCodeAvailability}
                  required
                  maxlength="20"
                  readonly={autoGenerateCode && !editingId}
                  class="form-input"
                  class:border-red-500={formErrors.codice}
                  class:bg-neutral-100={autoGenerateCode && !editingId}
                  placeholder="Es: ELETTR, ABBIG, CASA"
                />
                {#if formErrors.codice}
                  <p class="form-error">{formErrors.codice.join(', ')}</p>
                {/if}
                {#if autoGenerateCode && !editingId}
                  <p class="text-neutral-500 text-sm mt-1 flex items-center space-x-1">
                    <Icon name="info" size={14} />
                    <span>Codice generato automaticamente</span>
                  </p>
                {/if}
              </div>
            </div>

            <div class="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg border">
              <input
                type="checkbox"
                id="attiva"
                bind:checked={formData.attiva}
                class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label for="attiva" class="text-sm font-medium text-neutral-700 flex items-center space-x-2">
                <Icon name="active" size={16} className="text-secondary-600" />
                <span>Categoria attiva e visibile nel sistema</span>
              </label>
            </div>

            <!-- Bottoni -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
              <button
                type="button"
                on:click={resetForm}
                disabled={loading}
                class="btn btn-secondary btn-md flex items-center space-x-2"
              >
                <Icon name="cancel" size={16} />
                <span>Annulla</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                class="btn btn-primary btn-md flex items-center space-x-2"
              >
                {#if loading}
                  <div class="spinner w-4 h-4"></div>
                  <span>Salvataggio...</span>
                {:else}
                  <Icon name={editingId ? "save" : "add"} size={16} />
                  <span>{editingId ? 'Aggiorna' : 'Crea'}</span>
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Tabella moderna -->
    <div class="card overflow-hidden">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Icon name="categories" size={20} className="text-neutral-600" />
            <h3 class="text-lg font-semibold text-neutral-900">
              Elenco Categorie ({filteredCategorie.length} / {categorie.length})
            </h3>
          </div>
          {#if filteredCategorie.length > 0}
            <div class="text-sm text-neutral-500">
              {filteredCategorie.length} risultat{filteredCategorie.length === 1 ? 'o' : 'i'}
            </div>
          {/if}
        </div>
      </div>
      
      {#if loading}
        <div class="p-12 text-center">
          <div class="spinner w-10 h-10 mx-auto"></div>
          <p class="text-neutral-600 mt-4 font-medium">Caricamento categorie in corso...</p>
          <p class="text-sm text-neutral-500 mt-1">Attendere prego</p>
        </div>
      {:else if filteredCategorie.length === 0}
        <div class="p-12 text-center">
          <div class="p-4 bg-neutral-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Icon name="categories" size={32} className="text-neutral-400" />
          </div>
          {#if categorie.length === 0}
            <p class="text-lg font-medium text-neutral-700 mb-2">Nessuna categoria presente</p>
            <p class="text-neutral-500 mb-4">Inizia creando la prima categoria per questo committente</p>
            <button
              on:click={() => showForm = true}
              class="btn btn-primary btn-md flex items-center space-x-2 mx-auto"
            >
              <Icon name="add" size={16} />
              <span>Crea Prima Categoria</span>
            </button>
          {:else}
            <p class="text-lg font-medium text-neutral-700 mb-2">Nessun risultato</p>
            <p class="text-neutral-500">Nessuna categoria corrisponde ai filtri impostati</p>
          {/if}
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Stato</th>
                <th>Data Creazione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredCategorie as categoria (categoria.id)}
                <tr>
                  <td>
                    <div class="flex items-center space-x-3">
                      <div class="p-2 bg-primary-100 rounded-lg">
                        <Icon name="categories" size={16} className="text-primary-600" />
                      </div>
                      <div>
                        <div class="text-sm font-semibold text-neutral-900">
                          {categoria.descrizione}
                        </div>
                        <div class="text-xs text-neutral-500 flex items-center space-x-1">
                          <span>Codice:</span>
                          <code class="bg-neutral-100 px-1 py-0.5 rounded text-xs">{categoria.codice}</code>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge {categoria.attiva ? 'badge-success' : 'badge-danger'} flex items-center space-x-1 w-fit">
                      <Icon name={categoria.attiva ? 'active' : 'inactive'} size={12} />
                      <span>{categoria.attiva ? 'Attiva' : 'Inattiva'}</span>
                    </span>
                  </td>
                  <td class="text-neutral-600">
                    <div class="flex items-center space-x-1">
                      <Icon name="calendar" size={14} className="text-neutral-400" />
                      <span>{new Date(categoria.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center space-x-1">
                      <button
                        on:click={() => handleEdit(categoria)}
                        class="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Modifica categoria"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        on:click={() => toggleStatus(categoria)}
                        class="p-1.5 text-neutral-600 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="{categoria.attiva ? 'Disattiva' : 'Attiva'} categoria"
                      >
                        <Icon name={categoria.attiva ? 'inactive' : 'active'} size={16} />
                      </button>
                      <button
                        on:click={() => handleDelete(categoria.id, categoria.descrizione)}
                        class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina categoria"
                      >
                        <Icon name="delete" size={16} />
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