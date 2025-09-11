<script>
  import { page } from '$app/stores';
  export let data;

  $: udc = data.udc || {};
  $: contenuto = data.contenuto || [];
  $: movimenti = data.movimenti || [];
  $: stats = data.stats || {};
  $: saturazione = data.saturazione || {};
  
  // Genera il link di ritorno con il parametro back se presente
  $: backLink = (() => {
    const backParam = $page.url.searchParams.get('back');
    return backParam ? `/auth/udc?back=${encodeURIComponent(backParam)}` : '/auth/udc';
  })();

  function getStatoClass(stato) {
    const classes = {
      'VUOTO': 'bg-gray-100 text-gray-800',
      'PARZIALE': 'bg-yellow-100 text-yellow-800',
      'PIENO': 'bg-green-100 text-green-800',
      'IN_MOVIMENTO': 'bg-blue-100 text-blue-800',
      'BLOCCATO': 'bg-red-100 text-red-800',
      'DANNEGGIATO': 'bg-red-100 text-red-800'
    };
    return classes[stato] || 'bg-gray-100 text-gray-800';
  }

  function getTipoMovimento(tipo) {
    const labels = {
      'CREAZIONE': { label: 'Creazione', icon: '🆕', class: 'bg-green-100 text-green-800' },
      'CARICO': { label: 'Carico', icon: '📥', class: 'bg-blue-100 text-blue-800' },
      'SCARICO': { label: 'Scarico', icon: '📤', class: 'bg-orange-100 text-orange-800' },
      'TRASFERIMENTO': { label: 'Trasferimento', icon: '🔄', class: 'bg-purple-100 text-purple-800' },
      'INVENTARIO': { label: 'Inventario', icon: '📊', class: 'bg-gray-100 text-gray-800' },
      'BLOCCO': { label: 'Blocco', icon: '🚫', class: 'bg-red-100 text-red-800' },
      'SBLOCCO': { label: 'Sblocco', icon: '✅', class: 'bg-green-100 text-green-800' }
    };
    return labels[tipo] || { label: tipo, icon: '📋', class: 'bg-gray-100 text-gray-800' };
  }

  function getSaturazioneClass(percentuale) {
    if (percentuale >= 90) return 'text-red-600';
    if (percentuale >= 70) return 'text-yellow-600';
    return 'text-green-600';
  }
</script>

