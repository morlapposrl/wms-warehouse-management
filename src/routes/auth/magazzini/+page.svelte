<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  
  let magazzini = [];
  let magazziniOriginali = [];
  let loading = true;
  let searchTerm = '';
  
  let showForm = false;
  let editingId = null;
  let formData = {
    codice: '',
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    larghezza_metri: '',
    lunghezza_metri: '',
    altezza_metri: '',
    temperatura_min: '',
    temperatura_max: '',
    umidita_max: ''
  };
  let formErrors = {};
  let error = '';
  let success = '';
  
  onMount(async () => {
    await loadMagazzini();
  });
  
  async function loadMagazzini() {
    loading = true;
    try {
      const response = await fetch('/api/magazzini');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          magazziniOriginali = result.data;
          applyClientFilters();
        } else {
          error = result.error || $t('errors.loadingError');
        }
      } else {
        error = $t('errors.connectionError');
      }
    } catch (err) {
      console.error('Errore magazzini:', err);
      error = $t('errors.connectionError');
    } finally {
      loading = false;
    }
  }
  
  function applyClientFilters() {
    if (!magazziniOriginali || magazziniOriginali.length === 0) {
      magazzini = [];
      return;
    }
    
    let filtered = magazziniOriginali.filter(magazzino => {
      if (searchTerm && !magazzino.codice.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !magazzino.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
    
    magazzini = filtered;
  }
  
  async function handleSubmit() {
    if (!formData.nome.trim()) {
      formErrors.nome = [$t('validation.enterName')];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = [$t('validation.enterCode')];
      return;
    }
    
    if (!formData.larghezza_metri || !formData.lunghezza_metri || !formData.altezza_metri) {
      formErrors.larghezza_metri = !formData.larghezza_metri ? [$t('validation.enterWidth')] : [];
      formErrors.lunghezza_metri = !formData.lunghezza_metri ? [$t('validation.enterLength')] : [];
      formErrors.altezza_metri = !formData.altezza_metri ? [$t('validation.enterHeight')] : [];
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const url = editingId ? `/api/magazzini/${editingId}` : `/api/magazzini`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = editingId ? $t('warehouses.updateSuccess') : $t('warehouses.createSuccess');
        await loadMagazzini();
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
    if (!confirm($t('warehouses.deleteConfirm', { nome }))) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/magazzini/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = $t('warehouses.deleteSuccess');
        await loadMagazzini();
      } else {
        error = result.error || $t('errors.deleteError');
      }
    } catch (e) {
      error = $t('errors.connectionError');
    } finally {
      loading = false;
    }
  }

  function handleEdit(magazzino) {
    editingId = magazzino.id;
    formData = {
      codice: magazzino.codice,
      nome: magazzino.nome,
      indirizzo: magazzino.indirizzo || '',
      citta: magazzino.citta || '',
      cap: magazzino.cap || '',
      larghezza_metri: magazzino.larghezza_metri.toString(),
      lunghezza_metri: magazzino.lunghezza_metri.toString(),
      altezza_metri: magazzino.altezza_metri.toString(),
      temperatura_min: magazzino.temperatura_min ? magazzino.temperatura_min.toString() : '',
      temperatura_max: magazzino.temperatura_max ? magazzino.temperatura_max.toString() : '',
      umidita_max: magazzino.umidita_max ? magazzino.umidita_max.toString() : ''
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      nome: '',
      indirizzo: '',
      citta: '',
      cap: '',
      larghezza_metri: '',
      lunghezza_metri: '',
      altezza_metri: '',
      temperatura_min: '',
      temperatura_max: '',
      umidita_max: ''
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
    if (formData.nome && !editingId) {
      const code = formData.nome
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10);
      formData.codice = 'MAG_' + code;
    }
  }
</script>

<svelte:head>
  <title>Gestione Magazzini - WMS Morlappo</title>
</svelte:head>

<div class="w-full">
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          🏢 {$t('warehouses.title')}
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">{$t('layout.warehousesDesc')}</p>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        on:click={loadMagazzini}
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
        ➕ {$t('warehouses.add')}
      </button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="text-red-600 dark:text-red-400 text-lg">❌</span>
        <div>
          <p class="font-semibold text-red-800 dark:text-red-200">{$t('errors.generic')}</p>
          <p class="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if success}
    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="text-green-600 dark:text-green-400 text-lg">✅</span>
        <div>
          <p class="font-semibold text-green-800 dark:text-green-200">{$t('common.success')}</p>
          <p class="text-sm text-green-700 dark:text-green-300 mt-1">{success}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">{$t('warehouses.loading')}</span>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg">🔍</span>
        <span class="text-md font-semibold text-gray-900 dark:text-gray-100">{$t('common.filters')}</span>
      </div>
      <div class="flex items-end gap-2 flex-nowrap">
        <div class="min-w-28">
          <input 
            type="text" 
            bind:value={searchTerm}
            on:input={applyClientFilters}
            placeholder="{$t('common.search')} {$t('warehouses.name').toLowerCase()}..."
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm"
          >
        </div>
        
        <div>
          <button
            class="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            on:click={clearAllFilters}
            title="{$t('common.resetFilters')}"
          >
            ↻
          </button>
        </div>
        
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {magazzini.length} {$t('warehouses.warehousesCount')}
        </div>
      </div>
    </div>

    <!-- KPI Cards moderne -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <span class="text-blue-600 dark:text-blue-400 text-xl">🏢</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$t('warehouses.totalWarehouses')}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{magazzini.length}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <span class="text-green-600 dark:text-green-400 text-xl">📏</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$t('warehouses.totalSurface')}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {magazzini.reduce((sum, m) => sum + (m.superficie_mq || 0), 0).toFixed(0)} m²
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <span class="text-purple-600 dark:text-purple-400 text-xl">📦</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$t('warehouses.totalVolume')}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {magazzini.reduce((sum, m) => sum + (m.volume_mc || 0), 0).toFixed(0)} m³
            </p>
          </div>
        </div>
      </div>
    </div>

    {#if magazzini.length > 0}
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            {$t('warehouses.warehouseList')}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>{$t('warehouses.code')}</th>
                <th>{$t('warehouses.name')}</th>
                <th>{$t('warehouses.location')}</th>
                <th>{$t('warehouses.dimensions')}</th>
                <th>{$t('warehouses.environmentalControls')}</th>
                <th>{$t('warehouses.status')}</th>
                <th>{$t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each magazzini as magazzino}
                <tr>
                  <td class="font-mono">{magazzino.codice}</td>
                  <td class="font-semibold">{magazzino.nome}</td>
                  <td class="text-sm">
                    {#if magazzino.indirizzo}
                      <div>{magazzino.indirizzo}</div>
                      <div class="text-neutral-500">{magazzino.citta} {magazzino.cap}</div>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  <td class="text-sm">
                    <div>{magazzino.larghezza_metri}×{magazzino.lunghezza_metri}×{magazzino.altezza_metri}m</div>
                    <div class="text-neutral-500">{magazzino.superficie_mq}m² - {magazzino.volume_mc}m³</div>
                  </td>
                  <td class="text-sm">
                    {#if magazzino.temperatura_min || magazzino.temperatura_max || magazzino.umidita_max}
                      {#if magazzino.temperatura_min && magazzino.temperatura_max}
                        <div>🌡️ {magazzino.temperatura_min}°-{magazzino.temperatura_max}°C</div>
                      {/if}
                      {#if magazzino.umidita_max}
                        <div>💧 max {magazzino.umidita_max}%</div>
                      {/if}
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  <td>
                    <span class="badge {magazzino.attivo ? 'badge-success' : 'badge-danger'}">
                      {magazzino.attivo ? $t('warehouses.active') : $t('warehouses.inactive')}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button 
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        on:click={() => handleEdit(magazzino)}
                        title="{$t('common.edit')}"
                      >
                        ✏️
                      </button>
                      <button 
                        class="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        on:click={() => handleDelete(magazzino.id, magazzino.nome)}
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
        <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span class="text-3xl">🏢</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {$t('warehouses.noWarehouses')}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{$t('warehouses.noWarehousesDesc')}</p>
        <button
          on:click={() => showForm = true}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          ➕ {$t('warehouses.add')}
        </button>
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
      
      <!-- Header semplice -->
      <div class="bg-blue-600 px-4 py-3 flex justify-between items-center">
        <h2 class="text-white font-semibold">🏢 {editingId ? $t('warehouses.edit') : $t('warehouses.add')}</h2>
        <button 
          on:click={resetForm}
          class="text-white hover:text-gray-200 text-xl"
        >
          ×
        </button>
      </div>
      
      <!-- Content scrollabile -->
      <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
        <form on:submit|preventDefault={handleSubmit} class="p-4 space-y-4">
        
        <!-- Riga 1: Nome e Codice -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.name')} *</label>
            <input
              type="text"
              bind:value={formData.nome}
              on:input={generateCode}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              class:border-red-500={formErrors.nome}
              placeholder="{$t('warehouses.namePlaceholder')}"
              required
            />
            {#if formErrors.nome}
              <p class="text-red-500 text-xs mt-1">{formErrors.nome.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.code')} *</label>
            <input
              type="text"
              bind:value={formData.codice}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              class:border-red-500={formErrors.codice}
              placeholder="{$t('warehouses.codePlaceholder')}"
              required
            />
            {#if formErrors.codice}
              <p class="text-red-500 text-xs mt-1">{formErrors.codice.join(', ')}</p>
            {/if}
          </div>
        </div>

        <!-- Riga 2: Indirizzo completo -->
        <div>
          <label class="block text-sm font-medium mb-1">{$t('warehouses.address')}</label>
          <input
            type="text"
            bind:value={formData.indirizzo}
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            placeholder="{$t('warehouses.addressPlaceholder')}"
          />
        </div>

        <!-- Riga 3: Città e CAP -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.city')}</label>
            <input
              type="text"
              bind:value={formData.citta}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="{$t('warehouses.cityPlaceholder')}"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.postalCode')}</label>
            <input
              type="text"
              bind:value={formData.cap}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="20100"
              maxlength="5"
            />
          </div>
        </div>

        <!-- Riga 4: Dimensioni -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.width')} (m) *</label>
            <input
              type="number"
              bind:value={formData.larghezza_metri}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              class:border-red-500={formErrors.larghezza_metri}
              placeholder="60"
              step="0.1"
              required
            />
            {#if formErrors.larghezza_metri}
              <p class="text-red-500 text-xs mt-1">{formErrors.larghezza_metri.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.length')} (m) *</label>
            <input
              type="number"
              bind:value={formData.lunghezza_metri}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              class:border-red-500={formErrors.lunghezza_metri}
              placeholder="40"
              step="0.1"
              required
            />
            {#if formErrors.lunghezza_metri}
              <p class="text-red-500 text-xs mt-1">{formErrors.lunghezza_metri.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.height')} (m) *</label>
            <input
              type="number"
              bind:value={formData.altezza_metri}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              class:border-red-500={formErrors.altezza_metri}
              placeholder="8"
              step="0.1"
              required
            />
            {#if formErrors.altezza_metri}
              <p class="text-red-500 text-xs mt-1">{formErrors.altezza_metri.join(', ')}</p>
            {/if}
          </div>
        </div>

        <!-- Riga 5: Controlli ambientali -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.tempMin')} (°C)</label>
            <input
              type="number"
              bind:value={formData.temperatura_min}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="5"
              step="0.1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.tempMax')} (°C)</label>
            <input
              type="number"
              bind:value={formData.temperatura_max}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="35"
              step="0.1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{$t('warehouses.humidityMax')} (%)</label>
            <input
              type="number"
              bind:value={formData.umidita_max}
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="80"
              step="0.1"
              min="0"
              max="100"
            />
          </div>
        </div>

        </form>
      </div>

      <!-- Footer semplice -->
      <div class="border-t bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
        <button 
          type="button" 
          on:click={resetForm} 
          class="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
        >
          {$t('common.cancel')}
        </button>
        
        <button 
          type="button"
          on:click={handleSubmit} 
          disabled={loading} 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2"
        >
          {#if loading}<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{/if}
          {editingId ? $t('common.save') : $t('common.add')}
        </button>
      </div>
    </div>
  </div>
{/if}