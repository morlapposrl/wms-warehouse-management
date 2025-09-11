<script>
  import { onMount } from 'svelte';
  
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
      error = 'Errore nel caricamento dei dati';
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
          error = result.error || 'Errore nel caricamento';
        }
      } else {
        error = 'Errore di connessione';
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
      formErrors.committente_id = ['Seleziona un committente'];
      return;
    }
    
    if (!formData.descrizione.trim()) {
      formErrors.descrizione = ['Inserisci una descrizione'];
      return;
    }
    
    if (!formData.codice.trim()) {
      formErrors.codice = ['Inserisci un codice'];
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
        success = editingId ? 'Categoria aggiornata con successo' : 'Categoria creata con successo';
        await loadCategorie();
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
    if (!confirm(`Sei sicuro di voler eliminare la categoria "${descrizione}"?`)) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/categorie/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
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
  <title>Gestione Categorie - WMS Morlappo</title>
</svelte:head>

<div class="w-full">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          🏷️ Gestione Categorie - Vista Multicommittente
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">
        Gestione categorie prodotti per tutti i committenti
      </p>
    </div>
    
    <!-- Controlli -->
    <div class="flex items-center gap-4">
      <!-- Refresh manuale -->
      <button 
        on:click={loadCategorie}
        class="btn btn-sm btn-secondary"
        title="Ricarica categorie"
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
        ➕ Nuova Categoria
      </button>
    </div>
  </div>

  <!-- Messaggi -->
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
      <span class="ml-3 text-neutral-600 dark:text-gray-400">Caricamento categorie...</span>
    </div>
  {:else}
    <!-- Filtri -->
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">Filtri</span>
        </div>
        <div class="flex items-end gap-2 flex-nowrap">
          
          <!-- Ricerca -->
          <div class="min-w-28">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="Cerca categoria..."
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
              <option value="">Tutti committenti</option>
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
              <option value="">Tutti stati</option>
              <option value="1">✅ Attiva</option>
              <option value="0">❌ Non attiva</option>
            </select>
          </div>
          
          <!-- Reset -->
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
            {categorie.length} categorie
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Categorie Totali</p>
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Attive</p>
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Inattive</p>
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
            <p class="text-sm font-medium text-neutral-600 dark:text-gray-400">Committenti</p>
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
            Lista Categorie {selectedCommittente ? `- ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : '(Tutte)'}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Committente</th>
                <th>Codice</th>
                <th>Descrizione</th>
                <th>Stato</th>
                <th>Data Creazione</th>
                <th>Azioni</th>
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
                      {categoria.attiva ? 'Attiva' : 'Inattiva'}
                    </span>
                  </td>
                  <td>{new Date(categoria.created_at).toLocaleDateString('it-IT')}</td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(categoria)}
                        title="Modifica categoria"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(categoria.id, categoria.descrizione)}
                        title="Elimina categoria"
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
          Nessuna categoria trovata
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">
          {selectedCommittente ? 'Il committente selezionato non ha categorie' : 'Non ci sono categorie nel sistema'}
        </p>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal Form -->
{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold">
          {editingId ? 'Modifica Categoria' : 'Nuova Categoria'}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400">
          ✖️
        </button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
        
        <!-- Committente -->
        <div>
          <label class="form-label">Committente *</label>
          <select
            bind:value={formData.committente_id}
            class="form-input"
            class:border-red-500={formErrors.committente_id}
            required
          >
            <option value={0}>Seleziona committente...</option>
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
          <label class="form-label">Descrizione *</label>
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
          <label class="form-label">Codice *</label>
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
            class="rounded border-neutral-300"
          />
          <label for="attiva" class="text-sm font-medium text-neutral-700 dark:text-gray-300">
            Categoria attiva e visibile nel sistema
          </label>
        </div>

        <!-- Bottoni -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            on:click={resetForm}
            class="btn btn-secondary"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            class="btn btn-primary"
          >
            {#if loading}
              <div class="spinner w-4 h-4 mr-2"></div>
            {/if}
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