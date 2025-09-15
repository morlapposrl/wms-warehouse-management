<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  
  let tipi = [];
  let tipiOriginali = [];
  let loading = true;
  let searchTerm = '';
  let filterCategoria = '';
  
  let showForm = false;
  let editingId = null;
  let formData = {
    codice: '',
    nome: '',
    descrizione: '',
    categoria: '',
    lunghezza_cm: '',
    larghezza_cm: '',
    altezza_max_cm: '',
    peso_max_kg: '',
    impilabile: true,
    max_stack: '5',
    riutilizzabile: true,
    costo_acquisto: '',
    costo_noleggio_giorno: '',
    attivo: true
  };
  let formErrors = {};
  let error = '';
  let success = '';
  
  $: categorie = [
    { value: 'PALLET', label: $t('udcTypes.categories.PALLET'), icon: '🪚' },
    { value: 'CONTAINER', label: $t('udcTypes.categories.CONTAINER'), icon: '📦' },
    { value: 'BOX', label: $t('udcTypes.categories.BOX'), icon: '🗂️' },
    { value: 'ROLL', label: $t('udcTypes.categories.ROLL'), icon: '🛒' },
    { value: 'CUSTOM', label: $t('udcTypes.categories.CUSTOM'), icon: '⚙️' }
  ];
  
  onMount(async () => {
    await loadTipi();
  });
  
  async function loadTipi() {
    loading = true;
    try {
      const response = await fetch('/api/tipi-udc');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          tipiOriginali = result.data;
          applyClientFilters();
        } else {
          error = result.error || $t('errors.loadingError');
        }
      } else {
        error = $t('errors.connectionError');
      }
    } catch (err) {
      console.error('Errore tipi UDC:', err);
      error = $t('errors.connectionError');
    } finally {
      loading = false;
    }
  }
  
  function applyClientFilters() {
    if (!tipiOriginali || tipiOriginali.length === 0) {
      tipi = [];
      return;
    }
    
    let filtered = tipiOriginali.filter(tipo => {
      if (searchTerm && !tipo.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !tipo.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterCategoria && tipo.categoria !== filterCategoria) {
        return false;
      }
      return true;
    });
    
    tipi = filtered;
  }
  
  async function handleSubmit() {
    if (!formData.nome.trim() || !formData.codice.trim() || !formData.categoria) {
      formErrors = {
        nome: !formData.nome.trim() ? ['Inserisci un nome'] : [],
        codice: !formData.codice.trim() ? ['Inserisci un codice'] : [],
        categoria: !formData.categoria ? ['Seleziona una categoria'] : []
      };
      return;
    }
    
    if (!formData.lunghezza_cm || !formData.larghezza_cm || !formData.altezza_max_cm || !formData.peso_max_kg) {
      formErrors = {
        ...formErrors,
        lunghezza_cm: !formData.lunghezza_cm ? ['Inserisci la lunghezza'] : [],
        larghezza_cm: !formData.larghezza_cm ? ['Inserisci la larghezza'] : [],
        altezza_max_cm: !formData.altezza_max_cm ? ['Inserisci l\'altezza massima'] : [],
        peso_max_kg: !formData.peso_max_kg ? ['Inserisci il peso massimo'] : []
      };
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const url = editingId ? `/api/tipi-udc/${editingId}` : `/api/tipi-udc`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = editingId ? $t('common.updateSuccess') : $t('common.createSuccess');
        await loadTipi();
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

  async function handleDelete(id, nome) {
    if (!confirm($t('udcTypes.deleteConfirm', { nome }))) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/tipi-udc/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = $t('common.deleteSuccess');
        await loadTipi();
      } else {
        error = result.error || $t('errors.deleteError');
      }
    } catch (e) {
      error = $t('errors.connectionError');
    } finally {
      loading = false;
    }
  }

  function handleEdit(tipo) {
    editingId = tipo.id;
    formData = {
      codice: tipo.codice,
      nome: tipo.nome,
      descrizione: tipo.descrizione || '',
      categoria: tipo.categoria,
      lunghezza_cm: tipo.lunghezza_cm.toString(),
      larghezza_cm: tipo.larghezza_cm.toString(),
      altezza_max_cm: tipo.altezza_max_cm.toString(),
      peso_max_kg: tipo.peso_max_kg.toString(),
      impilabile: Boolean(tipo.impilabile),
      max_stack: tipo.max_stack.toString(),
      riutilizzabile: Boolean(tipo.riutilizzabile),
      costo_acquisto: tipo.costo_acquisto ? tipo.costo_acquisto.toString() : '',
      costo_noleggio_giorno: tipo.costo_noleggio_giorno ? tipo.costo_noleggio_giorno.toString() : '',
      attivo: Boolean(tipo.attivo)
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      nome: '',
      descrizione: '',
      categoria: '',
      lunghezza_cm: '',
      larghezza_cm: '',
      altezza_max_cm: '',
      peso_max_kg: '',
      impilabile: true,
      max_stack: '5',
      riutilizzabile: true,
      costo_acquisto: '',
      costo_noleggio_giorno: '',
      attivo: true
    };
    editingId = null;
    showForm = false;
    formErrors = {};
    error = '';
    success = '';
  }
  
  function clearAllFilters() {
    searchTerm = '';
    filterCategoria = '';
    applyClientFilters();
  }
  
  function generateCode() {
    if (formData.nome && formData.categoria && !editingId) {
      const categoryCode = formData.categoria.substring(0, 3);
      const nameCode = formData.nome
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 10);
      formData.codice = `${categoryCode}_${nameCode}`;
    }
  }

  function getCategoriaInfo(categoria) {
    return categorie.find(c => c.value === categoria) || { label: categoria, icon: '📦' };
  }

  function formatVolume(lunghezza, larghezza, altezza) {
    const volume = (lunghezza * larghezza * altezza) / 1000000; // m³
    return volume.toFixed(2);
  }
