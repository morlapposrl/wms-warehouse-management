<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  
  // State management
  let categorie = [];
  let categorieOriginali = [];
  let committenti = [];
  let loading = true;
  let selectedCommittente = '';
  let searchTerm = '';
  let selectedStato = '';
  
  // Form state
  let showForm = false;
  let editingId = null;
  let formData = {
    codice: '',
    descrizione: '',
    attiva: true,
    committente_id: 0
  };
  let formErrors = {};
  let error = '';
  let success = '';
  
  onMount(async () => {
    try {
      // Carica committenti
      const commitResponse = await fetch('/api/committenti');
      if (commitResponse.ok) {
        const result = await commitResponse.json();
        if (result.success) {
          committenti = result.data;
        }
      }
      
      // Carica categorie
      await loadCategorie();
    } catch (err) {
      console.error('Errore caricamento:', err);
      error = $t('errors.network');
    }
  });
  
  async function loadCategorie() {
    loading = true;
    try {
      const response = await fetch('/api/categorie/global');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          categorieOriginali = result.data;
          applyClientFilters();
        } else {
          error = result.error || $t('errors.network');
        }
      } else {
        error = $t('errors.network');
      }
    } catch (err) {
      console.error('Errore categorie:', err);
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }
  
  function applyClientFilters() {
    if (!categorieOriginali || categorieOriginali.length === 0) {
      categorie = [];
      return;
    }
    
    let filtered = categorieOriginali.filter(categoria => {
      // Filtro ricerca
      if (searchTerm && !categoria.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !categoria.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !categoria.committente_ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro committente
      if (selectedCommittente && categoria.committente_id != selectedCommittente) {
        return false;
      }
      
      // Filtro stato
      if (selectedStato !== '' && categoria.attiva != selectedStato) {
        return false;
      }
      
      return true;
    });
    
    categorie = filtered;
  }
  
  async function handleSubmit() {
    if (!formData.committente_id) {
      formErrors.committente_id = [$t('validation.required')];
      return;
    }
    
    if (!formData.descrizione.trim()) {
      formErrors.descrizione = [$t('validation.required')];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = [$t('validation.required')];
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const url = editingId ? `/api/categorie/${editingId}` : `/api/categorie`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = editingId ? $t('categories.edit') + ' ' + $t('common.confirm') : $t('categories.add') + ' ' + $t('common.confirm');
        await loadCategorie();
        resetForm();
      } else {
        error = result.error || $t('errors.generic');
        if (result.errors) {
          formErrors = result.errors;
        }
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id, descrizione) {
    if (!confirm(`${$t('categories.delete')} "${descrizione}"?`)) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/categorie/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = $t('categories.delete') + ' ' + $t('common.confirm');
        await loadCategorie();
      } else {
        error = result.error || $t('errors.generic');
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  function handleEdit(categoria) {
    editingId = categoria.id;
    formData = {
      codice: categoria.codice,
      descrizione: categoria.descrizione,
      attiva: categoria.attiva,
      committente_id: categoria.committente_id
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      descrizione: '',
      attiva: true,
      committente_id: 0
    };
    editingId = null;
    showForm = false;
    formErrors = {};
    error = '';
    success = '';
  }
  
  function clearAllFilters() {
    searchTerm = '';
    selectedCommittente = '';
    selectedStato = '';
    applyClientFilters();
  }
  
  // Auto-genera codice dalla descrizione
  function generateCode() {
    if (formData.descrizione && !editingId) {
      const code = formData.descrizione
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10);
      formData.codice = code;
    }
  }
</script>

<svelte:head>
  <title>{$t('categories.title')} - WMS Morlappo</title>
</svelte:head>

<div class="w-full bg-transparent">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          🏷️ {$t('categories.title')}
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">
        {$t('layout.categoriesDesc')}
      </p>
    </div>
    
    <!-- Controlli -->
    <div class="flex items-center gap-4">
      <!-- Refresh manuale -->
      <button 
        on:click={loadCategorie}
        class="btn btn-sm btn-secondary"
        title="{$t('common.refresh')}"
        disabled={loading}
      >
        🔄
      </button>
      
      <!-- Nuova categoria -->
      <button
        on:click={() => showForm = true}
        class="btn btn-primary"
        disabled={loading}
      >
        ➕ {$t('categories.add')}
      </button>
    </div>
  </div>

  <!-- Messaggi -->
  {#if error}
    <div class="alert alert-error mb-6">
      <div class="flex items-center space-x-3">
        <span class="text-lg">❌</span>
        <div>
          <p class="font-semibold">{$t('errors.generic')}</p>
          <p class="text-sm mt-1">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if success}
    <div class="alert alert-success mb-6">
      <div class="flex items-center space-x-3">
        <span class="text-lg">✅</span>
        <div>
          <p class="font-semibold">{$t('common.confirm')}</p>
          <p class="text-sm mt-1">{success}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600 dark:text-gray-400">{$t('common.loading')}</span>
    </div>
  {:else}
    <!-- Filtri -->
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">{$t('common.filter')}</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          
          <!-- Ricerca -->
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="{$t('common.search')} {$t('categories.title').toLowerCase()}..."
              class="form-input text-sm"
            >
          </div>
          
          <!-- Committente -->
          <div class="min-w-36">
            <select 
              bind:value={selectedCommittente}
              on:change={applyClientFilters}
              class="form-input text-sm"
            >
              <option value="">{$t('common.all')} {$t('layout.clientManagement').toLowerCase()}</option>
              {#each committenti as committente}
                <option value={committente.id}>
                  {committente.ragione_sociale}
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
              <option value="">{$t('common.all')} {$t('common.status').toLowerCase()}</option>
              <option value="1">✅ {$t('products.status.active')}</option>
              <option value="0">❌ {$t('products.status.inactive')}</option>
            </select>
          </div>
          
          <!-- Reset -->
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
            {categorie.length} {$t('categories.title').toLowerCase()}
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiche -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">🏷️</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('categories.title')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{categorie.length}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">✅</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('products.status.active')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {categorie.filter(c => c.attiva).length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-red-100">
            <span class="text-red-600 text-xl">❌</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('products.status.inactive')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {categorie.filter(c => !c.attiva).length}
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('layout.clientManagement')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {selectedCommittente ? 1 : committenti.length}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista Categorie -->
    {#if categorie.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            {$t('categories.title')} {selectedCommittente ? `- ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : `(${$t('common.all')})`}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{$t('categories.client')}</th>
                <th>{$t('categories.code')}</th>
                <th>{$t('categories.description')}</th>
                <th>{$t('common.status')}</th>
                <th>{$t('common.date')}</th>
                <th>{$t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each categorie as categoria}
                <tr>
                  <td>
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span class="text-sm font-medium">
                        {categoria.committente_ragione_sociale || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td class="font-mono">{categoria.codice}</td>
                  <td>{categoria.descrizione}</td>
                  <td>
                    <span class="badge {categoria.attiva ? 'badge-success' : 'badge-danger'}">
                      {categoria.attiva ? $t('products.status.active') : $t('products.status.inactive')}
                    </span>
                  </td>
                  <td>{new Date(categoria.created_at).toLocaleDateString('it-IT')}</td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(categoria)}
                        title="{$t('categories.edit')}"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(categoria.id, categoria.descrizione)}
                        title="{$t('categories.delete')}"
                      >
                        🗑️
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
        <div class="text-6xl mb-4">🏷️</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          {$t('common.noData')}
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">
          {selectedCommittente ? $t('common.noData') : $t('common.noData')}
        </p>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal Form -->
{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header bg-white dark:bg-gray-800">
        <h2 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">
          {editingId ? $t('categories.edit') : $t('categories.add')}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200">
          ✖️
        </button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4 bg-white dark:bg-gray-800">
        
        <!-- Committente -->
        <div>
          <label class="form-label">{$t('categories.client')} *</label>
          <select
            bind:value={formData.committente_id}
            class="form-input"
            class:border-red-500={formErrors.committente_id}
            required
          >
            <option value={0}>{$t('common.select')} {$t('categories.client').toLowerCase()}...</option>
            {#each committenti as committente}
              <option value={committente.id}>{committente.ragione_sociale}</option>
            {/each}
          </select>
          {#if formErrors.committente_id}
            <p class="form-error">{formErrors.committente_id.join(', ')}</p>
          {/if}
        </div>

        <!-- Descrizione -->
        <div>
          <label class="form-label">{$t('categories.description')} *</label>
          <input
            type="text"
            bind:value={formData.descrizione}
            on:input={generateCode}
            class="form-input"
            class:border-red-500={formErrors.descrizione}
            placeholder="Es: Elettronica, Abbigliamento, Casa..."
            required
            maxlength="100"
          />
          {#if formErrors.descrizione}
            <p class="form-error">{formErrors.descrizione.join(', ')}</p>
          {/if}
        </div>

        <!-- Codice -->
        <div>
          <label class="form-label">{$t('categories.code')} *</label>
          <input
            type="text"
            bind:value={formData.codice}
            class="form-input"
            class:border-red-500={formErrors.codice}
            placeholder="Es: ELETTR, ABBIG, CASA"
            required
            maxlength="20"
          />
          {#if formErrors.codice}
            <p class="form-error">{formErrors.codice.join(', ')}</p>
          {/if}
        </div>

        <!-- Attiva -->
        <div class="flex items-center space-x-3">
          <input
            type="checkbox"
            id="attiva"
            bind:checked={formData.attiva}
            class="rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
          />
          <label for="attiva" class="text-sm font-medium text-neutral-700 dark:text-gray-300">
            {$t('categories.title')} {$t('products.status.active').toLowerCase()}
          </label>
        </div>

        <!-- Bottoni -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            on:click={resetForm}
            class="btn btn-secondary"
          >
            {$t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            class="btn btn-primary"
          >
            {#if loading}
              <div class="spinner w-4 h-4 mr-2"></div>
            {/if}
            {editingId ? $t('common.save') : $t('common.add')}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
  }
  
  .modal-content {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-header {
    @apply flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700;
  }
</style>