<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let listinoData = {};
  let totaleBottiglie = 0;
  let discotecaId = 1; // Default alla prima discoteca
  let loading = true;
  let error = null;
  let showAddForm = false;

  // Form per aggiungere nuova bottiglia
  let nuovaBottiglia = {
    nome_bottiglia: '',
    marca: '',
    tipo: '',
    volume_ml: '',
    prezzo_base: '',
    prezzo_tavolo: '',
    prezzo_vip: '',
    note: ''
  };

  const tipiBottiglie = ['Vodka', 'Whisky', 'Champagne', 'Cognac', 'Gin', 'Tequila', 'Rum', 'Liquore', 'Vino', 'Altro'];

  async function caricaListino() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`/api/listino-bottiglie?discoteca_id=${discotecaId}`);
      const result = await response.json();
      
      if (result.success) {
        listinoData = result.data.listino;
        totaleBottiglie = result.data.totale_bottiglie;
      } else {
        error = result.error || 'Errore nel caricamento del listino';
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    } finally {
      loading = false;
    }
  }

  async function aggiungiBottiglia() {
    try {
      const response = await fetch('/api/listino-bottiglie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          discoteca_id: discotecaId,
          ...nuovaBottiglia,
          volume_ml: nuovaBottiglia.volume_ml ? parseInt(nuovaBottiglia.volume_ml) : null,
          prezzo_base: parseFloat(nuovaBottiglia.prezzo_base),
          prezzo_tavolo: nuovaBottiglia.prezzo_tavolo ? parseFloat(nuovaBottiglia.prezzo_tavolo) : null,
          prezzo_vip: nuovaBottiglia.prezzo_vip ? parseFloat(nuovaBottiglia.prezzo_vip) : null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reset form
        nuovaBottiglia = {
          nome_bottiglia: '',
          marca: '',
          tipo: '',
          volume_ml: '',
          prezzo_base: '',
          prezzo_tavolo: '',
          prezzo_vip: '',
          note: ''
        };
        showAddForm = false;
        
        // Ricarica il listino
        await caricaListino();
        
        alert('Bottiglia aggiunta con successo!');
      } else {
        alert('Errore: ' + (result.error || 'Errore sconosciuto'));
      }
    } catch (err) {
      alert('Errore di connessione');
      console.error('Errore:', err);
    }
  }

  function formatPrice(price) {
    return price ? `€${price.toFixed(2)}` : '-';
  }

  onMount(() => {
    caricaListino();
  });
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Listino Bottiglie</h1>
      <p class="text-gray-600 mt-2">Gestione prezzi bottiglie per discoteca</p>
    </div>
    
    <div class="flex gap-4">
      <button
        on:click={() => showAddForm = !showAddForm}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {showAddForm ? 'Annulla' : 'Aggiungi Bottiglia'}
      </button>
      
      <button
        on:click={caricaListino}
        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        disabled={loading}
      >
        {loading ? 'Caricamento...' : 'Aggiorna'}
      </button>
    </div>
  </div>

  <!-- Form per aggiungere nuova bottiglia -->
  {#if showAddForm}
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow">
      <h3 class="text-lg font-semibold mb-4">Aggiungi Nuova Bottiglia</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome Bottiglia *</label>
          <input
            type="text"
            bind:value={nuovaBottiglia.nome_bottiglia}
            class="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Marca</label>
          <input
            type="text"
            bind:value={nuovaBottiglia.marca}
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            bind:value={nuovaBottiglia.tipo}
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Seleziona tipo</option>
            {#each tipiBottiglie as tipo}
              <option value={tipo}>{tipo}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Volume (ml)</label>
          <input
            type="number"
            bind:value={nuovaBottiglia.volume_ml}
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Prezzo Base *</label>
          <input
            type="number"
            step="0.01"
            bind:value={nuovaBottiglia.prezzo_base}
            class="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Prezzo Tavolo</label>
          <input
            type="number"
            step="0.01"
            bind:value={nuovaBottiglia.prezzo_tavolo}
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Prezzo VIP</label>
          <input
            type="number"
            step="0.01"
            bind:value={nuovaBottiglia.prezzo_vip}
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            bind:value={nuovaBottiglia.note}
            rows="3"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          ></textarea>
        </div>
      </div>
      
      <div class="flex justify-end gap-2 mt-4">
        <button
          on:click={() => showAddForm = false}
          class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Annulla
        </button>
        <button
          on:click={aggiungiBottiglia}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={!nuovaBottiglia.nome_bottiglia || !nuovaBottiglia.prezzo_base}
        >
          Aggiungi
        </button>
      </div>
    </div>
  {/if}

  <!-- Statistiche -->
  <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Statistiche Listino</h3>
        <p class="text-gray-600">Discoteca ID: {discotecaId}</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-bold text-blue-600">{totaleBottiglie}</div>
        <div class="text-sm text-gray-500">Bottiglie disponibili</div>
      </div>
    </div>
  </div>

  <!-- Loading -->
  {#if loading}
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Caricamento listino...</p>
    </div>
  {/if}

  <!-- Error -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-600">{error}</p>
    </div>
  {/if}

  <!-- Listino per categoria -->
  {#if !loading && !error}
    {#each Object.entries(listinoData) as [tipo, bottiglie]}
      <div class="bg-white border border-gray-200 rounded-lg mb-6 shadow">
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900">{tipo}</h3>
          <p class="text-sm text-gray-600">{bottiglie.length} bottiglie</p>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr class="border-b border-gray-200">
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bottiglia</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo Base</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo Tavolo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo VIP</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each bottiglie as bottiglia}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="font-medium text-gray-900">{bottiglia.nome_bottiglia}</div>
                  </td>
                  <td class="px-6 py-4 text-gray-700">{bottiglia.marca || '-'}</td>
                  <td class="px-6 py-4 text-gray-700">{bottiglia.volume_ml ? `${bottiglia.volume_ml}ml` : '-'}</td>
                  <td class="px-6 py-4">
                    <span class="font-semibold text-green-600">{formatPrice(bottiglia.prezzo_base)}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="font-semibold text-blue-600">{formatPrice(bottiglia.prezzo_tavolo)}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="font-semibold text-purple-600">{formatPrice(bottiglia.prezzo_vip)}</span>
                  </td>
                  <td class="px-6 py-4 text-gray-500 text-sm">{bottiglia.note || '-'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/each}
  {/if}

  <!-- Empty state -->
  {#if !loading && !error && totaleBottiglie === 0}
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Nessuna bottiglia nel listino</h3>
      <p class="mt-1 text-sm text-gray-500">Inizia aggiungendo la prima bottiglia al listino.</p>
      <div class="mt-6">
        <button
          on:click={() => showAddForm = true}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Aggiungi Prima Bottiglia
        </button>
      </div>
    </div>
  {/if}
</div>