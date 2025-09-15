<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  
  let transferType = 'byQuantity'; // default
  let udcId: string | null = null;
  let udcBarcode: string | null = null;
  let isUdcModeFixed = false; // Se true, non può essere cambiato
  
  // Form data
  let formData = {
    quantityToTransfer: '',
    destinationLocation: '',
    cause: '',
    notes: ''
  };
  
  let loading = false;
  let causali = [];
  let ubicazioni = [];
  
  onMount(async () => {
    // Controlla i parametri URL per modalità preimpostata
    const urlParams = $page.url.searchParams;
    const typeParam = urlParams.get('type');
    const udcIdParam = urlParams.get('udc_id');
    const udcBarcodeParam = urlParams.get('udc_barcode');
    
    if (typeParam === 'byUdc' && udcIdParam && udcBarcodeParam) {
      transferType = 'byUdc';
      udcId = udcIdParam;
      udcBarcode = decodeURIComponent(udcBarcodeParam);
      isUdcModeFixed = true; // Non può essere cambiato quando arriva da UDC
    }
    
    // Carica dati per il form
    await loadFormData();
  });
  
  async function loadFormData() {
    loading = true;
    try {
      // Load causali
      const causaliResponse = await fetch('/api/causali-trasferimento');
      if (causaliResponse.ok) {
        causali = await causaliResponse.json();
      }
      
      // Load ubicazioni
      const ubicazioniResponse = await fetch('/api/ubicazioni');
      if (ubicazioniResponse.ok) {
        const data = await ubicazioniResponse.json();
        ubicazioni = Array.isArray(data) ? data : data.ubicazioni || [];
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      loading = false;
    }
  }
  
  async function submitTransfer() {
    // TODO: Implementare invio trasferimento
    console.log('Transfer data:', {
      type: transferType,
      udcId,
      udcBarcode,
      formData
    });
  }
</script>

<svelte:head>
  <title>{$t('transfer.title')} | {$t('common.app')}</title>
</svelte:head>

<div class="w-full p-6">
  
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">🔄 {$t('transfer.title')}</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">{$t('transfer.subtitle')}</p>
    </div>
    <div class="flex gap-2">
      <button 
        class="btn btn-ghost btn-sm"
        on:click={() => window.history.back()}
      >
        ← {$t('common.back')}
      </button>
      <button 
        class="btn btn-ghost btn-sm"
        on:click={() => window.location.reload()}
        title="{$t('common.refresh')}"
      >
        🔄
      </button>
    </div>
  </div>

  <!-- Transfer Form Card -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
    <div class="p-6">
      
      {#if loading}
        <div class="text-center py-8">
          <div class="animate-spin text-4xl mb-2">⏳</div>
          <p class="text-gray-600 dark:text-gray-400">{$t('common.loading')}</p>
        </div>
      {:else}
        
        <!-- Transfer Type Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {$t('transfer.type')}
          </label>
          
          <div class="flex gap-4">
            <label class="flex items-center text-gray-700 dark:text-gray-300 {isUdcModeFixed ? 'opacity-50' : ''}">
              <input 
                type="radio" 
                bind:group={transferType} 
                value="byQuantity"
                disabled={isUdcModeFixed}
                class="mr-2 text-blue-600 dark:text-blue-500"
              >
              📦 {$t('transfer.byQuantity')}
            </label>
            
            <label class="flex items-center text-gray-700 dark:text-gray-300 {isUdcModeFixed ? 'font-bold bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded' : ''}">
              <input 
                type="radio" 
                bind:group={transferType} 
                value="byUdc"
                disabled={isUdcModeFixed}
                class="mr-2 text-blue-600 dark:text-blue-500"
              >
              🏗️ {$t('transfer.byUdc')}
              {#if isUdcModeFixed}
                <span class="ml-2 text-xs text-blue-600 dark:text-blue-400">({$t('transfer.preselected')})</span>
              {/if}
            </label>
          </div>
          
          {#if isUdcModeFixed && udcBarcode}
            <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="text-sm text-blue-800 dark:text-blue-200">
                <strong>{$t('transfer.selectedUdc')}:</strong> {udcBarcode}
              </div>
            </div>
          {/if}
        </div>

        <!-- Transfer by Quantity -->
        {#if transferType === 'byQuantity'}
          <div class="space-y-4">
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {$t('transfer.quantityToTransfer')} *
              </label>
              <input
                type="number"
                bind:value={formData.quantityToTransfer}
                min="1"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="{$t('transfer.quantityPlaceholder')}"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {$t('transfer.destinationLocation')} *
              </label>
              <select 
                bind:value={formData.destinationLocation}
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{$t('transfer.selectLocation')}</option>
                {#each ubicazioni as ubicazione}
                  <option value={ubicazione.id}>
                    {ubicazione.codice_ubicazione} - {ubicazione.zona}
                  </option>
                {/each}
              </select>
            </div>
            
          </div>
        {/if}

        <!-- Transfer by UDC -->
        {#if transferType === 'byUdc'}
          <div class="space-y-4">
            
            {#if udcBarcode}
              <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div class="flex items-center gap-3">
                  <div class="text-green-600 dark:text-green-400 text-2xl">🏗️</div>
                  <div>
                    <div class="text-sm font-medium text-green-800 dark:text-green-200">
                      {$t('transfer.fullUdcTransfer')}
                    </div>
                    <div class="text-xs text-green-600 dark:text-green-400">
                      UDC: <span class="font-mono font-bold">{udcBarcode}</span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {$t('transfer.destinationLocation')} *
              </label>
              <select 
                bind:value={formData.destinationLocation}
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{$t('transfer.selectLocation')}</option>
                {#each ubicazioni as ubicazione}
                  <option value={ubicazione.id}>
                    {ubicazione.codice_ubicazione} - {ubicazione.zona}
                  </option>
                {/each}
              </select>
            </div>
            
          </div>
        {/if}

        <!-- Common Fields -->
        <div class="space-y-4 mt-6">
          
          <!-- Causale -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {$t('transfer.cause')} *
            </label>
            <select 
              bind:value={formData.cause}
              class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{$t('transfer.selectCause')}</option>
              {#each causali as causale}
                <option value={causale.id}>
                  {causale.codice} - {causale.descrizione}
                </option>
              {/each}
            </select>
          </div>
          
          <!-- Note -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {$t('transfer.optionalNotes')}
            </label>
            <textarea
              bind:value={formData.notes}
              rows="3"
              class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="{$t('transfer.notesPlaceholder')}"
            ></textarea>
          </div>
          
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            on:click={() => window.history.back()}
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            {$t('common.cancel')}
          </button>
          
          <button
            type="button"
            on:click={submitTransfer}
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
          >
            🔄 {$t('transfer.execute')}
          </button>
        </div>
        
      {/if}
    </div>
  </div>
</div>