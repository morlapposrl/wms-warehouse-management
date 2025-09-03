<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { 
    tipiInventarioDescrizioni, 
    statiInventarioDescrizioni,
    statiInventarioColori,
    tipiInventarioColori 
  } from '$lib/validations/inventario.js';

  const committente_id = parseInt($page.params.committente_id);

  // Stato componente
  let inventari: any[] = [];
  let categorie: any[] = [];
  let loading = true;
  let error = '';

  // Modali
  let showCreateModal = false;
  let showDeleteModal = false;
  let deleteInventario: any = null;

  // Form nuovo inventario
  let formData = {
    codice_inventario: '',
    descrizione: '',
    tipo: 'TOTALE',
    data_pianificazione: '',
    operatore_responsabile: '',
    categoria_id: '',
    ubicazione_filtro: '',
    note: ''
  };
  let formErrors: any = {};

  // Filtri
  let filtri = {
    stato: '',
    tipo: '',
    operatore_responsabile: ''
  };

  // Carica dati
  async function loadInventari() {
    try {
      loading = true;
      error = '';

      const params = new URLSearchParams();
      if (filtri.stato) params.set('stato', filtri.stato);
      if (filtri.tipo) params.set('tipo', filtri.tipo);
      if (filtri.operatore_responsabile) params.set('operatore_responsabile', filtri.operatore_responsabile);

      const response = await fetch(`/api/committenti/${committente_id}/inventari?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento');
      }

      const data = await response.json();
      inventari = data.inventari || [];

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    } finally {
      loading = false;
    }
  }

  async function loadCategorie() {
    try {
      const response = await fetch(`/api/committenti/${committente_id}/categorie`);
      if (response.ok) {
        const data = await response.json();
        categorie = data.categorie || [];
      }
    } catch (err) {
      console.error('Errore caricamento categorie:', err);
    }
  }

  // Crea inventario
  async function createInventario() {
    try {
      formErrors = {};
      
      const response = await fetch(`/api/committenti/${committente_id}/inventari`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          // Errori di validazione Zod
          formErrors = errorData.details.reduce((acc: any, error: any) => {
            acc[error.path[0]] = error.message;
            return acc;
          }, {});
        } else {
          throw new Error(errorData.error || 'Errore nella creazione');
        }
        return;
      }

      // Reset form e ricarica lista
      formData = {
        codice_inventario: '',
        descrizione: '',
        tipo: 'TOTALE',
        data_pianificazione: '',
        operatore_responsabile: '',
        categoria_id: '',
        ubicazione_filtro: '',
        note: ''
      };
      showCreateModal = false;
      await loadInventari();

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    }
  }

  // Elimina inventario
  async function deleteInventarioConfirm() {
    if (!deleteInventario) return;

    try {
      const response = await fetch(`/api/committenti/${committente_id}/inventari/${deleteInventario.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'eliminazione');
      }

      showDeleteModal = false;
      deleteInventario = null;
      await loadInventari();

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    }
  }

  // Azioni inventario
  async function executeAction(inventario: any, action: string) {
    try {
      const response = await fetch(`/api/committenti/${committente_id}/inventari/${inventario.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'esecuzione azione');
      }

      await loadInventari();

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    }
  }

  // Formatters
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('it-IT');
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('it-IT');
  }

  function getProgressColor(percentuale: number): string {
    if (percentuale === 0) return 'bg-gray-200';
    if (percentuale < 30) return 'bg-red-200';
    if (percentuale < 70) return 'bg-yellow-200';
    if (percentuale < 100) return 'bg-blue-200';
    return 'bg-green-200';
  }

  // Inizializzazione
  onMount(() => {
    // Imposta data di default a domani
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    formData.data_pianificazione = tomorrow.toISOString().split('T')[0];

    loadInventari();
    loadCategorie();
  });

  // Reattività filtri
  $: if (filtri) {
    loadInventari();
  }
</script>

<svelte:head>
  <title>Inventari - Committente {committente_id}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">📋 Inventari</h1>
      <p class="text-gray-600 mt-2">Gestione inventari fisici per il committente #{committente_id}</p>
    </div>
    <button
      on:click={() => showCreateModal = true}
      class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      ➕ Nuovo Inventario
    </button>
  </div>

  <!-- Statistiche -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Totale Inventari</div>
      <div class="text-3xl font-bold text-gray-900">{inventari.length}</div>
    </div>
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Pianificati</div>
      <div class="text-3xl font-bold text-blue-600">
        {inventari.filter(i => i.stato === 'PIANIFICATO').length}
      </div>
    </div>
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">In Corso</div>
      <div class="text-3xl font-bold text-yellow-600">
        {inventari.filter(i => i.stato === 'IN_CORSO').length}
      </div>
    </div>
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Completati</div>
      <div class="text-3xl font-bold text-green-600">
        {inventari.filter(i => i.stato === 'COMPLETATO').length}
      </div>
    </div>
  </div>

  <!-- Filtri -->
  <div class="bg-white p-6 rounded-lg shadow border mb-8">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 Filtri</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="filtro-stato" class="block text-sm font-medium text-gray-700 mb-2">
          Stato
        </label>
        <select 
          id="filtro-stato"
          bind:value={filtri.stato}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tutti gli stati</option>
          <option value="PIANIFICATO">Pianificato</option>
          <option value="IN_CORSO">In Corso</option>
          <option value="COMPLETATO">Completato</option>
          <option value="ANNULLATO">Annullato</option>
        </select>
      </div>
      <div>
        <label for="filtro-tipo" class="block text-sm font-medium text-gray-700 mb-2">
          Tipo
        </label>
        <select 
          id="filtro-tipo"
          bind:value={filtri.tipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tutti i tipi</option>
          <option value="TOTALE">Totale</option>
          <option value="PARZIALE">Parziale</option>
          <option value="CICLICO">Ciclico</option>
        </select>
      </div>
      <div>
        <label for="filtro-operatore" class="block text-sm font-medium text-gray-700 mb-2">
          Operatore
        </label>
        <input
          id="filtro-operatore"
          type="text"
          bind:value={filtri.operatore_responsabile}
          placeholder="Nome operatore..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>

  <!-- Messaggio errore -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="text-red-800">{error}</div>
    </div>
  {/if}

  <!-- Lista Inventari -->
  {#if loading}
    <div class="p-12 text-center">
      <div class="text-gray-500">Caricamento inventari...</div>
    </div>
  {:else if inventari.length === 0}
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
      <div class="text-gray-500 text-lg mb-4">📋 Nessun inventario trovato</div>
      <p class="text-gray-400 mb-6">Crea il primo inventario per iniziare</p>
      <button
        on:click={() => showCreateModal = true}
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        ➕ Crea Primo Inventario
      </button>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow border">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventario</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pianificazione</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progresso</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operatore</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each inventari as inventario}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">
                  <div class="font-medium">{inventario.codice_inventario}</div>
                  <div class="text-gray-500">{inventario.descrizione}</div>
                  {#if inventario.categoria_descrizione}
                    <div class="text-xs text-gray-400">Categoria: {inventario.categoria_descrizione}</div>
                  {/if}
                  {#if inventario.ubicazione_filtro}
                    <div class="text-xs text-gray-400">Ubicazione: {inventario.ubicazione_filtro}</div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statiInventarioColori[inventario.stato]}">
                    {statiInventarioDescrizioni[inventario.stato]}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {tipiInventarioColori[inventario.tipo]}">
                    {tipiInventarioDescrizioni[inventario.tipo]}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  <div>{formatDate(inventario.data_pianificazione)}</div>
                  {#if inventario.data_inizio}
                    <div class="text-xs text-gray-500">Inizio: {formatDateTime(inventario.data_inizio)}</div>
                  {/if}
                  {#if inventario.data_fine}
                    <div class="text-xs text-gray-500">Fine: {formatDateTime(inventario.data_fine)}</div>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">
                    {inventario.prodotti_contati} / {inventario.totale_prodotti_da_contare}
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      class="h-2 rounded-full {getProgressColor(inventario.progresso_percentuale)}" 
                      style="width: {inventario.progresso_percentuale}%"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{inventario.progresso_percentuale}%</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {inventario.operatore_responsabile || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <a
                    href="/committenti/{committente_id}/inventari/{inventario.id}"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Dettagli
                  </a>
                  
                  {#if inventario.stato === 'PIANIFICATO'}
                    <button
                      on:click={() => executeAction(inventario, 'avvia')}
                      class="text-green-600 hover:text-green-900"
                    >
                      Avvia
                    </button>
                    <button
                      on:click={() => { deleteInventario = inventario; showDeleteModal = true; }}
                      class="text-red-600 hover:text-red-900"
                    >
                      Elimina
                    </button>
                  {:else if inventario.stato === 'IN_CORSO'}
                    <button
                      on:click={() => executeAction(inventario, 'completa')}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Completa
                    </button>
                    <button
                      on:click={() => executeAction(inventario, 'annulla')}
                      class="text-red-600 hover:text-red-900"
                    >
                      Annulla
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Modal Nuovo Inventario -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-bold text-gray-900 mb-4">📋 Nuovo Inventario</h3>
        
        <form on:submit|preventDefault={createInventario} class="space-y-4">
          <!-- Codice Inventario -->
          <div>
            <label for="codice" class="block text-sm font-medium text-gray-700 mb-2">
              Codice Inventario *
            </label>
            <input
              id="codice"
              type="text"
              bind:value={formData.codice_inventario}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {formErrors.codice_inventario ? 'border-red-500' : ''}"
              placeholder="Es: INV-2024-001"
              required
            />
            {#if formErrors.codice_inventario}
              <p class="mt-1 text-sm text-red-600">{formErrors.codice_inventario}</p>
            {/if}
          </div>

          <!-- Descrizione -->
          <div>
            <label for="descrizione" class="block text-sm font-medium text-gray-700 mb-2">
              Descrizione *
            </label>
            <input
              id="descrizione"
              type="text"
              bind:value={formData.descrizione}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {formErrors.descrizione ? 'border-red-500' : ''}"
              placeholder="Descrizione inventario..."
              required
            />
            {#if formErrors.descrizione}
              <p class="mt-1 text-sm text-red-600">{formErrors.descrizione}</p>
            {/if}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Tipo -->
            <div>
              <label for="tipo" class="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                id="tipo"
                bind:value={formData.tipo}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TOTALE">Totale</option>
                <option value="PARZIALE">Parziale</option>
                <option value="CICLICO">Ciclico</option>
              </select>
            </div>

            <!-- Data Pianificazione -->
            <div>
              <label for="data" class="block text-sm font-medium text-gray-700 mb-2">
                Data Pianificazione *
              </label>
              <input
                id="data"
                type="date"
                bind:value={formData.data_pianificazione}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {formErrors.data_pianificazione ? 'border-red-500' : ''}"
                required
              />
              {#if formErrors.data_pianificazione}
                <p class="mt-1 text-sm text-red-600">{formErrors.data_pianificazione}</p>
              {/if}
            </div>
          </div>

          <!-- Operatore -->
          <div>
            <label for="operatore" class="block text-sm font-medium text-gray-700 mb-2">
              Operatore Responsabile
            </label>
            <input
              id="operatore"
              type="text"
              bind:value={formData.operatore_responsabile}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome operatore..."
            />
          </div>

          {#if formData.tipo === 'PARZIALE'}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Categoria -->
              <div>
                <label for="categoria" class="block text-sm font-medium text-gray-700 mb-2">
                  Categoria (per inventari parziali)
                </label>
                <select
                  id="categoria"
                  bind:value={formData.categoria_id}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleziona categoria...</option>
                  {#each categorie as categoria}
                    <option value={categoria.id}>{categoria.descrizione}</option>
                  {/each}
                </select>
              </div>

              <!-- Ubicazione -->
              <div>
                <label for="ubicazione" class="block text-sm font-medium text-gray-700 mb-2">
                  Filtro Ubicazione
                </label>
                <input
                  id="ubicazione"
                  type="text"
                  bind:value={formData.ubicazione_filtro}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es: A01, Scaffale B..."
                />
              </div>
            </div>
          {/if}

          <!-- Note -->
          <div>
            <label for="note" class="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              id="note"
              bind:value={formData.note}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Note aggiuntive..."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              on:click={() => showCreateModal = false}
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Crea Inventario
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Conferma Eliminazione -->
{#if showDeleteModal && deleteInventario}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg font-bold text-gray-900 mb-4">⚠️ Conferma Eliminazione</h3>
        <p class="text-gray-600 mb-6">
          Sei sicuro di voler eliminare l'inventario <strong>{deleteInventario.codice_inventario}</strong>?
          <br><br>
          Questa azione non può essere annullata.
        </p>
        <div class="flex justify-center space-x-3">
          <button
            on:click={() => { showDeleteModal = false; deleteInventario = null; }}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Annulla
          </button>
          <button
            on:click={deleteInventarioConfirm}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}