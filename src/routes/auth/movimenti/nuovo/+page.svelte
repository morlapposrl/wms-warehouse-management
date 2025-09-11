<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  // Tipi movimento disponibili
  const tipiMovimento = [
    { value: 'CARICO', label: '📥 Carico (entrata merce)', color: 'text-green-600' },
    { value: 'SCARICO', label: '📤 Scarico (uscita merce)', color: 'text-red-600' },
    { value: 'RETTIFICA_POS', label: '➕ Rettifica positiva', color: 'text-blue-600' },
    { value: 'RETTIFICA_NEG', label: '➖ Rettifica negativa', color: 'text-orange-600' },
    { value: 'RESO_CLIENTE', label: '🔄 Reso da cliente', color: 'text-yellow-600' },
    { value: 'RESO_FORNITORE', label: '📮 Reso a fornitore', color: 'text-purple-600' }
  ];

  let selectedCommittente = data.selectedCommittente || '';
  let selectedProdotto = '';
  let selectedOrdine = '';
  let selectedTipoMovimento = '';
  let selectedUbicazione = '';
  let selectedUdc = '';
  let loadingProdotti = false;
  let loadingUbicazioni = false;
  let loadingUdc = false;
  let prodotti = data.prodotti || [];
  let ordiniIngresso = data.ordiniIngresso || [];
  let ubicazioni = data.ubicazioni || [];
  let udcDisponibili = data.udcDisponibili || [];

  // Carica prodotti quando cambia il committente
  async function loadProdotti() {
    if (!selectedCommittente) {
      prodotti = [];
      return;
    }

    loadingProdotti = true;
    try {
      const response = await fetch(`?committente=${selectedCommittente}`);
      if (response.ok) {
        // Ricarica la pagina con il nuovo committente
        goto(`?committente=${selectedCommittente}`);
      }
    } catch (error) {
      console.error('Errore caricamento prodotti:', error);
    } finally {
      loadingProdotti = false;
    }
  }

  function getProdottoInfo(prodottoId: string) {
    const prodotto = prodotti.find(p => p.id.toString() === prodottoId);
    return prodotto;
  }

  function getOrdineInfo(ordineId: string) {
    const ordine = ordiniIngresso.find(o => o.id.toString() === ordineId);
    return ordine;
  }

  function formatDate(dateString: string) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('it-IT');
  }

  // Mostra la combobox ordini solo per movimenti di CARICO
  $: showOrdiniCombo = selectedTipoMovimento === 'CARICO';

  // Funzione per tornare indietro
  function goBack() {
    goto('/auth/movimenti');
  }
</script>

<svelte:head>
  <title>Nuovo Movimento - Gestionale Magazzino</title>
</svelte:head>

