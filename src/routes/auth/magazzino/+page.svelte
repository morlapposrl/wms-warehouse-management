<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { t } from '$lib/i18n';
  import LocationPicker from '$lib/components/LocationPicker.svelte';
  
  export let data;
  
  // Modalità vista: 'table' (default) o 'map'
  let viewMode: 'table' | 'map' = 'table';
  
  let selectedUbicazione: any = null;
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let dragStart = { x: 0, y: 0, panX: 0, panY: 0 };
  
  // Initialize default bounds
  let magazzinoBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
  let ubicazioniFiltrate: any[] = [];
  let ubicazioniMappa: any[] = [];
  
  // Calcola boundaries del magazzino
  $: {
    if (data?.ubicazioni && data.ubicazioni.length > 0) {
      try {
        magazzinoBounds = {
          minX: Math.min(...data.ubicazioni.map(u => u.coordinata_x - (u.larghezza_cm || 120)/200)),
          maxX: Math.max(...data.ubicazioni.map(u => u.coordinata_x + (u.larghezza_cm || 120)/200)),
          minY: Math.min(...data.ubicazioni.map(u => u.coordinata_y - (u.profondita_cm || 80)/200)),
          maxY: Math.max(...data.ubicazioni.map(u => u.coordinata_y + (u.profondita_cm || 80)/200))
        };
      } catch (error) {
        console.warn('Errore calcolo boundaries:', error);
        magazzinoBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
      }
    }
  }
  
  // Usa le ubicazioni già filtrate dal server per la tabella
  $: {
    if (data?.ubicazioni) {
      ubicazioniFiltrate = data.ubicazioni;
    } else {
      ubicazioniFiltrate = [];
    }
  }
  
  // Per la mappa usa tutte le ubicazioni con filtri client-side
  $: {
    if (data?.ubicazioniTutte) {
      ubicazioniMappa = data.ubicazioniTutte.filter(ubicazione => {
        if (data.filters?.zona && ubicazione.zona !== data.filters.zona) return false;
        if (data.filters?.tipo && ubicazione.tipo !== data.filters.tipo) return false;
        if (data.filters?.zona_velocita && ubicazione.zona_velocita !== data.filters.zona_velocita) return false;
        return true;
      });
    } else if (data?.ubicazioni) {
      ubicazioniMappa = data.ubicazioni;
    } else {
      ubicazioniMappa = [];
    }
  }
  
  function selectUbicazione(ubicazione: any) {
    selectedUbicazione = ubicazione;
  }
  
  function getOccupationColor(percentuale: number): string {
    if (percentuale >= 90) return '#DC2626'; // Rosso - molto pieno
    if (percentuale >= 70) return '#EA580C'; // Arancione - abbastanza pieno
    if (percentuale >= 50) return '#D97706'; // Giallo - metà pieno
    if (percentuale >= 20) return '#059669'; // Verde - poco pieno
    return '#06B6D4'; // Azzurro - vuoto
  }
  
  function applyFilters() {
    const form = document.getElementById('filtersForm') as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      if (value && value !== '') {
        params.set(key, value.toString());
      }
    }
    
    goto(`?${params.toString()}`);
  }
  
  function resetFilters() {
    goto('/auth/magazzino');
  }
  
  // Zoom and Pan handlers (rallentati)
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.95 : 1.05; // Zoom più lento
    zoomLevel = Math.max(0.1, Math.min(3, zoomLevel * delta)); // Max zoom ridotto
  }
  
  function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      panX,
      panY
    };
  }
  
  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    // Pan più lento e meno sensibile
    panX = dragStart.panX + (deltaX / zoomLevel) * 0.5;
    panY = dragStart.panY + (deltaY / zoomLevel) * 0.5;
  }
  
  function handleMouseUp() {
    isDragging = false;
  }
  
  function resetView() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
  }

  // Content and optimization functions
  let ubicazioneContent: any[] = [];
  let showContentModal = false;
  let optimizationSuggestions: any[] = [];
  let showOptimizationModal = false;

  // Tool creazione ubicazioni
  let showCreateModal = false;
  let creationMode = false;
  let bulkMode = false; // Modalità creazione multipla
  let newUbicazione = {
    area: '',
    zona: '',
    fronte: '',
    colonna: '',
    piano: '',
    tipo: 'SCAFFALE',
    coordinata_x: 0,
    coordinata_y: 0,
    larghezza_cm: 120,
    profondita_cm: 80,
    altezza_cm: 200,
    zona_velocita: 'WARM'
  };
  
  // Configurazione generazione multipla
  let bulkGeneration = {
    area_start: '', area_end: '',
    zona_start: '', zona_end: '',
    fronte_start: '', fronte_end: '',
    colonna_start: '', colonna_end: '',
    piano_start: '', piano_end: '',
    tipo: 'SCAFFALE',
    coordinata_x_start: 0, coordinata_x_spacing: 150,
    coordinata_y_start: 0, coordinata_y_spacing: 100,
    larghezza_cm: 120,
    profondita_cm: 80,
    altezza_cm: 200,
    zona_velocita: 'WARM'
  };
  
  let generatedUbicazioni: any[] = [];
  let previewCount = 0;
  
  // Demo LocationPicker
  let testLocationFrom: any = null;
  let testLocationTo: any = null;

  async function loadUbicazioneContent(ubicazioneId: number) {
    try {
      console.log('🔍 Caricamento contenuto ubicazione:', ubicazioneId);
      const response = await fetch(`/api/ubicazioni/${ubicazioneId}/content`);
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Risposta API:', result);
        console.log('📋 Content ricevuto:', result.content);
        ubicazioneContent = result.content || [];
        console.log('✅ UbicazioneContent impostato:', ubicazioneContent);
        showContentModal = true;
      } else {
        console.error('❌ Failed to load content, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading content:', error);
    }
  }

  async function suggestOptimization(ubicazione: any) {
    try {
      const response = await fetch('/api/ubicazioni/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ubicazione_id: ubicazione.id })
      });
      
      if (response.ok) {
        const result = await response.json();
        optimizationSuggestions = result.suggestions || [];
        showOptimizationModal = true;
      } else {
        console.error('Failed to get optimization suggestions');
      }
    } catch (error) {
      console.error('Error getting optimization:', error);
    }
  }

  function closeModals() {
    showContentModal = false;
    showOptimizationModal = false;
    showCreateModal = false;
    ubicazioneContent = [];
    optimizationSuggestions = [];
    creationMode = false;
  }

  // Funzioni per creazione ubicazioni
  function startCreationMode() {
    creationMode = true;
    showCreateModal = true;
  }

  function handleMapClick(event: MouseEvent) {
    if (!creationMode) return;
    
    // Calcola le coordinate relative al SVG
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const scale = zoomLevel;
    
    // Converti coordinate schermo in coordinate SVG
    const x = (event.clientX - rect.left - rect.width/2) / scale + centerX;
    const y = (event.clientY - rect.top - rect.height/2) / scale + centerY;
    
    newUbicazione.coordinata_x = Math.round(x * 10) / 10;
    newUbicazione.coordinata_y = Math.round(y * 10) / 10;
    
    console.log(`📍 {$t("warehouse.locations.fields.position")} selezionata: X=${newUbicazione.coordinata_x}, Y=${newUbicazione.coordinata_y}`);
  }

  async function createUbicazione() {
    try {
      // Genera il codice ubicazione
      const codice = `${newUbicazione.area}-${newUbicazione.zona}-${newUbicazione.fronte}-${newUbicazione.colonna}-${newUbicazione.piano}`;
      
      const ubicazioneData = {
        ...newUbicazione,
        codice_ubicazione: codice
      };

      const response = await fetch('/api/ubicazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ubicazioneData)
      });

      if (response.ok) {
        console.log('✅ Ubicazione creata con successo');
        // Ricarica la pagina per mostrare la nuova ubicazione
        window.location.reload();
      } else {
        console.error('❌ Errore durante la creazione');
      }
    } catch (error) {
      console.error('❌ Errore:', error);
    }
  }

  function resetNewUbicazione() {
    newUbicazione = {
      area: '',
      zona: '',
      fronte: '',
      colonna: '',
      piano: '',
      tipo: 'SCAFFALE',
      coordinata_x: 0,
      coordinata_y: 0,
      larghezza_cm: 120,
      profondita_cm: 80,
      altezza_cm: 200,
      zona_velocita: 'WARM'
    };
  }

  // Funzioni per generazione dinamica multipla
  function incrementAlpha(value: string): string | null {
    if (!value) return 'A';
    
    const chars = value.split('');
    let carry = true;
    
    for (let i = chars.length - 1; i >= 0 && carry; i--) {
      if (chars[i] === 'Z') {
        chars[i] = 'A';
      } else {
        chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
        carry = false;
      }
    }
    
    if (carry) {
      return 'A' + chars.join('');
    }
    
    return chars.join('');
  }

  function incrementNumeric(value: string): string {
    if (!value) return '01';
    const num = parseInt(value, 10) + 1;
    return num.toString().padStart(value.length, '0');
  }

  function isAlphabetic(value: string): boolean {
    return /^[A-Z]+$/.test(value);
  }

  function generateSequence(start: string, end: string): string[] {
    if (!start || !end) return [start];
    
    const sequence: string[] = [];
    let current = start;
    
    if (isAlphabetic(start) && isAlphabetic(end)) {
      // Sequenza alfabetica
      while (current <= end && sequence.length < 1000) { // Safety limit
        sequence.push(current);
        if (current === end) break;
        const next = incrementAlpha(current);
        if (!next || next <= current) break;
        current = next;
      }
    } else {
      // Sequenza numerica
      const startNum = parseInt(start, 10);
      const endNum = parseInt(end, 10);
      const padLength = start.length;
      
      for (let i = startNum; i <= endNum && i < startNum + 1000; i++) {
        sequence.push(i.toString().padStart(padLength, '0'));
      }
    }
    
    return sequence.length > 0 ? sequence : [start];
  }

  function generateBulkUbicazioni() {
    const areaSeq = generateSequence(bulkGeneration.area_start, bulkGeneration.area_end);
    const zonaSeq = generateSequence(bulkGeneration.zona_start, bulkGeneration.zona_end);
    const fronteSeq = generateSequence(bulkGeneration.fronte_start, bulkGeneration.fronte_end);
    const colonnaSeq = generateSequence(bulkGeneration.colonna_start, bulkGeneration.colonna_end);
    const pianoSeq = generateSequence(bulkGeneration.piano_start, bulkGeneration.piano_end);
    
    generatedUbicazioni = [];
    let coordX = bulkGeneration.coordinata_x_start;
    let coordY = bulkGeneration.coordinata_y_start;
    
    areaSeq.forEach(area => {
      zonaSeq.forEach(zona => {
        fronteSeq.forEach(fronte => {
          colonnaSeq.forEach(colonna => {
            pianoSeq.forEach(piano => {
              const codice = `${area}-${zona}-${fronte}-${colonna}-${piano}`;
              
              generatedUbicazioni.push({
                area, zona, fronte, colonna, piano,
                codice_ubicazione: codice,
                tipo: bulkGeneration.tipo,
                coordinata_x: coordX,
                coordinata_y: coordY,
                larghezza_cm: bulkGeneration.larghezza_cm,
                profondita_cm: bulkGeneration.profondita_cm,
                altezza_cm: bulkGeneration.altezza_cm,
                zona_velocita: bulkGeneration.zona_velocita
              });
              
              coordX += bulkGeneration.coordinata_x_spacing;
            });
            coordY += bulkGeneration.coordinata_y_spacing;
            coordX = bulkGeneration.coordinata_x_start;
          });
        });
      });
    });
    
    previewCount = generatedUbicazioni.length;
  }

  async function createBulkUbicazioni() {
    try {
      const response = await fetch('/api/ubicazioni/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ubicazioni: generatedUbicazioni })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.created} ubicazioni create con successo`);
        closeModals();
        window.location.reload();
      } else {
        console.error('❌ Errore durante la creazione multipla');
      }
    } catch (error) {
      console.error('❌ Errore:', error);
    }
  }

  // Reactive: rigenera preview quando cambiano i parametri
  $: if (bulkMode && 
       (bulkGeneration.area_start || bulkGeneration.zona_start || 
        bulkGeneration.fronte_start || bulkGeneration.colonna_start || 
        bulkGeneration.piano_start)) {
    generateBulkUbicazioni();
  }
  
  // Calcola dimensioni viewport
  $: viewboxWidth = magazzinoBounds ? (magazzinoBounds.maxX - magazzinoBounds.minX) * 1.2 : 120;
  $: viewboxHeight = magazzinoBounds ? (magazzinoBounds.maxY - magazzinoBounds.minY) * 1.2 : 120;
  $: centerX = magazzinoBounds ? (magazzinoBounds.minX + magazzinoBounds.maxX) / 2 : 50;
  $: centerY = magazzinoBounds ? (magazzinoBounds.minY + magazzinoBounds.maxY) / 2 : 50;