<div class="w-full">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">
          📦 Dettaglio UDC - {udc.barcode}
        </h1>
        <p class="text-neutral-600 dark:text-gray-400">
          Visualizzazione completa dell'Unità di Carico con tracking e movimentazioni
        </p>
      </div>
      
      <div class="flex space-x-2">
        <a href={backLink} class="btn btn-secondary">
          ← Torna alla Lista UDC
        </a>
      </div>
    </div>
  </div>

  <!-- Informazioni Generali UDC -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    
    <!-- Card Info Principale -->
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">ℹ️ Informazioni Generali</h3>
      </div>
      <div class="card-body space-y-4">
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Barcode UDC</label>
          <p class="text-lg font-mono font-bold text-blue-600">{udc.barcode}</p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Tipo UDC</label>
          <p class="font-semibold">{udc.tipo_udc}</p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Stato Attuale</label>
          <span class="badge {getStatoClass(udc.stato)}">{udc.stato}</span>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Committente Proprietario</label>
          <p class="font-semibold">{udc.committente_nome || 'Non assegnato'}</p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Ubicazione Attuale</label>
          <p class="font-mono text-blue-600">
            {udc.codice_ubicazione} - {udc.zona}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Data Creazione</label>
          <p class="text-sm">{udc.data_creazione}</p>
        </div>
      </div>
    </div>

    <!-- Card Specifiche Fisiche -->
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">📏 Specifiche Fisiche</h3>
      </div>
      <div class="card-body space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-gray-400">Lunghezza</label>
            <p class="text-sm font-semibold">{saturazione.lunghezza_effettiva} cm</p>
          </div>
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-gray-400">Larghezza</label>
            <p class="text-sm font-semibold">{saturazione.larghezza_effettiva} cm</p>
          </div>
          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-gray-400">Altezza Max</label>
            <p class="text-sm font-semibold">{saturazione.altezza_effettiva} cm</p>
          </div>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Peso Massimo</label>
          <p class="text-lg font-bold">{saturazione.peso_max_effettivo} kg</p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Volume Massimo</label>
          <p class="text-sm font-semibold">
            {Math.round(saturazione.volume_max / 1000000)} litri
          </p>
        </div>
        
        {#if udc.qr_code}
          <div>
            <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">QR Code</label>
            <p class="text-sm font-mono">{udc.qr_code}</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Card Saturazione -->
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">📊 Stato Saturazione</h3>
      </div>
      <div class="card-body space-y-4">
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Prodotti Diversi</label>
          <p class="text-2xl font-bold text-blue-600">{stats.prodotti_diversi}</p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Quantità Totale</label>
          <p class="text-xl font-semibold">{stats.quantita_totale} pz</p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Saturazione Peso</label>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold {getSaturazioneClass(saturazione.peso)}">
              {saturazione.peso.toFixed(1)}%
            </span>
            <span class="text-xs text-neutral-500">
              {stats.peso_totale.toFixed(1)} / {saturazione.peso_max_effettivo} kg
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style="width: {Math.min(saturazione.peso, 100)}%"
            ></div>
          </div>
        </div>
        
        <div>
          <label class="text-sm font-medium text-neutral-600 dark:text-gray-400">Saturazione Volume</label>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold {getSaturazioneClass(saturazione.volume)}">
              {saturazione.volume.toFixed(1)}%
            </span>
            <span class="text-xs text-neutral-500">
              {Math.round(saturazione.volume_occupato / 1000)} / {Math.round(saturazione.volume_max / 1000)} L
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              class="bg-green-600 h-2 rounded-full transition-all duration-300"
              style="width: {Math.min(saturazione.volume, 100)}%"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Contenuto UDC -->
  <div class="card mb-8">
    <div class="card-header border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
        📦 Contenuto UDC ({contenuto.length} prodotti)
      </h3>
    </div>
    
    {#if contenuto.length > 0}
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Prodotto</th>
              <th>Descrizione</th>
              <th class="text-center">Quantità</th>
              <th>Unità Misura</th>
              <th>Lotto</th>
              <th>Posizione in UDC</th>
              <th>Peso</th>
              <th>Volume</th>
              <th>Data Inserimento</th>
              <th>Operatore</th>
            </tr>
          </thead>
          <tbody>
            {#each contenuto as item}
              <tr>
                <td>
                  <span class="font-mono text-sm font-semibold text-blue-600">
                    {item.prodotto_codice}
                  </span>
                </td>
                <td class="w-full">
                  {item.prodotto_descrizione || '-'}
                </td>
                <td class="text-center font-bold text-lg">
                  {item.quantita}
                </td>
                <td>{item.unita_misura || '-'}</td>
                <td>
                  {#if item.lotto}
                    <span class="badge bg-blue-100 text-blue-800 text-xs">
                      {item.lotto}
                    </span>
                  {:else}
                    <span class="text-neutral-400">-</span>
                  {/if}
                </td>
                <td>{item.posizione_in_udc || '-'}</td>
                <td class="text-right">
                  {item.peso_kg ? `${item.peso_kg} kg` : '-'}
                </td>
                <td class="text-right">
                  {item.volume_cm3 ? `${Math.round(item.volume_cm3 / 1000)} L` : '-'}
                </td>
                <td class="text-xs">{item.data_inserimento_formatted}</td>
                <td class="text-xs">{item.operatore_nome || 'Sistema'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="card-body">
        <div class="text-center py-8">
          <div class="text-4xl mb-4">📦</div>
          <h3 class="text-lg font-semibold text-neutral-700 mb-2">UDC Vuoto</h3>
          <p class="text-neutral-600 dark:text-gray-400">Questo UDC non contiene ancora nessun prodotto</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Storico Movimenti -->
  <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
    <div class="card-header border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
        🔄 Storico Movimenti ({movimenti.length} movimenti)
      </h3>
    </div>
    
    {#if movimenti.length > 0}
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Data/Ora</th>
              <th>Tipo Movimento</th>
              <th>Da Ubicazione</th>
              <th>A Ubicazione</th>
              <th>Operatore</th>
              <th class="text-center">Quantità</th>
              <th class="text-right">Durata</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {#each movimenti as movimento}
              {@const tipoMovimento = getTipoMovimento(movimento.tipo_movimento)}
              <tr>
                <td class="text-sm">{movimento.data_inizio_formatted}</td>
                <td>
                  <span class="badge {tipoMovimento.class} text-xs">
                    {tipoMovimento.icon} {tipoMovimento.label}
                  </span>
                </td>
                <td class="text-sm font-mono">
                  {movimento.ubicazione_da || '-'}
                </td>
                <td class="text-sm font-mono">
                  {movimento.ubicazione_a || '-'}
                </td>
                <td class="text-sm">{movimento.operatore_nome || 'Sistema'}</td>
                <td class="text-center">
                  {movimento.quantita_movimentata || '-'}
                </td>
                <td class="text-right text-sm">
                  {movimento.durata_secondi ? `${movimento.durata_secondi}s` : '-'}
                </td>
                <td class="text-sm w-full truncate" title={movimento.note_movimento || ''}>
                  {movimento.note_movimento || '-'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="card-body">
        <div class="text-center py-8">
          <div class="text-4xl mb-4">🔄</div>
          <h3 class="text-lg font-semibold text-neutral-700 mb-2">Nessun Movimento</h3>
          <p class="text-neutral-600 dark:text-gray-400">Questo UDC non ha ancora movimenti registrati</p>
        </div>
      </div>
    {/if}
  </div>
</div>