<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  
  // State management
  let unitaMisura = [];
  let unitaMisuraOriginali = [];
  let committenti = [];
  let loading = true;
  let selectedCommittente = '';
  let searchTerm = '';
  let selectedTipo = '';
  
  // Form state
  let showForm = false;
  let editingId = null;
  let formData = {
    codice: '',
    descrizione: '',
    tipo: 'personalizzata',
    attiva: true,
    committente_id: null
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
      
      // Carica unità di misura
      await loadUnitaMisura();
    } catch (err) {
      console.error('Errore caricamento:', err);
      error = $t('units.messages.loadingError');
    }
  });
  
  async function loadUnitaMisura() {
    loading = true;
    try {
      const response = await fetch('/api/unita-misura/global');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          unitaMisuraOriginali = result.data;
          applyClientFilters();
        } else {
          error = result.error || $t('units.messages.loadingError');
        }
      } else {
        error = $t('units.messages.connectionError');
      }
    } catch (err) {
      console.error('Errore unità di misura:', err);
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }
  
  function applyClientFilters() {
    if (!unitaMisuraOriginali || unitaMisuraOriginali.length === 0) {
      unitaMisura = [];
      return;
    }
    
    let filtered = unitaMisuraOriginali.filter(unita => {
      // Filtro ricerca
      if (searchTerm && !unita.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !unita.descrizione.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro committente
      if (selectedCommittente && unita.committente_id != selectedCommittente) {
        return false;
      }
      
      // Filtro tipo
      if (selectedTipo !== '' && unita.tipo !== selectedTipo) {
        return false;
      }
      
      return true;
    });
    
    unitaMisura = filtered;
  }
  
  async function handleSubmit() {
    if (!formData.descrizione.trim()) {
      formErrors.descrizione = [$t('units.validation.descriptionRequired')];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = [$t('units.validation.codeRequired')];
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const url = editingId ? `/api/unita-misura/${editingId}` : `/api/unita-misura`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = editingId ? $t('units.messages.updateSuccess') : $t('units.messages.createSuccess');
        await loadUnitaMisura();
        resetForm();
      } else {
        error = result.error || $t('units.messages.saveError');
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
    if (!confirm($t('units.messages.deleteConfirm', { description: descrizione }))) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/unita-misura/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = $t('units.messages.deleteSuccess');
        await loadUnitaMisura();
      } else {
        error = result.error || 'Errore nell\'eliminazione';
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  function handleEdit(unita) {
    editingId = unita.id;
    formData = {
      codice: unita.codice,
      descrizione: unita.descrizione,
      tipo: unita.tipo,
      attiva: unita.attiva,
      committente_id: unita.committente_id
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      descrizione: '',
      tipo: 'personalizzata',
      attiva: true,
      committente_id: null
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
    selectedTipo = '';
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
  <title>{$t('units.pageTitle')}</title>
</svelte:head>

<div class="w-full">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          📏 {$t('units.title')}
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">
        {$t('units.subtitle')}
      </p>
    </div>
    
    <!-- Controlli -->
    <div class="flex items-center gap-4">
      <!-- Refresh manuale -->
      <button 
        on:click={loadUnitaMisura}
        class="btn btn-sm btn-secondary"
        title="{$t('units.actions.refresh')}"
        disabled={loading}
      >
        🔄
      </button>
      
      <!-- Nuova unità -->
      <button
        on:click={() => showForm = true}
        class="btn btn-primary"
        disabled={loading}
      >
        ➕ {$t('units.actions.new')}
      </button>
    </div>
  </div>

  <!-- Messaggi -->
  {#if error}
    <div class="alert alert-error mb-6">
      <div class="flex items-center space-x-3">
        <span class="text-lg">❌</span>
        <div>
          <p class="font-semibold">{$t('units.messages.errorTitle')}</p>
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
          <p class="font-semibold">{$t('units.messages.successTitle')}</p>
          <p class="text-sm mt-1">{success}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600 dark:text-gray-400">{$t('units.messages.loading')}</span>
    </div>
  {:else}
    <!-- Filtri -->
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">{$t('units.filters.title')}</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          
          <!-- Ricerca -->
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="{$t('units.filters.search')}"
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
              <option value="">{$t('units.filters.allClients')}</option>
              <option value="null">🌍 {$t('common.global')}</option>
              {#each committenti as committente}
                <option value={committente.id}>
                  {committente.ragione_sociale}
                </option>
              {/each}
            </select>
          </div>
          
          <!-- Tipo -->
          <div class="min-w-24">
            <select 
              bind:value={selectedTipo}
              on:change={applyClientFilters}
              class="form-input text-sm"
            >
              <option value="">{$t('units.filters.allTypes')}</option>
              <option value="sistema">🔧 {$t('units.types.sistema')}</option>
              <option value="personalizzata">👤 {$t('units.types.personalizzata')}</option>
            </select>
          </div>
          
          <!-- Reset -->
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={clearAllFilters}
              title="Reset {$t('units.filters.title')}"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {unitaMisura.length} {$t('units.stats.units')}
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiche -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">📏</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('units.stats.totalUnits')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{unitaMisura.length}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">🔧</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('units.stats.systemUnits')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {unitaMisura.filter(u => u.tipo === 'sistema').length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">👤</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('units.stats.customUnits')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {unitaMisura.filter(u => u.tipo === 'personalizzata').length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-orange-100">
            <span class="text-orange-600 text-xl">🌍</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{$t('units.stats.globalUnits')}</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {unitaMisura.filter(u => !u.committente_id).length}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista Unità di Misura -->
    {#if unitaMisura.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            {$t('units.stats.listTitle')} {selectedCommittente && selectedCommittente !== 'null' ? `- ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : selectedCommittente === 'null' ? $t('units.stats.globalFilter') : $t('units.stats.all')}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{$t('units.table.code')}</th>
                <th>{$t('units.table.description')}</th>
                <th>{$t('units.table.type')}</th>
                <th>{$t('units.table.client')}</th>
                <th>{$t('units.table.status')}</th>
                <th>{$t('units.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each unitaMisura as unita}
                <tr>
                  <td class="font-mono font-bold">{unita.codice}</td>
                  <td>{unita.descrizione}</td>
                  <td>
                    <span class="badge {unita.tipo === 'sistema' ? 'badge-primary' : 'badge-secondary'}">
                      {unita.tipo === 'sistema' ? `🔧 ${$t('units.types.sistema')}` : `👤 ${$t('units.types.personalizzata')}`}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center">
                      {#if unita.committente_id}
                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        <span class="text-sm font-medium">
                          {unita.committente_ragione_sociale || 'N/A'}
                        </span>
                      {:else}
                        <span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        <span class="text-sm font-medium text-orange-700">
                          🌍 {$t('common.global')}
                        </span>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <span class="badge {unita.attiva ? 'badge-success' : 'badge-danger'}">
                      {unita.attiva ? 'Attiva' : 'Inattiva'}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(unita)}
                        title="{$t('units.actions.edit')}"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(unita.id, unita.descrizione)}
                        title="{$t('units.actions.delete')}"
                        disabled={unita.tipo === 'sistema'}
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
        <div class="text-6xl mb-4">📏</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          {$t('units.messages.noResults')}
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">
          {selectedCommittente ? $t('units.messages.noResultsClient') : $t('units.messages.noResultsSystem')}
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
          {editingId ? $t('units.form.editTitle') : $t('units.form.title')}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200">
          ✖️
        </button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4 bg-white dark:bg-gray-800">
        
        <!-- Ambito -->
        <div>
          <label class="form-label">{$t('units.table.client')}</label>
          <select
            bind:value={formData.committente_id}
            class="form-input"
          >
            <option value={null}>{$t('units.form.globalUnit')}</option>
            {#each committenti as committente}
              <option value={committente.id}>{committente.ragione_sociale}</option>
            {/each}
          </select>
        </div>

        <!-- Tipo -->
        <div>
          <label class="form-label">{$t('units.form.type')} *</label>
          <select
            bind:value={formData.tipo}
            class="form-input"
            required
          >
            <option value="personalizzata">{$t('units.types.personalizzata')}</option>
            <option value="sistema">{$t('units.types.sistema')}</option>
          </select>
        </div>

        <!-- Descrizione -->
        <div>
          <label class="form-label">{$t('units.form.description')} *</label>
          <input
            type="text"
            bind:value={formData.descrizione}
            on:input={generateCode}
            class="form-input"
            class:border-red-500={formErrors.descrizione}
            placeholder="{$t('units.form.descriptionPlaceholder')}"
            required
            maxlength="100"
          />
          {#if formErrors.descrizione}
            <p class="form-error mt-1">{formErrors.descrizione.join(', ')}</p>
          {/if}
        </div>

        <!-- Codice -->
        <div>
          <label class="form-label">{$t('units.form.code')} *</label>
          <input
            type="text"
            bind:value={formData.codice}
            class="form-input"
            class:border-red-500={formErrors.codice}
            placeholder="{$t('units.form.codePlaceholder')}"
            required
            maxlength="10"
          />
          {#if formErrors.codice}
            <p class="form-error mt-1">{formErrors.codice.join(', ')}</p>
          {/if}
        </div>

        <!-- Attiva -->
        <div class="flex items-center space-x-3">
          <input
            type="checkbox"
            id="attiva"
            bind:checked={formData.attiva}
            class="rounded border-neutral-300"
          />
          <label for="attiva" class="text-sm font-medium text-neutral-700 dark:text-gray-300">
            {$t('units.form.active')}
          </label>
        </div>

        <!-- Bottoni -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            on:click={resetForm}
            class="btn btn-secondary"
          >
            {$t('units.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            class="btn btn-primary"
          >
            {#if loading}
              <div class="spinner w-4 h-4 mr-2"></div>
            {/if}
            {$t('units.form.save')}
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