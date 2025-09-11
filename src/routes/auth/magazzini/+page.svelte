<script>
  import { onMount } from 'svelte';
  
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
          error = result.error || 'Errore nel caricamento';
        }
      } else {
        error = 'Errore di connessione';
      }
    } catch (err) {
      console.error('Errore magazzini:', err);
      error = 'Errore di connessione';
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
      formErrors.nome = ['Inserisci un nome'];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = ['Inserisci un codice'];
      return;
    }
    
    if (!formData.larghezza_metri || !formData.lunghezza_metri || !formData.altezza_metri) {
      formErrors.larghezza_metri = !formData.larghezza_metri ? ['Inserisci la larghezza'] : [];
      formErrors.lunghezza_metri = !formData.lunghezza_metri ? ['Inserisci la lunghezza'] : [];
      formErrors.altezza_metri = !formData.altezza_metri ? ['Inserisci l\'altezza'] : [];
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
        success = editingId ? 'Magazzino aggiornato con successo' : 'Magazzino creato con successo';
        await loadMagazzini();
        resetForm();
      } else {
        error = result.error || 'Errore nel salvataggio';
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

  async function handleDelete(id, nome) {
    if (!confirm(`Sei sicuro di voler eliminare il magazzino "${nome}"?`)) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/magazzini/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = 'Magazzino eliminato con successo';
        await loadMagazzini();
      } else {
        error = result.error || 'Errore nell\'eliminazione';
      }
    } catch (e) {
      error = 'Errore di connessione';
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
          🏢 Gestione Magazzini
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">Configurazione magazzini fisici</p>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        on:click={loadMagazzini}
        class="btn btn-sm btn-secondary"
        title="Ricarica magazzini"
        disabled={loading}
      >
        🔄
      </button>
      
      <button
        on:click={() => showForm = true}
        class="btn btn-primary"
        disabled={loading}
      >
        ➕ Nuovo Magazzino
      </button>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error mb-6">
      <div class="flex items-center space-x-3">
        <span class="text-lg">❌</span>
        <div>
          <p class="font-semibold">Errore</p>
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
          <p class="font-semibold">Successo</p>
          <p class="text-sm mt-1">{success}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600 dark:text-gray-400">Caricamento magazzini...</span>
    </div>
  {:else}
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">Filtri</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="Cerca magazzino..."
              class="form-input text-sm"
            >
          </div>
          
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={clearAllFilters}
              title="Reset filtri"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {magazzini.length} magazzini
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">🏢</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Magazzini Totali</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">{magazzini.length}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">📏</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Superficie Totale</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
              {magazzini.reduce((sum, m) => sum + (m.superficie_mq || 0), 0).toFixed(0)} m²
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">📦</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Volume Totale</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
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
            Lista Magazzini
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Codice</th>
                <th>Nome</th>
                <th>Ubicazione</th>
                <th>Dimensioni</th>
                <th>Controlli Ambientali</th>
                <th>Stato</th>
                <th>Azioni</th>
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
                      {magazzino.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(magazzino)}
                        title="Modifica magazzino"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(magazzino.id, magazzino.nome)}
                        title="Elimina magazzino"
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
        <div class="text-6xl mb-4">🏢</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          Nessun magazzino trovato
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">Non ci sono magazzini nel sistema</p>
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold">
          {editingId ? 'Modifica Magazzino' : 'Nuovo Magazzino'}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400">✖️</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
        
        <div>
          <label class="form-label">Nome *</label>
          <input
            type="text"
            bind:value={formData.nome}
            on:input={generateCode}
            class="form-input"
            class:border-red-500={formErrors.nome}
            placeholder="Es: Magazzino Centrale Milano"
            required
          />
          {#if formErrors.nome}
            <p class="form-error">{formErrors.nome.join(', ')}</p>
          {/if}
        </div>

        <div>
          <label class="form-label">Codice *</label>
          <input
            type="text"
            bind:value={formData.codice}
            class="form-input"
            class:border-red-500={formErrors.codice}
            placeholder="Es: MAG_MILANO01"
            required
          />
          {#if formErrors.codice}
            <p class="form-error">{formErrors.codice.join(', ')}</p>
          {/if}
        </div>

        <div>
          <label class="form-label">Indirizzo</label>
          <input
            type="text"
            bind:value={formData.indirizzo}
            class="form-input"
            placeholder="Via, numero"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Città</label>
            <input
              type="text"
              bind:value={formData.citta}
              class="form-input"
              placeholder="Milano"
            />
          </div>
          <div>
            <label class="form-label">CAP</label>
            <input
              type="text"
              bind:value={formData.cap}
              class="form-input"
              placeholder="20100"
              maxlength="5"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="form-label">Larghezza (m) *</label>
            <input
              type="number"
              bind:value={formData.larghezza_metri}
              class="form-input"
              class:border-red-500={formErrors.larghezza_metri}
              placeholder="60"
              step="0.1"
              required
            />
            {#if formErrors.larghezza_metri}
              <p class="form-error">{formErrors.larghezza_metri.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="form-label">Lunghezza (m) *</label>
            <input
              type="number"
              bind:value={formData.lunghezza_metri}
              class="form-input"
              class:border-red-500={formErrors.lunghezza_metri}
              placeholder="40"
              step="0.1"
              required
            />
            {#if formErrors.lunghezza_metri}
              <p class="form-error">{formErrors.lunghezza_metri.join(', ')}</p>
            {/if}
          </div>
          <div>
            <label class="form-label">Altezza (m) *</label>
            <input
              type="number"
              bind:value={formData.altezza_metri}
              class="form-input"
              class:border-red-500={formErrors.altezza_metri}
              placeholder="8"
              step="0.1"
              required
            />
            {#if formErrors.altezza_metri}
              <p class="form-error">{formErrors.altezza_metri.join(', ')}</p>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="form-label">Temp. Min (°C)</label>
            <input
              type="number"
              bind:value={formData.temperatura_min}
              class="form-input"
              placeholder="5"
              step="0.1"
            />
          </div>
          <div>
            <label class="form-label">Temp. Max (°C)</label>
            <input
              type="number"
              bind:value={formData.temperatura_max}
              class="form-input"
              placeholder="35"
              step="0.1"
            />
          </div>
          <div>
            <label class="form-label">Umidità Max (%)</label>
            <input
              type="number"
              bind:value={formData.umidita_max}
              class="form-input"
              placeholder="80"
              step="0.1"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" on:click={resetForm} class="btn btn-secondary">Annulla</button>
          <button type="submit" disabled={loading} class="btn btn-primary">
            {#if loading}<div class="spinner w-4 h-4 mr-2"></div>{/if}
            {editingId ? 'Aggiorna' : 'Crea'}
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
    @apply flex justify-between items-center p-6 border-b;
  }
</style>