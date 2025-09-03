<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  // import type { MovimentoDettaglio } from '$lib/server/repositories/movimentiRepository.js';
  // Tipi movimento - definiti localmente per evitare problemi di import client-side
  const tipiMovimentoDescrizioni = {
    'CARICO': 'Carico (entrata merce)',
    'SCARICO': 'Scarico (uscita merce)',
    'TRASFERIMENTO_INTERNO': 'Trasferimento interno',
    'TRASFERIMENTO_INTER_COMMITTENTE': 'Trasferimento tra committenti',
    'RETTIFICA_POS': 'Rettifica positiva',
    'RETTIFICA_NEG': 'Rettifica negativa',
    'RESO_CLIENTE': 'Reso da cliente',
    'RESO_FORNITORE': 'Reso a fornitore'
  };

  const tipiMovimentoColori = {
    'CARICO': 'bg-green-100 text-green-800',
    'SCARICO': 'bg-red-100 text-red-800',
    'TRASFERIMENTO_INTERNO': 'bg-blue-100 text-blue-800',
    'TRASFERIMENTO_INTER_COMMITTENTE': 'bg-purple-100 text-purple-800',
    'RETTIFICA_POS': 'bg-green-100 text-green-800',
    'RETTIFICA_NEG': 'bg-red-100 text-red-800',
    'RESO_CLIENTE': 'bg-yellow-100 text-yellow-800',
    'RESO_FORNITORE': 'bg-orange-100 text-orange-800'
  };

  const committente_id = parseInt($page.params.committente_id);

  // Stato componente
  let movimenti: any[] = [];
  let loading = true;
  let error = '';
  let showForm = false;
  let editingMovimento: any | null = null;

  // Statistiche
  let statistiche = {
    totale_movimenti: 0,
    carichi_totali: 0,
    scarichi_totali: 0,
    rettifiche_totali: 0,
    ultimo_movimento: null as string | null
  };

  // Dati per dropdown
  let prodotti: Array<{
    id: number;
    codice: string;
    descrizione: string;
    categoria_descrizione: string;
    unita_misura_codice: string;
    giacenza_attuale: number;
  }> = [];

  let fornitori: Array<{
    id: number;
    codice: string;
    ragione_sociale: string;
  }> = [];

  // Form data
  let formData = {
    tipo_movimento: '',
    prodotto_id: '',
    quantita: '',
    prezzo: '',
    fornitore_id: '',
    numero_documento: '',
    data_documento: '',
    causale: '',
    operatore: '',
    note: ''
  };

  // Form errors
  let formErrors: Record<string, string> = {};

  // Filtri
  let filtri = {
    data_inizio: '',
    data_fine: '',
    tipo_movimento: '',
    prodotto_id: ''
  };

  // Carica movimenti
  async function loadMovimenti() {
    try {
      loading = true;
      error = '';

      const params = new URLSearchParams();
      if (filtri.data_inizio) params.append('data_inizio', filtri.data_inizio);
      if (filtri.data_fine) params.append('data_fine', filtri.data_fine);
      if (filtri.tipo_movimento) params.append('tipo_movimento', filtri.tipo_movimento);
      if (filtri.prodotto_id) params.append('prodotto_id', filtri.prodotto_id);

      const response = await fetch(`/api/committenti/${committente_id}/movimenti?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento');
      }

      const data = await response.json();
      movimenti = data.movimenti;
      statistiche = data.statistiche;

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    } finally {
      loading = false;
    }
  }

  // Carica dati dropdown
  async function loadDropdownData() {
    try {
      const response = await fetch(`/api/committenti/${committente_id}/movimenti/dropdown-data`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dati');
      }

      const data = await response.json();
      prodotti = data.prodotti;
      fornitori = data.fornitori;

    } catch (err) {
      console.error('Errore caricamento dropdown:', err);
    }
  }

  // Reset form
  function resetForm() {
    formData = {
      tipo_movimento: '',
      prodotto_id: '',
      quantita: '',
      prezzo: '',
      fornitore_id: '',
      numero_documento: '',
      data_documento: '',
      causale: '',
      operatore: '',
      note: ''
    };
    formErrors = {};
    editingMovimento = null;
  }

  // Apri form per nuovo movimento
  function openCreateForm() {
    resetForm();
    showForm = true;
  }

  // Apri form per modifica movimento
  function openEditForm(movimento: any) {
    editingMovimento = movimento;
    formData = {
      tipo_movimento: movimento.tipo_movimento,
      prodotto_id: movimento.prodotto_id.toString(),
      quantita: movimento.quantita.toString(),
      prezzo: movimento.prezzo.toString(),
      fornitore_id: movimento.fornitore_id?.toString() || '',
      numero_documento: movimento.numero_documento || '',
      data_documento: movimento.data_documento || '',
      causale: movimento.causale || '',
      operatore: movimento.operatore || '',
      note: movimento.note || ''
    };
    formErrors = {};
    showForm = true;
  }

  // Salva movimento (crea o aggiorna)
  async function saveMovimento() {
    try {
      formErrors = {};
      
      const payload = {
        tipo_movimento: formData.tipo_movimento,
        prodotto_id: parseInt(formData.prodotto_id),
        quantita: parseInt(formData.quantita),
        prezzo: formData.prezzo ? parseFloat(formData.prezzo) : 0,
        fornitore_id: formData.fornitore_id ? parseInt(formData.fornitore_id) : undefined,
        numero_documento: formData.numero_documento || undefined,
        data_documento: formData.data_documento || undefined,
        causale: formData.causale || undefined,
        operatore: formData.operatore || undefined,
        note: formData.note || undefined
      };

      const method = editingMovimento ? 'PUT' : 'POST';
      const url = editingMovimento 
        ? `/api/committenti/${committente_id}/movimenti/${editingMovimento.id}`
        : `/api/committenti/${committente_id}/movimenti`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          // Errori di validazione
          formErrors.general = result.details;
        } else {
          formErrors.general = result.error || 'Errore nel salvataggio';
        }
        return;
      }

      // Successo
      showForm = false;
      resetForm();
      await loadMovimenti();

    } catch (err) {
      formErrors.general = err instanceof Error ? err.message : 'Errore sconosciuto';
    }
  }

  // Elimina movimento
  async function deleteMovimento(movimento: any) {
    if (!confirm('Sei sicuro di voler eliminare questo movimento? ATTENZIONE: Le giacenze potrebbero essere influenzate.')) {
      return;
    }

    try {
      const response = await fetch(`/api/committenti/${committente_id}/movimenti/${movimento.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Errore nell\'eliminazione');
        return;
      }

      await loadMovimenti();

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore sconosciuto');
    }
  }

  // Formatta data per visualizzazione
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Applica filtri
  function applyFilters() {
    loadMovimenti();
  }

  // Reset filtri
  function resetFilters() {
    filtri = {
      data_inizio: '',
      data_fine: '',
      tipo_movimento: '',
      prodotto_id: ''
    };
    loadMovimenti();
  }

  // Inizializzazione
  onMount(async () => {
    await Promise.all([
      loadMovimenti(),
      loadDropdownData()
    ]);
  });
