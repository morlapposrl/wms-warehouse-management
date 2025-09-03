<script>
  import { page } from '$app/stores';
  import { onMount, afterUpdate } from 'svelte';

  const committente_id = parseInt($page.params.committente_id);
  
  let result = 'Loading...';

  onMount(() => {
    console.log('onMount called, committente_id:', committente_id);
    
    fetch(`/api/committenti/${committente_id}/movimenti`)
      .then(response => {
        console.log('Fetch response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Data received:', data);
        result = `Success: ${data.movimenti.length} movimenti found, last: ${data.statistiche.ultimo_movimento}`;
      })
      .catch(error => {
        console.error('Fetch error:', error);
        result = `Error: ${error.message}`;
      });
  });

  afterUpdate(() => {
    console.log('afterUpdate called, result:', result);
  });

  // Debug logging
  console.log('Script section executed');
  
  if (typeof window !== 'undefined') {
    console.log('Window is defined, DOM ready');
  }
</script>

<svelte:head>
  <title>Test JS - Committente {committente_id}</title>
</svelte:head>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Test JavaScript</h1>
  <div class="bg-blue-100 p-4 rounded">
    <p>Committente ID: {committente_id}</p>
    <p>Result: {result}</p>
  </div>
</div>