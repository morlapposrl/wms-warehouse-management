<script>
  import { onMount } from 'svelte';
  
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
  
  const tipiCausali = [
    { value: 'INTERNO', label: 'Trasferimento Interno' },
    { value: 'ESTERNO', label: 'Trasferimento Esterno' },
    { value: 'CORREZIONE', label: 'Correzione Inventario' },
    { value: 'OTTIMIZZAZIONE', label: 'Ottimizzazione Layout' }
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
          error = result.error || 'Errore nel caricamento';
        }
      } else {
        error = 'Errore di connessione';
      }
    } catch (err) {
      console.error('Errore causali:', err);
      error = 'Errore di connessione';
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
      formErrors.descrizione = ['Inserisci una descrizione'];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = ['Inserisci un codice'];
      return;
    }
    
    if (!formData.tipo) {
      formErrors.tipo = ['Seleziona un tipo'];
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
        success = editingId ? 'Causale aggiornata con successo' : 'Causale creata con successo';
        await loadCausali();
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

  async function handleDelete(id, descrizione) {
    if (!confirm(`Sei sicuro di voler eliminare la causale "${descrizione}"?`)) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/causali/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = 'Causale eliminata con successo';
        await loadCausali();
      } else {
        error = result.error || 'Errore nell\'eliminazione';
      }
    } catch (e) {
      error = 'Errore di connessione';
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
          📝 Gestione Causali Trasferimento
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">Causali per movimentazioni e trasferimenti</p>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        on:click={loadCausali}
        class="btn btn-sm btn-secondary"
        title="Ricarica causali"
        disabled={loading}
      >
        🔄
      </button>
      
      <button
        on:click={() => showForm = true}
        class="btn btn-primary"
        disabled={loading}
      >
        ➕ Nuova Causale
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
      <span class="ml-3 text-neutral-600 dark:text-gray-400">Caricamento causali...</span>
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
              placeholder="Cerca causale..."
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
            {causali.length} causali
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
            Lista Causali Trasferimento
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Codice</th>
                <th>Descrizione</th>
                <th>Tipo</th>
                <th>Autorizzazione</th>
                <th>Stato</th>
                <th>Azioni</th>
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
                      <span class="text-amber-600">🔒 Richiesta</span>
                    {:else}
                      <span class="text-neutral-400">-</span>
                    {/if}
                  </td>
                  <td>
                    <span class="badge {causale.attiva ? 'badge-success' : 'badge-danger'}">
                      {causale.attiva ? 'Attiva' : 'Inattiva'}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(causale)}
                        title="Modifica causale"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(causale.id, causale.descrizione)}
                        title="Elimina causale"
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
          Nessuna causale trovata
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">Non ci sono causali nel sistema</p>
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold">
          {editingId ? 'Modifica Causale' : 'Nuova Causale'}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400">✖️</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
        
        <div>
          <label class="form-label">Descrizione *</label>
          <input
            type="text"
            bind:value={formData.descrizione}
            on:input={generateCode}
            class="form-input"
            class:border-red-500={formErrors.descrizione}
            placeholder="Es: Trasferimento tra zone"
            required
          />
          {#if formErrors.descrizione}
            <p class="form-error">{formErrors.descrizione.join(', ')}</p>
          {/if}
        </div>

        <div>
          <label class="form-label">Codice *</label>
          <input
            type="text"
            bind:value={formData.codice}
            class="form-input"
            class:border-red-500={formErrors.codice}
            placeholder="Es: TRASF_ZONE"
            required
          />
          {#if formErrors.codice}
            <p class="form-error">{formErrors.codice.join(', ')}</p>
          {/if}
        </div>

        <div>
          <label class="form-label">Tipo *</label>
          <select
            bind:value={formData.tipo}
            class="form-input"
            class:border-red-500={formErrors.tipo}
            required
          >
            <option value="">Seleziona tipo</option>
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
              class="checkbox"
            />
            <span class="text-sm">Richiede autorizzazione</span>
          </label>
          
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.attiva}
              class="checkbox"
            />
            <span class="text-sm">Causale attiva</span>
          </label>
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
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-header {
    @apply flex justify-between items-center p-6 border-b;
  }
</style>