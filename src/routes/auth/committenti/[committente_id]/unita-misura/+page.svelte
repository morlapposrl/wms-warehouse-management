<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import type { UnitaMisura } from '$lib/types';
  
  const committente_id = parseInt($page.params.committente_id);
  
  // Stato principale
  let unita: UnitaMisura[] = [];
  let loading = false;
  let error = '';
  let success = '';
  let searchQuery = '';
  
  // Stato form
  let showForm = false;
  let editingId: number | null = null;
  let formData = {
    codice: '',
    descrizione: '',
    attiva: true
  };
  let formErrors: Record<string, string> = {};
  
  // Stato eliminazione
  let deleteId: number | null = null;
  let deleteInfo = { codice: '', descrizione: '' };
  
  onMount(() => {
    loadUnita();
  });
  
  async function loadUnita() {
    loading = true;
    error = '';
    
    try {
      const url = searchQuery 
        ? `/api/committenti/${committente_id}/unita-misura?q=${encodeURIComponent(searchQuery)}`
        : `/api/committenti/${committente_id}/unita-misura`;
        
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        unita = result.data.unita_misura;
      } else {
        error = result.error || 'Errore nel caricamento delle unità di misura';
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    } finally {
      loading = false;
    }
  }
  
  async function handleSearch() {
    await loadUnita();
  }
  
  function openCreateForm() {
    showForm = true;
    editingId = null;
    formData = {
      codice: '',
      descrizione: '',
      attiva: true
    };
    formErrors = {};
  }
  
  async function openEditForm(unita: UnitaMisura) {
    // Controlla se può essere modificata
    if (unita.committente_id === null) {
      error = 'Non è possibile modificare le unità di misura globali';
      return;
    }
    
    if (unita.tipo === 'sistema') {
      error = 'Non è possibile modificare le unità di misura di sistema';
      return;
    }
    
    showForm = true;
    editingId = unita.id;
    formData = {
      codice: unita.codice,
      descrizione: unita.descrizione,
      attiva: unita.attiva
    };
    formErrors = {};
  }
  
  function closeForm() {
    showForm = false;
    editingId = null;
    formErrors = {};
  }
  
  async function saveUnita() {
    error = '';
    success = '';
    formErrors = {};
    
    try {
      const url = editingId 
        ? `/api/committenti/${committente_id}/unita-misura/${editingId}`
        : `/api/committenti/${committente_id}/unita-misura`;
        
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = result.data.message;
        closeForm();
        await loadUnita();
      } else {
        if (result.errors) {
          result.errors.forEach((err: any) => {
            formErrors[err.field] = err.message;
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
  
  function openDeleteModal(unita: UnitaMisura) {
    if (unita.committente_id === null) {
      error = 'Non è possibile eliminare le unità di misura globali';
      return;
    }
    
    if (unita.tipo === 'sistema') {
      error = 'Non è possibile eliminare le unità di misura di sistema';
      return;
    }
    
    deleteId = unita.id;
    deleteInfo = {
      codice: unita.codice,
      descrizione: unita.descrizione
    };
  }
  
  function closeDeleteModal() {
    deleteId = null;
    deleteInfo = { codice: '', descrizione: '' };
  }
  
  async function confirmDelete() {
    if (!deleteId) return;
    
    error = '';
    success = '';
    
    try {
      const response = await fetch(`/api/committenti/${committente_id}/unita-misura/${deleteId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = result.data.message;
        closeDeleteModal();
        await loadUnita();
      } else {
        error = result.error;
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    }
  }
  
  function getBadgeClass(unita: UnitaMisura): string {
    if (!unita.attiva) return 'bg-gray-100 text-gray-800';
    if (unita.committente_id === null && unita.tipo === 'sistema') return 'bg-blue-100 text-blue-800';
    if (unita.committente_id === null) return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
  }
  
  function getBadgeText(unita: UnitaMisura): string {
    if (!unita.attiva) return 'Inattiva';
    if (unita.committente_id === null && unita.tipo === 'sistema') return 'Sistema';
    if (unita.committente_id === null) return 'Globale';
    return 'Personalizzata';
  }
  
  function canModify(unita: UnitaMisura): boolean {
    return unita.committente_id === committente_id && unita.tipo !== 'sistema';
  }
</script>

<svelte:head>
  <title>Unità di Misura - Gestionale Magazzino</title>
</svelte:head>

<div class="min-h-screen py-8 slide-up">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-6">
        <div class="p-3 bg-gradient-primary rounded-xl shadow-lg">
          <Icon name="units" size={28} className="text-white" />
        </div>
        <div>
          <h1 class="text-4xl font-bold text-neutral-900 tracking-tight">Unità di Misura</h1>
          <p class="text-lg text-neutral-600 mt-1">
            Gestione unità di misura globali e personalizzate per il committente
          </p>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          on:click={openCreateForm}
          class="btn btn-primary btn-lg flex items-center space-x-2 bounce-subtle"
        >
          <Icon name="add" size={20} />
          <span>Nuova Unità</span>
        </button>
      </div>
    </div>

    <!-- Barra di ricerca moderna -->
    <div class="card mb-8">
      <div class="card-header">
        <div class="flex items-center space-x-2">
          <Icon name="search" size={20} className="text-neutral-600" />
          <h3 class="text-lg font-semibold text-neutral-900">Ricerca Unità di Misura</h3>
        </div>
      </div>
      
      <div class="card-body">
        <div class="flex gap-4">
          <div class="flex-1 relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Cerca per codice o descrizione..."
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
              on:click={() => { searchQuery = ''; loadUnita(); }}
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

    <!-- Tabella moderna -->
    <div class="card overflow-hidden">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Icon name="units" size={20} className="text-neutral-600" />
            <h3 class="text-lg font-semibold text-neutral-900">
              Unità di Misura ({unita.length})
            </h3>
          </div>
          {#if unita.length > 0}
            <div class="text-sm text-neutral-500">
              {unita.length} unità disponibili
            </div>
          {/if}
        </div>
      </div>
      
      {#if loading}
        <div class="p-12 text-center">
          <div class="spinner w-10 h-10 mx-auto"></div>
          <p class="text-neutral-600 mt-4 font-medium">Caricamento unità di misura...</p>
          <p class="text-sm text-neutral-500 mt-1">Attendere prego</p>
        </div>
      {:else if unita.length === 0}
        <div class="p-12 text-center">
          <div class="p-4 bg-neutral-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Icon name="units" size={32} className="text-neutral-400" />
          </div>
          <p class="text-lg font-medium text-neutral-700 mb-2">
            {searchQuery ? 'Nessun risultato trovato' : 'Nessuna unità di misura'}
          </p>
          <p class="text-neutral-500 mb-4">
            {searchQuery ? 'Prova a modificare i criteri di ricerca' : 'Inizia creando la prima unità di misura personalizzata'}
          </p>
          {#if !searchQuery}
            <button
              on:click={openCreateForm}
              class="btn btn-primary btn-md flex items-center space-x-2 mx-auto"
            >
              <Icon name="add" size={16} />
              <span>Crea Prima Unità</span>
            </button>
          {/if}
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Unità di Misura</th>
                <th>Tipo</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each unita as unita_item (unita_item.id)}
                <tr>
                  <td>
                    <div class="flex items-center space-x-3">
                      <div class="p-2 {unita_item.committente_id === null ? 'bg-blue-100' : 'bg-accent-100'} rounded-lg">
                        <Icon name="units" size={16} className="{unita_item.committente_id === null ? 'text-blue-600' : 'text-accent-600'}" />
                      </div>
                      <div>
                        <div class="text-sm font-semibold text-neutral-900">
                          {unita_item.descrizione}
                        </div>
                        <div class="text-xs text-neutral-500 flex items-center space-x-1">
                          <span>Codice:</span>
                          <code class="bg-neutral-100 px-1 py-0.5 rounded text-xs font-mono">{unita_item.codice}</code>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge {getBadgeClass(unita_item)} flex items-center space-x-1 w-fit">
                      <Icon name={unita_item.committente_id === null && unita_item.tipo === 'sistema' ? 'settings' : unita_item.committente_id === null ? 'users' : 'suppliers'} size={12} />
                      <span>{getBadgeText(unita_item)}</span>
                    </span>
                  </td>
                  <td>
                    <span class="badge {unita_item.attiva ? 'badge-success' : 'badge-danger'} flex items-center space-x-1 w-fit">
                      <Icon name={unita_item.attiva ? 'active' : 'inactive'} size={12} />
                      <span>{unita_item.attiva ? 'Attiva' : 'Inattiva'}</span>
                    </span>
                  </td>
                  <td>
                    {#if canModify(unita_item)}
                      <div class="flex items-center space-x-1">
                        <button
                          on:click={() => openEditForm(unita_item)}
                          class="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Modifica unità di misura"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          on:click={() => openDeleteModal(unita_item)}
                          class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina unità di misura"
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    {:else}
                      <span class="badge badge-info flex items-center space-x-1 w-fit">
                        <Icon name="info" size={12} />
                        <span class="text-xs">{unita_item.committente_id === null ? 'Globale' : 'Sistema'}</span>
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal form moderno -->
{#if showForm}
  <div class="modal-backdrop fade-in">
    <div class="modal-content slide-up">
      <div class="modal-header">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-primary-100 rounded-lg">
              <Icon name={editingId ? "edit" : "add"} size={20} className="text-primary-600" />
            </div>
            <h2 class="text-xl font-semibold text-neutral-900">
              {editingId ? 'Modifica Unità di Misura' : 'Nuova Unità di Misura'}
            </h2>
          </div>
          <button
            on:click={closeForm}
            class="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Icon name="cancel" size={20} />
          </button>
        </div>
      </div>
        
      
      <form on:submit|preventDefault={saveUnita} class="p-6 space-y-6">
        <div class="alert alert-info">
          <div class="flex items-center space-x-3">
            <Icon name="info" size={20} className="flex-shrink-0" />
            <div class="text-sm">
              <p class="font-semibold">Unità personalizzata</p>
              <p class="mt-1">Questa unità sarà specifica per questo committente e potrà essere utilizzata nei suoi prodotti.</p>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">
              Codice *
            </label>
            <input
              type="text"
              bind:value={formData.codice}
              class="form-input font-mono"
              class:border-red-500={formErrors.codice}
              placeholder="es. KG, PZ, LT"
              style="text-transform: uppercase;"
              maxlength="10"
              required
            />
            {#if formErrors.codice}
              <p class="form-error">{formErrors.codice}</p>
            {:else}
              <p class="text-xs text-neutral-500 mt-1">Codice breve identificativo (max 10 caratteri)</p>
            {/if}
          </div>
          
          <div>
            <label class="form-label">
              Descrizione *
            </label>
            <input
              type="text"
              bind:value={formData.descrizione}
              class="form-input"
              class:border-red-500={formErrors.descrizione}
              placeholder="es. Chilogrammo, Pezzo, Litro"
              maxlength="50"
              required
            />
            {#if formErrors.descrizione}
              <p class="form-error">{formErrors.descrizione}</p>
            {:else}
              <p class="text-xs text-neutral-500 mt-1">Descrizione completa dell'unità di misura</p>
            {/if}
          </div>
        </div>
        
        <div class="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg border">
          <input
            type="checkbox"
            id="attiva"
            bind:checked={formData.attiva}
            class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <label for="attiva" class="text-sm font-medium text-neutral-700 flex items-center space-x-2">
            <Icon name="active" size={16} className="text-secondary-600" />
            <span>Unità attiva e utilizzabile nei prodotti</span>
          </label>
        </div>
        
        <div class="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
          <button
            type="button"
            on:click={closeForm}
            class="btn btn-secondary btn-md flex items-center space-x-2"
          >
            <Icon name="cancel" size={16} />
            <span>Annulla</span>
          </button>
          <button
            type="submit"
            class="btn btn-primary btn-md flex items-center space-x-2"
          >
            <Icon name={editingId ? "save" : "add"} size={16} />
            <span>{editingId ? 'Aggiorna' : 'Crea Unità'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal conferma eliminazione -->
{#if deleteId}
  <div class="modal-backdrop fade-in">
    <div class="modal-content slide-up max-w-md">
      <div class="p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <Icon name="warning" size={32} className="text-red-600" />
        </div>
        
        <h3 class="text-xl font-semibold text-neutral-900 mb-3">Elimina Unità di Misura</h3>
        
        <div class="mb-6">
          <p class="text-neutral-600 mb-4">
            Sei sicuro di voler eliminare l'unità di misura:
          </p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="font-semibold text-red-800">{deleteInfo.descrizione}</div>
            <div class="text-sm text-red-600 font-mono">Codice: {deleteInfo.codice}</div>
          </div>
          <p class="text-red-600 text-sm mt-3 font-medium">
            ⚠️ Questa azione non può essere annullata
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
            <span>Elimina Unità</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}