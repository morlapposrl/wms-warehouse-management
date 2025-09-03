<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import type { Fornitore } from '$lib/types';
  
  const committente_id = parseInt($page.params.committente_id);
  
  // Stato principale
  let fornitori: Array<Fornitore & { 
    attivo: boolean; 
    condizioni_specifiche?: string;
    relazione_id: number;
  }> = [];
  let fornitoriDisponibili: Fornitore[] = [];
  let loading = false;
  let error = '';
  let success = '';
  let searchQuery = '';
  let activeTab: 'associati' | 'disponibili' = 'associati';
  
  // Stato form associazione
  let showAssociateForm = false;
  let selectedFornitoreId: number | null = null;
  let associateData = {
    attivo: true,
    condizioni_specifiche: ''
  };
  
  // Stato form modifica associazione
  let showEditForm = false;
  let editingRelationId: number | null = null;
  let editData = {
    attivo: true,
    condizioni_specifiche: ''
  };
  let editFormErrors: Record<string, string> = {};
  
  // Stato eliminazione associazione
  let deleteRelationId: number | null = null;
  let deleteInfo = { ragione_sociale: '', codice: '' };
  
  // Statistiche
  let stats = { associati: 0, attivi: 0, inattivi: 0, con_condizioni: 0 };
  
  onMount(() => {
    loadFornitori();
  });
  
  async function loadFornitori() {
    loading = true;
    error = '';
    
    try {
      const url = searchQuery 
        ? `/api/committenti/${committente_id}/fornitori?q=${encodeURIComponent(searchQuery)}`
        : `/api/committenti/${committente_id}/fornitori`;
        
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        fornitori = result.data.fornitori;
        stats = result.data.statistiche;
      } else {
        error = result.error || 'Errore nel caricamento dei fornitori';
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    } finally {
      loading = false;
    }
  }
  
  async function loadFornitoriDisponibili() {
    if (fornitoriDisponibili.length > 0) return; // Carica solo una volta
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/fornitori/associate`);
      const result = await response.json();
      
      if (result.success) {
        fornitoriDisponibili = result.data.fornitori_disponibili;
      } else {
        error = result.error || 'Errore nel caricamento fornitori disponibili';
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    }
  }
  
  async function handleSearch() {
    await loadFornitori();
  }
  
  function switchTab(tab: 'associati' | 'disponibili') {
    activeTab = tab;
    if (tab === 'disponibili') {
      loadFornitoriDisponibili();
    }
  }
  
  function openAssociateForm(fornitore: Fornitore) {
    showAssociateForm = true;
    selectedFornitoreId = fornitore.id;
    associateData = {
      attivo: true,
      condizioni_specifiche: ''
    };
  }
  
  function closeAssociateForm() {
    showAssociateForm = false;
    selectedFornitoreId = null;
  }
  
  async function associateFornitore() {
    if (!selectedFornitoreId) return;
    
    error = '';
    success = '';
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/fornitori/associate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fornitore_id: selectedFornitoreId,
          ...associateData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = result.data.message;
        closeAssociateForm();
        await loadFornitori();
        // Rimuovi dalla lista disponibili
        fornitoriDisponibili = fornitoriDisponibili.filter(f => f.id !== selectedFornitoreId);
        activeTab = 'associati';
      } else {
        error = result.error;
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    }
  }
  
  function openEditForm(fornitore: any) {
    showEditForm = true;
    editingRelationId = fornitore.relazione_id;
    editData = {
      attivo: fornitore.attivo,
      condizioni_specifiche: fornitore.condizioni_specifiche || ''
    };
    editFormErrors = {};
  }
  
  function closeEditForm() {
    showEditForm = false;
    editingRelationId = null;
    editFormErrors = {};
  }
  
  async function saveEdit() {
    if (!editingRelationId) return;
    
    error = '';
    success = '';
    editFormErrors = {};
    
    const fornitore = fornitori.find(f => f.relazione_id === editingRelationId);
    if (!fornitore) return;
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/fornitori/${fornitore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = result.data.message;
        closeEditForm();
        await loadFornitori();
      } else {
        if (result.errors) {
          result.errors.forEach((err: any) => {
            editFormErrors[err.field] = err.message;
          });
        } else {
          error = result.error;
        }
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    }
  }
  
  function openDeleteModal(fornitore: any) {
    deleteRelationId = fornitore.relazione_id;
    deleteInfo = {
      ragione_sociale: fornitore.ragione_sociale,
      codice: fornitore.codice
    };
  }
  
  function closeDeleteModal() {
    deleteRelationId = null;
    deleteInfo = { ragione_sociale: '', codice: '' };
  }
  
  async function confirmDelete() {
    if (!deleteRelationId) return;
    
    error = '';
    success = '';
    
    const fornitore = fornitori.find(f => f.relazione_id === deleteRelationId);
    if (!fornitore) return;
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/fornitori/${fornitore.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = result.data.message;
        closeDeleteModal();
        await loadFornitori();
        // Aggiungi alla lista disponibili se necessario
        fornitoriDisponibili = [fornitore, ...fornitoriDisponibili];
      } else {
        error = result.error;
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    }
  }
  
  function getStatusBadgeClass(attivo: boolean): string {
    return attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }
  
  function getSelectedFornitore(): Fornitore | null {
    return fornitoriDisponibili.find(f => f.id === selectedFornitoreId) || null;
  }
</script>

<svelte:head>
  <title>Fornitori - Gestionale Magazzino</title>
</svelte:head>

<div class="min-h-screen py-8 slide-up">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-6">
        <div class="p-3 bg-gradient-primary rounded-xl shadow-lg">
          <Icon name="suppliers" size={28} className="text-white" />
        </div>
        <div>
          <h1 class="text-4xl font-bold text-neutral-900 tracking-tight">Fornitori</h1>
          <p class="text-lg text-neutral-600 mt-1">
            Gestione associazioni fornitori per il committente
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs moderni -->
    <div class="mb-8">
      <nav class="flex space-x-1 p-1 bg-neutral-100 rounded-xl">
        <button
          on:click={() => switchTab('associati')}
          class="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 {activeTab === 'associati' 
            ? 'bg-white text-primary-700 shadow-sm' 
            : 'text-neutral-600 hover:text-neutral-900'}"
        >
          <Icon name="suppliers" size={16} />
          <span>Associati ({stats.associati})</span>
        </button>
        <button
          on:click={() => switchTab('disponibili')}
          class="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 {activeTab === 'disponibili' 
            ? 'bg-white text-primary-700 shadow-sm' 
            : 'text-neutral-600 hover:text-neutral-900'}"
        >
          <Icon name="add" size={16} />
          <span>Aggiungi Fornitore</span>
        </button>
      </nav>
    </div>

    <!-- Statistiche moderne -->
    {#if activeTab === 'associati' && stats.associati > 0}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat-card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-primary-700 mb-1">Fornitori Associati</p>
              <p class="text-3xl font-bold text-primary-900">{stats.associati}</p>
            </div>
            <div class="stat-icon bg-primary-600 text-white">
              <Icon name="suppliers" size={24} />
            </div>
          </div>
        </div>

        <div class="stat-card bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-secondary-700 mb-1">Fornitori Attivi</p>
              <p class="text-3xl font-bold text-secondary-900">{stats.attivi}</p>
              <p class="text-xs text-secondary-600 mt-1">
                {stats.associati > 0 ? Math.round((stats.attivi / stats.associati) * 100) : 0}% del totale
              </p>
            </div>
            <div class="stat-icon bg-secondary-600 text-white">
              <Icon name="active" size={24} />
            </div>
          </div>
        </div>

        <div class="stat-card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-700 mb-1">Fornitori Inattivi</p>
              <p class="text-3xl font-bold text-red-900">{stats.inattivi}</p>
              <p class="text-xs text-red-600 mt-1">
                {stats.associati > 0 ? Math.round((stats.inattivi / stats.associati) * 100) : 0}% del totale
              </p>
            </div>
            <div class="stat-icon bg-red-600 text-white">
              <Icon name="inactive" size={24} />
            </div>
          </div>
        </div>

        <div class="stat-card bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-accent-700 mb-1">Con Condizioni</p>
              <p class="text-3xl font-bold text-accent-900">{stats.con_condizioni}</p>
              <p class="text-xs text-accent-600 mt-1">
                Condizioni specifiche
              </p>
            </div>
            <div class="stat-icon bg-accent-600 text-white">
              <Icon name="settings" size={24} />
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Barra di ricerca moderna (solo per associati) -->
    {#if activeTab === 'associati'}
      <div class="card mb-8">
        <div class="card-header">
          <div class="flex items-center space-x-2">
            <Icon name="search" size={20} className="text-neutral-600" />
            <h3 class="text-lg font-semibold text-neutral-900">Ricerca Fornitori</h3>
          </div>
        </div>
        
        <div class="card-body">
          <div class="flex gap-4">
            <div class="flex-1 relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Cerca per ragione sociale, codice o P.IVA..."
                class="form-input pl-10"
                on:keydown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              on:click={handleSearch}
              class="btn btn-primary btn-md flex items-center space-x-2"
            >
              <Icon name="search" size={16} />
              <span>Cerca</span>
            </button>
            {#if searchQuery}
              <button
                on:click={() => { searchQuery = ''; loadFornitori(); }}
                class="btn btn-secondary btn-md flex items-center space-x-2"
              >
                <Icon name="cancel" size={16} />
                <span>Reset</span>
              </button>
            {/if}
          </div>
          
          {#if searchQuery}
            <div class="mt-4 p-3 bg-neutral-50 rounded-lg border">
              <div class="flex items-center space-x-2 text-sm text-neutral-600">
                <Icon name="info" size={14} />
                <span>Ricerca per: <span class="bg-primary-100 text-primary-800 px-2 py-1 rounded font-medium">"{searchQuery}"</span></span>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Messaggi moderni -->
    {#if error}
      <div class="alert alert-error mb-6 fade-in">
        <div class="flex items-center space-x-3">
          <Icon name="error" size={20} className="flex-shrink-0" />
          <div>
            <p class="font-semibold">Si è verificato un errore</p>
            <p class="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if success}
      <div class="alert alert-success mb-6 fade-in">
        <div class="flex items-center space-x-3">
          <Icon name="success" size={20} className="flex-shrink-0" />
          <div>
            <p class="font-semibold">Operazione completata</p>
            <p class="text-sm mt-1">{success}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Contenuto tabs -->
    <div class="card overflow-hidden">
      {#if loading}
        <div class="p-12 text-center">
          <div class="spinner w-10 h-10 mx-auto"></div>
          <p class="text-neutral-600 mt-4 font-medium">
            {activeTab === 'associati' ? 'Caricamento fornitori associati...' : 'Caricamento fornitori disponibili...'}
          </p>
          <p class="text-sm text-neutral-500 mt-1">Attendere prego</p>
        </div>
      {:else if activeTab === 'associati'}
        <!-- Tabella fornitori associati -->
        {#if fornitori.length === 0}
          <div class="p-12 text-center">
            <div class="p-4 bg-neutral-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Icon name="suppliers" size={32} className="text-neutral-400" />
            </div>
            <p class="text-lg font-medium text-neutral-700 mb-2">Nessun fornitore associato</p>
            <p class="text-neutral-500 mb-4">Inizia associando il primo fornitore per questo committente</p>
            <button
              on:click={() => switchTab('disponibili')}
              class="btn btn-primary btn-md flex items-center space-x-2 mx-auto"
            >
              <Icon name="add" size={16} />
              <span>Associa Primo Fornitore</span>
            </button>
          </div>
        {:else}
          <div class="card-header">
            <div class="flex items-center space-x-2">
              <Icon name="suppliers" size={20} className="text-neutral-600" />
              <h3 class="text-lg font-semibold text-neutral-900">
                Fornitori Associati ({fornitori.length})
              </h3>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Fornitore</th>
                  <th>Contatti</th>
                  <th>Stato</th>
                  <th>Condizioni</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {#each fornitori as fornitore (fornitore.id)}
                  <tr>
                    <td>
                      <div class="flex items-center space-x-3">
                        <div class="p-2 bg-primary-100 rounded-lg">
                          <Icon name="suppliers" size={16} className="text-primary-600" />
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-neutral-900">
                            {fornitore.ragione_sociale}
                          </div>
                          <div class="text-xs text-neutral-500 flex items-center space-x-2">
                            <span>Codice:</span>
                            <code class="bg-neutral-100 px-1 py-0.5 rounded text-xs">{fornitore.codice}</code>
                            {#if fornitore.partita_iva}
                              <span>•</span>
                              <span>P.IVA: {fornitore.partita_iva}</span>
                            {/if}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="text-neutral-600">
                      {#if fornitore.email || fornitore.telefono}
                        <div class="space-y-1">
                          {#if fornitore.email}
                            <div class="flex items-center space-x-1">
                              <Icon name="users" size={12} className="text-neutral-400" />
                              <span class="text-xs">{fornitore.email}</span>
                            </div>
                          {/if}
                          {#if fornitore.telefono}
                            <div class="flex items-center space-x-1">
                              <Icon name="info" size={12} className="text-neutral-400" />
                              <span class="text-xs">{fornitore.telefono}</span>
                            </div>
                          {/if}
                        </div>
                      {:else}
                        <span class="text-neutral-400 text-sm">Non disponibili</span>
                      {/if}
                    </td>
                    <td>
                      <span class="badge {fornitore.attivo ? 'badge-success' : 'badge-danger'} flex items-center space-x-1 w-fit">
                        <Icon name={fornitore.attivo ? 'active' : 'inactive'} size={12} />
                        <span>{fornitore.attivo ? 'Attivo' : 'Inattivo'}</span>
                      </span>
                    </td>
                    <td class="text-neutral-600">
                      {#if fornitore.condizioni_specifiche}
                        <div class="text-sm max-w-xs truncate" title={fornitore.condizioni_specifiche}>
                          {fornitore.condizioni_specifiche}
                        </div>
                      {:else}
                        <span class="text-neutral-400 text-sm">Nessuna</span>
                      {/if}
                    </td>
                    <td>
                      <div class="flex items-center space-x-1">
                        <button
                          on:click={() => openEditForm(fornitore)}
                          class="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Modifica associazione"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          on:click={() => openDeleteModal(fornitore)}
                          class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rimuovi associazione"
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
      {/if}
    {:else}
        <!-- Lista fornitori disponibili -->
        {#if fornitoriDisponibili.length === 0}
          <div class="p-12 text-center">
            <div class="p-4 bg-neutral-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Icon name="add" size={32} className="text-neutral-400" />
            </div>
            <p class="text-lg font-medium text-neutral-700 mb-2">Nessun fornitore disponibile</p>
            <p class="text-neutral-500">Tutti i fornitori sono già stati associati a questo committente</p>
          </div>
        {:else}
          <div class="card-header">
            <div class="flex items-center space-x-2">
              <Icon name="add" size={20} className="text-neutral-600" />
              <h3 class="text-lg font-semibold text-neutral-900">
                Fornitori Disponibili ({fornitoriDisponibili.length})
              </h3>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Fornitore</th>
                  <th>Contatti</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {#each fornitoriDisponibili as fornitore (fornitore.id)}
                  <tr>
                    <td>
                      <div class="flex items-center space-x-3">
                        <div class="p-2 bg-secondary-100 rounded-lg">
                          <Icon name="suppliers" size={16} className="text-secondary-600" />
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-neutral-900">
                            {fornitore.ragione_sociale}
                          </div>
                          <div class="text-xs text-neutral-500 flex items-center space-x-2">
                            <span>Codice:</span>
                            <code class="bg-neutral-100 px-1 py-0.5 rounded text-xs">{fornitore.codice}</code>
                            {#if fornitore.partita_iva}
                              <span>•</span>
                              <span>P.IVA: {fornitore.partita_iva}</span>
                            {/if}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="text-neutral-600">
                      {#if fornitore.email || fornitore.telefono}
                        <div class="space-y-1">
                          {#if fornitore.email}
                            <div class="flex items-center space-x-1">
                              <Icon name="users" size={12} className="text-neutral-400" />
                              <span class="text-xs">{fornitore.email}</span>
                            </div>
                          {/if}
                          {#if fornitore.telefono}
                            <div class="flex items-center space-x-1">
                              <Icon name="info" size={12} className="text-neutral-400" />
                              <span class="text-xs">{fornitore.telefono}</span>
                            </div>
                          {/if}
                        </div>
                      {:else}
                        <span class="text-neutral-400 text-sm">Non disponibili</span>
                      {/if}
                    </td>
                    <td>
                      <button
                        on:click={() => openAssociateForm(fornitore)}
                        class="btn btn-primary btn-sm flex items-center space-x-2"
                      >
                        <Icon name="add" size={14} />
                        <span>Associa</span>
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
      {/if}
    {/if}
    </div>
  </div>
</div>

<!-- Modal associa fornitore -->
{#if showAssociateForm && selectedFornitoreId}
  {@const selectedFornitore = getSelectedFornitore()}
  <div class="modal-backdrop fade-in">
    <div class="modal-content slide-up">
      <div class="modal-header">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-primary-100 rounded-lg">
              <Icon name="add" size={20} className="text-primary-600" />
            </div>
            <h2 class="text-xl font-semibold text-neutral-900">
              Associa Fornitore
            </h2>
          </div>
          <button
            on:click={closeAssociateForm}
            class="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Icon name="cancel" size={20} />
          </button>
        </div>
      </div>
      
      <form on:submit|preventDefault={associateFornitore} class="p-6 space-y-6">
        {#if selectedFornitore}
          <div class="alert alert-info">
            <div class="flex items-center space-x-3">
              <Icon name="suppliers" size={20} className="flex-shrink-0" />
              <div>
                <p class="font-semibold">Fornitore selezionato</p>
                <div class="text-sm mt-1">
                  <div class="font-medium">{selectedFornitore.ragione_sociale}</div>
                  <div class="text-neutral-600 flex items-center space-x-2">
                    <span>Codice: {selectedFornitore.codice}</span>
                    {#if selectedFornitore.partita_iva}
                      <span>•</span>
                      <span>P.IVA: {selectedFornitore.partita_iva}</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        <div class="space-y-4">
          <div class="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg border">
            <input
              type="checkbox"
              id="attivo_associate"
              bind:checked={associateData.attivo}
              class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label for="attivo_associate" class="text-sm font-medium text-neutral-700 flex items-center space-x-2">
              <Icon name="active" size={16} className="text-secondary-600" />
              <span>Fornitore attivo dal momento dell'associazione</span>
            </label>
          </div>
          
          <div>
            <label class="form-label">
              Condizioni Specifiche
            </label>
            <textarea
              bind:value={associateData.condizioni_specifiche}
              class="form-input"
              placeholder="Inserisci condizioni commerciali, note particolari, sconti..."
              rows="3"
            ></textarea>
            <p class="text-xs text-neutral-500 mt-1">
              Condizioni specifiche per questo committente (opzionale)
            </p>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
          <button
            type="button"
            on:click={closeAssociateForm}
            class="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Icon name="cancel" size={16} />
            <span>Annulla</span>
          </button>
          <button
            type="submit"
            class="btn btn-primary btn-md flex items-center space-x-2"
          >
            <Icon name="add" size={16} />
            <span>Associa Fornitore</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal modifica associazione -->
{#if showEditForm}
  <div class="modal-backdrop fade-in">
    <div class="modal-content slide-up">
      <div class="modal-header">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-primary-100 rounded-lg">
              <Icon name="edit" size={20} className="text-primary-600" />
            </div>
            <h2 class="text-xl font-semibold text-neutral-900">
              Modifica Associazione Fornitore
            </h2>
          </div>
          <button
            on:click={closeEditForm}
            class="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Icon name="cancel" size={20} />
          </button>
        </div>
      </div>
      
      <form on:submit|preventDefault={saveEdit} class="p-6 space-y-6">
        <div class="space-y-4">
          <div class="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg border">
            <input
              type="checkbox"
              id="attivo_edit"
              bind:checked={editData.attivo}
              class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label for="attivo_edit" class="text-sm font-medium text-neutral-700 flex items-center space-x-2">
              <Icon name="active" size={16} className="text-secondary-600" />
              <span>Fornitore attivo per questo committente</span>
            </label>
          </div>
          
          <div>
            <label class="form-label">
              Condizioni Specifiche
            </label>
            <textarea
              bind:value={editData.condizioni_specifiche}
              class="form-input"
              class:border-red-500={editFormErrors.condizioni_specifiche}
              placeholder="Inserisci condizioni commerciali, note particolari, sconti..."
              rows="3"
            ></textarea>
            {#if editFormErrors.condizioni_specifiche}
              <p class="form-error">{editFormErrors.condizioni_specifiche}</p>
            {:else}
              <p class="text-xs text-neutral-500 mt-1">
                Condizioni specifiche per questo committente (opzionale)
              </p>
            {/if}
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
          <button
            type="button"
            on:click={closeEditForm}
            class="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Icon name="cancel" size={16} />
            <span>Annulla</span>
          </button>
          <button
            type="submit"
            class="btn btn-primary btn-md flex items-center space-x-2"
          >
            <Icon name="save" size={16} />
            <span>Salva Modifiche</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal conferma rimozione associazione -->
{#if deleteRelationId}
  <div class="modal-backdrop fade-in">
    <div class="modal-content slide-up max-w-md">
      <div class="p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <Icon name="warning" size={32} className="text-red-600" />
        </div>
        
        <h3 class="text-xl font-semibold text-neutral-900 mb-3">Rimuovi Associazione</h3>
        
        <div class="mb-6">
          <p class="text-neutral-600 mb-4">
            Sei sicuro di voler rimuovere l'associazione con il fornitore:
          </p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="font-semibold text-red-800">{deleteInfo.ragione_sociale}</div>
            <div class="text-sm text-red-600">Codice: {deleteInfo.codice}</div>
          </div>
          <p class="text-red-600 text-sm mt-3 font-medium">
            ⚠️ Il fornitore non sarà più disponibile per questo committente
          </p>
        </div>
        
        <div class="flex justify-center space-x-3">
          <button
            on:click={closeDeleteModal}
            class="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Icon name="cancel" size={16} />
            <span>Annulla</span>
          </button>
          <button
            on:click={confirmDelete}
            class="btn btn-danger btn-md flex items-center space-x-2"
          >
            <Icon name="delete" size={16} />
            <span>Rimuovi Associazione</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}