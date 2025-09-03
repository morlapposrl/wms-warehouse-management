<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const committente_id = parseInt($page.params.committente_id);

  let data = null;
  let loading = true;
  let error = '';

  async function loadData() {
    try {
      const response = await fetch(`/api/committenti/${committente_id}/movimenti`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      data = await response.json();
      console.log('Data loaded:', data);
    } catch (err) {
      error = err.message;
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    console.log('Component mounted, committente_id:', committente_id);
    loadData();
  });
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Debug Movimenti - Committente {committente_id}</h1>
  
  {#if loading}
    <div>Loading...</div>
  {:else if error}
    <div class="text-red-600">Error: {error}</div>
  {:else if data}
    <div class="space-y-4">
      <div class="bg-blue-100 p-4 rounded">
        <h2 class="font-bold">Statistiche:</h2>
        <pre>{JSON.stringify(data.statistiche, null, 2)}</pre>
      </div>
      
      <div class="bg-green-100 p-4 rounded">
        <h2 class="font-bold">Movimenti trovati: {data.movimenti.length}</h2>
        {#each data.movimenti as movimento, i}
          <div class="border p-2 mt-2">
            <div>#{movimento.id} - {movimento.tipo_movimento}</div>
            <div>Prodotto: {movimento.prodotto_codice} - {movimento.prodotto_descrizione}</div>
            <div>Quantità: {movimento.quantita} {movimento.unita_misura_codice}</div>
            <div>Data: {movimento.data_movimento}</div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div>No data</div>
  {/if}
</div>