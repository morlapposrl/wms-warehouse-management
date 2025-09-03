<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let mode: 'from' | 'to' = 'to'; // Modalità: da dove o dove va
  export let selectedLocation: any = null;
  export let committente_id: number;
  export let sku_code: string = '';
  export let required_volume: number = 0;
  export let required_weight: number = 0;
  
  const dispatch = createEventDispatcher();
  
  let locations: any[] = [];
  let suggestedLocations: any[] = [];
  let searchTerm = '';
  let isOpen = false;
  let loading = false;
  
  // Carica ubicazioni disponibili
  async function loadLocations() {
    if (loading) return;
    loading = true;
    
    try {
      const params = new URLSearchParams({
        mode,
        committente_id: committente_id.toString(),
        sku_code,
        required_volume: required_volume.toString(),
        required_weight: required_weight.toString(),
        search: searchTerm
      });
      
      const response = await fetch(`/api/ubicazioni/picker?${params}`);
      if (response.ok) {
        const data = await response.json();
        locations = data.locations || [];
        suggestedLocations = data.suggested || [];
      }
    } catch (error) {
      console.error('Errore caricamento ubicazioni:', error);
    } finally {
      loading = false;
    }
  }
  
  // Filtra ubicazioni in base al testo di ricerca
  $: filteredLocations = locations.filter(loc => 
    loc.codice_ubicazione.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.zona.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  function selectLocation(location: any) {
    selectedLocation = location;
    isOpen = false;
    dispatch('select', location);
  }
  
  function clearSelection() {
    selectedLocation = null;
    dispatch('select', null);
  }
  
  // Auto-carica quando si apre
  $: if (isOpen && locations.length === 0) {
    loadLocations();
  }
  
  // Emoji per tipo ubicazione
  function getLocationIcon(tipo: string): string {
    switch(tipo) {
      case 'SCAFFALE': return '📦';
      case 'PALLET': return '🚚';
      case 'FRIGO': return '🧊';
      case 'CONGELATORE': return '❄️';
      case 'QUARANTENA': return '⚠️';
      case 'UFFICIO': return '🏢';
      default: return '📍';
    }
  }
  
  // Colore per zona velocità
  function getZoneColor(zona_velocita: string): string {
    switch(zona_velocita) {
      case 'HOT': return 'text-red-600 bg-red-100';
      case 'WARM': return 'text-orange-600 bg-orange-100';
      case 'COLD': return 'text-blue-600 bg-blue-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  }
</script>

<div class="relative">
  <!-- Campo di input/selezione -->
  <div class="relative">
    <button
      type="button"
      on:click={() => isOpen = !isOpen}
      class="w-full text-left border border-neutral-300 rounded-md px-3 py-2 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      class:border-red-300={!selectedLocation && isOpen}
    >
      {#if selectedLocation}
        <div class="flex items-center gap-2">
          <span class="text-lg">{getLocationIcon(selectedLocation.tipo)}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">{selectedLocation.codice_ubicazione}</div>
            <div class="text-xs text-neutral-500 truncate">
              {selectedLocation.zona} • {selectedLocation.percentuale_occupazione}% occupato
            </div>
          </div>
          <span class="badge badge-xs {getZoneColor(selectedLocation.zona_velocita)}">
            {selectedLocation.zona_velocita}
          </span>
          <button
            type="button"
            on:click|stopPropagation={clearSelection}
            class="text-neutral-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      {:else}
        <div class="text-neutral-500">
          {mode === 'from' ? '🔍 Seleziona ubicazione origine...' : '📍 Seleziona ubicazione destinazione...'}
        </div>
      {/if}
      
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg class="w-4 h-4 text-neutral-400 transform transition-transform {isOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </button>
  </div>
  
  <!-- Dropdown ubicazioni -->
  {#if isOpen}
    <div class="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg max-h-96 overflow-hidden">
      <!-- Campo ricerca -->
      <div class="p-3 border-b">
        <input
          type="text"
          bind:value={searchTerm}
          on:input={loadLocations}
          placeholder="🔍 Cerca per codice o zona..."
          class="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="max-h-80 overflow-y-auto">
        <!-- Sezione ubicazioni suggerite -->
        {#if suggestedLocations.length > 0}
          <div class="p-2 bg-green-50 border-b">
            <div class="text-xs font-medium text-green-800 mb-2">
              💡 Ubicazioni suggerite ({mode === 'from' ? 'con merce disponibile' : 'ottimali per stoccaggio'})
            </div>
            {#each suggestedLocations as location}
              <button
                type="button"
                on:click={() => selectLocation(location)}
                class="w-full text-left p-2 hover:bg-green-100 rounded-md transition-colors"
              >
                <div class="flex items-center gap-2">
                  <span class="text-lg">{getLocationIcon(location.tipo)}</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">{location.codice_ubicazione}</div>
                    <div class="text-xs text-neutral-600 truncate">
                      {location.zona} • {location.percentuale_occupazione}% occ. • 
                      {location.volume_disponibile}cm³ disp.
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="badge badge-xs {getZoneColor(location.zona_velocita)}">
                      {location.zona_velocita}
                    </span>
                    {#if location.reason}
                      <span class="text-xs text-green-700">
                        {location.reason}
                      </span>
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
        
        <!-- Tutte le ubicazioni -->
        {#if loading}
          <div class="p-4 text-center text-neutral-500">
            <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Caricamento ubicazioni...
          </div>
        {:else if filteredLocations.length === 0}
          <div class="p-4 text-center text-neutral-500">
            {searchTerm ? 'Nessuna ubicazione trovata' : 'Nessuna ubicazione disponibile'}
          </div>
        {:else}
          <div class="p-2">
            <div class="text-xs font-medium text-neutral-600 mb-2">
              Tutte le ubicazioni ({filteredLocations.length})
            </div>
            {#each filteredLocations as location}
              <button
                type="button"
                on:click={() => selectLocation(location)}
                class="w-full text-left p-2 hover:bg-neutral-50 rounded-md transition-colors border-l-4"
                class:border-l-red-400={location.percentuale_occupazione >= 90}
                class:border-l-orange-400={location.percentuale_occupazione >= 70 && location.percentuale_occupazione < 90}
                class:border-l-yellow-400={location.percentuale_occupazione >= 50 && location.percentuale_occupazione < 70}
                class:border-l-green-400={location.percentuale_occupazione >= 20 && location.percentuale_occupazione < 50}
                class:border-l-blue-400={location.percentuale_occupazione < 20}
              >
                <div class="flex items-center gap-2">
                  <span class="text-lg">{getLocationIcon(location.tipo)}</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">{location.codice_ubicazione}</div>
                    <div class="text-xs text-neutral-600 truncate">
                      Zona {location.zona} • {location.tipo} • {location.percentuale_occupazione}% occupato
                    </div>
                    {#if location.contenuto_attuale}
                      <div class="text-xs text-blue-600 truncate">
                        Contiene: {location.contenuto_attuale}
                      </div>
                    {/if}
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="badge badge-xs {getZoneColor(location.zona_velocita)}">
                      {location.zona_velocita}
                    </span>
                    <span class="text-xs text-neutral-500">
                      {location.volume_disponibile}cm³
                    </span>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Footer con azioni -->
      <div class="p-3 border-t bg-neutral-50 flex items-center justify-between">
        <span class="text-xs text-neutral-600">
          {mode === 'from' ? 'Dove si trova la merce' : 'Dove posizionare la merce'}
        </span>
        <button
          type="button"
          on:click={() => isOpen = false}
          class="text-xs text-blue-600 hover:text-blue-800"
        >
          Chiudi
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .badge {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
  }
  
  .badge-xs {
    @apply px-1.5 py-0.5 text-xs;
  }
</style>