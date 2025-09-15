<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  
  let causali = [];
  let causaliOriginali = [];
  let loading = true;
  let searchTerm = '';
  
  let showForm = false;
  let editingId = null;
  let formData = {
    codice: '',
    descrizione: '',
    tipo: '',
    richiede_autorizzazione: false,
    attiva: true
  };
  let formErrors = {};
  let error = '';
  let success = '';
  
  // Reactive statement per le traduzioni dei tipi causali
  $: tipiCausali = [
    { value: 'INTERNO', label: $t('transferCauses.types.internal') },
    { value: 'ESTERNO', label: $t('transferCauses.types.external') },
    { value: 'CORREZIONE', label: $t('transferCauses.types.correction') },
    { value: 'OTTIMIZZAZIONE', label: $t('transferCauses.types.optimization') }
  ];
  
  onMount(async () => {
    await loadCausali();
  });
  
  async function loadCausali() {
    loading = true;
    try {
      const response = await fetch('/api/causali');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          causaliOriginali = result.data;
          applyClientFilters();
        } else {
          error = result.error || $t('errors.loadingError');
        }
      } else {
        error = $t('errors.connectionError');
      }
    } catch (err) {
      console.error('Errore causali:', err);
      error = $t('errors.connectionError');
    } finally {
      loading = false;
    }
  }
  
  function applyClientFilters() {
    if (!causaliOriginali || causaliOriginali.length === 0) {
      causali = [];
      return;
    }
    
    let filtered = causaliOriginali.filter(causale => {
      if (searchTerm && !causale.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !causale.descrizione.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
    
    causali = filtered;
  }
  
  async function handleSubmit() {
    if (!formData.descrizione.trim()) {
      formErrors.descrizione = [$t('validation.enterDescription')];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = [$t('validation.enterCode')];
      return;
    }
    
    if (!formData.tipo) {
      formErrors.tipo = [$t('transferCauses.selectType')];
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const url = editingId ? `/api/causali/${editingId}` : `/api/causali`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = editingId ? $t('transferCauses.updateSuccess') : $t('transferCauses.createSuccess');
        await loadCausali();
        resetForm();
      } else {
        error = result.error || $t('errors.saveError');
        if (result.errors) {
          formErrors = result.errors;
        }
      }
    } catch (e) {
      error = $t('errors.connectionError');
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id, descrizione) {
    if (!confirm($t('transferCauses.deleteConfirm', { descrizione }))) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/causali/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = $t('transferCauses.deleteSuccess');
        await loadCausali();
      } else {
        error = result.error || $t('errors.deleteError');
      }
    } catch (e) {
      error = $t('errors.connectionError');
    } finally {
      loading = false;
    }
  }

  function handleEdit(causale) {
    editingId = causale.id;
    formData = {
      codice: causale.codice,
      descrizione: causale.descrizione,
      tipo: causale.tipo,
      richiede_autorizzazione: Boolean(causale.richiede_autorizzazione),
      attiva: Boolean(causale.attiva)
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      descrizione: '',
      tipo: '',
      richiede_autorizzazione: false,
      attiva: true
    };
    editingId = null;
    showForm = false;
    formErrors = {};
    error = '';
    success = '';
  }
  
  function clearAllFilters() {
    searchTerm = '';
    applyClientFilters();
  }
  
  function generateCode() {
    if (formData.descrizione && !editingId) {
      const code = formData.descrizione
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 15);
      formData.codice = code;
    }
  }

  function getTipoLabel(tipo) {
    const found = tipiCausali.find(t => t.value === tipo);
    return found ? found.label : tipo;
  }

  function getTipoBadgeClass(tipo) {
    switch(tipo) {
      case 'INTERNO': return 'badge-primary';
      case 'ESTERNO': return 'badge-secondary';
      case 'CORREZIONE': return 'badge-warning';
      case 'OTTIMIZZAZIONE': return 'badge-success';
      default: return 'badge-neutral';
    }
  }
</script>

<svelte:head>
  <title>Gestione Causali Trasferimento - WMS Morlappo</title>
</svelte:head>

