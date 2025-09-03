<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  export let data; // Dati dal server
  
  let loading = false; // Già caricati dal server
  let dateFilter = {
    from: '',
    to: ''
  };
  let selectedCommittente = '';
  
  // Usa i dati dal server
  $: movimenti = data.movimenti || [];
  $: committenti = data.committenti || [];
  $: apiStats = data.statistiche || {};
  $: filtri = data.filtri || {};
  
  // Inizializza selectedCommittente dal filtro attuale
  $: if (filtri.committente_id) {
    selectedCommittente = filtri.committente_id.toString();
  }
  
  onMount(async () => {
    // Inizializza filtri date se non presenti
    if (!filtri.data_da && !filtri.data_a) {
      const today = new Date();
      const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      dateFilter.from = lastYear.toISOString().split('T')[0];
      dateFilter.to = today.toISOString().split('T')[0];
    } else {
      dateFilter.from = filtri.data_da || '';
      dateFilter.to = filtri.data_a || '';
    }
  });
  
  function updateFilters() {
    const params = new URLSearchParams();
    
    // Mantieni filtri esistenti e aggiungi/modifica solo quelli necessari
    if (filtri.committente_id) params.append('committente', filtri.committente_id.toString());
    if (filtri.prodotto_id) params.append('prodotto', filtri.prodotto_id.toString());
    if (filtri.search) params.append('search', filtri.search);
    if (filtri.tipo_movimento) params.append('tipo', filtri.tipo_movimento);
    if (filtri.operatore_id) params.append('operatore', filtri.operatore_id.toString());
    if (dateFilter.from) params.append('data_da', dateFilter.from);
    if (dateFilter.to) params.append('data_a', dateFilter.to);
    
    // Naviga con i nuovi parametri
    goto(`?${params.toString()}`);
  }
  
  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getMovementTypeLabel(tipo) {
    const labels = {
      'CARICO': { label: 'Carico', class: 'bg-green-100 text-green-800', icon: '📥' },
      'SCARICO': { label: 'Scarico', class: 'bg-red-100 text-red-800', icon: '📤' },
      'RETTIFICA_POSITIVA': { label: 'Rett. +', class: 'bg-blue-100 text-blue-800', icon: '➕' },
      'RETTIFICA_NEGATIVA': { label: 'Rett. -', class: 'bg-orange-100 text-orange-800', icon: '➖' },
      'TRASFERIMENTO': { label: 'Trasferimento', class: 'bg-purple-100 text-purple-800', icon: '🔄' },
      'RECEIVE': { label: 'Ricevimento', class: 'bg-green-100 text-green-800', icon: '📦' },
      'PUT_AWAY': { label: 'Stoccaggio', class: 'bg-blue-100 text-blue-800', icon: '🏠' },
      'PICK': { label: 'Prelievo', class: 'bg-orange-100 text-orange-800', icon: '👋' },
      'CROSS_DOCK': { label: 'Cross-dock', class: 'bg-yellow-100 text-yellow-800', icon: '⚡' }
    };
    return labels[tipo] || { label: tipo, class: 'bg-neutral-100 text-neutral-800', icon: '📋' };
  }
  
  function calculateStats() {
    // Se abbiamo statistiche dall'API, usale
    if (apiStats && typeof apiStats === 'object' && apiStats.totale_movimenti !== undefined) {
      return {
        totalMovimenti: apiStats.totale_movimenti || 0,
        carichi: apiStats.carichi || 0,
        scarichi: apiStats.scarichi || 0,
        valoreTotale: apiStats.valore_totale_movimenti || 0
      };
    }
    
    // Altrimenti calcola localmente (per API committente)
    const carichi = movimenti.filter(m => ['CARICO', 'RECEIVE', 'RETTIFICA_POSITIVA', 'RETTIFICA_POS'].includes(m.tipo_movimento));
    const scarichi = movimenti.filter(m => ['SCARICO', 'PICK', 'RETTIFICA_NEGATIVA', 'RETTIFICA_NEG'].includes(m.tipo_movimento));
    
    return {
      totalMovimenti: movimenti.length || 0,
      carichi: carichi.length || 0,
      scarichi: scarichi.length || 0,
      valoreTotale: movimenti.reduce((sum, m) => sum + ((m.quantita * (m.prezzo || m.costo_unitario || 0))), 0) || 0
    };
  }
  
  $: stats = calculateStats();
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header con filtri -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">
          📋 Movimenti Globali - Vista Multicommittente
        </h1>
        <p class="text-neutral-600">
          Cronologia completa movimentazioni di tutti i committenti con filtri avanzati
        </p>
      </div>
    </div>
    
    <!-- Pannello Filtri -->
    <div class="card mb-6">
      <div class="card-header">
        <h3 class="text-lg font-semibold text-neutral-900">🔍 Filtri di Ricerca</h3>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Filtro Committente -->
          <div>
            <label for="committente-filter" class="block text-sm font-medium text-neutral-700 mb-2">
              Committente
            </label>
            <select 
              id="committente-filter"
              bind:value={selectedCommittente}
              class="form-input w-full"
            >
              <option value="">🌐 Tutti i committenti</option>
              {#each committenti as committente}
                <option value={committente.id}>
                  🏢 {committente.ragione_sociale}
                </option>
              {/each}
            </select>
          </div>
          
          <!-- Filtro Data Da -->
          <div>
            <label for="date-from" class="block text-sm font-medium text-neutral-700 mb-2">
              Data dal
            </label>
            <input 
              type="date" 
              id="date-from"
              bind:value={dateFilter.from}
              class="form-input w-full"
            />
          </div>
          
          <!-- Filtro Data A -->
          <div>
            <label for="date-to" class="block text-sm font-medium text-neutral-700 mb-2">
              Data al
            </label>
            <input 
              type="date" 
              id="date-to"
              bind:value={dateFilter.to}
              class="form-input w-full"
            />
          </div>
        </div>
        
        <div class="flex justify-between items-center mt-4 pt-4 border-t">
          <button 
            class="btn btn-secondary"
            on:click={() => {
              selectedCommittente = '';
              dateFilter.from = '';
              dateFilter.to = '';
            }}
          >
            🗑️ Cancella Filtri
          </button>
          
          <div class="text-sm text-neutral-600">
            Trovati {movimenti.length} movimenti
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600">Caricamento movimenti...</span>
    </div>
  {:else}
    <!-- Statistiche -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-primary-100">
            <span class="text-primary-600 text-xl">📊</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Movimenti Totali</p>
            <p class="text-2xl font-bold text-neutral-900">{stats.totalMovimenti}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100">
            <span class="text-green-600 text-xl">📥</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Carichi</p>
            <p class="text-2xl font-bold text-neutral-900">{stats.carichi}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-red-100">
            <span class="text-red-600 text-xl">📤</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Scarichi</p>
            <p class="text-2xl font-bold text-neutral-900">{stats.scarichi}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100">
            <span class="text-blue-600 text-xl">💰</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Valore Movimenti</p>
            <p class="text-2xl font-bold text-neutral-900">€ {(stats.valoreTotale || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista Movimenti -->
    {#if movimenti.length > 0}
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-neutral-900">
            Cronologia Movimenti {selectedCommittente ? `- ${committenti.find(c => c.id == selectedCommittente)?.ragione_sociale}` : '(Tutti)'}
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Data/Ora</th>
                <th>Committente</th>
                <th>Tipo</th>
                <th>Ordine</th>
                <th>Prodotto</th>
                <th>Qtà</th>
                <th>Costo Unit.</th>
                <th>Valore Tot.</th>
                <th>Ubicazioni</th>
                <th>Operatore</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {#each movimenti as movimento}
                {@const movementType = getMovementTypeLabel(movimento.tipo_movimento)}
                <tr>
                  <td class="text-sm">
                    {formatDate(movimento.timestamp)}
                  </td>
                  <td>
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                      <span class="text-sm font-medium">
                        {committenti.find(c => c.id == movimento.committente_id)?.ragione_sociale || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="badge text-xs {movementType.class}">
                      {movementType.icon} {movementType.label}
                    </span>
                  </td>
                  <td>
                    {#if movimento.ordine_numero}
                      <div class="text-xs">
                        <div class="font-mono text-sm text-blue-600">{movimento.ordine_numero}</div>
                        <div class="text-xs text-neutral-500 uppercase">
                          {movimento.ordine_tipo === 'INBOUND' ? '📥 IN' : movimento.ordine_tipo === 'OUTBOUND' ? '📤 OUT' : '-'}
                        </div>
                      </div>
                    {:else}
                      <span class="text-neutral-400 text-xs">-</span>
                    {/if}
                  </td>
                  <td>
                    <div>
                      <div class="font-mono text-sm">{movimento.sku_code}</div>
                      <div class="text-xs text-neutral-600">{movimento.prodotto_descrizione || '-'}</div>
                    </div>
                  </td>
                  <td class="text-center font-bold">
                    <span class="{['SCARICO', 'PICK', 'RETTIFICA_NEGATIVA'].includes(movimento.tipo_movimento) ? 'text-red-600' : 'text-green-600'}">
                      {['SCARICO', 'PICK', 'RETTIFICA_NEGATIVA'].includes(movimento.tipo_movimento) ? '-' : '+'}{movimento.quantita}
                    </span>
                  </td>
                  <td class="text-right">
                    {movimento.costo_unitario ? `€ ${movimento.costo_unitario.toFixed(2)}` : '-'}
                  </td>
                  <td class="text-right font-semibold">
                    {(movimento.quantita * movimento.costo_unitario) ? 
                      `€ ${(movimento.quantita * movimento.costo_unitario).toFixed(2)}` : '-'}
                  </td>
                  <td class="text-sm">
                    {#if movimento.ubicazione_da && movimento.ubicazione_a}
                      <div class="text-xs">
                        <div>Da: {movimento.ubicazione_da}</div>
                        <div>A: {movimento.ubicazione_a}</div>
                      </div>
                    {:else if movimento.ubicazione_da}
                      {movimento.ubicazione_da}
                    {:else if movimento.ubicazione_a}
                      {movimento.ubicazione_a}
                    {:else}
                      -
                    {/if}
                  </td>
                  <td class="text-sm">
                    {movimento.operatore_id || 'Sistema'}
                  </td>
                  <td class="text-sm max-w-32 truncate" title={movimento.note || ''}>
                    {movimento.note || '-'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-xl font-semibold text-neutral-700 mb-2">
          Nessun movimento trovato
        </h3>
        <p class="text-neutral-600">
          {selectedCommittente ? 'Il committente selezionato non ha movimenti nel periodo' : 'Non ci sono movimenti nel periodo selezionato'}
        </p>
      </div>
    {/if}
  {/if}
</div>