</script>

<svelte:head>
  <title>Movimenti - Committente {committente_id}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Movimenti di Magazzino</h1>
      <p class="text-gray-600 mt-2">Gestione movimentazioni per il committente #{committente_id}</p>
    </div>
    <button
      on:click={openCreateForm}
      class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      Nuovo Movimento
    </button>
  </div>

  <!-- Statistiche -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Totale Movimenti</div>
      <div class="text-2xl font-bold text-blue-600">{statistiche.totale_movimenti}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Carichi</div>
      <div class="text-2xl font-bold text-green-600">{statistiche.carichi_totali}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Scarichi</div>
      <div class="text-2xl font-bold text-red-600">{statistiche.scarichi_totali}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Rettifiche</div>
      <div class="text-2xl font-bold text-yellow-600">{statistiche.rettifiche_totali}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Ultimo Movimento</div>
      <div class="text-sm text-gray-900">
        {#if statistiche.ultimo_movimento}
          {formatDate(statistiche.ultimo_movimento)}
        {:else}
          Nessuno
        {/if}
      </div>
    </div>
  </div>

  <!-- Filtri -->
  <div class="bg-white p-6 rounded-lg shadow border mb-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Filtri di Ricerca</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label for="data-inizio" class="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
        <input
          id="data-inizio"
          type="date"
          bind:value={filtri.data_inizio}
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
      </div>
      
      <div>
        <label for="data-fine" class="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
        <input
          id="data-fine"
          type="date"
          bind:value={filtri.data_fine}
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
      </div>
      
      <div>
        <label for="tipo-movimento" class="block text-sm font-medium text-gray-700 mb-1">Tipo Movimento</label>
        <select
          id="tipo-movimento"
          bind:value={filtri.tipo_movimento}
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tutti i tipi</option>
          {#each Object.entries(tipiMovimentoDescrizioni) as [key, value]}
            <option value={key}>{value}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="prodotto" class="block text-sm font-medium text-gray-700 mb-1">Prodotto</label>
        <select
          id="prodotto"
          bind:value={filtri.prodotto_id}
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tutti i prodotti</option>
          {#each prodotti as prodotto}
            <option value={prodotto.id.toString()}>{prodotto.codice} - {prodotto.descrizione}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="flex gap-4 mt-4">
      <button
        on:click={applyFilters}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
      >
        Applica Filtri
      </button>
      <button
        on:click={resetFilters}
        class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
      >
        Reset Filtri
      </button>
    </div>
  </div>

  <!-- Lista Movimenti -->
  <div class="bg-white rounded-lg shadow border">
    <div class="p-6 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-900">Lista Movimenti</h2>
    </div>

    {#if loading}
      <div class="p-12 text-center">
        <div class="text-gray-500">Caricamento movimenti...</div>
      </div>
    {:else if error}
      <div class="p-6 text-center">
        <div class="text-red-600">{error}</div>
        <button
          on:click={loadMovimenti}
          class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Riprova
        </button>
      </div>
    {:else if movimenti.length === 0}
      <div class="p-12 text-center">
        <div class="text-gray-500 mb-4">Nessun movimento trovato</div>
        <button
          on:click={openCreateForm}
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Crea Primo Movimento
        </button>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornitore</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each movimenti as movimento}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(movimento.data_movimento)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {tipiMovimentoColori[movimento.tipo_movimento]}">
                    {tipiMovimentoDescrizioni[movimento.tipo_movimento]}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  <div class="font-medium">{movimento.prodotto_codice}</div>
                  <div class="text-gray-500">{movimento.prodotto_descrizione}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="font-medium">{movimento.quantita}</span>
                  <span class="text-gray-500 ml-1">{movimento.unita_misura_codice}</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {movimento.fornitore_ragione_sociale || '-'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {movimento.numero_documento || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    on:click={() => openEditForm(movimento)}
                    class="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Modifica
                  </button>
                  <button
                    on:click={() => deleteMovimento(movimento)}
                    class="text-red-600 hover:text-red-900"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Form -->
{#if showForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {editingMovimento ? 'Modifica Movimento' : 'Nuovo Movimento'}
        </h3>
      </div>

      <div class="p-6 space-y-6">
        {#if formErrors.general}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {formErrors.general}
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Tipo Movimento -->
          <div class="md:col-span-2">
            <label for="tipo-movimento-form" class="block text-sm font-medium text-gray-700 mb-2">Tipo Movimento *</label>
            <select
              id="tipo-movimento-form"
              bind:value={formData.tipo_movimento}
              disabled={!!editingMovimento}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              required
            >
              <option value="">Seleziona tipo movimento</option>
              {#each Object.entries(tipiMovimentoDescrizioni) as [key, value]}
                <option value={key}>{value}</option>
              {/each}
            </select>
          </div>

          <!-- Prodotto -->
          <div class="md:col-span-2">
            <label for="prodotto-form" class="block text-sm font-medium text-gray-700 mb-2">Prodotto *</label>
            <select
              id="prodotto-form"
              bind:value={formData.prodotto_id}
              disabled={!!editingMovimento}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              required
            >
              <option value="">Seleziona prodotto</option>
              {#each prodotti as prodotto}
                <option value={prodotto.id.toString()}>
                  {prodotto.codice} - {prodotto.descrizione} (Giacenza: {prodotto.giacenza_attuale} {prodotto.unita_misura_codice})
                </option>
              {/each}
            </select>
          </div>

          <!-- Quantità -->
          <div>
            <label for="quantita-form" class="block text-sm font-medium text-gray-700 mb-2">Quantità *</label>
            <input
              id="quantita-form"
              type="number"
              min="1"
              step="1"
              bind:value={formData.quantita}
              disabled={!!editingMovimento}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              required
            >
          </div>

          <!-- Prezzo -->
          <div>
            <label for="prezzo-form" class="block text-sm font-medium text-gray-700 mb-2">Prezzo Unitario</label>
            <input
              id="prezzo-form"
              type="number"
              min="0"
              step="0.01"
              bind:value={formData.prezzo}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>

          <!-- Fornitore -->
          <div>
            <label for="fornitore-form" class="block text-sm font-medium text-gray-700 mb-2">Fornitore</label>
            <select
              id="fornitore-form"
              bind:value={formData.fornitore_id}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Nessun fornitore</option>
              {#each fornitori as fornitore}
                <option value={fornitore.id.toString()}>{fornitore.codice} - {fornitore.ragione_sociale}</option>
              {/each}
            </select>
          </div>

          <!-- Numero Documento -->
          <div>
            <label for="numero-documento-form" class="block text-sm font-medium text-gray-700 mb-2">N° Documento</label>
            <input
              id="numero-documento-form"
              type="text"
              bind:value={formData.numero_documento}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxlength="100"
            >
          </div>

          <!-- Data Documento -->
          <div>
            <label for="data-documento-form" class="block text-sm font-medium text-gray-700 mb-2">Data Documento</label>
            <input
              id="data-documento-form"
              type="date"
              bind:value={formData.data_documento}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>

          <!-- Causale -->
          <div>
            <label for="causale-form" class="block text-sm font-medium text-gray-700 mb-2">Causale</label>
            <input
              id="causale-form"
              type="text"
              bind:value={formData.causale}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxlength="500"
            >
          </div>

          <!-- Operatore -->
          <div>
            <label for="operatore-form" class="block text-sm font-medium text-gray-700 mb-2">Operatore</label>
            <input
              id="operatore-form"
              type="text"
              bind:value={formData.operatore}
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxlength="100"
            >
          </div>

          <!-- Note -->
          <div class="md:col-span-2">
            <label for="note-form" class="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <textarea
              id="note-form"
              bind:value={formData.note}
              rows="3"
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxlength="1000"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-gray-200 flex justify-end gap-4">
        <button
          on:click={() => { showForm = false; resetForm(); }}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
        >
          Annulla
        </button>
        <button
          on:click={saveMovimento}
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          {editingMovimento ? 'Aggiorna' : 'Salva'}
        </button>
      </div>
    </div>
  </div>
{/if}