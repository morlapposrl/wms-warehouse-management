<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const committente_id = parseInt($page.params.committente_id);

  // Stati della scorta con colori
  const statiScorta = {
    'OK': { desc: 'Normale', color: 'bg-green-100 text-green-800' },
    'BASSA': { desc: 'Scorta Bassa', color: 'bg-yellow-100 text-yellow-800' },
    'CRITICA': { desc: 'Scorta Critica', color: 'bg-red-100 text-red-800' },
    'ECCESSIVA': { desc: 'Scorta Eccessiva', color: 'bg-blue-100 text-blue-800' }
  };

  // Stato componente
  let giacenze: any[] = [];
  let loading = true;
  let error = '';

  // Statistiche
  let statistiche = {
    totale_prodotti: 0,
    prodotti_attivi: 0,
    prodotti_scorta_bassa: 0,
    prodotti_scorta_critica: 0,
    valore_totale_magazzino: 0,
    ultima_movimentazione: null as string | null
  };

  // Dati aggiuntivi
  let valorePerCategoria: any[] = [];
  let categorie: any[] = [];

  // Filtri
  let filtri = {
    categoria_id: '',
    stato_scorta: '',
    search: ''
  };

  // Modal per aggiornamento scorte
  let showScorteModal = false;
  let editingGiacenza: any = null;
  let scorteForm = {
    scorta_minima: '',
    scorta_massima: ''
  };
  let formErrors: Record<string, string> = {};

  // Carica giacenze
  async function loadGiacenze() {
    try {
      loading = true;
      error = '';

      const params = new URLSearchParams();
      if (filtri.categoria_id) params.append('categoria_id', filtri.categoria_id);
      if (filtri.stato_scorta) params.append('stato_scorta', filtri.stato_scorta);
      if (filtri.search) params.append('search', filtri.search);

      const response = await fetch(`/api/committenti/${committente_id}/giacenze?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento');
      }

      const data = await response.json();
      giacenze = data.giacenze || [];
      statistiche = data.statistiche || statistiche;
      valorePerCategoria = data.valorePerCategoria || [];
      categorie = data.categorie || [];

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    } finally {
      loading = false;
    }
  }

  // Formatta valuta
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  // Formatta data
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Applica filtri
  function applyFilters() {
    loadGiacenze();
  }

  // Reset filtri
  function resetFilters() {
    filtri = {
      categoria_id: '',
      stato_scorta: '',
      search: ''
    };
    loadGiacenze();
  }

  // Apri modal per aggiornamento scorte
  function openScorteModal(giacenza: any) {
    editingGiacenza = giacenza;
    scorteForm = {
      scorta_minima: giacenza.scorta_minima.toString(),
      scorta_massima: giacenza.scorta_massima.toString()
    };
    formErrors = {};
    showScorteModal = true;
  }

  // Aggiorna scorte min/max
  async function updateScorte() {
    if (!editingGiacenza) return;

    try {
      formErrors = {};

      const payload = {
        scorta_minima: parseInt(scorteForm.scorta_minima),
        scorta_massima: parseInt(scorteForm.scorta_massima)
      };

      const response = await fetch(
        `/api/committenti/${committente_id}/giacenze/${editingGiacenza.prodotto_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        formErrors.general = result.error || 'Errore nell\'aggiornamento';
        return;
      }

      // Successo - ricarica giacenze
      showScorteModal = false;
      editingGiacenza = null;
      await loadGiacenze();

    } catch (err) {
      formErrors.general = err instanceof Error ? err.message : 'Errore sconosciuto';
    }
  }

  // Inizializzazione
  onMount(() => {
    loadGiacenze();
  });
</script>

<svelte:head>
  <title>Giacenze - Committente {committente_id}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Giacenze di Magazzino</h1>
      <p class="text-gray-600 mt-2">Monitoraggio scorte per il committente #{committente_id}</p>
    </div>
    <div class="flex gap-4">
      <a 
        href="/committenti/{committente_id}/giacenze/scorta-bassa"
        class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        ⚠️ Scorte Basse
      </a>
      <button
        on:click={loadGiacenze}
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        🔄 Aggiorna
      </button>
    </div>
  </div>

  <!-- Statistiche -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Totale Prodotti</div>
      <div class="text-2xl font-bold text-blue-600">{statistiche.totale_prodotti}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Attivi</div>
      <div class="text-2xl font-bold text-green-600">{statistiche.prodotti_attivi}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Scorta Bassa</div>
      <div class="text-2xl font-bold text-yellow-600">{statistiche.prodotti_scorta_bassa}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border">
      <div class="text-sm font-medium text-gray-500">Scorta Critica</div>
      <div class="text-2xl font-bold text-red-600">{statistiche.prodotti_scorta_critica}</div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow border lg:col-span-2">
      <div class="text-sm font-medium text-gray-500">Valore Totale</div>
      <div class="text-2xl font-bold text-purple-600">{formatCurrency(statistiche.valore_totale_magazzino)}</div>
    </div>
  </div>

  <!-- Filtri -->
  <div class="bg-white p-6 rounded-lg shadow border mb-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Filtri di Ricerca</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Ricerca</label>
        <input
          id="search"
          type="text"
          bind:value={filtri.search}
          placeholder="Codice o descrizione prodotto..."
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
      </div>
      
      <div>
        <label for="categoria" class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <select
          id="categoria"
          bind:value={filtri.categoria_id}
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tutte le categorie</option>
          {#each categorie as categoria}
            <option value={categoria.id.toString()}>{categoria.descrizione} ({categoria.numero_prodotti})</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="stato-scorta" class="block text-sm font-medium text-gray-700 mb-1">Stato Scorta</label>
        <select
          id="stato-scorta"
          bind:value={filtri.stato_scorta}
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tutti gli stati</option>
          {#each Object.entries(statiScorta) as [key, value]}
            <option value={key}>{value.desc}</option>
          {/each}
        </select>
      </div>
      
      <div class="flex items-end">
        <div class="flex gap-2 w-full">
          <button
            on:click={applyFilters}
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
          >
            Filtra
          </button>
          <button
            on:click={resetFilters}
            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-md font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Lista Giacenze -->
  <div class="bg-white rounded-lg shadow border">
    <div class="p-6 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-900">Stato Giacenze</h2>
    </div>

    {#if loading}
      <div class="p-12 text-center">
        <div class="text-gray-500">Caricamento giacenze...</div>
      </div>
    {:else if error}
      <div class="p-6 text-center">
        <div class="text-red-600 mb-4">{error}</div>
        <button
          on:click={loadGiacenze}
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Riprova
        </button>
      </div>
    {:else if giacenze.length === 0}
      <div class="p-12 text-center">
        <div class="text-gray-500 mb-4">Nessuna giacenza trovata</div>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giacenza</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scorte Min/Max</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicazione</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each giacenze as giacenza}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">
                  <div class="font-medium">{giacenza.prodotto_codice}</div>
                  <div class="text-gray-500">{giacenza.prodotto_descrizione}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {giacenza.categoria_descrizione}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="text-lg font-bold">{giacenza.quantita}</div>
                  <div class="text-gray-500">{giacenza.unita_misura_codice}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  <div>Min: <span class="font-medium">{giacenza.scorta_minima}</span></div>
                  <div>Max: <span class="font-medium">{giacenza.scorta_massima}</span></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if statiScorta[giacenza.stato_scorta]}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statiScorta[giacenza.stato_scorta].color}">
                      {statiScorta[giacenza.stato_scorta].desc}
                    </span>
                  {:else}
                    <span class="text-gray-500">{giacenza.stato_scorta}</span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="font-medium">{formatCurrency(giacenza.valore_totale)}</div>
                  <div class="text-gray-500">({formatCurrency(giacenza.prezzo_acquisto)}/unità)</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {giacenza.ubicazione || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    on:click={() => openScorteModal(giacenza)}
                    class="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Modifica Scorte
                  </button>
                  <a
                    href="/committenti/{committente_id}/movimenti?prodotto_id={giacenza.prodotto_id}"
                    class="text-green-600 hover:text-green-900"
                  >
                    Movimenti
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Valore per Categoria (se disponibile) -->
  {#if valorePerCategoria.length > 0}
    <div class="mt-8 bg-white rounded-lg shadow border">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Valore per Categoria</h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each valorePerCategoria as categoria}
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="font-medium text-gray-900">{categoria.categoria_descrizione}</div>
              <div class="text-sm text-gray-500">{categoria.numero_prodotti} prodotti</div>
              <div class="text-lg font-bold text-blue-600 mt-2">{formatCurrency(categoria.valore_totale)}</div>
              <div class="text-sm text-gray-500">Quantità totale: {categoria.quantita_totale}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Modal Aggiornamento Scorte -->
{#if showScorteModal && editingGiacenza}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          Aggiorna Scorte: {editingGiacenza.prodotto_codice}
        </h3>
      </div>

      <div class="p-6 space-y-4">
        {#if formErrors.general}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {formErrors.general}
          </div>
        {/if}

        <div>
          <label for="scorta-minima" class="block text-sm font-medium text-gray-700 mb-2">Scorta Minima *</label>
          <input
            id="scorta-minima"
            type="number"
            min="0"
            step="1"
            bind:value={scorteForm.scorta_minima}
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
        </div>

        <div>
          <label for="scorta-massima" class="block text-sm font-medium text-gray-700 mb-2">Scorta Massima *</label>
          <input
            id="scorta-massima"
            type="number"
            min="0"
            step="1"
            bind:value={scorteForm.scorta_massima}
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-sm text-blue-800">
            <div class="font-medium">Giacenza attuale: {editingGiacenza.quantita} {editingGiacenza.unita_misura_codice}</div>
            <div class="mt-1">Stato corrente: {statiScorta[editingGiacenza.stato_scorta]?.desc || editingGiacenza.stato_scorta}</div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-gray-200 flex justify-end gap-4">
        <button
          on:click={() => { showScorteModal = false; editingGiacenza = null; }}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
        >
          Annulla
        </button>
        <button
          on:click={updateScorte}
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          Aggiorna
        </button>
      </div>
    </div>
  </div>
{/if}