<div class="w-full">
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          📝 {$t('transferCauses.title')}
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">{$t('layout.transferCausesDesc')}</p>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        on:click={loadCausali}
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
        ➕ {$t('transferCauses.add')}
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
          <p class="font-semibold">{$t('common.success')}</p>
          <p class="text-sm mt-1">{success}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600 dark:text-gray-400">{$t('transferCauses.loading')}</span>
    </div>
  {:else}
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">{$t('common.filters')}</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="{$t('common.search')} {$t('transferCauses.causeName').toLowerCase()}..."
              class="form-input text-sm"
            >
          </div>
          
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={clearAllFilters}
              title="{$t('common.resetFilters')}"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {causali.length} {$t('transferCauses.causesCount')}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {#each tipiCausali as tipo}
        <div class="stat-card">
          <div class="flex items-center">
            <div class="stat-icon bg-blue-100">
              <span class="text-blue-600 text-xl">📋</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{tipo.label}</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
                {causali.filter(c => c.tipo === tipo.value).length}
              </p>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if causali.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            {$t('transferCauses.causesList')}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{$t('transferCauses.code')}</th>
                <th>{$t('transferCauses.description')}</th>
                <th>{$t('transferCauses.type')}</th>
                <th>{$t('transferCauses.authorization')}</th>
                <th>{$t('transferCauses.status')}</th>
                <th>{$t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each causali as causale}
                <tr>
                  <td class="font-mono">{causale.codice}</td>
                  <td class="font-semibold">{causale.descrizione}</td>
                  <td>
                    <span class="badge {getTipoBadgeClass(causale.tipo)}">
                      {getTipoLabel(causale.tipo)}
                    </span>
                  </td>
                  <td class="text-center">
                    {#if causale.richiede_autorizzazione}
                      <span class="text-amber-600">🔒 {$t('transferCauses.required')}</span>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  <td>
                    <span class="badge {causale.attiva ? 'badge-success' : 'badge-danger'}">
                      {causale.attiva ? $t('transferCauses.active') : $t('transferCauses.inactive')}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(causale)}
                        title="{$t('transferCauses.edit')}"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(causale.id, causale.descrizione)}
                        title="{$t('transferCauses.delete')}"
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
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          {$t('transferCauses.noCauses')}
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">{$t('transferCauses.noCausesDesc')}</p>
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header bg-white dark:bg-gray-800">
        <h2 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">
          {editingId ? $t('transferCauses.edit') : $t('transferCauses.add')}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200">✖️</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4 bg-white dark:bg-gray-800">
        
        <div>
          <label class="form-label">{$t('transferCauses.description')} *</label>
          <input
            type="text"
            bind:value={formData.descrizione}
            on:input={generateCode}
            class="form-input"
            class:border-red-500={formErrors.descrizione}
            placeholder="{$t('transferCauses.descriptionPlaceholder')}"
            required
          />
          {#if formErrors.descrizione}
            <p class="form-error">{formErrors.descrizione.join(', ')}</p>
          {/if}
        </div>

        <div>
          <label class="form-label">{$t('transferCauses.code')} *</label>
          <input
            type="text"
            bind:value={formData.codice}
            class="form-input"
            class:border-red-500={formErrors.codice}
            placeholder="{$t('transferCauses.codePlaceholder')}"
            required
          />
          {#if formErrors.codice}
            <p class="form-error">{formErrors.codice.join(', ')}</p>
          {/if}
        </div>

        <div>
          <label class="form-label">{$t('transferCauses.type')} *</label>
          <select
            bind:value={formData.tipo}
            class="form-input"
            class:border-red-500={formErrors.tipo}
            required
          >
            <option value="">{$t('common.select')} {$t('transferCauses.type').toLowerCase()}</option>
            {#each tipiCausali as tipo}
              <option value={tipo.value}>{tipo.label}</option>
            {/each}
          </select>
          {#if formErrors.tipo}
            <p class="form-error">{formErrors.tipo.join(', ')}</p>
          {/if}
        </div>

        <div class="flex items-center space-x-4">
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.richiede_autorizzazione}
              class="rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
            <span class="text-sm text-neutral-700 dark:text-gray-300">{$t('transferCauses.requiresAuthorization')}</span>
          </label>
          
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.attiva}
              class="rounded border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
            <span class="text-sm text-neutral-700 dark:text-gray-300">{$t('transferCauses.isActive')}</span>
          </label>
        </div>

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
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-header {
    @apply flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700;
  }
</style>