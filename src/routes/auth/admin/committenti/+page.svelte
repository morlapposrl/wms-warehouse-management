<script lang="ts">
  import { onMount } from 'svelte';
  import type { Committente, ApiResponse, CommittenteWithStats } from '$lib/types';
  import { STATI_COMMITTENTE, TIPI_CONTRATTO } from '$lib/types';
  import { validateCommittente } from '$lib/validations/committente';
  import { t } from '$lib/i18n';
  
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
        error = result.error || $t('errors.generic');
      }
    } catch (e) {
      error = $t('errors.network');
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
      
      console.log('Risposta server:', result); // DEBUG

      if (result.success) {
        success = editingId ? 'Committente aggiornato con successo' : 'Committente creato con successo';
        await loadCommittenti();
        resetForm();
      } else {
        // Gestione errori più robusta
        if (result.errors && typeof result.errors === 'object') {
          formErrors = result.errors;
        } else {
          error = result.error || $t('errors.generic');
          formErrors = {}; // Reset errori del form
        }
      }
    } catch (e) {
      error = $t('errors.network');
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
        success = hard ? $t('clients.messages.deleteSuccess') : $t('clients.messages.saveSuccess');
        await loadCommittenti();
      } else {
        error = result.error || $t('clients.messages.error');
      }
    } catch (e) {
      error = $t('errors.network');
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
      case 'attivo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sospeso': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cessato': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  function getContractBadgeClass(tipo: string) {
    switch (tipo) {
      case 'deposito': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'logistica': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'misto': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
</script>

<div class="w-full">
  <!-- Header con azioni -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-1">
          🏢 {$t('clients.title')}
        </h1>
        <p class="text-neutral-600 dark:text-gray-400">
          {$t('clients.subtitle')}
        </p>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-3">
        <button 
          class="btn btn-neutral"
          on:click={() => window.location.reload()}
          title="{$t('common.refresh')}"
        >
          🔄 {$t('common.refresh')}
        </button>
        <button
          class="btn btn-primary"
          on:click={() => showForm = true}
          disabled={loading}
          title="{$t('clients.add')}"
        >
          + {$t('clients.add')}
        </button>
      </div>
    </div>

    <!-- Alert successo/errore -->
    {#if error}
      <div class="alert alert-error mb-6">
        <strong>{$t('orders.labels.error')}:</strong> {error}
      </div>
    {/if}

    {#if success}
      <div class="alert alert-success mb-6">
        <strong>{$t('orders.labels.success')}:</strong> {success}
      </div>
    {/if}

    <!-- Pannello Filtri -->
    <div class="card mb-6">
      <div class="card-header py-3">
        <h3 class="text-md font-semibold text-neutral-900 flex items-center gap-2">
          <span class="text-lg">🔍</span>
          <span>{$t('common.filter')}</span>
        </h3>
      </div>
      <div class="card-body py-4">
        <div class="flex items-end gap-2 flex-nowrap">
          <!-- Ricerca -->
          <div class="min-w-64">
            <input
              id="search"
              type="text"
              bind:value={searchTerm}
              placeholder="{$t('clients.searchPlaceholder')}"
              class="form-input text-sm"
            />
          </div>
          
          <!-- Filtro Stato -->
          <div class="min-w-32">
            <select
              id="status-filter"
              bind:value={statusFilter}
              class="form-input text-sm"
            >
              <option value="">{$t('common.all')} {$t('clients.filters.status').toLowerCase()}</option>
              {#each STATI_COMMITTENTE as stato}
                <option value={stato}>{$t(`clients.statuses.${stato === 'attivo' ? 'active' : stato === 'sospeso' ? 'suspended' : 'terminated'}`)}</option>
              {/each}
            </select>
          </div>
          
          <!-- Filtro Tipo Contratto -->
          <div class="min-w-32">
            <select
              id="contract-filter"
              bind:value={contractFilter}
              class="form-input text-sm"
            >
              <option value="">{$t('common.all')} {$t('clients.filters.contractType').toLowerCase()}</option>
            {#each TIPI_CONTRATTO as tipo}
              <option value={tipo}>{$t(`clients.contractTypes.${tipo === 'deposito' ? 'deposit' : tipo === 'logistica' ? 'logistics' : 'mixed'}`)}</option>
            {/each}
          </select>
          </div>
          
          <!-- Pulsante Reset -->
          <div>
            <button
              class="btn btn-secondary btn-sm px-2"
              on:click={() => { searchTerm = ''; statusFilter = ''; contractFilter = ''; }}
              title="{$t('common.refresh')} {$t('common.filter').toLowerCase()}"
            >
              ↻
            </button>
          </div>
          
          <div class="text-sm text-neutral-600 dark:text-gray-400">
            {filteredCommittenti.length} {$t('clients.title').toLowerCase()}
          </div>
        </div>
      </div>
    </div>

    <!-- Form Modale -->
    {#if showForm}
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
          <div class="bg-white dark:bg-gray-800 border-b px-4 py-3 flex-shrink-0">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingId ? $t('clients.edit') : $t('clients.add')}
              </h2>
              <button
                on:click={resetForm}
                class="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <form on:submit|preventDefault={handleSubmit} class="flex flex-col flex-1 overflow-hidden">
            <div class="p-4 overflow-y-auto flex-1">
            <!-- Layout principale: form + note -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Colonna principale form (2/3) -->
              <div class="lg:col-span-2 space-y-3">
                <!-- Dati principali -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="codice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.code')} *
                </label>
                <input
                  id="codice"
                  type="text"
                  bind:value={formData.codice}
                  required
                  disabled={editingId !== null}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  class:border-red-500={formErrors.codice}
                />
                {#if formErrors.codice}
                  <p class="text-red-600 text-sm mt-1">{formErrors.codice.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="ragione_sociale" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.companyName')} *
                </label>
                <input
                  id="ragione_sociale"
                  type="text"
                  bind:value={formData.ragione_sociale}
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.ragione_sociale}
                />
                {#if formErrors.ragione_sociale}
                  <p class="text-red-600 text-sm mt-1">{formErrors.ragione_sociale.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Dati fiscali -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="partita_iva" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.vatNumber')}
                </label>
                <input
                  id="partita_iva"
                  type="text"
                  bind:value={formData.partita_iva}
                  placeholder="11 cifre"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.partita_iva}
                />
                {#if formErrors.partita_iva}
                  <p class="text-red-600 text-sm mt-1">{formErrors.partita_iva.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="codice_fiscale" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.fiscalCode')}
                </label>
                <input
                  id="codice_fiscale"
                  type="text"
                  bind:value={formData.codice_fiscale}
                  placeholder="16 caratteri"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                <label for="indirizzo_sede" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.address')}
                </label>
                <input
                  id="indirizzo_sede"
                  type="text"
                  bind:value={formData.indirizzo_sede}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.indirizzo_sede}
                />
                {#if formErrors.indirizzo_sede}
                  <p class="text-red-600 text-sm mt-1">{formErrors.indirizzo_sede.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="indirizzo_fatturazione" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.billingAddress')}
                </label>
                <input
                  id="indirizzo_fatturazione"
                  type="text"
                  bind:value={formData.indirizzo_fatturazione}
                  placeholder="{$t('clients.form.billingAddress')}"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.indirizzo_fatturazione}
                />
                {#if formErrors.indirizzo_fatturazione}
                  <p class="text-red-600 text-sm mt-1">{formErrors.indirizzo_fatturazione.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Località -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label for="cap" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.zipCode')}
                </label>
                <input
                  id="cap"
                  type="text"
                  bind:value={formData.cap}
                  placeholder="12345"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.cap}
                />
                {#if formErrors.cap}
                  <p class="text-red-600 text-sm mt-1">{formErrors.cap.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="citta" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.city')}
                </label>
                <input
                  id="citta"
                  type="text"
                  bind:value={formData.citta}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.citta}
                />
                {#if formErrors.citta}
                  <p class="text-red-600 text-sm mt-1">{formErrors.citta.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="provincia" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.province')}
                </label>
                <input
                  id="provincia"
                  type="text"
                  bind:value={formData.provincia}
                  placeholder="MI"
                  maxlength="2"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.provincia}
                />
                {#if formErrors.provincia}
                  <p class="text-red-600 text-sm mt-1">{formErrors.provincia.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Contatti -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label for="telefono" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.phone')}
                </label>
                <input
                  id="telefono"
                  type="text"
                  bind:value={formData.telefono}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.telefono}
                />
                {#if formErrors.telefono}
                  <p class="text-red-600 text-sm mt-1">{formErrors.telefono.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  bind:value={formData.email}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.email}
                />
                {#if formErrors.email}
                  <p class="text-red-600 text-sm mt-1">{formErrors.email.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="pec" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.pec')}
                </label>
                <input
                  id="pec"
                  type="email"
                  bind:value={formData.pec}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                <label for="referente_principale" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.mainContact')}
                </label>
                <input
                  id="referente_principale"
                  type="text"
                  bind:value={formData.referente_principale}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.referente_principale}
                />
                {#if formErrors.referente_principale}
                  <p class="text-red-600 text-sm mt-1">{formErrors.referente_principale.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="tipo_contratto" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.contractType')}
                </label>
                <select
                  id="tipo_contratto"
                  bind:value={formData.tipo_contratto}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.tipo_contratto}
                >
                  {#each TIPI_CONTRATTO as tipo}
                    <option value={tipo}>{$t(`clients.contractTypes.${tipo === 'deposito' ? 'deposit' : tipo === 'logistica' ? 'logistics' : 'mixed'}`)}</option>
                  {/each}
                </select>
                {#if formErrors.tipo_contratto}
                  <p class="text-red-600 text-sm mt-1">{formErrors.tipo_contratto.join(', ')}</p>
                {/if}
              </div>
            </div>

            <!-- Date e stato -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label for="data_inizio_rapporto" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.startDate')}
                </label>
                <input
                  id="data_inizio_rapporto"
                  type="date"
                  bind:value={formData.data_inizio_rapporto}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.data_inizio_rapporto}
                />
                {#if formErrors.data_inizio_rapporto}
                  <p class="text-red-600 text-sm mt-1">{formErrors.data_inizio_rapporto.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="data_fine_rapporto" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.endDate')}
                </label>
                <input
                  id="data_fine_rapporto"
                  type="date"
                  bind:value={formData.data_fine_rapporto}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.data_fine_rapporto}
                />
                {#if formErrors.data_fine_rapporto}
                  <p class="text-red-600 text-sm mt-1">{formErrors.data_fine_rapporto.join(', ')}</p>
                {/if}
              </div>

              <div>
                <label for="stato" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {$t('clients.form.status')}
                </label>
                <select
                  id="stato"
                  bind:value={formData.stato}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  class:border-red-500={formErrors.stato}
                >
                  {#each STATI_COMMITTENTE as stato}
                    <option value={stato}>{$t(`clients.statuses.${stato === 'attivo' ? 'active' : stato === 'sospeso' ? 'suspended' : 'terminated'}`)}</option>
                  {/each}
                </select>
                {#if formErrors.stato}
                  <p class="text-red-600 text-sm mt-1">{formErrors.stato.join(', ')}</p>
                {/if}
              </div>
            </div>
          </div>
          
          <!-- Colonna Note (1/3) -->
          <div class="lg:col-span-1">
            <div class="sticky top-4">
              <label for="note" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📝 {$t('clients.form.notes')}
              </label>
              <textarea
                id="note"
                bind:value={formData.note}
                rows="6"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                class:border-red-500={formErrors.note}
                placeholder="{$t('clients.form.notes')}"
              ></textarea>
              {#if formErrors.note}
                <p class="text-red-600 text-sm mt-1">{formErrors.note.join(', ')}</p>
              {/if}
            </div>
          </div>
        </div>
            </div>

            <!-- Footer fisso con bottoni -->
            <div class="border-t px-4 py-3 flex-shrink-0 bg-white dark:bg-gray-800">
              <!-- Errori generali -->
              {#if Object.keys(formErrors).length > 0 && !Object.keys(formErrors).some(key => formErrors[key]?.length)}
                <div class="text-red-600 text-sm mb-3">
                  <p>{$t('validation.required')}</p>
                </div>
              {/if}

              <!-- Bottoni -->
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  on:click={resetForm}
                  disabled={loading}
                  class="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {$t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? $t('common.loading') : editingId ? $t('common.edit') : $t('common.add')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Tabella -->
    <div class="card">
      <div class="card-header">
        <h3 class="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <span class="text-lg">🏢</span>
          <span>{$t('clients.title')} ({filteredCommittenti.length})</span>
        </h3>
      </div>
      
      {#if loading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-neutral-600 dark:text-gray-400 mt-2">{$t('common.loading')}</p>
        </div>
      {:else if filteredCommittenti.length === 0}
        <div class="p-8 text-center text-neutral-600 dark:text-gray-400">
          <p>{$t('common.noData')}</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th class="sortable-header">
                  {$t('clients.form.companyName')}
                </th>
                <th class="sortable-header">
                  {$t('orders.labels.contacts')}
                </th>
                <th class="sortable-header">
                  {$t('clients.form.contractType')}
                </th>
                <th class="sortable-header">
                  {$t('clients.form.status')}
                </th>
                <th class="sortable-header">
                  {$t('clients.stats.totalProducts')}
                </th>
                <th class="sortable-header">
                  {$t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {#each filteredCommittenti as committente}
                <tr>
                  <td>
                    <div>
                      <div class="font-medium">
                        {committente.ragione_sociale}
                      </div>
                      <div class="text-sm opacity-60">
                        {committente.codice}
                      </div>
                      {#if committente.partita_iva}
                        <div class="text-xs opacity-50">
                          {$t('clients.form.vatNumber')}: {committente.partita_iva}
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <div class="text-sm">
                      {#if committente.email}
                        <div>📧 {committente.email}</div>
                      {/if}
                      {#if committente.telefono}
                        <div>📞 {committente.telefono}</div>
                      {/if}
                      {#if committente.referente_principale}
                        <div class="text-xs opacity-60">
                          {$t('clients.form.mainContact')}: {committente.referente_principale}
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <div class="badge {getContractBadgeClass(committente.tipo_contratto)}">
                      {$t(`clients.contractTypes.${committente.tipo_contratto === 'deposito' ? 'deposit' : committente.tipo_contratto === 'logistica' ? 'logistics' : 'mixed'}`)}
                    </div>
                    {#if committente.data_inizio_rapporto}
                      <div class="text-xs opacity-60 mt-1">
                        {$t('clients.form.startDate')}: {new Date(committente.data_inizio_rapporto).toLocaleDateString()}
                      </div>
                    {/if}
                  </td>
                  <td>
                    <div class="badge {getStatusBadgeClass(committente.stato)}">
                      {$t(`clients.statuses.${committente.stato === 'attivo' ? 'active' : committente.stato === 'sospeso' ? 'suspended' : 'terminated'}`)}
                    </div>
                  </td>
                  <td>
                    <div class="text-sm space-y-1">
                      <div>🏷️ {$t('products.title')}: {committente.num_prodotti || 0}</div>
                      <div>📦 {$t('movements.title')}: {committente.num_movimenti_mese || 0}/mese</div>
                      <div>💰 {$t('clients.stats.totalValue')}: €{(committente.valore_giacenza || 0).toFixed(2)}</div>
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button
                        on:click={() => handleEdit(committente)}
                        class="btn btn-sm btn-ghost"
                        title="{$t('clients.actions.edit')}"
                      >
                        ✏️
                      </button>
                      <button
                        on:click={() => handleDelete(committente.id, committente.ragione_sociale)}
                        class="btn btn-sm btn-warning"
                        title="{$t('clients.actions.delete')}"
                      >
                        ⏸️
                      </button>
                      {#if committente.stato === 'cessato'}
                        <button
                          on:click={() => handleDelete(committente.id, committente.ragione_sociale, true)}
                          class="btn btn-sm btn-error"
                          title="{$t('clients.actions.delete')}"
                        >
                          🗑️
                        </button>
                      {/if}
                    </div>
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

<style>
  .sortable-header {
    @apply relative;
  }
  
  .sortable-header button {
    @apply text-sm font-medium cursor-pointer transition-colors;
  }
  
  .sortable-header button:hover {
    @apply text-blue-600;
  }
  
  /* Filter dropdown styles */
  .sortable-header .absolute {
    z-index: 1000;
  }
</style>