</script>

<svelte:head>
  <title>{$t('udcTypes.title')} - WMS Morlappo</title>
</svelte:head>

<div class="w-full">
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          📦 {$t('udcTypes.title')}
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">{$t('layout.udcTypesDesc')}</p>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        on:click={loadTipi}
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
        ➕ {$t('udcTypes.add')}
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
      <span class="ml-3 text-neutral-600 dark:text-gray-400">{$t('common.loading')}...</span>
    </div>
  {:else}
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">{$t('common.filters')}</span>
        </div>
        <div class="flex items-end gap-2 flex-wrap">
          <div class="min-w-32">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="{$t('common.search')} {$t('udcTypes.name').toLowerCase()}..."
              class="form-input text-sm"
            >
          </div>
          
          <div class="min-w-32">
            <select 
              bind:value={filterCategoria}
              on:change={applyClientFilters}
              class="form-input text-sm"
            >
              <option value="">{$t('common.all')} {$t('udcTypes.allCategories')}</option>
              {#each categorie as cat}
                <option value={cat.value}>{cat.icon} {cat.label}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={clearAllFilters}
              title="{$t('common.reset')} {$t('common.filters').toLowerCase()}"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {tipi.length} {$t('udcTypes.totalTypes').toLowerCase()}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      {#each categorie as categoria}
        <div class="stat-card">
          <div class="flex items-center">
            <div class="stat-icon bg-blue-100">
              <span class="text-blue-600 text-xl">{categoria.icon}</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">{categoria.label}</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
                {tipi.filter(t => t.categoria === categoria.value).length}
              </p>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if tipi.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            {$t('udcTypes.typesList')}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{$t('udcTypes.code')}</th>
                <th>{$t('udcTypes.name')}</th>
                <th>{$t('udcTypes.category')}</th>
                <th>{$t('udcTypes.dimensions')}</th>
                <th>{$t('udcTypes.properties')}</th>
                <th>{$t('udcTypes.costs')}</th>
                <th>{$t('udcTypes.status')}</th>
                <th>{$t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each tipi as tipo}
                <tr>
                  <td class="font-mono text-sm">{tipo.codice}</td>
                  <td>
                    <div class="font-semibold">{tipo.nome}</div>
                    {#if tipo.descrizione}
                      <div class="text-sm text-neutral-500">{tipo.descrizione}</div>
                    {/if}
                  </td>
                  <td>
                    <span class="inline-flex items-center gap-1">
                      {getCategoriaInfo(tipo.categoria).icon}
                      {getCategoriaInfo(tipo.categoria).label}
                    </span>
                  </td>
                  <td class="text-sm">
                    <div>{tipo.lunghezza_cm}×{tipo.larghezza_cm}×{tipo.altezza_max_cm} cm</div>
                    <div class="text-neutral-500">
                      Vol: {formatVolume(tipo.lunghezza_cm, tipo.larghezza_cm, tipo.altezza_max_cm)} m³
                    </div>
                    <div class="text-neutral-500">Max: {tipo.peso_max_kg} kg</div>
                  </td>
                  <td class="text-sm">
                    {#if tipo.impilabile}
                      <div class="text-green-600">📚 Stack: {tipo.max_stack}</div>
                    {/if}
                    {#if tipo.riutilizzabile}
                      <div class="text-blue-600">♻️ {$t('udcTypes.reusable')}</div>
                    {:else}
                      <div class="text-amber-600">🗑️ Monouso</div>
                    {/if}
                  </td>
                  <td class="text-sm">
                    {#if tipo.costo_acquisto}
                      <div>💰 €{tipo.costo_acquisto}</div>
                    {/if}
                    {#if tipo.costo_noleggio_giorno}
                      <div>📅 €{tipo.costo_noleggio_giorno}/g</div>
                    {/if}
                    {#if !tipo.costo_acquisto && !tipo.costo_noleggio_giorno}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  <td>
                    <span class="badge {tipo.attivo ? 'badge-success' : 'badge-danger'}">
                      {tipo.attivo ? $t('udcTypes.active') : $t('udcTypes.inactive')}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(tipo)}
                        title="{$t('common.edit')}"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(tipo.id, tipo.nome)}
                        title="{$t('common.delete')}"
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
        <div class="text-6xl mb-4">📦</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          {$t('udcTypes.noTypes')}
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">{$t('udcTypes.noTypesDesc')}</p>
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content large" on:click|stopPropagation>
      <div class="modal-header bg-white dark:bg-gray-800">
        <h2 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">
          {editingId ? $t('udcTypes.edit') : $t('udcTypes.add')}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200">✖️</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4 bg-white dark:bg-gray-800">
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{$t('udcTypes.name')} *</label>
            <input
              type="text"
              bind:value={formData.nome}
              on:input={generateCode}
              class="form-input"
              class:border-red-500={formErrors.nome}
              placeholder="{$t('udcTypes.namePlaceholder')}"
              required
            />
            {#if formErrors.nome}
              <p class="form-error">{formErrors.nome.join(', ')}</p>
            {/if}
          </div>

          <div>
            <label class="form-label">{$t('udcTypes.code')} *</label>
            <input
              type="text"
              bind:value={formData.codice}
              class="form-input"
              class:border-red-500={formErrors.codice}
              placeholder="{$t('udcTypes.codePlaceholder')}"
              required
            />
            {#if formErrors.codice}
              <p class="form-error">{formErrors.codice.join(', ')}</p>
            {/if}
          </div>
        </div>

        <div>
          <label class="form-label">{$t('udcTypes.description')}</label>
          <textarea
            bind:value={formData.descrizione}
            class="form-input"
            rows="2"
            placeholder="{$t('udcTypes.descriptionPlaceholder')}"
          ></textarea>
        </div>

        <div>
          <label class="form-label">{$t('udcTypes.category')} *</label>
          <select
            bind:value={formData.categoria}
            class="form-input"
            class:border-red-500={formErrors.categoria}
            required
          >
            <option value="">{$t('common.select')} {$t('udcTypes.category').toLowerCase()}</option>
            {#each categorie as cat}
              <option value={cat.value}>{cat.icon} {cat.label}</option>
            {/each}
          </select>
          {#if formErrors.categoria}
            <p class="form-error">{formErrors.categoria.join(', ')}</p>
          {/if}
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="form-label">{$t('udcTypes.length')} (cm) *</label>
            <input
              type="number"
              bind:value={formData.lunghezza_cm}
              class="form-input"
              class:border-red-500={formErrors.lunghezza_cm}
              placeholder="120"
              min="1"
              required
            />
            {#if formErrors.lunghezza_cm}
              <p class="form-error">{formErrors.lunghezza_cm.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="form-label">{$t('udcTypes.width')} (cm) *</label>
            <input
              type="number"
              bind:value={formData.larghezza_cm}
              class="form-input"
              class:border-red-500={formErrors.larghezza_cm}
              placeholder="80"
              min="1"
              required
            />
            {#if formErrors.larghezza_cm}
              <p class="form-error">{formErrors.larghezza_cm.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="form-label">{$t('udcTypes.maxHeight')} (cm) *</label>
            <input
              type="number"
              bind:value={formData.altezza_max_cm}
              class="form-input"
              class:border-red-500={formErrors.altezza_max_cm}
              placeholder="180"
              min="1"
              required
            />
            {#if formErrors.altezza_max_cm}
              <p class="form-error">{formErrors.altezza_max_cm.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="form-label">{$t('udcTypes.maxWeight')} (kg) *</label>
            <input
              type="number"
              bind:value={formData.peso_max_kg}
              class="form-input"
              class:border-red-500={formErrors.peso_max_kg}
              placeholder="1500"
              step="0.1"
              min="0.1"
              required
            />
            {#if formErrors.peso_max_kg}
              <p class="form-error">{formErrors.peso_max_kg.join(', ')}</p>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{$t('udcTypes.maxStack')}</label>
            <input
              type="number"
              bind:value={formData.max_stack}
              class="form-input"
              placeholder="5"
              min="1"
            />
          </div>
          <div>
            <label class="form-label">{$t('udcTypes.purchaseCost')} (€)</label>
            <input
              type="number"
              bind:value={formData.costo_acquisto}
              class="form-input"
              placeholder="12.50"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div>
          <label class="form-label">{$t('udcTypes.dailyRentalCost')} (€)</label>
          <input
            type="number"
            bind:value={formData.costo_noleggio_giorno}
            class="form-input"
            placeholder="0.50"
            step="0.01"
            min="0"
          />
        </div>

        <div class="flex items-center space-x-6">
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.impilabile}
              class="checkbox"
            />
            <span class="text-sm">{$t('udcTypes.stackable')}</span>
          </label>
          
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.riutilizzabile}
              class="checkbox"
            />
            <span class="text-sm">{$t('udcTypes.reusable')}</span>
          </label>
          
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.attivo}
              class="checkbox"
            />
            <span class="text-sm">{$t('udcTypes.active')}</span>
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
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-content.large {
    @apply max-w-4xl;
  }
  
  .modal-header {
    @apply flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700;
  }
</style>