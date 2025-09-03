<script lang="ts">
  import { onMount } from 'svelte';
  import type { Committente, ApiResponse, CommittenteWithStats } from '$lib/types';
  import { STATI_COMMITTENTE, TIPI_CONTRATTO } from '$lib/types';
  import { validateCommittente } from '$lib/validations/committente';
  
  // State management
  let committenti: CommittenteWithStats[] = [];
  let filteredCommittenti: CommittenteWithStats[] = [];
  let loading = false;
  let error = '';
  let success = '';
  
  // Form state
  let showForm = false;
  let editingId: number | null = null;
  let formData = {
    codice: '',
    ragione_sociale: '',
    partita_iva: '',
    codice_fiscale: '',
    indirizzo_sede: '',
    indirizzo_fatturazione: '',
    cap: '',
    citta: '',
    provincia: '',
    telefono: '',
    email: '',
    pec: '',
    referente_principale: '',
    tipo_contratto: 'deposito' as const,
    data_inizio_rapporto: '',
    data_fine_rapporto: '',
    stato: 'attivo' as const,
    note: ''
  };
  let formErrors: Record<string, string[]> = {};
  
  // Filtri
  let searchTerm = '';
  let statusFilter = '';
  let contractFilter = '';

  onMount(() => {
    loadCommittenti();
  });

  $: {
    filteredCommittenti = committenti.filter(c => {
      const matchesSearch = !searchTerm || 
        c.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !statusFilter || c.stato === statusFilter;
      const matchesContract = !contractFilter || c.tipo_contratto === contractFilter;
      
      return matchesSearch && matchesStatus && matchesContract;
    });
  }

  async function loadCommittenti() {
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/api/admin/committenti/with-stats');
      const result: ApiResponse<CommittenteWithStats[]> = await response.json();
      
      if (result.success) {
        committenti = result.data || [];
      } else {
        error = result.error || 'Errore nel caricamento';
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    loading = true;
    error = '';
    success = '';
    formErrors = {};
    
    // Valida i dati
    const validation = validateCommittente(formData);
    
    if (!validation.success) {
      formErrors = validation.errors || {};
      loading = false;
      return;
    }
    
    try {
      const url = editingId ? `/api/admin/committenti/${editingId}` : '/api/admin/committenti';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result: ApiResponse<Committente> = await response.json();

      if (result.success) {
        success = editingId ? 'Committente aggiornato con successo' : 'Committente creato con successo';
        await loadCommittenti();
        resetForm();
      } else {
        if (result.errors) {
          formErrors = result.errors;
        } else {
          error = result.error || 'Errore nel salvataggio';
        }
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id: number, ragioneSociale: string, hard = false) {
    const confirmMessage = hard 
      ? `Sei sicuro di voler ELIMINARE DEFINITIVAMENTE il committente "${ragioneSociale}"? Questa operazione non è reversibile!`
      : `Sei sicuro di voler disattivare il committente "${ragioneSociale}"? Verrà impostato come "cessato".`;
    
    if (!confirm(confirmMessage)) return;
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const url = hard ? `/api/admin/committenti/${id}?hard=true` : `/api/admin/committenti/${id}`;
      const response = await fetch(url, { method: 'DELETE' });
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        success = hard ? 'Committente eliminato definitivamente' : 'Committente disattivato';
        await loadCommittenti();
      } else {
        error = result.error || 'Errore nell\'eliminazione';
      }
    } catch (e) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }

  function handleEdit(committente: Committente) {
    editingId = committente.id;
    formData = {
      codice: committente.codice,
      ragione_sociale: committente.ragione_sociale,
      partita_iva: committente.partita_iva || '',
      codice_fiscale: committente.codice_fiscale || '',
      indirizzo_sede: committente.indirizzo_sede || '',
      indirizzo_fatturazione: committente.indirizzo_fatturazione || '',
      cap: committente.cap || '',
      citta: committente.citta || '',
      provincia: committente.provincia || '',
      telefono: committente.telefono || '',
      email: committente.email || '',
      pec: committente.pec || '',
      referente_principale: committente.referente_principale || '',
      tipo_contratto: committente.tipo_contratto,
      data_inizio_rapporto: committente.data_inizio_rapporto || '',
      data_fine_rapporto: committente.data_fine_rapporto || '',
      stato: committente.stato,
      note: committente.note || ''
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      codice: '',
      ragione_sociale: '',
      partita_iva: '',
      codice_fiscale: '',
      indirizzo_sede: '',
      indirizzo_fatturazione: '',
      cap: '',
      citta: '',
      provincia: '',
      telefono: '',
      email: '',
      pec: '',
      referente_principale: '',
      tipo_contratto: 'deposito',
      data_inizio_rapporto: '',
      data_fine_rapporto: '',
      stato: 'attivo',
      note: ''
    };
    editingId = null;
    showForm = false;
    formErrors = {};
    error = '';
    success = '';
  }

  function getStatusBadgeClass(stato: string) {
    switch (stato) {
      case 'attivo': return 'bg-green-100 text-green-800';
      case 'sospeso': return 'bg-yellow-100 text-yellow-800';
      case 'cessato': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getContractBadgeClass(tipo: string) {
    switch (tipo) {
      case 'deposito': return 'bg-blue-100 text-blue-800';
      case 'logistica': return 'bg-purple-100 text-purple-800';
      case 'misto': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">🏢 Gestione Committenti</h1>
        <p class="text-gray-600 mt-2">Amministrazione clienti/proprietari merce in deposito</p>
      </div>
      
      <button
        on:click={() => showForm = true}
        disabled={loading}
        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        + Nuovo Committente
      </button>
    </div>

    <!-- Messaggi -->
    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        <strong>Errore:</strong> {error}
      </div>
    {/if}

    {#if success}
      <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
        <strong>Successo:</strong> {success}
      </div>
    {/if}

    <!-- Filtri -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">🔍 Filtri</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            Ricerca
          </label>
          <input
            id="search"
            type="text"
            bind:value={searchTerm}
            placeholder="Ragione sociale, codice, email..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Stato
          </label>
          <select
            id="status-filter"
            bind:value={statusFilter}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tutti</option>
            {#each STATI_COMMITTENTE as stato}
              <option value={stato}>{stato}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="contract-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Tipo Contratto
          </label>
          <select
            id="contract-filter"
            bind:value={contractFilter}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tutti</option>
            {#each TIPI_CONTRATTO as tipo}
              <option value={tipo}>{tipo}</option>
            {/each}
          </select>
        </div>
        
        <div class="flex items-end">
          <button
            on:click={() => { searchTerm = ''; statusFilter = ''; contractFilter = ''; }}
            class="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Pulisci Filtri
          </button>
        </div>
      </div>
    </div>

    <!-- Form Modale -->
    {#if showForm}
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b px-6 py-4">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-gray-900">
                {editingId ? 'Modifica Committente' : 'Nuovo Committente'}
              </h2>
              <button
                on:click={resetForm}
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
            <!-- Dati principali -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="codice" class="block text-sm font-medium text-gray-700 mb-2">
                  Codice Committente *
                </label>
                <input
                  id="codice"
                  type="text"
                  bind:value={formData.codice}
                  required
                  disabled={editingId !== null}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  class:border-red-500={formErrors.codice}
                />
                {#if formErrors.codice}
                  <p class="text-red-600 text-sm mt-1">{formErrors.codice.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="ragione_sociale" class="block text-sm font-medium text-gray-700 mb-2">
                  Ragione Sociale *
                </label>
                <input
                  id="ragione_sociale"
                  type="text"
                  bind:value={formData.ragione_sociale}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.ragione_sociale}
                />
                {#if formErrors.ragione_sociale}
                  <p class="text-red-600 text-sm mt-1">{formErrors.ragione_sociale.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Dati fiscali -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="partita_iva" class="block text-sm font-medium text-gray-700 mb-2">
                  Partita IVA
                </label>
                <input
                  id="partita_iva"
                  type="text"
                  bind:value={formData.partita_iva}
                  placeholder="11 cifre"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.partita_iva}
                />
                {#if formErrors.partita_iva}
                  <p class="text-red-600 text-sm mt-1">{formErrors.partita_iva.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="codice_fiscale" class="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale
                </label>
                <input
                  id="codice_fiscale"
                  type="text"
                  bind:value={formData.codice_fiscale}
                  placeholder="16 caratteri"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.codice_fiscale}
                />
                {#if formErrors.codice_fiscale}
                  <p class="text-red-600 text-sm mt-1">{formErrors.codice_fiscale.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Indirizzi -->
            <div class="space-y-4">
              <div>
                <label for="indirizzo_sede" class="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo Sede
                </label>
                <input
                  id="indirizzo_sede"
                  type="text"
                  bind:value={formData.indirizzo_sede}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.indirizzo_sede}
                />
                {#if formErrors.indirizzo_sede}
                  <p class="text-red-600 text-sm mt-1">{formErrors.indirizzo_sede.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="indirizzo_fatturazione" class="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo Fatturazione
                </label>
                <input
                  id="indirizzo_fatturazione"
                  type="text"
                  bind:value={formData.indirizzo_fatturazione}
                  placeholder="Se diverso dalla sede"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.indirizzo_fatturazione}
                />
                {#if formErrors.indirizzo_fatturazione}
                  <p class="text-red-600 text-sm mt-1">{formErrors.indirizzo_fatturazione.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Località -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="cap" class="block text-sm font-medium text-gray-700 mb-2">
                  CAP
                </label>
                <input
                  id="cap"
                  type="text"
                  bind:value={formData.cap}
                  placeholder="12345"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.cap}
                />
                {#if formErrors.cap}
                  <p class="text-red-600 text-sm mt-1">{formErrors.cap.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="citta" class="block text-sm font-medium text-gray-700 mb-2">
                  Città
                </label>
                <input
                  id="citta"
                  type="text"
                  bind:value={formData.citta}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.citta}
                />
                {#if formErrors.citta}
                  <p class="text-red-600 text-sm mt-1">{formErrors.citta.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="provincia" class="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <input
                  id="provincia"
                  type="text"
                  bind:value={formData.provincia}
                  placeholder="MI"
                  maxlength="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.provincia}
                />
                {#if formErrors.provincia}
                  <p class="text-red-600 text-sm mt-1">{formErrors.provincia.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Contatti -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="telefono" class="block text-sm font-medium text-gray-700 mb-2">
                  Telefono
                </label>
                <input
                  id="telefono"
                  type="text"
                  bind:value={formData.telefono}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.telefono}
                />
                {#if formErrors.telefono}
                  <p class="text-red-600 text-sm mt-1">{formErrors.telefono.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  bind:value={formData.email}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.email}
                />
                {#if formErrors.email}
                  <p class="text-red-600 text-sm mt-1">{formErrors.email.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="pec" class="block text-sm font-medium text-gray-700 mb-2">
                  PEC
                </label>
                <input
                  id="pec"
                  type="email"
                  bind:value={formData.pec}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.pec}
                />
                {#if formErrors.pec}
                  <p class="text-red-600 text-sm mt-1">{formErrors.pec.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Referente e contratto -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="referente_principale" class="block text-sm font-medium text-gray-700 mb-2">
                  Referente Principale
                </label>
                <input
                  id="referente_principale"
                  type="text"
                  bind:value={formData.referente_principale}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.referente_principale}
                />
                {#if formErrors.referente_principale}
                  <p class="text-red-600 text-sm mt-1">{formErrors.referente_principale.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="tipo_contratto" class="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Contratto
                </label>
                <select
                  id="tipo_contratto"
                  bind:value={formData.tipo_contratto}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.tipo_contratto}
                >
                  {#each TIPI_CONTRATTO as tipo}
                    <option value={tipo}>{tipo}</option>
                  {/each}
                </select>
                {#if formErrors.tipo_contratto}
                  <p class="text-red-600 text-sm mt-1">{formErrors.tipo_contratto.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Date e stato -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="data_inizio_rapporto" class="block text-sm font-medium text-gray-700 mb-2">
                  Data Inizio Rapporto
                </label>
                <input
                  id="data_inizio_rapporto"
                  type="date"
                  bind:value={formData.data_inizio_rapporto}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.data_inizio_rapporto}
                />
                {#if formErrors.data_inizio_rapporto}
                  <p class="text-red-600 text-sm mt-1">{formErrors.data_inizio_rapporto.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="data_fine_rapporto" class="block text-sm font-medium text-gray-700 mb-2">
                  Data Fine Rapporto
                </label>
                <input
                  id="data_fine_rapporto"
                  type="date"
                  bind:value={formData.data_fine_rapporto}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.data_fine_rapporto}
                />
                {#if formErrors.data_fine_rapporto}
                  <p class="text-red-600 text-sm mt-1">{formErrors.data_fine_rapporto.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="stato" class="block text-sm font-medium text-gray-700 mb-2">
                  Stato
                </label>
                <select
                  id="stato"
                  bind:value={formData.stato}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.stato}
                >
                  {#each STATI_COMMITTENTE as stato}
                    <option value={stato}>{stato}</option>
                  {/each}
                </select>
                {#if formErrors.stato}
                  <p class="text-red-600 text-sm mt-1">{formErrors.stato.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Note -->
            <div>
              <label for="note" class="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <textarea
                id="note"
                bind:value={formData.note}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                class:border-red-500={formErrors.note}
                placeholder="Note aggiuntive..."
              ></textarea>
              {#if formErrors.note}
                <p class="text-red-600 text-sm mt-1">{formErrors.note.join(', ')}</p>
              {/if}
            </div>

            <!-- Errori generali -->
            {#if Object.keys(formErrors).length > 0 && !Object.keys(formErrors).some(key => formErrors[key]?.length)}
              <div class="text-red-600 text-sm">
                <p>Correggere gli errori evidenziati prima di procedere.</p>
              </div>
            {/if}

            <!-- Bottoni -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                on:click={resetForm}
                disabled={loading}
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvataggio...' : editingId ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Tabella -->
    <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">
          Committenti ({filteredCommittenti.length})
        </h3>
      </div>
      
      {#if loading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Caricamento...</p>
        </div>
      {:else if filteredCommittenti.length === 0}
        <div class="p-8 text-center text-gray-600">
          <p>Nessun committente trovato.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Committente
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contratto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistiche
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredCommittenti as committente}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {committente.ragione_sociale}
                      </div>
                      <div class="text-sm text-gray-500">
                        {committente.codice}
                      </div>
                      {#if committente.partita_iva}
                        <div class="text-xs text-gray-400">
                          P.IVA: {committente.partita_iva}
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {#if committente.email}
                        <div>📧 {committente.email}</div>
                      {/if}
                      {#if committente.telefono}
                        <div>📞 {committente.telefono}</div>
                      {/if}
                      {#if committente.referente_principale}
                        <div class="text-xs text-gray-500">
                          Ref: {committente.referente_principale}
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getContractBadgeClass(committente.tipo_contratto)}">
                      {committente.tipo_contratto}
                    </span>
                    {#if committente.data_inizio_rapporto}
                      <div class="text-xs text-gray-500 mt-1">
                        Dal: {new Date(committente.data_inizio_rapporto).toLocaleDateString()}
                      </div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusBadgeClass(committente.stato)}">
                      {committente.stato}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>🏷️ Prodotti: {committente.num_prodotti || 0}</div>
                    <div>📦 Movimenti: {committente.num_movimenti_mese || 0}/mese</div>
                    <div>💰 Valore: €{(committente.valore_giacenza || 0).toFixed(2)}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <a
                      href="/committenti/{committente.id}/categorie"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Categorie
                    </a>
                    <button
                      on:click={() => handleEdit(committente)}
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      Modifica
                    </button>
                    <button
                      on:click={() => handleDelete(committente.id, committente.ragione_sociale)}
                      class="text-yellow-600 hover:text-yellow-900"
                    >
                      Disattiva
                    </button>
                    {#if committente.stato === 'cessato'}
                      <button
                        on:click={() => handleDelete(committente.id, committente.ragione_sociale, true)}
                        class="text-red-600 hover:text-red-900"
                      >
                        Elimina
                      </button>
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