<div class="w-full">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-neutral-900 mb-2">📦 Nuovo Movimento</h1>
      <p class="text-neutral-600 dark:text-gray-400">
        Registra una nuova movimentazione di magazzino
      </p>
    </div>
    <button class="btn btn-secondary" on:click={goBack}>
      ← Torna ai Movimenti
    </button>
  </div>

  <!-- Errori form -->
  {#if form?.error}
    <div class="alert alert-error mb-6">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      {form.message}
    </div>
  {/if}

  <!-- Form -->
  <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
    <div class="card-header border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">Dati del Movimento</h2>
    </div>
    
    <form method="POST" action="?/create" use:enhance class="card-body space-y-6">
      
      <!-- Prima riga: Committente e Tipo Movimento -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Committente -->
        <div>
          <label for="committente" class="form-label required">
            🏢 Committente
          </label>
          <select 
            id="committente" 
            name="committente_id" 
            class="form-input" 
            bind:value={selectedCommittente}
            on:change={loadProdotti}
            required
          >
            <option value="">Seleziona committente...</option>
            {#each data.committenti as committente}
              <option value={committente.id}>
                {committente.ragione_sociale} ({committente.codice})
              </option>
            {/each}
          </select>
        </div>

        <!-- Tipo Movimento -->
        <div>
          <label for="tipo_movimento" class="form-label required">
            🔄 Tipo Movimento
          </label>
          <select 
            id="tipo_movimento" 
            name="tipo_movimento" 
            class="form-input" 
            bind:value={selectedTipoMovimento}
            required
          >
            <option value="">Seleziona tipo...</option>
            {#each tipiMovimento as tipo}
              <option value={tipo.value} class={tipo.color}>
                {tipo.label}
              </option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Seconda riga: Prodotto -->
      <div>
        <label for="prodotto" class="form-label required">
          📋 Prodotto
        </label>
        <select 
          id="prodotto" 
          name="prodotto_id" 
          class="form-input"
          bind:value={selectedProdotto}
          disabled={!selectedCommittente || loadingProdotti}
          required
        >
          <option value="">
            {selectedCommittente ? 'Seleziona prodotto...' : 'Prima seleziona un committente'}
          </option>
          {#if loadingProdotti}
            <option disabled>Caricamento prodotti...</option>
          {:else}
            {#each prodotti as prodotto}
              <option value={prodotto.id}>
                {prodotto.codice} - {prodotto.descrizione} 
                (Giacenza: {prodotto.giacenza_attuale} {prodotto.unita_misura})
              </option>
            {/each}
          {/if}
        </select>
        
        {#if selectedProdotto}
          {@const info = getProdottoInfo(selectedProdotto)}
          {#if info}
            <div class="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div class="text-sm text-blue-800">
                <strong>Prodotto selezionato:</strong>
                <div class="mt-1">
                  <span class="font-mono">{info.codice}</span> - {info.descrizione}
                  <br>
                  Categoria: {info.categoria_nome || 'N/D'} | 
                  Giacenza attuale: <span class="font-bold">{info.giacenza_attuale} {info.unita_misura}</span>
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Sezione Ordine di Riferimento (solo per CARICO) -->
      {#if showOrdiniCombo && ordiniIngresso.length > 0}
        <div>
          <label for="ordine_id" class="form-label">
            🧾 Ordine di Riferimento
          </label>
          <select 
            id="ordine_id" 
            name="ordine_id" 
            class="form-input"
            bind:value={selectedOrdine}
          >
            <option value="">Nessun ordine di riferimento</option>
            {#each ordiniIngresso as ordine}
              <option value={ordine.id}>
                {ordine.numero_ordine} - {ordine.cliente_fornitore} 
                (€ {(ordine.totale_valore || 0).toFixed(2)}) - {ordine.stato}
              </option>
            {/each}
          </select>
          
          {#if selectedOrdine}
            {@const ordineInfo = getOrdineInfo(selectedOrdine)}
            {#if ordineInfo}
              <div class="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div class="text-sm text-green-800">
                  <strong>Ordine selezionato:</strong>
                  <div class="mt-1">
                    <span class="font-mono">{ordineInfo.numero_ordine}</span> - {ordineInfo.cliente_fornitore}
                    <br>
                    Data: {formatDate(ordineInfo.data_ordine)} | 
                    Stato: <span class="font-semibold">{ordineInfo.stato}</span> |
                    Valore: <span class="font-bold">€ {(ordineInfo.totale_valore || 0).toFixed(2)}</span>
                    <br>
                    Righe: {ordineInfo.righe_totali} (di cui {ordineInfo.righe_aperte} ancora aperte)
                  </div>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      {:else if showOrdiniCombo && ordiniIngresso.length === 0}
        <div class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div class="text-sm text-yellow-800">
            <strong>ℹ️ Nessun ordine di ingresso disponibile</strong>
            <p class="mt-1">
              Non ci sono ordini INBOUND attivi per questo committente. 
              Il movimento sarà registrato senza collegamento a un ordine specifico.
            </p>
          </div>
        </div>
      {/if}

      <!-- Sezione Ubicazione e UDC (solo per CARICO) -->
      {#if selectedTipoMovimento === 'CARICO'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Ubicazione di Destinazione -->
          <div>
            <label for="ubicazione_id" class="form-label required">
              📍 Ubicazione di Destinazione
            </label>
            <select 
              id="ubicazione_id" 
              name="ubicazione_id" 
              class="form-input"
              bind:value={selectedUbicazione}
              required
            >
              <option value="">Seleziona ubicazione...</option>
              {#each ubicazioni as ubicazione}
                <option value={ubicazione.id}>
                  {ubicazione.codice_ubicazione} - {ubicazione.zona} 
                  ({ubicazione.stato} - {ubicazione.volume_occupato_pct}% occupato)
                </option>
              {/each}
            </select>
            
            {#if selectedUbicazione}
              {@const ub = ubicazioni.find(u => u.id.toString() === selectedUbicazione)}
              {#if ub}
                <div class="mt-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div class="text-sm text-indigo-800">
                    <strong>Ubicazione selezionata:</strong>
                    <div class="mt-1">
                      <span class="font-mono">{ub.codice_ubicazione}</span> - Zona {ub.zona}
                      <br>
                      Tipo: {ub.tipo} | Stato: <span class="font-semibold">{ub.stato}</span>
                      <br>
                      Occupazione: <span class="font-bold">{ub.volume_occupato_pct}%</span> 
                      ({ub.volume_occupato}m³ / {ub.volume_max}m³)
                    </div>
                  </div>
                </div>
              {/if}
            {/if}
          </div>

          <!-- UDC di Destinazione -->
          <div>
            <label for="udc_id" class="form-label">
              📦 UDC/Pallet di Destinazione
            </label>
            <select 
              id="udc_id" 
              name="udc_id" 
              class="form-input"
              bind:value={selectedUdc}
            >
              <option value="">Nessun UDC (carico diretto)</option>
              {#each udcDisponibili as udc}
                <option value={udc.id}>
                  {udc.barcode} - {udc.tipo_udc} 
                  ({udc.stato} - {udc.volume_occupato_pct}% pieno)
                </option>
              {/each}
            </select>
            
            {#if selectedUdc}
              {@const udcInfo = udcDisponibili.find(u => u.id.toString() === selectedUdc)}
              {#if udcInfo}
                <div class="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div class="text-sm text-green-800">
                    <strong>UDC selezionato:</strong>
                    <div class="mt-1">
                      <span class="font-mono">{udcInfo.barcode}</span> - {udcInfo.tipo_udc}
                      <br>
                      Stato: <span class="font-semibold">{udcInfo.stato}</span> |
                      Occupazione: <span class="font-bold">{udcInfo.volume_occupato_pct}%</span>
                      <br>
                      Ubicazione attuale: {udcInfo.ubicazione_codice || 'Non posizionato'}
                    </div>
                  </div>
                </div>
              {/if}
            {/if}
          </div>
        </div>
      {/if}

      <!-- Terza riga: Quantità e Prezzo -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Quantità -->
        <div>
          <label for="quantita" class="form-label required">
            🔢 Quantità
          </label>
          <input 
            type="number" 
            id="quantita" 
            name="quantita" 
            class="form-input" 
            min="1"
            step="1"
            placeholder="Es: 100"
            required
          />
        </div>

        <!-- Prezzo Unitario -->
        <div>
          <label for="prezzo" class="form-label">
            💰 Prezzo Unitario (€)
          </label>
          <input 
            type="number" 
            id="prezzo" 
            name="prezzo" 
            class="form-input" 
            min="0"
            step="0.01"
            placeholder="Es: 12.50"
          />
        </div>
      </div>

      <!-- Dettagli aggiuntivi -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Numero Ordine -->
        <div>
          <label for="ordine_numero" class="form-label">
            🧾 Numero Ordine
          </label>
          <input 
            type="text" 
            id="ordine_numero" 
            name="ordine_numero" 
            class="form-input" 
            placeholder="Es: ORD-2025-001"
          />
        </div>

        <!-- Causale -->
        <div>
          <label for="causale" class="form-label">
            📋 Causale
          </label>
          <input 
            type="text" 
            id="causale" 
            name="causale" 
            class="form-input" 
            placeholder="Es: Acquisto da fornitore"
          />
        </div>
      </div>

      <!-- Note -->
      <div>
        <label for="note" class="form-label">
          📝 Note
        </label>
        <textarea 
          id="note" 
          name="note" 
          rows="3"
          class="form-input" 
          placeholder="Note aggiuntive sul movimento..."
        ></textarea>
      </div>

      <!-- Pulsanti azione -->
      <div class="flex justify-end gap-3 pt-6 border-t">
        <button type="button" class="btn btn-secondary" on:click={goBack}>
          Annulla
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          disabled={!selectedCommittente || !selectedProdotto || (selectedTipoMovimento === 'CARICO' && !selectedUbicazione)}
        >
          💾 Crea Movimento
        </button>
      </div>

    </form>
  </div>

  <!-- Info box -->
  <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <div class="flex">
      <svg class="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="text-sm text-blue-800">
        <strong>Nota importante:</strong>
        <ul class="mt-2 space-y-1 list-disc list-inside">
          <li>I movimenti di <strong>CARICO</strong>, <strong>RETTIFICA_POS</strong> e <strong>RESO_CLIENTE</strong> aumentano le giacenze</li>
          <li>I movimenti di <strong>SCARICO</strong>, <strong>RETTIFICA_NEG</strong> e <strong>RESO_FORNITORE</strong> diminuiscono le giacenze</li>
          <li><strong>📍 Per i CARICHI</strong>: è obbligatoria la selezione dell'ubicazione di destinazione</li>
          <li><strong>📦 UDC/Pallet</strong>: opzionale per organizzare meglio lo stoccaggio</li>
          <li><strong>🧾 Ordini di riferimento</strong>: collegamento automatico per migliorare la tracciabilità</li>
          <li>Il sistema aggiorna automaticamente: <strong>giacenze, stato ubicazioni, stato UDC e ordini</strong></li>
        </ul>
      </div>
    </div>
  </div>

</div>

<style>
  .required::after {
    content: " *";
    color: #ef4444;
  }
</style>