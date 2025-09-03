<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const committente_id = parseInt($page.params.committente_id);

  // Tipi movimento semplici
  const tipiMovimento = {
    'CARICO': { desc: 'Carico (entrata merce)', color: 'bg-green-100 text-green-800' },
    'SCARICO': { desc: 'Scarico (uscita merce)', color: 'bg-red-100 text-red-800' },
    'TRASFERIMENTO_INTERNO': { desc: 'Trasferimento interno', color: 'bg-blue-100 text-blue-800' },
    'RETTIFICA_POS': { desc: 'Rettifica positiva', color: 'bg-green-100 text-green-800' },
    'RETTIFICA_NEG': { desc: 'Rettifica negativa', color: 'bg-red-100 text-red-800' }
  };

  // Stato componente
  let movimenti: any[] = [];
  let loading = true;
  let error = '';
  let statistiche = { totale_movimenti: 0, carichi_totali: 0, scarichi_totali: 0, ultimo_movimento: null };

  // Carica movimenti
  async function loadMovimenti() {
    try {
      loading = true;
      error = '';

      console.log('Loading movimenti for committente:', committente_id);

      const response = await fetch(`/api/committenti/${committente_id}/movimenti`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      movimenti = data.movimenti || [];
      statistiche = data.statistiche || statistiche;

      console.log('Loaded', movimenti.length, 'movimenti');

    } catch (err) {
      console.error('Error loading movimenti:', err);
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    } finally {
      loading = false;
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

  // Inizializzazione
  onMount(() => {
    console.log('Component mounted, committente_id:', committente_id);
    loadMovimenti();
  });
</script>

<svelte:head>
  <title>Movimenti Simple - Committente {committente_id}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Movimenti di Magazzino</h1>
    <p class="text-gray-600 mt-2">Committente #{committente_id}</p>
  </div>

  <!-- Statistiche -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        <div class="text-red-600 mb-4">Errore: {error}</div>
        <button
          on:click={loadMovimenti}
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Riprova
        </button>
      </div>
    {:else if movimenti.length === 0}
      <div class="p-12 text-center">
        <div class="text-gray-500">Nessun movimento trovato</div>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operatore</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each movimenti as movimento}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{movimento.id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(movimento.data_movimento)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if tipiMovimento[movimento.tipo_movimento]}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {tipiMovimento[movimento.tipo_movimento].color}">
                      {tipiMovimento[movimento.tipo_movimento].desc}
                    </span>
                  {:else}
                    <span class="text-gray-500">{movimento.tipo_movimento}</span>
                  {/if}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  <div class="font-medium">{movimento.prodotto_codice}</div>
                  <div class="text-gray-500">{movimento.prodotto_descrizione}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="font-medium">{movimento.quantita}</span>
                  <span class="text-gray-500 ml-1">{movimento.unita_misura_codice}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  €{movimento.prezzo.toFixed(2)}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {movimento.operatore || '-'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>