<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  
  export let show = false;
  export let prodotto = null;
  export let udc = null;
  export let giacenzaDisponibile = 0;
  export let committente = null;
  
  const dispatch = createEventDispatcher();
  
  // Form state
  let transferForm = {
    tipo_trasferimento: 'QUANTITA', // QUANTITA o UDC
    quantita: '',
    udc_origine: '',
    udc_destinazione: '',
    ubicazione_destinazione: '',
    causale_id: '',
    note: '',
    autorizzazione_richiesta: false
  };
  
  let causali = [];
  let ubicazioni = [];
  let ubicazioniFiltrate = [];
  let udcs = [];
  let loading = false;
  let errors = {};
  
  // Filtri per ubicazioni
  let filtriUbicazioni = {
    zona: '',
    tipo: '',
    zona_velocita: '',
    solo_raccomandate: false,
    cerca_codice: ''
  };
  
  // Opzioni filtri (caricate dinamicamente)
  let opzioniFiltri = {
    zone: [],
    tipi: [],
    zone_velocita: ['HOT', 'WARM', 'COLD']
  };
  
  // Load data when modal opens
  $: if (show) {
    loadModalData();
  }
  
  async function loadModalData() {
    try {
      loading = true;
      
      // Load causali
      const causaliResponse = await fetch('/api/causali-trasferimento');
      if (causaliResponse.ok) {
        causali = await causaliResponse.json();
      }
      
      // Load ubicazioni con algoritmo best location
      let ubicazioniUrl = '/api/ubicazioni?best_location_first=true&for_putaway=true';
      if (prodotto?.id) {
        ubicazioniUrl += `&prodotto_id=${prodotto.id}`;
      }
      
      const ubicazioniResponse = await fetch(ubicazioniUrl);
      if (ubicazioniResponse.ok) {
        const data = await ubicazioniResponse.json();
        ubicazioni = data.ubicazioni || data; // Compatibilità con entrambi i formati
        
        // Estrai opzioni per i filtri
        opzioniFiltri.zone = [...new Set(ubicazioni.map(u => u.zona))].sort();
        opzioniFiltri.tipi = [...new Set(ubicazioni.map(u => u.tipo))].sort();
        
        // Applica filtri iniziali
        applicaFiltriUbicazioni();
      }
      
      // Load UDCs if needed
      if (transferForm.tipo_trasferimento === 'UDC') {
        const udcResponse = await fetch('/api/udc');
        if (udcResponse.ok) {
          udcs = await udcResponse.json();
        }
      }
      
    } catch (error) {
      console.error('Error loading modal data:', error);
    } finally {
      loading = false;
    }
  }
  
  function closeModal() {
    show = false;
    resetForm();
    dispatch('close');
  }
  
  function resetForm() {
    transferForm = {
      tipo_trasferimento: 'QUANTITA',
      quantita: '',
      udc_origine: '',
      udc_destinazione: '',
      ubicazione_destinazione: '',
      causale_id: '',
      note: '',
      autorizzazione_richiesta: false
    };
    errors = {};
    
    // Reset filtri
    filtriUbicazioni = {
      zona: '',
      tipo: '',
      zona_velocita: '',
      solo_raccomandate: false,
      cerca_codice: ''
    };
  }
  
  // Funzione per applicare i filtri alle ubicazioni
  function applicaFiltriUbicazioni() {
    let risultato = [...ubicazioni];
    
    // Filtro per zona
    if (filtriUbicazioni.zona) {
      risultato = risultato.filter(u => u.zona === filtriUbicazioni.zona);
    }
    
    // Filtro per tipo
    if (filtriUbicazioni.tipo) {
      risultato = risultato.filter(u => u.tipo === filtriUbicazioni.tipo);
    }
    
    // Filtro per zona velocità
    if (filtriUbicazioni.zona_velocita) {
      risultato = risultato.filter(u => u.zona_velocita === filtriUbicazioni.zona_velocita);
    }
    
    // Filtro solo raccomandate
    if (filtriUbicazioni.solo_raccomandate) {
      risultato = risultato.filter(u => u.is_recommended);
    }
    
    // Filtro ricerca per codice
    if (filtriUbicazioni.cerca_codice) {
      const cerca = filtriUbicazioni.cerca_codice.toLowerCase();
      risultato = risultato.filter(u => 
        u.codice_ubicazione.toLowerCase().includes(cerca) ||
        u.zona.toLowerCase().includes(cerca)
      );
    }
    
    // Mantieni l'ordine best-location se non filtrato troppo
    ubicazioniFiltrate = risultato.slice(0, 100); // Limita a 100 per performance
  }
  
  // Reattività per applicare filtri quando cambiano
  $: if (ubicazioni.length > 0) {
    applicaFiltriUbicazioni();
  }
  
  // Reattività per ogni singolo filtro - separata per essere più precisa
  $: filtriUbicazioni.zona, filtriUbicazioni.tipo, filtriUbicazioni.zona_velocita, filtriUbicazioni.solo_raccomandate, filtriUbicazioni.cerca_codice, ubicazioni.length > 0 && applicaFiltriUbicazioni()
  
  // Reset filtri rapido
  function resetFiltriUbicazioni() {
    filtriUbicazioni = {
      zona: '',
      tipo: '',
      zona_velocita: '',
      solo_raccomandate: false,
      cerca_codice: ''
    };
  }
  
  function validateForm() {
    errors = {};
    
    if (!transferForm.causale_id) {
      errors.causale = 'Seleziona una causale';
    }
    
    if (transferForm.tipo_trasferimento === 'QUANTITA') {
      const qty = parseInt(transferForm.quantita);
      if (!qty || qty <= 0) {
        errors.quantita = 'Inserisci una quantità valida';
      } else if (qty > giacenzaDisponibile) {
        errors.quantita = `Quantità massima disponibile: ${giacenzaDisponibile}`;
      }
      
      if (!transferForm.ubicazione_destinazione) {
        errors.ubicazione = 'Seleziona ubicazione destinazione';
      }
    } else if (transferForm.tipo_trasferimento === 'UDC') {
      if (!transferForm.udc_origine) {
        errors.udc_origine = 'Seleziona UDC origine';
      }
      if (!transferForm.ubicazione_destinazione) {
        errors.ubicazione = 'Seleziona ubicazione destinazione';
      }
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function submitTransfer() {
    if (!validateForm()) return;
    
    try {
      loading = true;
      
      const transferData = {
        ...transferForm,
        prodotto_id: prodotto?.id,
        committente_id: committente?.id,
        quantita: transferForm.tipo_trasferimento === 'QUANTITA' ? parseInt(transferForm.quantita) : null
      };
      
      const response = await fetch('/api/trasferimenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        errors.general = result.error || 'Errore durante il trasferimento';
        return;
      }
      
      // Success
      dispatch('success', result);
      closeModal();
      
    } catch (error) {
      errors.general = 'Errore di connessione';
    } finally {
      loading = false;
    }
  }
  
  // Get causale details for authorization check
  $: selectedCausale = causali.find(c => c.id.toString() === transferForm.causale_id);
  $: transferForm.autorizzazione_richiesta = selectedCausale?.richiede_autorizzazione || false;
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{$t('transfer.title')}</h3>
            {#if prodotto}
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {prodotto.codice} - {prodotto.descrizione}
                {#if committente}
                  <span class="text-indigo-600 dark:text-indigo-400">({committente.nome})</span>
                {/if}
              </p>
            {/if}
          </div>
          <button on:click={closeModal} class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            ✕
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4 bg-white dark:bg-gray-800">
        {#if errors.general}
          <div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {errors.general}
          </div>
        {/if}
        
        <!-- Giacenza disponibile -->
        {#if giacenzaDisponibile > 0}
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <strong>{$t('transfer.availableStock')}:</strong> {giacenzaDisponibile} {prodotto?.unita_misura || ''}
            </div>
          </div>
        {/if}

        <!-- Tipo trasferimento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{$t('transfer.type')}</label>
          <div class="flex gap-4">
            <label class="flex items-center text-gray-700 dark:text-gray-300">
              <input 
                type="radio" 
                bind:group={transferForm.tipo_trasferimento} 
                value="QUANTITA"
                class="mr-2 text-blue-600 dark:text-blue-500"
              >
              📦 {$t('transfer.byQuantity')}
            </label>
            <label class="flex items-center text-gray-700 dark:text-gray-300">
              <input 
                type="radio" 
                bind:group={transferForm.tipo_trasferimento} 
                value="UDC"
                class="mr-2 text-blue-600 dark:text-blue-500"
                disabled={!udc}
              >
              🏗️ {$t('transfer.byUdc')}
            </label>
          </div>
        </div>

        <!-- Trasferimento per quantità -->
        {#if transferForm.tipo_trasferimento === 'QUANTITA'}
          <div class="space-y-3">
            <!-- Prima riga: quantità -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{$t('transfer.quantityToTransfer')} *</label>
              <input
                type="number"
                bind:value={transferForm.quantita}
                min="1"
                max={giacenzaDisponibile}
                class="form-input {errors.quantita ? 'border-red-500 dark:border-red-400' : ''}"
                placeholder="Es: 10"
              >
              {#if errors.quantita}
                <p class="text-red-500 dark:text-red-400 text-xs mt-1">{errors.quantita}</p>
              {/if}
            </div>
            
            <!-- Filtri ubicazioni -->
            <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">🔍 {$t('transfer.filtersTitle')}</h4>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{ubicazioniFiltrate.length} {$t('transfer.of')} {ubicazioni.length}</span>
                  <button 
                    type="button" 
                    on:click={resetFiltriUbicazioni}
                    class="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-200"
                  >
                    {$t('transfer.reset')}
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <!-- Filtro Zona -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">{$t('transfer.zone')}</label>
                  <select bind:value={filtriUbicazioni.zona} class="text-xs p-1 border border-gray-300 dark:border-gray-500 rounded w-full bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <option value="">{$t('transfer.allZones')}</option>
                    {#each opzioniFiltri.zone as zona}
                      <option value={zona}>{zona}</option>
                    {/each}
                  </select>
                </div>
                
                <!-- Filtro Tipo -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">{$t('transfer.typeLocation')}</label>
                  <select bind:value={filtriUbicazioni.tipo} class="text-xs p-1 border border-gray-300 dark:border-gray-500 rounded w-full bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <option value="">{$t('transfer.allTypes')}</option>
                    {#each opzioniFiltri.tipi as tipo}
                      <option value={tipo}>{tipo}</option>
                    {/each}
                  </select>
                </div>
                
                <!-- Filtro Velocità -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">{$t('transfer.speed')}</label>
                  <select bind:value={filtriUbicazioni.zona_velocita} class="text-xs p-1 border border-gray-300 dark:border-gray-500 rounded w-full bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <option value="">{$t('transfer.allSpeeds')}</option>
                    {#each opzioniFiltri.zone_velocita as velocita}
                      <option value={velocita}>
                        {#if velocita === 'HOT'}🔥{:else if velocita === 'WARM'}🟡{:else}❄️{/if}
                        {velocita}
                      </option>
                    {/each}
                  </select>
                </div>
                
                <!-- Solo raccomandate -->
                <div class="flex items-end">
                  <label class="flex items-center text-xs text-gray-700 dark:text-gray-300">
                    <input 
                      type="checkbox" 
                      bind:checked={filtriUbicazioni.solo_raccomandate} 
                      class="mr-1 text-blue-600 dark:text-blue-500"
                    >
                    ⭐ {$t('transfer.onlyRecommended')}
                  </label>
                </div>
              </div>
              
              <!-- Cerca Codice - riga separata -->
              <div class="mt-2">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">{$t('transfer.searchCode')}</label>
                <input 
                  type="text" 
                  bind:value={filtriUbicazioni.cerca_codice} 
                  placeholder="Es: A-01, B-02..."
                  class="text-xs p-1 border border-gray-300 dark:border-gray-500 rounded w-full bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                >
              </div>
            </div>
            
            <!-- Ubicazione destinazione -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{$t('transfer.destinationLocation')} *</label>
              <select bind:value={transferForm.ubicazione_destinazione} class="form-input {errors.ubicazione ? 'border-red-500 dark:border-red-400' : ''}">
                <option value="">{$t('transfer.selectLocation')}</option>
                {#each ubicazioniFiltrate as ubicazione}
                  <option 
                    value={ubicazione.id} 
                    class="{ubicazione.is_recommended ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 font-semibold' : 'text-gray-900 dark:text-gray-100'}"
                  >
                    {#if ubicazione.is_recommended}⭐{/if}
                    {ubicazione.codice_ubicazione} - {ubicazione.zona}
                    {#if ubicazione.spazio_disponibile_perc}
                      ({ubicazione.spazio_disponibile_perc}% libero)
                    {/if}
                  </option>
                {/each}
              </select>
              {#if transferForm.ubicazione_destinazione && ubicazioni.find(u => u.id == transferForm.ubicazione_destinazione)?.recommendation_reason}
                <p class="text-green-600 dark:text-green-400 text-xs mt-1 flex items-center">
                  <span class="mr-1">💡</span>
                  {ubicazioni.find(u => u.id == transferForm.ubicazione_destinazione).recommendation_reason}
                </p>
              {/if}
              {#if errors.ubicazione}
                <p class="text-red-500 dark:text-red-400 text-xs mt-1">{errors.ubicazione}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Trasferimento per UDC -->
        {#if transferForm.tipo_trasferimento === 'UDC'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{$t('transfer.udcOrigin')} *</label>
              <select bind:value={transferForm.udc_origine} class="form-input {errors.udc_origine ? 'border-red-500 dark:border-red-400' : ''}">
                <option value="">{$t('transfer.selectUdcOrigin')}</option>
                {#each udcs as udc_item}
                  <option value={udc_item.id}>{udc_item.barcode} - {udc_item.tipo_udc}</option>
                {/each}
              </select>
              {#if errors.udc_origine}
                <p class="text-red-500 dark:text-red-400 text-xs mt-1">{errors.udc_origine}</p>
              {/if}
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ubicazione Destinazione *</label>
              <select bind:value={transferForm.ubicazione_destinazione} class="form-input {errors.ubicazione ? 'border-red-500 dark:border-red-400' : ''}">
                <option value="">{$t('transfer.selectLocation')}</option>
                {#each ubicazioniFiltrate as ubicazione}
                  <option 
                    value={ubicazione.id} 
                    class="{ubicazione.is_recommended ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 font-semibold' : 'text-gray-900 dark:text-gray-100'}"
                  >
                    {#if ubicazione.is_recommended}⭐{/if}
                    {ubicazione.codice_ubicazione} - {ubicazione.zona}
                    {#if ubicazione.spazio_disponibile_perc}
                      ({ubicazione.spazio_disponibile_perc}% libero)
                    {/if}
                  </option>
                {/each}
              </select>
              {#if transferForm.ubicazione_destinazione && ubicazioni.find(u => u.id == transferForm.ubicazione_destinazione)?.recommendation_reason}
                <p class="text-green-600 dark:text-green-400 text-xs mt-1 flex items-center">
                  <span class="mr-1">💡</span>
                  {ubicazioni.find(u => u.id == transferForm.ubicazione_destinazione).recommendation_reason}
                </p>
              {/if}
              {#if errors.ubicazione}
                <p class="text-red-500 dark:text-red-400 text-xs mt-1">{errors.ubicazione}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Causale -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{$t('transfer.cause')} *</label>
          <select bind:value={transferForm.causale_id} class="form-input {errors.causale ? 'border-red-500 dark:border-red-400' : ''}">
            <option value="">{$t('transfer.selectCause')}</option>
            {#each causali as causale}
              <option value={causale.id}>
                {causale.codice} - {causale.descrizione}
                {causale.richiede_autorizzazione ? ` (${$t('transfer.requiresAuthorization')})` : ''}
              </option>
            {/each}
          </select>
          {#if errors.causale}
            <p class="text-red-500 dark:text-red-400 text-xs mt-1">{errors.causale}</p>
          {/if}
        </div>

        <!-- Autorizzazione richiesta -->
        {#if transferForm.autorizzazione_richiesta}
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
            <div class="flex items-center">
              <div class="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</div>
              <div class="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>{$t('transfer.attention')}:</strong> {$t('transfer.authorizationWarning')}
              </div>
            </div>
          </div>
        {/if}

        <!-- Note -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{$t('transfer.optionalNotes')}</label>
          <textarea
            bind:value={transferForm.note}
            rows="2"
            class="form-input"
            placeholder="{$t('transfer.notesPlaceholder')}"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-800">
        <button
          on:click={closeModal}
          class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
        >
          {$t('common.cancel')}
        </button>
        <button
          on:click={submitTransfer}
          disabled={loading}
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {#if loading}
            ⏳ {$t('transfer.processing')}
          {:else}
            🔄 {$t('transfer.execute')}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .form-input {
    @apply w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100;
  }
  
  /* Forza il color-scheme per far renderizzare correttamente le select in dark mode */
  :global(.dark .form-input) {
    color-scheme: dark;
    background-color: #374151 !important;
    color: #f9fafb !important;
  }
  
  /* Forza tutti i select in dark mode */
  :global(.dark select.form-input) {
    background-color: #374151 !important;
    color: #f9fafb !important;
    border-color: #6b7280 !important;
  }
  
  /* Forza colori per le option in dark mode */  
  :global(.dark select.form-input option) {
    background-color: #374151 !important;
    color: #f9fafb !important;
  }
  
  /* Forza anche per light mode per sicurezza */
  :global(select.form-input option) {
    background-color: white;
    color: #111827;
  }
</style>