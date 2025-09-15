<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  
  let fornitori = [];
  let fornitoriOriginali = [];
  let committenti = [];
  let loading = true;
  let searchTerm = '';
  
  let showForm = false;
  let editingId = null;
  let formData = {
    codice: '',
    ragione_sociale: '',
    partita_iva: '',
    indirizzo: '',
    telefono: '',
    email: '',
    committenti_selezionati: []
  };
  
  // Filtro committenti
  let searchCommittenti = '';
  $: committeniFiltrati = (committenti || []).filter(committente => {
    const ragioneSociale = (committente.ragione_sociale || '').toLowerCase();
    const codice = (committente.codice || '').toLowerCase();
    const searchTerm = searchCommittenti.toLowerCase();
    
    return ragioneSociale.includes(searchTerm) || codice.includes(searchTerm);
  });
  let formErrors = {};
  let error = '';
  let success = '';
  
  onMount(async () => {
    try {
      const commitResponse = await fetch('/api/committenti');
      if (commitResponse.ok) {
        const result = await commitResponse.json();
        if (result.success) {
          committenti = result.data;
        }
      }
      
      await loadFornitori();
    } catch (err) {
      console.error('Errore caricamento:', err);
      error = $t('errors.network');
    }
  });
  
  async function loadFornitori() {
    loading = true;
    try {
      const response = await fetch('/api/fornitori/global');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          fornitoriOriginali = result.data;
          applyClientFilters();
        } else {
          error = result.error || $t('errors.network');
        }
      } else {
        error = $t('errors.network');
      }
    } catch (err) {
      console.error('Errore fornitori:', err);
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }
  
  function applyClientFilters() {
    if (!fornitoriOriginali || fornitoriOriginali.length === 0) {
      fornitori = [];
      return;
    }
    
    let filtered = fornitoriOriginali.filter(fornitore => {
      if (searchTerm && !fornitore.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !fornitore.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
    
    fornitori = filtered;
  }
  
  async function handleSubmit() {
    if (!formData.ragione_sociale.trim()) {
      formErrors.ragione_sociale = [$t('validation.required')];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = [$t('validation.required')];
      return;
    }

    // Validazione committenti solo per creazione, non per aggiornamento
    if (!editingId && formData.committenti_selezionati.length === 0) {
      formErrors.committenti_selezionati = [$t('validation.required')];
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const url = editingId ? `/api/fornitori/${editingId}` : `/api/fornitori`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = editingId ? $t('suppliers.edit') + ' ' + $t('common.confirm') : $t('suppliers.add') + ' ' + $t('common.confirm');
        await loadFornitori();
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

  async function handleDelete(id, ragione_sociale) {
    if (!confirm(`${$t('suppliers.delete')} "${ragione_sociale}"?`)) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/fornitori/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = $t('suppliers.delete') + ' ' + $t('common.confirm');
        await loadFornitori();
      } else {
        error = result.error || $t('errors.generic');
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  function handleEdit(fornitore) {
    editingId = fornitore.id;
    formData = {
      codice: fornitore.codice,
      ragione_sociale: fornitore.ragione_sociale,
      partita_iva: fornitore.partita_iva || '',
      indirizzo: fornitore.indirizzo || '',
      telefono: fornitore.telefono || '',
      email: fornitore.email || '',
      committenti_selezionati: fornitore.committenti_ids ? fornitore.committenti_ids.split(',').map(id => parseInt(id)) : []
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      ragione_sociale: '',
      partita_iva: '',
      indirizzo: '',
      telefono: '',
      email: '',
      committenti_selezionati: []
    };
    editingId = null;
    showForm = false;
    formErrors = {};
    error = '';
    success = '';
    searchCommittenti = ''; // Reset filtro
  }
  
  function clearAllFilters() {
    searchTerm = '';
    applyClientFilters();
  }
  
  function generateCode() {
    if (formData.ragione_sociale && !editingId) {
      const code = formData.ragione_sociale
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 15);
      formData.codice = 'FORN_' + code;
    }
  }
</script>

<svelte:head>
  <title>{$t('suppliers.title')} - WMS Morlappo</title>
</svelte:head>

<div class="w-full">
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          🚚 {$t('suppliers.title')}
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">{$t('layout.suppliersDesc')}</p>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        on:click={loadFornitori}
        class="btn btn-sm btn-secondary"
        title="{$t('common.refresh')}"
        disabled={loading}
      >
        🔄
      </button>
      
      <button
        on:click={() => showForm = true}
        class="btn btn-primary"
        disabled={loading}
      >
        ➕ {$t('suppliers.add')}
      </button>
    </div>
  </div>

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
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">{$t('common.filter')}</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="{$t('common.search')} {$t('suppliers.title').toLowerCase()}..."
              class="form-input text-sm"
            >
          </div>
          
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
            {fornitori.length} {$t('layout.suppliers').toLowerCase()}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">🚚</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('suppliers.title')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{fornitori.length}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">📧</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('suppliers.email')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {fornitori.filter(f => f.email).length}
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Con P.IVA</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {fornitori.filter(f => f.partita_iva).length}
            </p>
          </div>
        </div>
      </div>
    </div>

    {#if fornitori.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            {$t('suppliers.title')}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{$t('suppliers.code')}</th>
                <th>{$t('suppliers.name')}</th>
                <th>P.IVA</th>
                <th>{$t('suppliers.contact')}</th>
                <th>{$t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each fornitori as fornitore}
                <tr>
                  <td class="font-mono">{fornitore.codice}</td>
                  <td class="font-semibold">{fornitore.ragione_sociale}</td>
                  <td class="font-mono text-sm">{fornitore.partita_iva || '-'}</td>
                  <td class="text-sm">
                    {#if fornitore.email}
                      <div>📧 {fornitore.email}</div>
                    {/if}
                    {#if fornitore.telefono}
                      <div>📞 {fornitore.telefono}</div>
                    {/if}
                    {#if !fornitore.email && !fornitore.telefono}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(fornitore)}
                        title="{$t('suppliers.edit')}"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(fornitore.id, fornitore.ragione_sociale)}
                        title="{$t('suppliers.delete')}"
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
        <div class="text-6xl mb-4">🚚</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          {$t('common.noData')}
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">{$t('common.noData')}</p>
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header bg-white dark:bg-gray-800">
        <h2 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">
          {editingId ? $t('suppliers.edit') : $t('suppliers.add')}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200">✖️</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4 bg-white dark:bg-gray-800">
        
        <!-- Grid layout semplificato -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Ragione Sociale -->
            <div>
              <label class="form-label">{$t('suppliers.name')} *</label>
              <input
                type="text"
                bind:value={formData.ragione_sociale}
                on:input={generateCode}
                class="form-input"
                class:border-red-500={formErrors.ragione_sociale}
                placeholder="Es: Fornitore SpA"
                required
              />
              {#if formErrors.ragione_sociale}
                <p class="form-error">{formErrors.ragione_sociale.join(', ')}</p>
              {/if}
            </div>

            <!-- Codice -->
            <div>
              <label class="form-label">{$t('suppliers.code')} *</label>
              <input
                type="text"
                bind:value={formData.codice}
                class="form-input"
                class:border-red-500={formErrors.codice}
                placeholder="Es: FORN_ABC"
                required
              />
              {#if formErrors.codice}
                <p class="form-error">{formErrors.codice.join(', ')}</p>
              {/if}
            </div>

            <!-- Partita IVA -->
            <div>
              <label class="form-label">{$t('suppliers.vatNumber')}</label>
              <input
                type="text"
                bind:value={formData.partita_iva}
                class="form-input"
                placeholder="Es: 12345678901"
                maxlength="11"
              />
            </div>

            <!-- Indirizzo -->
            <div>
              <label class="form-label">{$t('suppliers.address')}</label>
              <input
                type="text"
                bind:value={formData.indirizzo}
                class="form-input"
                placeholder="Via, numero, città"
              />
            </div>
            <!-- Telefono -->
            <div>
              <label class="form-label">{$t('suppliers.phone')}</label>
              <input
                type="tel"
                bind:value={formData.telefono}
                class="form-input"
                placeholder="Es: +39 123 456 7890"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="form-label">{$t('suppliers.email')}</label>
              <input
                type="email"
                bind:value={formData.email}
                class="form-input"
                placeholder="Es: info@fornitore.com"
              />
            </div>
        </div>

        <!-- Committenti -->
        <div>
          <label class="form-label">{$t('suppliers.clients')} *</label>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Committenti Selezionati -->
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {$t('suppliers.selectedClients')} ({formData.committenti_selezionati.length})
              </p>
              
              {#if formData.committenti_selezionati.length > 0}
                <div class="space-y-1 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2">
                  {#each formData.committenti_selezionati as committente_id}
                    {@const committente = committenti.find(c => c.id === committente_id)}
                    {#if committente}
                      <div class="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                        <span class="text-gray-800 dark:text-gray-200">
                          {committente.codice} - {committente.ragione_sociale}
                        </span>
                        <button
                          type="button"
                          on:click={() => {
                            formData.committenti_selezionati = formData.committenti_selezionati.filter(id => id !== committente_id);
                          }}
                          class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="{$t('common.delete')}"
                        >
                          ×
                        </button>
                      </div>
                    {/if}
                  {/each}
                </div>
              {:else}
                <div class="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-500 dark:text-gray-400">
                  {$t('common.none')} {$t('suppliers.clients').toLowerCase()}
                </div>
              {/if}
            </div>
            
            <!-- Ricerca -->
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {$t('common.search')}
              </p>
              
              <div class="mb-2">
                <input
                  type="text"
                  bind:value={searchCommittenti}
                  placeholder="{$t('common.search')} {$t('suppliers.clients').toLowerCase()}..."
                  class="form-input text-sm"
                />
              </div>
              
              {#if searchCommittenti}
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {committeniFiltrati.length} {$t('suppliers.found')}
                </p>
              {/if}
              
              <div class="space-y-1 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2">
                {#each committeniFiltrati as committente}
                  {#if !formData.committenti_selezionati.includes(committente.id)}
                    <button
                      type="button"
                      on:click={() => {
                        formData.committenti_selezionati = [...formData.committenti_selezionati, committente.id];
                      }}
                      class="w-full text-left px-2 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                    >
                      <span class="text-blue-600 dark:text-blue-400 mr-2">{committente.codice}</span>
                      <span>{committente.ragione_sociale}</span>
                    </button>
                  {/if}
                {:else}
                  <div class="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                    {searchCommittenti ? $t('common.noData') : $t('common.search') + '...'}
                  </div>
                {/each}
              </div>
            </div>
            
          </div>
          
          {#if formErrors.committenti_selezionati}
            <p class="form-error mt-2">{formErrors.committenti_selezionati.join(', ')}</p>
          {/if}
        </div>

        <!-- Bottoni -->
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" on:click={resetForm} class="btn btn-secondary">{$t('common.cancel')}</button>
          <button type="submit" disabled={loading} class="btn btn-primary">
            {#if loading}<div class="spinner w-4 h-4 mr-2"></div>{/if}
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
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-header {
    @apply flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700;
  }
</style>