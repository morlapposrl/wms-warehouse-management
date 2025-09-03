<script>
  import { onMount } from 'svelte';
  
  let prodotti = [];
  let committenti = [];
  let loading = true;
  let selectedCommittente = '';
  
  onMount(async () => {
    try {
      // Carica committenti per filtro
      const commitResponse = await fetch('/api/committenti');
      if (commitResponse.ok) {
        committenti = await commitResponse.json();
      }
      
      // Carica prodotti globali
      await loadProdotti();
    } catch (err) {
      console.error('Errore caricamento:', err);
    }
  });
  
  async function loadProdotti() {
    loading = true;
    try {
      const url = selectedCommittente 
        ? `/api/committenti/${selectedCommittente}/prodotti`
        : '/api/prodotti/global';
        
      const response = await fetch(url);
      if (response.ok) {
        prodotti = await response.json();
      }
    } catch (err) {
      console.error('Errore prodotti:', err);
    } finally {
      loading = false;
    }
  }
  
  $: if (selectedCommittente !== '') {
    loadProdotti();
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header con filtro committente -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900 mb-2">
        🎯 Prodotti Globali - Vista Multicommittente
      </h1>
      <p class="text-neutral-600">
        Gestione prodotti aggregata di tutti i committenti con possibilità di filtro
      </p>
    </div>
    
    <!-- Filtro Committente -->
    <div class="flex items-center gap-4">
      <label for="committente-filter" class="text-sm font-medium text-neutral-700">
        Filtra per committente:
      </label>
      <select 
        id="committente-filter"
        bind:value={selectedCommittente}
        class="form-input max-w-xs"
      >
        <option value="">🌐 Tutti i committenti</option>
        {#each committenti as committente}
          <option value={committente.id}>
            🏢 {committente.ragione_sociale}
          </option>
        {/each}
      </select>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600">Caricamento prodotti...</span>
    </div>
  {:else}
    <!-- Statistiche -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-primary-100">
            <span class="text-primary-600 text-xl">📦</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Prodotti Totali</p>
            <p class="text-2xl font-bold text-neutral-900">{prodotti.length}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">✅</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Attivi</p>
            <p class="text-2xl font-bold text-neutral-900">
              {prodotti.filter(p => p.attivo).length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">🏢</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Committenti</p>
            <p class="text-2xl font-bold text-neutral-900">
              {selectedCommittente ? 1 : committenti.length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-yellow-100">
            <span class="text-yellow-600 text-xl">⚠️</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Scorta Bassa</p>
            <p class="text-2xl font-bold text-neutral-900">
              {prodotti.filter(p => p.giacenza_attuale <= p.scorta_minima).length}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista Prodotti -->
    {#if prodotti.length > 0}
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-neutral-900">
            Lista Prodotti {selectedCommittente ? `- ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : '(Tutti)'}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Committente</th>
                <th>Codice</th>
                <th>Descrizione</th>
                <th>Categoria</th>
                <th>Giacenza</th>
                <th>Scorta Min</th>
                <th>Valore €</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each prodotti as prodotto}
                <tr>
                  <td>
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                      <span class="text-sm font-medium">
                        {committenti.find(c => c.id == prodotto.committente_id)?.ragione_sociale || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td class="font-mono">{prodotto.codice}</td>
                  <td>{prodotto.descrizione}</td>
                  <td>{prodotto.categoria_descrizione}</td>
                  <td class="text-center font-bold {prodotto.giacenza_attuale <= prodotto.scorta_minima ? 'text-red-600' : 'text-green-600'}">
                    {prodotto.giacenza_attuale || 0}
                  </td>
                  <td class="text-center">{prodotto.scorta_minima || 0}</td>
                  <td class="text-right font-semibold">€ {(prodotto.valore_giacenza || 0).toFixed(2)}</td>
                  <td>
                    <span class="badge {prodotto.attivo ? 'badge-success' : 'badge-danger'}">
                      {prodotto.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <a 
                        href="/auth/committenti/{prodotto.committente_id}/prodotti"
                        class="btn btn-secondary btn-sm"
                        title="Gestisci nel contesto committente"
                      >
                        🔧
                      </a>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📦</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          Nessun prodotto trovato
        </h3>
        <p class="text-neutral-600">
          {selectedCommittente ? 'Il committente selezionato non ha prodotti' : 'Non ci sono prodotti nel sistema'}
        </p>
      </div>
    {/if}
  {/if}
</div>