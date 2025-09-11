<script>
  import { onMount } from 'svelte';
  
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
  
  const categorie = [
    { value: 'PALLET', label: 'Pallet', icon: '🪚' },
    { value: 'CONTAINER', label: 'Container', icon: '📦' },
    { value: 'BOX', label: 'Box/Contenitori', icon: '🗂️' },
    { value: 'ROLL', label: 'Roll Container', icon: '🛒' },
    { value: 'CUSTOM', label: 'Personalizzati', icon: '⚙️' }
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
          error = result.error || 'Errore nel caricamento';
        }
      } else {
        error = 'Errore di connessione';
      }
    } catch (err) {
      console.error('Errore tipi UDC:', err);
      error = 'Errore di connessione';
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
        success = editingId ? 'Tipo UDC aggiornato con successo' : 'Tipo UDC creato con successo';
        await loadTipi();
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
    if (!confirm(`Sei sicuro di voler eliminare il tipo UDC "${nome}"?`)) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/tipi-udc/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = 'Tipo UDC eliminato con successo';
        await loadTipi();
      } else {
        error = result.error || 'Errore nell\'eliminazione';
      }
    } catch (e) {
      error = 'Errore di connessione';
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
  <title>Gestione Tipi UDC - WMS Morlappo</title>
</svelte:head>

<div class="w-full">
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100">
          📦 Gestione Tipi UDC
        </h1>
      </div>
      <p class="text-neutral-600 dark:text-gray-400">Tipi di Unità Di Carico (pallet, container, box, ecc.)</p>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        on:click={loadTipi}
        class="btn btn-sm btn-secondary"
        title="Ricarica tipi UDC"
        disabled={loading}
      >
        🔄
      </button>
      
      <button
        on:click={() => showForm = true}
        class="btn btn-primary"
        disabled={loading}
      >
        ➕ Nuovo Tipo UDC
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
      <span class="ml-3 text-neutral-600 dark:text-gray-400">Caricamento tipi UDC...</span>
    </div>
  {:else}
    <div class="card mb-6">
      <div class="card-body py-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">Filtri</span>
        </div>
        <div class="flex items-end gap-2 flex-wrap">
          <div class="min-w-32">
            <input 
              type="text" 
              bind:value={searchTerm}
              on:input={applyClientFilters}
              placeholder="Cerca tipo..."
              class="form-input text-sm"
            >
          </div>
          
          <div class="min-w-32">
            <select 
              bind:value={filterCategoria}
              on:change={applyClientFilters}
              class="form-input text-sm"
            >
              <option value="">Tutte le categorie</option>
              {#each categorie as cat}
                <option value={cat.value}>{cat.icon} {cat.label}</option>
              {/each}
            </select>
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
            {tipi.length} tipi
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
            Lista Tipi UDC
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Codice</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Dimensioni</th>
                <th>Proprietà</th>
                <th>Costi</th>
                <th>Stato</th>
                <th>Azioni</th>
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
                      <div class="text-blue-600">♻️ Riutilizzabile</div>
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
                      {tipo.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-primary btn-sm"
                        on:click={() => handleEdit(tipo)}
                        title="Modifica tipo UDC"
                      >
                        ✏️
                      </button>
                      <button 
                        class="btn btn-danger btn-sm"
                        on:click={() => handleDelete(tipo.id, tipo.nome)}
                        title="Elimina tipo UDC"
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
          Nessun tipo UDC trovato
        </h3>
        <p class="text-neutral-600 dark:text-gray-400">Non ci sono tipi UDC nel sistema</p>
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="modal-backdrop" on:click={resetForm}>
    <div class="modal-content large" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold">
          {editingId ? 'Modifica Tipo UDC' : 'Nuovo Tipo UDC'}
        </h2>
        <button on:click={resetForm} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400">✖️</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Nome *</label>
            <input
              type="text"
              bind:value={formData.nome}
              on:input={generateCode}
              class="form-input"
              class:border-red-500={formErrors.nome}
              placeholder="Es: Pallet EPAL Standard"
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
              placeholder="Es: PALLET_EPAL"
              required
            />
            {#if formErrors.codice}
              <p class="form-error">{formErrors.codice.join(', ')}</p>
            {/if}
          </div>
        </div>

        <div>
          <label class="form-label">Descrizione</label>
          <textarea
            bind:value={formData.descrizione}
            class="form-input"
            rows="2"
            placeholder="Descrizione dettagliata del tipo UDC"
          ></textarea>
        </div>

        <div>
          <label class="form-label">Categoria *</label>
          <select
            bind:value={formData.categoria}
            class="form-input"
            class:border-red-500={formErrors.categoria}
            required
          >
            <option value="">Seleziona categoria</option>
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
            <label class="form-label">Lunghezza (cm) *</label>
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
            <label class="form-label">Larghezza (cm) *</label>
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
            <label class="form-label">Altezza Max (cm) *</label>
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
            <label class="form-label">Peso Max (kg) *</label>
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
            <label class="form-label">Max Impilabili</label>
            <input
              type="number"
              bind:value={formData.max_stack}
              class="form-input"
              placeholder="5"
              min="1"
            />
          </div>
          <div>
            <label class="form-label">Costo Acquisto (€)</label>
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
          <label class="form-label">Costo Noleggio/Giorno (€)</label>
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
            <span class="text-sm">Impilabile</span>
          </label>
          
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.riutilizzabile}
              class="checkbox"
            />
            <span class="text-sm">Riutilizzabile</span>
          </label>
          
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={formData.attivo}
              class="checkbox"
            />
            <span class="text-sm">Attivo</span>
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
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-content.large {
    @apply max-w-4xl;
  }
  
  .modal-header {
    @apply flex justify-between items-center p-6 border-b;
  }
</style>