</script>

<svelte:window on:mouseup={handleMouseUp} on:mousemove={handleMouseMove} />

<div class="min-h-screen bg-neutral-50 dark:bg-gray-900">
  
  <!-- Header -->
  <div class="bg-white dark:bg-gray-800 shadow-sm border-b">
    <div class="w-full px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <span class="text-xl">🏭</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-neutral-900 dark:text-gray-100">{$t('warehouse.layout.title')}</h1>
            <p class="text-sm text-neutral-600 dark:text-gray-400">{$t('warehouse.layout.subtitle')}</p>
          </div>
        </div>
        
        <!-- Toggle Vista -->
        <div class="flex items-center gap-4">
          <!-- Selettore Vista Moderno con Gradiente -->
          <div class="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-1 border border-blue-200/50 dark:border-blue-700/30 shadow-sm">
            <div class="flex items-center relative">
              <!-- Indicatore Scorrevole -->
              <div 
                class="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md transition-all duration-300 ease-out"
                style="width: 50%; left: {viewMode === 'table' ? '0%' : '50%'}; transform: translateX(0%);"
              ></div>
              
              <!-- Pulsanti -->
              <button 
                on:click={() => viewMode = 'table'}
                class="relative z-10 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 min-w-[120px] justify-center {viewMode === 'table' ? 'text-white shadow-sm' : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'}"
              >
                <span class="text-base">{viewMode === 'table' ? '📊' : '📋'}</span>
                {$t('warehouse.layout.tableView')}
              </button>
              <button 
                on:click={() => viewMode = 'map'}
                class="relative z-10 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 min-w-[120px] justify-center {viewMode === 'map' ? 'text-white shadow-sm' : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'}"
              >
                <span class="text-base">{viewMode === 'map' ? '🗺️' : '🌐'}</span>
                {$t('warehouse.layout.mapView')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

{#if viewMode === 'table'}
  <!-- Vista Tabellare -->
  <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
    
    <!-- Filtri Avanzati -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-md font-semibold text-neutral-900 dark:text-gray-100 flex items-center gap-2">
          <span class="text-lg">🔍</span>
          <span>{$t('warehouse.layout.searchTitle')}</span>
        </h2>
        <button on:click={resetFilters} class="btn btn-secondary btn-sm">
          🔄 {$t('warehouse.layout.filters.resetFilters')}
        </button>
      </div>
      
      <form id="filtersForm">
        <div class="flex items-end gap-2 flex-nowrap">
          <!-- Ricerca Libera -->
          <div class="min-w-24">
            <input 
              type="text" 
              name="search" 
              placeholder="{$t('warehouse.layout.searchPlaceholder')}"
              value={data.filters?.search || ''}
              class="form-input text-sm"
            />
          </div>
          
          <!-- Zona Filter -->
          <div class="min-w-24">
            <select name="zona" value={data.filters?.zona || ''} class="form-input text-sm">
              <option value="">{$t('warehouse.layout.filters.allZones')}</option>
              {#each data.zone || [] as zona}
                <option value={zona.zona}>{zona.zona}</option>
              {/each}
            </select>
          </div>
          
          <!-- Tipo Filter -->
          <div class="min-w-32">
            <select name="tipo" value={data.filters?.tipo || ''} class="form-input text-sm">
              <option value="">{$t('warehouse.layout.filters.allTypes')}</option>
              <option value="SCAFFALE">📦 {$t('warehouse.locations.types.SCAFFALE')}</option>
              <option value="PALLET">🚚 {$t('warehouse.locations.types.PALLET')}</option>
              <option value="FRIGO">🧊 {$t('warehouse.locations.types.FRIGO')}</option>
              <option value="CONGELATORE">❄️ {$t("warehouse.locations.types.CONGELATORE")}</option>
            </select>
          </div>
          
          <!-- {$t("warehouse.locations.fields.speedZone")} Filter -->
          <div class="min-w-28">
            <select name="zona_velocita" value={data.filters?.zona_velocita || ''} class="form-input text-sm">
              <option value="">{$t('warehouse.layout.filters.allStatuses')}</option>
              <option value="HOT">🔥 Hot</option>
              <option value="WARM">🌡️ Warm</option>
              <option value="COLD">🧊 Cold</option>
            </select>
          </div>
          
          <!-- Stato -->
          <div class="min-w-32">
            <select name="stato" value={data.filters?.stato || ''} class="form-input text-sm">
              <option value="">{$t('warehouse.layout.filters.allStatuses')}</option>
              <option value="vuoto">🟢 {$t('warehouse.layout.filters.empty')}</option>
              <option value="basso">🟡 {$t('warehouse.layout.filters.partial')}</option>
              <option value="medio">🟠 {$t('warehouse.layout.filters.partial')}</option>
              <option value="alto">🔴 {$t('warehouse.layout.filters.full')}</option>
            </select>
          </div>
          
          <!-- Azioni -->
          <div class="flex gap-1">
            <button type="button" on:click={applyFilters} class="btn btn-primary btn-sm px-2">
              🔍
            </button>
            <button type="button" on:click={startCreationMode} class="btn btn-success btn-sm px-2">
              ➕
            </button>
          </div>
        </div>
      </form>
    </div>
    
    <!-- Statistiche Rapide -->
    {#if data.statistiche}
      <div class="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span class="text-sm">🏭</span>
              </div>
            </div>
            <div class="ml-2">
              <p class="text-xs font-medium text-neutral-600 dark:text-gray-400">{$t('warehouse.layout.statistics.totalLocations')}</p>
              <p class="text-xl font-bold text-neutral-900 dark:text-gray-100">{data.statistiche.totale_ubicazioni}</p>
              <p class="text-xs text-neutral-500 dark:text-gray-400">{data.statistiche?.ubicazioni_occupate || 0} {$t('warehouse.layout.statistics.occupiedLocations')}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span class="text-sm">📊</span>
              </div>
            </div>
            <div class="ml-2">
              <p class="text-xs font-medium text-neutral-600 dark:text-gray-400">Occupazione</p>
              <p class="text-xl font-bold text-green-600">{data.statistiche.occupazione_media}%</p>
              <p class="text-xs text-neutral-500 dark:text-gray-400">{data.statistiche.volume_occupato_m3}m³</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span class="text-sm">📦</span>
              </div>
            </div>
            <div class="ml-2">
              <p class="text-xs font-medium text-neutral-600 dark:text-gray-400">SKU Totali</p>
              <p class="text-xl font-bold text-purple-600">{data.statistiche?.sku_totali || 0}</p>
              <p class="text-xs text-neutral-500 dark:text-gray-400">prodotti</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <span class="text-sm">🔢</span>
              </div>
            </div>
            <div class="ml-2">
              <p class="text-xs font-medium text-neutral-600 dark:text-gray-400">Pezzi Totali</p>
              <p class="text-xl font-bold text-cyan-600">{data.statistiche?.pezzi_totali || 0}</p>
              <p class="text-xs text-neutral-500 dark:text-gray-400">unità</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span class="text-sm">🔥</span>
              </div>
            </div>
            <div class="ml-2">
              <p class="text-xs font-medium text-neutral-600 dark:text-gray-400">Zone Hot</p>
              <p class="text-xl font-bold text-yellow-600">{data.statistiche?.zone_hot || 0}</p>
              <p class="text-xs text-neutral-500 dark:text-gray-400">veloci</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span class="text-sm">⚠️</span>
              </div>
            </div>
            <div class="ml-2">
              <p class="text-xs font-medium text-neutral-600 dark:text-gray-400">Oltre 90%</p>
              <p class="text-xl font-bold text-red-600">{data.statistiche?.ubicazioni_piene || 0}</p>
              <p class="text-xs text-neutral-500 dark:text-gray-400">piene</p>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Tabella Ubicazioni -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-neutral-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-neutral-900 dark:text-gray-100">
            📍 {$t('warehouse.layout.table.location')} ({ubicazioniFiltrate?.length || 0})
          </h3>
          
          <div class="flex items-center gap-3">
            <!-- Pulsante Crea Ubicazione -->
            <button 
              on:click={startCreationMode} 
              class="btn btn-primary btn-sm flex items-center gap-2"
            >
              ➕ {$t('warehouse.locations.create')}
            </button>
            
            <!-- Paginazione Info -->
            <div class="text-sm text-neutral-500 dark:text-gray-400">
              Visualizzati {ubicazioniFiltrate?.length || 0} risultati
            </div>
          </div>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200 dark:divide-gray-700 dark:divide-gray-700">
          <thead class="bg-neutral-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                {$t('warehouse.layout.table.location')}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                {$t('warehouse.layout.table.zone')}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                {$t('warehouse.layout.table.type')}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                {$t('warehouse.layout.table.occupancy')}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Velocità
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                {$t('warehouse.layout.table.dimensions')}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                {$t('warehouse.layout.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-neutral-200 dark:divide-gray-700 dark:divide-gray-700">
            {#each ubicazioniFiltrate || [] as ubicazione (ubicazione.id)}
              <tr class="hover:bg-neutral-50 dark:hover:bg-gray-700 cursor-pointer" on:click={() => selectUbicazione(ubicazione)}>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="text-sm font-medium text-neutral-900 dark:text-gray-100 font-mono">
                      {ubicazione.codice_ubicazione}
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral-900 dark:text-gray-100">{ubicazione.zona}</div>
                  <div class="text-sm text-neutral-500 dark:text-gray-400">Area {ubicazione.area || 'N/A'}</div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">
                      {#if ubicazione.tipo === 'SCAFFALE'}📦
                      {:else if ubicazione.tipo === 'PALLET'}🚚
                      {:else if ubicazione.tipo === 'FRIGO'}🧊
                      {:else if ubicazione.tipo === 'CONGELATORE'}❄️
                      {:else}📍{/if}
                    </span>
                    <span class="text-sm text-neutral-900 dark:text-gray-100">{ubicazione.tipo}</span>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <!-- Barra occupazione volume -->
                    <div class="flex items-center mb-1">
                      <div class="w-16 bg-neutral-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          class="h-2 rounded-full transition-all" 
                          style="width: {ubicazione.percentuale_occupazione || 0}%; background-color: {getOccupationColor(ubicazione.percentuale_occupazione || 0)}"
                        ></div>
                      </div>
                      <span class="text-sm font-medium text-neutral-900 dark:text-gray-100">
                        {ubicazione.percentuale_occupazione || 0}%
                      </span>
                    </div>
                    <!-- Informazioni giacenze reali -->
                    <div class="text-xs text-neutral-600 dark:text-gray-400">
                      {#if ubicazione.quantita_totale && ubicazione.quantita_totale > 0}
                        <div class="flex items-center gap-1">
                          <span>📦 {ubicazione.prodotti_diversi} SKU</span>
                          <span class="text-neutral-400 dark:text-gray-500">•</span>
                          <span>🔢 {ubicazione.quantita_totale} pz</span>
                        </div>
                      {:else}
                        <div class="text-neutral-400 dark:text-gray-500">🔵 Vuota</div>
                      {/if}
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {ubicazione.zona_velocita === 'HOT' ? 'bg-red-100 text-red-800' : ubicazione.zona_velocita === 'WARM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
                    {#if ubicazione.zona_velocita === 'HOT'}🔥 Hot
                    {:else if ubicazione.zona_velocita === 'WARM'}🌡️ Warm
                    {:else}🧊 Cold{/if}
                  </span>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-gray-400">
                  <div>{ubicazione.larghezza_cm}×{ubicazione.profondita_cm}×{ubicazione.altezza_cm} cm</div>
                  <div class="text-xs text-neutral-400 dark:text-gray-500">
                    Vol: {((ubicazione.volume_max_cm3 || ubicazione.larghezza_cm * ubicazione.profondita_cm * ubicazione.altezza_cm) / 1000000).toFixed(2)} m³
                    {#if ubicazione.peso_attuale_kg && ubicazione.peso_attuale_kg > 0}
                      <br>Peso: {ubicazione.peso_attuale_kg} kg
                    {/if}
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center gap-1">
                    <button 
                      on:click|stopPropagation={() => loadUbicazioneContent(ubicazione.id)}
                      class="text-blue-600 hover:text-blue-900 p-1 rounded" 
                      title="Vedi contenuto"
                    >
                      📦
                    </button>
                    <button 
                      class="text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-gray-100 p-1 rounded" 
                      title="Modifica"
                    >
                      ✏️
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if !ubicazioniFiltrate || ubicazioniFiltrate.length === 0}
          <div class="text-center py-12">
            <div class="text-4xl mb-4">📭</div>
            <h3 class="text-lg font-medium text-neutral-900 mb-2">Nessuna ubicazione trovata</h3>
            <p class="text-neutral-500">Prova a modificare i filtri di ricerca</p>
            <button on:click={resetFilters} class="mt-4 btn btn-primary">
              🔄 Reset Filtri
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
  
{:else if viewMode === 'map'}
  <!-- Vista Mappa (Codice originale) -->
  <div class="flex h-screen bg-neutral-50 dark:bg-gray-900">
  
  <!-- Sidebar Controls (Codice originale mantenuto) -->
  <div class="w-80 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
    
    <!-- Header -->
    <div class="p-6 border-b">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <span class="text-xl">🏭</span>
        </div>
        <div>
          <h1 class="text-xl font-bold text-neutral-900 dark:text-gray-100">Layout Magazzino</h1>
          <p class="text-sm text-neutral-600 dark:text-gray-400">Vista interattiva ubicazioni</p>
        </div>
      </div>
      
      <!-- Quick Stats -->
      {#if data.statistiche}
        <div class="grid grid-cols-2 gap-3">
          <div class="stat-mini">
            <div class="text-lg font-bold text-blue-600">{data.statistiche.totale_ubicazioni}</div>
            <div class="text-xs text-neutral-600 dark:text-gray-400">Ubicazioni</div>
          </div>
          <div class="stat-mini">
            <div class="text-lg font-bold text-green-600">{data.statistiche.occupazione_media}%</div>
            <div class="text-xs text-neutral-600 dark:text-gray-400">Occupazione</div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Filters -->
    <div class="p-4 border-b">
      <h3 class="font-semibold text-neutral-900 dark:text-gray-100 mb-4">🔍 Filtri</h3>
      <form id="filtersForm" class="space-y-4">
        
        <!-- Zona Filter -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Zona</label>
          <select name="zona" value={data.filters ? data.filters.zona : ''} class="form-input w-full text-sm">
            <option value="">Tutte le zone</option>
            {#each data.zone || [] as zona}
              <option value={zona.zona}>{zona.zona} ({zona.ubicazioni_count})</option>
            {/each}
          </select>
        </div>
        
        <!-- Tipo Filter -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
          <select name="tipo" value={data.filters ? data.filters.tipo : ''} class="form-input w-full text-sm">
            <option value="">Tutti i tipi</option>
            <option value="SCAFFALE">📦 {$t("warehouse.locations.types.SCAFFALE")}</option>
            <option value="PALLET">🚚 {$t("warehouse.locations.types.PALLET")}</option>
            <option value="FRIGO">🧊 {$t("warehouse.locations.types.FRIGO")}</option>
            <option value="CONGELATORE">❄️ {$t("warehouse.locations.types.CONGELATORE")}</option>
          </select>
        </div>
        
        <!-- {$t("warehouse.locations.fields.speedZone")} Filter -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">{$t("warehouse.locations.fields.speedZone")}</label>
          <select name="zona_velocita" value={data.filters ? data.filters.zona_velocita : ''} class="form-input w-full text-sm">
            <option value="">Tutte</option>
            <option value="HOT">🔥 Hot Zone</option>
            <option value="WARM">🌡️ Warm Zone</option>
            <option value="COLD">🧊 Cold Zone</option>
          </select>
        </div>
        
        <div class="flex gap-2 pt-2">
          <button type="button" on:click={applyFilters} class="btn btn-primary btn-sm flex-1">
            Applica
          </button>
          <button type="button" on:click={resetFilters} class="btn btn-secondary btn-sm">
            Reset
          </button>
        </div>
      </form>
    </div>
    
    <!-- Map Controls -->
    <div class="p-4 border-b">
      <h3 class="font-semibold text-neutral-900 dark:text-gray-100 mb-4">🎛️ Controlli Vista</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-neutral-700 dark:text-gray-300">Zoom: {Math.round(zoomLevel * 100)}%</span>
          <button on:click={resetView} class="btn btn-secondary btn-sm">Reset Vista</button>
        </div>
        
        <div class="border-t pt-3">
          {#if !creationMode}
            <button on:click={startCreationMode} class="btn btn-primary w-full mb-2">
              ➕ {$t('warehouse.locations.create')}
            </button>
          {:else}
            <button on:click={closeModals} class="btn btn-secondary w-full mb-2">
              ❌ {$t('common.cancel')}
            </button>
          {/if}
        </div>
        
        <div class="text-sm text-neutral-600 dark:text-gray-400">
          {#if creationMode}
            <div class="bg-blue-50 p-2 rounded text-blue-800">
              📍 <strong>Modalità Creazione Attiva</strong><br>
              Clicca sulla mappa per posizionare la nuova ubicazione
            </div>
          {:else}
            • Scroll: Zoom in/out<br>
            • Drag: Sposta vista<br>
            • Click: Seleziona ubicazione
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Ubicazione Details -->
    {#if selectedUbicazione}
      <div class="p-4 flex-1 overflow-y-auto min-h-[400px]">
        <h3 class="font-semibold text-neutral-900 dark:text-gray-100 mb-4">📍 {$t('warehouse.layout.table.location')} - {$t('common.description')}</h3>
        <div class="space-y-3">
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600 dark:text-gray-400">Codice:</span>
            <span class="text-sm font-mono font-medium">{selectedUbicazione.codice_ubicazione}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600 dark:text-gray-400">Zona:</span>
            <span class="text-sm font-medium">{selectedUbicazione.zona}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600 dark:text-gray-400">Tipo:</span>
            <span class="text-sm">{selectedUbicazione.tipo}</span>
          </div>
          
          {#if selectedUbicazione.percentuale_occupazione !== null}
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-sm text-neutral-600 dark:text-gray-400">Occupazione:</span>
                <span class="text-sm font-medium">{selectedUbicazione.percentuale_occupazione}%</span>
              </div>
              <div class="w-full bg-neutral-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  class="h-2 rounded-full" 
                  style="width: {selectedUbicazione?.percentuale_occupazione || 0}%; background-color: {getOccupationColor(selectedUbicazione?.percentuale_occupazione || 0)}"
                ></div>
              </div>
            </div>
          {/if}
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600 dark:text-gray-400">{$t("warehouse.locations.fields.speedZone")}:</span>
            <span class="text-sm">
              {#if selectedUbicazione.zona_velocita === 'HOT'}🔥 Hot
              {:else if selectedUbicazione.zona_velocita === 'WARM'}🌡️ Warm
              {:else}🧊 Cold{/if}
            </span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600 dark:text-gray-400">Accessibilità:</span>
            <span class="text-sm">{selectedUbicazione.accessibilita}</span>
          </div>
          
          {#if selectedUbicazione.temperatura_controllata}
            <div class="flex justify-between">
              <span class="text-sm text-neutral-600 dark:text-gray-400">Temperatura:</span>
              <span class="text-sm">{selectedUbicazione.temperatura_attuale}°C</span>
            </div>
          {/if}
          
          <div class="pt-4 border-t">
            <button 
              class="btn btn-primary w-full mb-2"
              on:click={() => loadUbicazioneContent(selectedUbicazione.id)}
            >
              📦 Vedi Contenuto
            </button>
          </div>
          
        </div>
      </div>
    {/if}
    
  </div>
  
  <!-- Main Map Area -->
  <div class="flex-1 relative overflow-hidden">
    
    <!-- Map Container -->
    <div 
      class="w-full h-full cursor-move"
      on:wheel={handleWheel}
      on:mousedown={handleMouseDown}
    >
      
      <svg 
        width="100%" 
        height="100%" 
        viewBox="{centerX - viewboxWidth/2 + panX} {centerY - viewboxHeight/2 + panY} {viewboxWidth / zoomLevel} {viewboxHeight / zoomLevel}"
        on:click={handleMapClick}
        style="cursor: {creationMode ? 'crosshair' : 'default'}"
      >
        
        <!-- Grid Background -->
        <defs>
          <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#e5e5e5" stroke-width="0.1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Zone Boundaries -->
        {#each data.zone as zona}
          <rect
            x={zona.x_min - 0.5}
            y={zona.y_min - 0.5}
            width={zona.x_max - zona.x_min + 1}
            height={zona.y_max - zona.y_min + 1}
            fill="none"
            stroke="#94a3b8"
            stroke-width="0.1"
            stroke-dasharray="0.5,0.3"
          />
          <text 
            x={zona.x_min} 
            y={zona.y_min - 0.2} 
            font-size="0.6" 
            fill="#64748b" 
            font-weight="bold"
          >
            ZONA {zona.zona}
          </text>
        {/each}
        
        <!-- Ubicazioni -->
        {#each ubicazioniMappa as ubicazione}
          <rect
            x={ubicazione.coordinata_x - ubicazione.larghezza_cm/200}
            y={ubicazione.coordinata_y - ubicazione.profondita_cm/200}
            width={ubicazione.larghezza_cm/100}
            height={ubicazione.profondita_cm/100}
            fill={getOccupationColor(ubicazione.percentuale_occupazione || 0)}
            stroke={selectedUbicazione?.id === ubicazione.id ? "#1d4ed8" : "#374151"}
            stroke-width={selectedUbicazione?.id === ubicazione.id ? "0.08" : "0.02"}
            opacity={selectedUbicazione?.id === ubicazione.id ? "1" : "0.8"}
            class="cursor-pointer hover:opacity-100 transition-opacity"
            on:click={() => selectUbicazione(ubicazione)}
          />
          
          <!-- Ubicazione Label -->
          <text 
            x={ubicazione.coordinata_x} 
            y={ubicazione.coordinata_y} 
            text-anchor="middle" 
            dominant-baseline="middle"
            font-size="0.25" 
            fill="white" 
            font-weight="600"
            class="pointer-events-none"
          >
            {ubicazione.codice_ubicazione}
          </text>
          
          <!-- Tipo Icon -->
          <text 
            x={ubicazione.coordinata_x} 
            y={ubicazione.coordinata_y - 0.15} 
            text-anchor="middle"
            font-size="0.2"
            class="pointer-events-none"
          >
            {#if ubicazione.tipo === 'SCAFFALE'}📦
            {:else if ubicazione.tipo === 'PALLET'}🚚
            {:else if ubicazione.tipo === 'FRIGO'}🧊
            {:else if ubicazione.tipo === 'CONGELATORE'}❄️
            {:else}📍{/if}
          </text>
        {/each}
        
      </svg>
    </div>
    
    <!-- Legend -->
    <div class="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64">
      <h4 class="font-semibold text-neutral-900 mb-3">🎨 Legenda Occupazione</h4>
      <div class="space-y-2 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #06B6D4"></div>
          <span>0-20% - Vuoto</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #059669"></div>
          <span>20-50% - Poco pieno</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #D97706"></div>
          <span>50-70% - Metà pieno</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #EA580C"></div>
          <span>70-90% - Abbastanza pieno</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #DC2626"></div>
          <span>90%+ - Molto pieno</span>
        </div>
      </div>
    </div>
    
    <!-- Zoom Level Indicator -->
    <div class="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow px-3 py-1">
      <span class="text-sm font-medium">Zoom: {Math.round(zoomLevel * 100)}%</span>
    </div>
    
  </div>
  
</div>
{/if}
</div>

<!-- Content Modal Moderna -->
{#if showContentModal}
  <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" on:click={closeModals}>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden" on:click|stopPropagation>
      
      <!-- Header con Gradiente -->
      <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-t-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span class="text-2xl">📦</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">
                {$t('warehouse.locations.content.title', { code: selectedUbicazione?.codice_ubicazione })}
              </h3>
              <p class="text-emerald-100 text-sm">
                {$t('warehouse.locations.content.empty.subtitle')}
              </p>
            </div>
          </div>
          <button on:click={closeModals} class="text-white/80 hover:text-white text-2xl transition-colors p-2 hover:bg-white/10 rounded-lg">
            ✕
          </button>
        </div>
      </div>
      
      <!-- Body Content -->
      <div class="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 overflow-y-auto max-h-[75vh]">
        
        {#if ubicazioneContent.length > 0}
          <!-- Statistiche Moderne con Gradienti -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 border border-blue-300 rounded-xl p-4 text-center shadow-sm">
              <div class="text-2xl font-bold text-blue-700 dark:text-blue-100">{ubicazioneContent.length}</div>
              <div class="text-sm text-blue-600 dark:text-blue-200 font-medium">{$t('warehouse.locations.content.stats.differentSku')}</div>
              <div class="mt-1">
                <span class="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-600 text-blue-800 dark:text-blue-100 rounded-full">
                  📦 SKU
                </span>
              </div>
            </div>
            <div class="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 border border-green-300 rounded-xl p-4 text-center shadow-sm">
              <div class="text-2xl font-bold text-green-700 dark:text-green-100">{ubicazioneContent.reduce((sum, sku) => sum + sku.quantita_fisica_totale, 0)}</div>
              <div class="text-sm text-green-600 dark:text-green-200 font-medium">{$t('warehouse.locations.content.stats.totalPieces')}</div>
              <div class="mt-1">
                <span class="text-xs px-2 py-1 bg-green-200 dark:bg-green-600 text-green-800 dark:text-green-100 rounded-full">
                  📊 Pezzi
                </span>
              </div>
            </div>
            <div class="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-700 border border-orange-300 rounded-xl p-4 text-center shadow-sm">
              <div class="text-2xl font-bold text-orange-700 dark:text-orange-100">{new Set(ubicazioneContent.flatMap(sku => sku.proprietari.map(p => p.committente_id))).size}</div>
              <div class="text-sm text-orange-600 dark:text-orange-200 font-medium">{$t('warehouse.locations.content.stats.clients')}</div>
              <div class="mt-1">
                <span class="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-600 text-orange-800 dark:text-orange-100 rounded-full">
                  🏢 Clienti
                </span>
              </div>
            </div>
          </div>
          
          <!-- Contenuto SKU Moderno con Gradienti -->
          <div class="space-y-6">
            {#each ubicazioneContent as sku}
              <div class="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700 overflow-hidden">
                <!-- Header SKU con Gradiente -->
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <span class="text-sm font-bold text-white">📦</span>
                        </div>
                        <div>
                          <div class="font-bold text-xl text-white">{sku.sku_code}</div>
                          <div class="text-indigo-100 text-sm">{sku.prodotto_nome || $t('warehouse.locations.content.sku.noDescription')}</div>
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-bold text-white">{sku.quantita_fisica_totale} <span class="text-lg">pz</span></div>
                      <div class="text-indigo-200 text-sm">{(sku.volume_occupato_cm3 / 1000).toFixed(1)} L</div>
                    </div>
                  </div>
                </div>
                
                <!-- Proprietari con Gradienti Colorati per Stato -->
                <div class="p-6">
                  {#if sku.proprietari && sku.proprietari.length > 0}
                    <div class="space-y-4">
                      {#each sku.proprietari as proprietario}
                        <!-- Gradiente dinamico basato sullo stato -->
                        <div class="rounded-xl p-4 shadow-sm border-l-4 {proprietario.stato === 'DISPONIBILE' ? 'bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 border-l-green-500' : proprietario.stato === 'RISERVATO' ? 'bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-800/30 border-l-yellow-500' : 'bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-800/30 border-l-red-500'}">
                          <!-- Header Proprietario Moderno -->
                          <div class="flex justify-between items-start mb-4">
                            <div class="flex-1">
                              <div class="flex items-center gap-3 flex-wrap">
                                <div class="flex items-center gap-2">
                                  <div class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span class="text-xs text-white font-bold">🏢</span>
                                  </div>
                                  <span class="font-bold text-gray-900 dark:text-gray-100">
                                    {proprietario.committente_nome}
                                  </span>
                                </div>
                                <span class="px-3 py-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                  {proprietario.committente_codice}
                                </span>
                                <span class="px-3 py-1 rounded-full font-semibold text-sm {proprietario.stato === 'DISPONIBILE' ? 'bg-gradient-to-r from-green-200 to-emerald-300 dark:from-green-700 dark:to-emerald-600 text-green-800 dark:text-green-200' : proprietario.stato === 'RISERVATO' ? 'bg-gradient-to-r from-yellow-200 to-amber-300 dark:from-yellow-700 dark:to-amber-600 text-yellow-800 dark:text-yellow-200' : 'bg-gradient-to-r from-red-200 to-rose-300 dark:from-red-700 dark:to-rose-600 text-red-800 dark:text-red-200'}">
                                  {proprietario.stato === 'DISPONIBILE' ? '✅ ' + $t('warehouse.locations.content.owner.state.DISPONIBILE') : proprietario.stato === 'RISERVATO' ? '🔒 ' + $t('warehouse.locations.content.owner.state.RISERVATO') : '⚠️ ' + $t('warehouse.locations.content.owner.state.DANNEGGIATO')}
                                </span>
                              </div>
                            </div>
                            <div class="text-right">
                              <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{proprietario.quantita} <span class="text-lg">pz</span></div>
                              <div class="text-sm text-gray-600 dark:text-gray-400">{proprietario.percentuale}% del totale</div>
                            </div>
                          </div>
                          
                          <!-- Dettagli Moderni con Mini-Cards -->
                          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <!-- Lotto Card -->
                            <div class="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800/50 dark:to-purple-700/50 p-3 rounded-lg border border-purple-200 dark:border-purple-600">
                              <div class="flex items-center gap-2 mb-2">
                                <span class="text-sm">🏷️</span>
                                <div class="text-xs font-medium text-purple-700 dark:text-purple-300">{$t("warehouse.locations.content.fields.lot")}</div>
                              </div>
                              <div class="font-bold text-purple-900 dark:text-purple-100">{proprietario.lotto || '—'}</div>
                            </div>
                            
                            <!-- Data Carico Card -->
                            <div class="bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-800/50 dark:to-cyan-700/50 p-3 rounded-lg border border-cyan-200 dark:border-cyan-600">
                              <div class="flex items-center gap-2 mb-2">
                                <span class="text-sm">📅</span>
                                <div class="text-xs font-medium text-cyan-700 dark:text-cyan-300">{$t("warehouse.locations.content.fields.loaded")}</div>
                              </div>
                              <div class="font-bold text-cyan-900 dark:text-cyan-100 text-sm">
                                {proprietario.data_posizionamento ? 
                                  new Date(proprietario.data_posizionamento).toLocaleDateString('it-IT') : '—'}
                              </div>
                              {#if proprietario.giorni_stoccaggio}
                                <div class="text-xs text-cyan-600 dark:text-cyan-400 mt-1">{$t('warehouse.locations.content.fields.daysAgo', { days: proprietario.giorni_stoccaggio })}</div>
                              {/if}
                            </div>
                            
                            <!-- Scadenza Card -->
                            <div class="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800/50 dark:to-orange-700/50 p-3 rounded-lg border border-orange-200 dark:border-orange-600">
                              <div class="flex items-center gap-2 mb-2">
                                <span class="text-sm">⏰</span>
                                <div class="text-xs font-medium text-orange-700 dark:text-orange-300">{$t("warehouse.locations.content.fields.expiry")}</div>
                              </div>
                              <div class="font-bold text-sm {proprietario.giorni_a_scadenza !== null && proprietario.giorni_a_scadenza < 30 ? 'text-red-600 dark:text-red-400' : proprietario.giorni_a_scadenza !== null && proprietario.giorni_a_scadenza < 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-900 dark:text-orange-100'}">
                                {proprietario.data_scadenza ? 
                                  new Date(proprietario.data_scadenza).toLocaleDateString('it-IT') : '—'}
                              </div>
                              {#if proprietario.giorni_a_scadenza !== null}
                                <div class="text-xs mt-1 {proprietario.giorni_a_scadenza < 30 ? 'text-red-500' : proprietario.giorni_a_scadenza < 90 ? 'text-yellow-500' : 'text-orange-600 dark:text-orange-400'}">
                                  {proprietario.giorni_a_scadenza > 0 ? 
                                    $t('warehouse.locations.content.fields.daysLeft', { days: proprietario.giorni_a_scadenza }) : 
                                    $t('warehouse.locations.content.fields.expired')}
                                </div>
                              {/if}
                            </div>
                            
                            <!-- Valore Card -->
                            <div class="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800/50 dark:to-emerald-700/50 p-3 rounded-lg border border-emerald-200 dark:border-emerald-600">
                              <div class="flex items-center gap-2 mb-2">
                                <span class="text-sm">💰</span>
                                <div class="text-xs font-medium text-emerald-700 dark:text-emerald-300">{$t("warehouse.locations.content.fields.value")}</div>
                              </div>
                              <div class="font-bold text-emerald-900 dark:text-emerald-100">
                                {proprietario.costo_acquisto ? 
                                  `€${(proprietario.costo_acquisto * proprietario.quantita).toFixed(2)}` : '—'}
                              </div>
                              {#if proprietario.costo_acquisto}
                                <div class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">€{proprietario.costo_acquisto}/pz</div>
                              {/if}
                            </div>
                          </div>
                          
                          <!-- Note se presenti - Con gradiente -->
                          {#if proprietario.note}
                            <div class="mt-3 p-3 bg-gradient-to-r from-slate-100 to-gray-200 dark:from-slate-800/50 dark:to-gray-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                              <div class="flex items-center gap-2 mb-1">
                                <span class="text-sm">📝</span>
                                <div class="text-xs font-medium text-slate-700 dark:text-slate-300">{$t("warehouse.locations.content.fields.notes")}</div>
                              </div>
                              <div class="text-sm text-slate-900 dark:text-slate-100">{proprietario.note}</div>
                            </div>
                          {/if}
                          
                          <!-- Dettagli UDC con Gradiente Moderno -->
                          {#if proprietario.udc_details && proprietario.udc_details.length > 0}
                            <div class="mt-3 p-4 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-800/30 rounded-lg border border-indigo-200 dark:border-indigo-600">
                              <div class="flex items-center gap-2 mb-3">
                                <div class="w-6 h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                                  <span class="text-xs text-white">🏗️</span>
                                </div>
                                <div class="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                                  {$t("warehouse.locations.content.fields.udcDetails", { count: proprietario.udc_count })}
                                </div>
                              </div>
                              <div class="space-y-2">
                                {#each proprietario.udc_details as udc}
                                  <div class="bg-gradient-to-r from-white to-indigo-50 dark:from-gray-800/80 dark:to-indigo-900/40 border border-indigo-200 dark:border-indigo-600 rounded-lg p-3 shadow-sm">
                                    <div class="flex justify-between items-start">
                                      <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                          <span class="text-xs">📦</span>
                                          <div class="font-bold text-indigo-700 dark:text-indigo-300 text-sm">{udc.udc_barcode}</div>
                                        </div>
                                        <div class="flex items-center gap-3 text-xs">
                                          <span class="px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-200 dark:from-blue-700 dark:to-indigo-600 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                                            {$t("warehouse.locations.content.fields.type")}: {udc.tipo_udc || 'Standard'}
                                          </span>
                                          <span class="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-700 dark:to-emerald-600 text-green-800 dark:text-green-200 rounded-full font-medium">
                                            {$t("warehouse.locations.content.fields.state")}: {udc.udc_stato}
                                          </span>
                                        </div>
                                        {#if udc.posizione}
                                          <div class="mt-1 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                                            <span>📍</span>
                                            <span class="font-medium">{$t("warehouse.locations.content.fields.position")}: {udc.posizione}</span>
                                          </div>
                                        {/if}
                                      </div>
                                      <div class="text-right">
                                        <div class="text-lg font-bold text-indigo-800 dark:text-indigo-200">{udc.quantita} <span class="text-sm">pz</span></div>
                                        {#if udc.lotto}
                                          <div class="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{$t("warehouse.locations.content.fields.lot")}: {udc.lotto}</div>
                                        {/if}
                                      </div>
                                    </div>
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-800/30 rounded-lg p-6 text-center border border-amber-200 dark:border-amber-600">
                      <div class="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span class="text-2xl text-white">⚠️</span>
                      </div>
                      <div class="text-sm font-medium text-amber-800 dark:text-amber-200">{$t("warehouse.locations.content.sku.noOwner")}</div>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Stato Vuoto Moderno -->
          <div class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 text-center border border-gray-300 dark:border-gray-600">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">📭</span>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {$t("warehouse.locations.content.empty.title")}
            </h4>
            <p class="text-gray-600 dark:text-gray-400">
              {$t("warehouse.locations.content.empty.subtitle")}
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Optimization Modal -->
{#if showOptimizationModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeModals}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[80vh] overflow-y-auto" on:click|stopPropagation>
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            🎯 Ottimizzazione Ubicazione {selectedUbicazione?.codice_ubicazione}
          </h3>
          <button on:click={closeModals} class="text-neutral-500 hover:text-neutral-700 dark:text-gray-300">
            ✕
          </button>
        </div>
        
        {#if optimizationSuggestions.length > 0}
          <div class="space-y-4">
            {#each optimizationSuggestions as suggestion}
              <div class="border-l-4 border-orange-400 pl-4 py-2">
                <div class="font-medium text-orange-800">{suggestion.reason}</div>
                <div class="text-sm text-neutral-600 mt-1">
                  Sposta {suggestion.quantita} x {suggestion.sku_code}
                </div>
                <div class="text-sm text-neutral-500 dark:text-gray-400">
                  Da: {suggestion.from_location.codice_ubicazione} → 
                  A: {suggestion.to_location.codice_ubicazione}
                </div>
                <button class="mt-2 btn btn-sm btn-primary">
                  Applica Ottimizzazione
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-neutral-500">
            <div class="text-4xl mb-2">✅</div>
            <div>Ubicazione già ottimizzata</div>
            <div class="text-sm">Nessun miglioramento suggerito</div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal Creazione Ubicazione COMPATTA -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeModals}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden" on:click|stopPropagation>
      
      <!-- Header con Gradiente Moderno -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span class="text-xl">{bulkMode ? '⚡' : '➕'}</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">
                {bulkMode ? $t('warehouse.layout.creation.bulk') : $t('warehouse.locations.form.title')}
              </h3>
              <p class="text-sm text-blue-100">
                {bulkMode ? $t('warehouse.layout.creation.bulkOptions.title') : $t('warehouse.locations.form.description')}
              </p>
            </div>
          </div>
          <button on:click={closeModals} class="text-white/80 hover:text-white text-xl transition-colors">
            ✕
          </button>
        </div>
      </div>

      <!-- Form Content in 2 Columns -->
      <div class="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 overflow-y-auto max-h-[75vh]">
        
        <!-- Toggle Modalità Compatto -->
        <div class="mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-xl">{bulkMode ? '⚡' : '🏗️'}</span>
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100">{$t('warehouse.locations.fields.modalityCreation')}</h4>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {bulkMode ? $t('warehouse.locations.actions.generateMultiple') : $t('warehouse.locations.actions.createSpecific')}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs {!bulkMode ? 'font-bold text-blue-600' : 'text-gray-500'}">{$t('warehouse.locations.fields.singleMode')}</span>
              <button 
                type="button"
                on:click={() => bulkMode = !bulkMode}
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 {bulkMode ? 'bg-purple-600' : 'bg-blue-600'}"
              >
                <span class="sr-only">Toggle bulk mode</span>
                <span class="inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform duration-200 {bulkMode ? 'translate-x-5' : 'translate-x-1'}"></span>
              </button>
              <span class="text-xs {bulkMode ? 'font-bold text-purple-600' : 'text-gray-500'}">{$t('warehouse.locations.fields.bulkMode')}</span>
            </div>
          </div>
        </div>
        
        <!-- Form con handler condizionale - Layout a 2 colonne per eliminare scroll -->
        <form on:submit|preventDefault={bulkMode ? createBulkUbicazioni : createUbicazione} class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- COLONNA SINISTRA -->
          <div class="space-y-4">
            {#if bulkMode}
              <!-- Generazione Multipla Compatta -->
              <div class="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg border border-purple-300">
                <h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                  ⚡ {$t('warehouse.locations.fields.rangeLocations')}
                </h4>
                <div class="grid grid-cols-5 gap-2">
                  <!-- Area -->
                  <div>
                    <label class="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">{$t('warehouse.locations.fields.area')}</label>
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.area_start}
                      placeholder="A"
                      class="form-input w-full text-xs h-8"
                      required
                    />
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.area_end}
                      placeholder="C"
                      class="form-input w-full text-xs h-8 mt-1"
                      required
                    />
                    <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Zona -->
                  <div>
                    <label class="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">{$t('warehouse.locations.fields.zona')}</label>
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.zona_start}
                      placeholder="01"
                      class="form-input w-full text-xs h-8"
                      required
                    />
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.zona_end}
                      placeholder="03"
                      class="form-input w-full text-xs h-8 mt-1"
                      required
                    />
                    <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Fronte -->
                  <div>
                    <label class="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">{$t('warehouse.locations.fields.fronte')}</label>
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.fronte_start}
                      placeholder="01"
                      class="form-input w-full text-xs h-8"
                      required
                    />
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.fronte_end}
                      placeholder="02"
                      class="form-input w-full text-xs h-8 mt-1"
                      required
                    />
                    <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Colonna -->
                  <div>
                    <label class="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">{$t('warehouse.locations.fields.colonna')}</label>
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.colonna_start}
                      placeholder="A"
                      class="form-input w-full text-xs h-8"
                      required
                    />
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.colonna_end}
                      placeholder="D"
                      class="form-input w-full text-xs h-8 mt-1"
                      required
                    />
                    <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Piano -->
                  <div>
                    <label class="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">{$t('warehouse.locations.fields.piano')}</label>
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.piano_start}
                      placeholder="1"
                      class="form-input w-full text-xs h-8"
                      required
                    />
                    <input 
                      type="text" 
                      bind:value={bulkGeneration.piano_end}
                      placeholder="4"
                      class="form-input w-full text-xs h-8 mt-1"
                      required
                    />
                    <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">Da → A</div>
                  </div>
                </div>
                
                <!-- Preview Generazione -->
                {#if previewCount > 0}
                  <div class="mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-purple-300 shadow-inner">
                    <div class="flex items-center justify-between">
                      <div class="text-xs text-gray-600 dark:text-gray-400">Ubicazioni da creare:</div>
                      <div class="text-sm font-bold text-purple-600 dark:text-purple-400">{previewCount}</div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                      {bulkGeneration.area_start}-{bulkGeneration.zona_start}-{bulkGeneration.fronte_start}-{bulkGeneration.colonna_start}-{bulkGeneration.piano_start}
                      → {bulkGeneration.area_end}-{bulkGeneration.zona_end}-{bulkGeneration.fronte_end}-{bulkGeneration.colonna_end}-{bulkGeneration.piano_end}
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Struttura Gerarchica Singola Compatta -->
              <div class="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg border border-blue-300">
                <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  🏗️ {$t('warehouse.locations.fields.hierarchicalStructure')}
                </h4>
                <div class="grid grid-cols-5 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{$t('warehouse.locations.fields.area')}</label>
                    <input 
                      type="text" 
                      bind:value={newUbicazione.area}
                      placeholder="A"
                      class="form-input w-full text-sm h-9"
                      required
                    />
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">Es: A, B, C</div>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{$t("warehouse.locations.fields.zona")}</label>
                    <input 
                      type="text" 
                      bind:value={newUbicazione.zona}
                      placeholder="01"
                      class="form-input w-full text-sm h-9"
                      required
                    />
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">Es: 01, 02</div>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{$t("warehouse.locations.fields.fronte")}</label>
                    <input 
                      type="text" 
                      bind:value={newUbicazione.fronte}
                      placeholder="01"
                      class="form-input w-full text-sm h-9"
                      required
                    />
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">Es: 01, 02</div>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{$t("warehouse.locations.fields.colonna")}</label>
                    <input 
                      type="text" 
                      bind:value={newUbicazione.colonna}
                      placeholder="A"
                      class="form-input w-full text-sm h-9"
                      required
                    />
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">Es: A, B</div>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{$t("warehouse.locations.fields.piano")}</label>
                    <input 
                      type="text" 
                      bind:value={newUbicazione.piano}
                      placeholder="1"
                      class="form-input w-full text-sm h-9"
                      required
                    />
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">Es: 1, 2</div>
                  </div>
                </div>
                
                <!-- Anteprima Codice Compatta -->
                <div class="mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-blue-300 shadow-inner">
                  <div class="text-xs text-gray-600 dark:text-gray-400">Codice Ubicazione:</div>
                  <div class="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {newUbicazione.area}-{newUbicazione.zona}-{newUbicazione.fronte}-{newUbicazione.colonna}-{newUbicazione.piano}
                  </div>
                </div>
              </div>
            {/if}
            
            <!-- Tipo e Caratteristiche Compatte -->
            <div class="bg-gradient-to-br from-green-100 to-teal-200 dark:from-green-900 dark:to-teal-800 p-4 rounded-lg border border-green-300">
              <h4 class="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                ⚙️ {$t("warehouse.locations.fields.characteristics")}
              </h4>
              <div class="space-y-3">
                {#if bulkMode}
                  <div>
                    <label class="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">{$t("warehouse.locations.fields.locationType")}</label>
                    <select bind:value={bulkGeneration.tipo} class="form-input w-full text-sm h-9">
                      <option value="SCAFFALE">📦 {$t("warehouse.locations.types.SCAFFALE")}</option>
                      <option value="PALLET">🚚 {$t("warehouse.locations.types.PALLET")}</option>
                      <option value="FRIGO">🧊 {$t("warehouse.locations.types.FRIGO")}</option>
                      <option value="CONGELATORE">❄️ {$t("warehouse.locations.types.CONGELATORE")}</option>
                      <option value="QUARANTENA">⚠️ {$t("warehouse.locations.types.QUARANTENA")}</option>
                      <option value="UFFICIO">🏢 {$t("warehouse.locations.types.UFFICIO")}</option>
                      <option value="PASSAGGIO">🚶 {$t("warehouse.locations.types.PASSAGGIO")}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">{$t("warehouse.locations.fields.speedZone")}</label>
                    <select bind:value={bulkGeneration.zona_velocita} class="form-input w-full text-sm h-9">
                      <option value="HOT">🔥 {$t("warehouse.locations.speeds.HOT")}</option>
                      <option value="WARM">🌡️ {$t("warehouse.locations.speeds.WARM")}</option>
                      <option value="COLD">🧊 {$t("warehouse.locations.speeds.COLD")}</option>
                    </select>
                  </div>
                {:else}
                  <div>
                    <label class="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">{$t("warehouse.locations.fields.locationType")}</label>
                    <select bind:value={newUbicazione.tipo} class="form-input w-full text-sm h-9">
                      <option value="SCAFFALE">📦 {$t("warehouse.locations.types.SCAFFALE")}</option>
                      <option value="PALLET">🚚 {$t("warehouse.locations.types.PALLET")}</option>
                      <option value="FRIGO">🧊 {$t("warehouse.locations.types.FRIGO")}</option>
                      <option value="CONGELATORE">❄️ {$t("warehouse.locations.types.CONGELATORE")}</option>
                      <option value="QUARANTENA">⚠️ {$t("warehouse.locations.types.QUARANTENA")}</option>
                      <option value="UFFICIO">🏢 {$t("warehouse.locations.types.UFFICIO")}</option>
                      <option value="PASSAGGIO">🚶 {$t("warehouse.locations.types.PASSAGGIO")}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">{$t("warehouse.locations.fields.speedZone")}</label>
                    <select bind:value={newUbicazione.zona_velocita} class="form-input w-full text-sm h-9">
                      <option value="HOT">🔥 {$t("warehouse.locations.speeds.HOT")}</option>
                      <option value="WARM">🌡️ {$t("warehouse.locations.speeds.WARM")}</option>
                      <option value="COLD">🧊 {$t("warehouse.locations.speeds.COLD")}</option>
                    </select>
                  </div>
                {/if}
              </div>
            </div>
          </div>
          
          <!-- COLONNA DESTRA -->
          <div class="space-y-4">
          
          {#if bulkMode}
            <!-- Coordinate e Spaziatura Bulk Compatte -->
            <div class="bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-900 dark:to-red-800 p-4 rounded-lg border border-orange-300">
              <h4 class="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">📍 {$t("warehouse.locations.fields.positionSpacing")}</h4>
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">{$t("warehouse.locations.fields.coordinateXStart")}</label>
                    <input 
                      type="number" 
                      bind:value={bulkGeneration.coordinata_x_start}
                      step="0.1"
                      class="form-input w-full text-sm h-8"
                      required
                    />
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">{$t("warehouse.locations.fields.coordinateYStart")}</label>
                    <input 
                      type="number" 
                      bind:value={bulkGeneration.coordinata_y_start}
                      step="0.1"
                      class="form-input w-full text-sm h-8"
                      required
                    />
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">{$t("warehouse.locations.fields.spacingX")}</label>
                    <input 
                      type="number" 
                      bind:value={bulkGeneration.coordinata_x_spacing}
                      min="50"
                      step="10"
                      class="form-input w-full text-sm h-8"
                      required
                    />
                    <div class="text-xs text-orange-600 dark:text-orange-400 mt-1">{$t("warehouse.locations.fields.horizontalDistance")}</div>
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">{$t("warehouse.locations.fields.spacingY")}</label>
                    <input 
                      type="number" 
                      bind:value={bulkGeneration.coordinata_y_spacing}
                      min="50"
                      step="10"
                      class="form-input w-full text-sm h-8"
                      required
                    />
                    <div class="text-xs text-orange-600 dark:text-orange-400 mt-1">{$t("warehouse.locations.fields.verticalDistance")}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Dimensioni Standard Bulk Compatte -->
            <div class="bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900 dark:to-yellow-800 p-4 rounded-lg border border-amber-300">
              <h4 class="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">📏 {$t("warehouse.locations.fields.standardDimensions")}</h4>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">{$t("warehouse.locations.fields.widthCm")}</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.larghezza_cm}
                    min="10"
                    class="form-input w-full text-sm h-8"
                    required
                  />
                  <div class="text-xs text-amber-600 dark:text-amber-400 mt-1">{$t("warehouse.locations.fields.sameForAll")}</div>
                </div>
                
                <div>
                  <label class="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">{$t("warehouse.locations.fields.depthCm")}</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.profondita_cm}
                    min="10"
                    class="form-input w-full text-sm h-8"
                    required
                  />
                  <div class="text-xs text-amber-600 dark:text-amber-400 mt-1">{$t("warehouse.locations.fields.sameForAll")}</div>
                </div>
                
                <div>
                  <label class="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">{$t("warehouse.locations.fields.heightCm")}</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.altezza_cm}
                    min="10"
                    class="form-input w-full text-sm h-8"
                    required
                  />
                  <div class="text-xs text-amber-600 dark:text-amber-400 mt-1">{$t("warehouse.locations.fields.sameForAll")}</div>
                </div>
              </div>
            </div>
          {:else}
            <!-- Coordinate Singola Compatte -->
            <div class="bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-cyan-900 dark:to-blue-800 p-4 rounded-lg border border-cyan-300">
              <h4 class="font-semibold text-cyan-900 dark:text-cyan-100 mb-3 flex items-center gap-2">📍 {$t("warehouse.locations.fields.position")}</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">{$t("warehouse.locations.fields.coordinateX")}</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.coordinata_x}
                    step="0.1"
                    class="form-input w-full text-sm h-9"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">{$t("warehouse.locations.fields.coordinateY")}</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.coordinata_y}
                    step="0.1"
                    class="form-input w-full text-sm h-9"
                    required
                  />
                </div>
              </div>
              <div class="text-xs text-cyan-600 dark:text-cyan-400 mt-2 flex items-center gap-1">
                💡 {$t("warehouse.locations.fields.automaticCoordinates")}
              </div>
            </div>
            
            <!-- Dimensioni Singola Compatte -->
            <div class="bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-900 dark:to-purple-800 p-4 rounded-lg border border-indigo-300">
              <h4 class="font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">📏 {$t("warehouse.locations.fields.dimensions")}</h4>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">{$t("warehouse.locations.fields.widthCm")}</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.larghezza_cm}
                    min="10"
                    class="form-input w-full text-sm h-9"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">{$t("warehouse.locations.fields.depthCm")}</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.profondita_cm}
                    min="10"
                    class="form-input w-full text-sm h-9"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">{$t("warehouse.locations.fields.heightCm")}</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.altezza_cm}
                    min="10"
                    class="form-input w-full text-sm h-9"
                    required
                  />
                </div>
              </div>
            </div>
          {/if}
          </div>
          
          <!-- Pulsanti Finali Compatti - Span su entrambe le colonne -->
          <div class="lg:col-span-2 mt-4">
            <div class="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border border-gray-300">
              <div class="flex gap-3">
                {#if bulkMode}
                  <button type="button" on:click={() => {bulkMode = false; previewCount = 0;}} 
                    class="btn btn-secondary flex-1 h-12 text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-300">
                    ← {$t("warehouse.locations.actions.singleMode")}
                  </button>
                  <button type="submit" class="btn btn-primary flex-1 h-12 text-sm flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0" disabled={previewCount === 0}>
                    ⚡ {$t("warehouse.locations.actions.createLocations", { count: previewCount })}
                  </button>
                {:else}
                  <button type="button" on:click={resetNewUbicazione} 
                    class="btn btn-secondary flex-1 h-12 text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-300">
                    🔄 {$t("warehouse.locations.actions.resetFields")}
                  </button>
                  <button type="submit" class="btn btn-primary flex-1 h-12 text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0">
                    ✅ {$t("warehouse.locations.actions.createLocation")}
                  </button>
                {/if}
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .stat-mini {
    @apply bg-neutral-50 dark:bg-gray-800 rounded-lg p-3 text-center;
  }
</style>