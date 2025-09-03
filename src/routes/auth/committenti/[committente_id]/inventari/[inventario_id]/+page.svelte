<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { 
    tipiInventarioDescrizioni, 
    statiInventarioDescrizioni,
    statiInventarioColori,
    tipiInventarioColori,
    differenzeConteggioColori,
    differenzeConteggioDescrizioni
  } from '$lib/validations/inventario.js';

  const committente_id = parseInt($page.params.committente_id);
  const inventario_id = parseInt($page.params.inventario_id);

  // Stato componente
  let inventario: any = null;
  let conteggi: any[] = [];
  let loading = true;
  let error = '';

  // Modali
  let showConteggioModal = false;
  let conteggioSelezionato: any = null;

  // Form conteggio
  let conteggioFormData = {
    quantita_contata: 0,
    operatore_conteggio: '',
    note_conteggio: ''
  };
  let conteggioFormErrors: any = {};

  // Filtri
  let filtroStato = '';
  let filtroCategoria = '';
  let ricercaProdotto = '';

  // Carica inventario e conteggi
  async function loadInventario() {
    try {
      loading = true;
      error = '';

      const [inventarioResponse, conteggiResponse] = await Promise.all([
        fetch(`/api/committenti/${committente_id}/inventari/${inventario_id}`),
        fetch(`/api/committenti/${committente_id}/inventari/${inventario_id}/conteggi`)
      ]);

      if (!inventarioResponse.ok) {
        const errorData = await inventarioResponse.json();
        throw new Error(errorData.error || 'Errore nel caricamento inventario');
      }

      if (!conteggiResponse.ok) {
        const errorData = await conteggiResponse.json();
        throw new Error(errorData.error || 'Errore nel caricamento conteggi');
      }

      const inventarioData = await inventarioResponse.json();
      const conteggiData = await conteggiResponse.json();
      
      inventario = inventarioData.inventario;
      conteggi = conteggiData.conteggi || [];

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    } finally {
      loading = false;
    }
  }

  // Aggiorna conteggio
  async function updateConteggio() {
    try {
      conteggioFormErrors = {};
      
      const response = await fetch(
        `/api/committenti/${committente_id}/inventari/${inventario_id}/conteggi/${conteggioSelezionato.prodotto_id}`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(conteggioFormData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          conteggioFormErrors = errorData.details.reduce((acc: any, error: any) => {
            acc[error.path[0]] = error.message;
            return acc;
          }, {});
        } else {
          throw new Error(errorData.error || 'Errore nell\'aggiornamento');
        }
        return;
      }

      // Aggiorna conteggi locali
      const data = await response.json();
      conteggi = data.conteggi || [];
      
      // Chiudi modal
      showConteggioModal = false;
      conteggioSelezionato = null;

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    }
  }

  // Azioni inventario
  async function executeAction(action: string) {
    try {
      const body: any = { action };
      
      // Per completamento, chiedi se applicare rettifiche
      if (action === 'completa') {
        const applicaRettifiche = confirm(
          'Vuoi applicare automaticamente le rettifiche alle giacenze?\n\n' +
          'Se selezioni "OK", le differenze verranno applicate come movimenti di rettifica.\n' +
          'Se selezioni "Annulla", l\'inventario verrà completato senza modificare le giacenze.'
        );
        body.applica_rettifiche = applicaRettifiche;
      }

      const response = await fetch(`/api/committenti/${committente_id}/inventari/${inventario_id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'esecuzione azione');
      }

      // Ricarica inventario
      await loadInventario();

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    }
  }

  // Apri modal conteggio
  function openConteggioModal(conteggio: any) {
    conteggioSelezionato = conteggio;
    conteggioFormData = {
      quantita_contata: conteggio.quantita_contata || conteggio.giacenza_sistema,
      operatore_conteggio: conteggio.operatore_conteggio || '',
      note_conteggio: conteggio.note_conteggio || ''
    };
    conteggioFormErrors = {};
    showConteggioModal = true;
  }

  // Formatters
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('it-IT');
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('it-IT');
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  function getStatoDifferenza(conteggio: any): string {
    if (conteggio.quantita_contata === null || conteggio.quantita_contata === undefined) {
      return 'PENDING';
    }
    if (conteggio.differenza === 0) {
      return 'OK';
    }
    return conteggio.differenza > 0 ? 'SURPLUS' : 'DEFICIT';
  }

  // Inizializzazione
  onMount(() => {
    loadInventario();
  });

  // Conteggi filtrati
  $: conteggiFiltrati = conteggi.filter(conteggio => {
    if (filtroStato && getStatoDifferenza(conteggio) !== filtroStato) {
      return false;
    }
    if (filtroCategoria && conteggio.categoria_descrizione !== filtroCategoria) {
      return false;
    }
    if (ricercaProdotto && 
        !conteggio.prodotto_codice.toLowerCase().includes(ricercaProdotto.toLowerCase()) &&
        !conteggio.prodotto_descrizione.toLowerCase().includes(ricercaProdotto.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Categorie uniche per filtro
  $: categorieUniche = [...new Set(conteggi.map(c => c.categoria_descrizione))];

  // Statistiche
  $: stats = {
    totale: conteggi.length,
    contati: conteggi.filter(c => c.quantita_contata !== null).length,
    ok: conteggi.filter(c => c.differenza === 0).length,
    differenze: conteggi.filter(c => c.differenza !== 0 && c.quantita_contata !== null).length,
    pendenti: conteggi.filter(c => c.quantita_contata === null).length,
    valoreDifferenze: conteggi.reduce((sum, c) => sum + (c.valore_differenza || 0), 0)
  };
</script>

<svelte:head>
  <title>Inventario {inventario?.codice_inventario} - Committente {committente_id}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <nav class="flex mb-2" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
          <li class="inline-flex items-center">
            <a href="/committenti/{committente_id}/inventari" class="text-blue-600 hover:text-blue-800">
              Inventari
            </a>
          </li>
          <li>
            <div class="flex items-center">
              <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
              </svg>
              <span class="ml-1 font-medium text-gray-900">
                {inventario?.codice_inventario || 'Caricamento...'}
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <h1 class="text-3xl font-bold text-gray-900">📋 Dettaglio Inventario</h1>
    </div>
    
    {#if inventario?.stato === 'PIANIFICATO'}
      <button
        on:click={() => executeAction('avvia')}
        class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        ▶️ Avvia Inventario
      </button>
    {:else if inventario?.stato === 'IN_CORSO'}
      <div class="flex gap-3">
        <button
          on:click={() => executeAction('completa')}
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          ✅ Completa Inventario
        </button>
        <button
          on:click={() => executeAction('annulla')}
          class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          ❌ Annulla
        </button>
      </div>
    {/if}
  </div>

  <!-- Messaggio errore -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="text-red-800">{error}</div>
    </div>
  {/if}

  {#if loading}
    <div class="p-12 text-center">
      <div class="text-gray-500">Caricamento inventario...</div>
    </div>
  {:else if !inventario}
    <div class="p-12 text-center">
      <div class="text-red-600">Inventario non trovato</div>
    </div>
  {:else}
    <!-- Info Inventario -->
    <div class="bg-white rounded-lg shadow border p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <div class="text-sm font-medium text-gray-500">Codice</div>
          <div class="text-xl font-bold text-gray-900">{inventario.codice_inventario}</div>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-500">Stato</div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statiInventarioColori[inventario.stato]}">
            {statiInventarioDescrizioni[inventario.stato]}
          </span>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-500">Tipo</div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {tipiInventarioColori[inventario.tipo]}">
            {tipiInventarioDescrizioni[inventario.tipo]}
          </span>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-500">Data Pianificazione</div>
          <div class="text-lg font-medium text-gray-900">{formatDate(inventario.data_pianificazione)}</div>
        </div>
      </div>
      
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-sm font-medium text-gray-700">Descrizione</div>
            <div class="text-gray-900">{inventario.descrizione}</div>
            {#if inventario.operatore_responsabile}
              <div class="text-sm text-gray-500 mt-1">Operatore: {inventario.operatore_responsabile}</div>
            {/if}
          </div>
          <div>
            {#if inventario.categoria_descrizione}
              <div class="text-sm font-medium text-gray-700">Categoria Filtro</div>
              <div class="text-gray-900">{inventario.categoria_descrizione}</div>
            {/if}
            {#if inventario.ubicazione_filtro}
              <div class="text-sm font-medium text-gray-700 mt-2">Ubicazione Filtro</div>
              <div class="text-gray-900">{inventario.ubicazione_filtro}</div>
            {/if}
          </div>
        </div>
        
        {#if inventario.note}
          <div class="mt-4">
            <div class="text-sm font-medium text-gray-700">Note</div>
            <div class="text-gray-900">{inventario.note}</div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Statistiche -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow border">
        <div class="text-sm font-medium text-gray-500">Prodotti Totali</div>
        <div class="text-3xl font-bold text-gray-900">{stats.totale}</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow border">
        <div class="text-sm font-medium text-gray-500">Contati</div>
        <div class="text-3xl font-bold text-blue-600">{stats.contati}</div>
        <div class="text-xs text-gray-500">{stats.totale > 0 ? Math.round((stats.contati / stats.totale) * 100) : 0}%</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow border">
        <div class="text-sm font-medium text-gray-500">Corretti</div>
        <div class="text-3xl font-bold text-green-600">{stats.ok}</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow border">
        <div class="text-sm font-medium text-gray-500">Differenze</div>
        <div class="text-3xl font-bold text-red-600">{stats.differenze}</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow border">
        <div class="text-sm font-medium text-gray-500">Valore Differenze</div>
        <div class="text-xl font-bold {stats.valoreDifferenze >= 0 ? 'text-green-600' : 'text-red-600'}">
          {formatCurrency(stats.valoreDifferenze)}
        </div>
      </div>
    </div>

    <!-- Filtri -->
    <div class="bg-white p-6 rounded-lg shadow border mb-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 Filtri</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Stato Differenza</label>
          <select 
            bind:value={filtroStato}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti</option>
            <option value="PENDING">Da contare</option>
            <option value="OK">Corretto</option>
            <option value="SURPLUS">Eccedenza</option>
            <option value="DEFICIT">Mancanza</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <select 
            bind:value={filtroCategoria}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte</option>
            {#each categorieUniche as categoria}
              <option value={categoria}>{categoria}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Ricerca Prodotto</label>
          <input
            type="text"
            bind:value={ricercaProdotto}
            placeholder="Codice o descrizione..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <!-- Lista Conteggi -->
    {#if conteggiFiltrati.length === 0}
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <div class="text-gray-500 text-lg">📋 Nessun conteggio trovato con i filtri selezionati</div>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow border">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giacenza Sistema</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità Contata</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Differenza</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore Differenza</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operatore</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each conteggiFiltrati as conteggio}
                {@const statoDifferenza = getStatoDifferenza(conteggio)}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="font-medium">{conteggio.prodotto_codice}</div>
                    <div class="text-gray-500 text-xs">{conteggio.prodotto_descrizione}</div>
                    <div class="text-gray-400 text-xs">{conteggio.categoria_descrizione}</div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="font-medium">{conteggio.giacenza_sistema}</div>
                    <div class="text-gray-500 text-xs">{conteggio.unita_misura_codice}</div>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    {#if conteggio.quantita_contata !== null}
                      <div class="font-medium text-blue-600">{conteggio.quantita_contata}</div>
                      {#if conteggio.timestamp_conteggio}
                        <div class="text-xs text-gray-500">{formatDateTime(conteggio.timestamp_conteggio)}</div>
                      {/if}
                    {:else}
                      <div class="text-gray-400 italic">Non contato</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    {#if conteggio.differenza !== null}
                      <div class="font-medium {conteggio.differenza === 0 ? 'text-green-600' : conteggio.differenza > 0 ? 'text-blue-600' : 'text-red-600'}">
                        {conteggio.differenza > 0 ? '+' : ''}{conteggio.differenza}
                      </div>
                    {:else}
                      <div class="text-gray-400">-</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    {#if conteggio.valore_differenza !== null && conteggio.valore_differenza !== 0}
                      <div class="font-medium {conteggio.valore_differenza >= 0 ? 'text-green-600' : 'text-red-600'}">
                        {formatCurrency(conteggio.valore_differenza)}
                      </div>
                    {:else}
                      <div class="text-gray-400">-</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {differenzeConteggioColori[statoDifferenza]}">
                      {differenzeConteggioDescrizioni[statoDifferenza]}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {conteggio.operatore_conteggio || '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {#if inventario.stato === 'IN_CORSO'}
                      <button
                        on:click={() => openConteggioModal(conteggio)}
                        class="text-blue-600 hover:text-blue-900"
                      >
                        {conteggio.quantita_contata !== null ? 'Modifica' : 'Conta'}
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
  {/if}
</div>

<!-- Modal Conteggio -->
{#if showConteggioModal && conteggioSelezionato}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-bold text-gray-900 mb-4">📋 Conteggio Prodotto</h3>
        
        <!-- Info Prodotto -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <div class="font-medium text-gray-900">{conteggioSelezionato.prodotto_codice}</div>
          <div class="text-sm text-gray-600">{conteggioSelezionato.prodotto_descrizione}</div>
          <div class="text-sm text-gray-500">{conteggioSelezionato.categoria_descrizione}</div>
          <div class="mt-2 text-sm">
            <span class="font-medium">Giacenza sistema:</span> 
            <span class="text-blue-600">{conteggioSelezionato.giacenza_sistema} {conteggioSelezionato.unita_misura_codice}</span>
          </div>
        </div>
        
        <form on:submit|preventDefault={updateConteggio} class="space-y-4">
          <!-- Quantità Contata -->
          <div>
            <label for="quantita-contata" class="block text-sm font-medium text-gray-700 mb-2">
              Quantità Contata *
            </label>
            <input
              id="quantita-contata"
              type="number"
              min="0"
              step="1"
              bind:value={conteggioFormData.quantita_contata}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {conteggioFormErrors.quantita_contata ? 'border-red-500' : ''}"
              required
            />
            {#if conteggioFormErrors.quantita_contata}
              <p class="mt-1 text-sm text-red-600">{conteggioFormErrors.quantita_contata}</p>
            {/if}
          </div>

          <!-- Operatore -->
          <div>
            <label for="operatore" class="block text-sm font-medium text-gray-700 mb-2">
              Operatore Conteggio
            </label>
            <input
              id="operatore"
              type="text"
              bind:value={conteggioFormData.operatore_conteggio}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome operatore..."
            />
          </div>

          <!-- Note -->
          <div>
            <label for="note" class="block text-sm font-medium text-gray-700 mb-2">
              Note Conteggio
            </label>
            <textarea
              id="note"
              bind:value={conteggioFormData.note_conteggio}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Note aggiuntive..."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              on:click={() => { showConteggioModal = false; conteggioSelezionato = null; }}
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Salva Conteggio
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}