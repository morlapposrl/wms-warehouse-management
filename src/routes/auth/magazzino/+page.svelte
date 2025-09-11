<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
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
    
    console.log(`📍 Posizione selezionata: X=${newUbicazione.coordinata_x}, Y=${newUbicazione.coordinata_y}`);
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
            <h1 class="text-xl font-bold text-neutral-900 dark:text-gray-100">Gestione Magazzino</h1>
            <p class="text-sm text-neutral-600 dark:text-gray-400">Ubicazioni e contenuti</p>
          </div>
        </div>
        
        <!-- Toggle Vista -->
        <div class="flex items-center gap-4">
          <div class="flex items-center bg-neutral-100 rounded-lg p-1">
            <button 
              on:click={() => viewMode = 'table'}
              class="px-3 py-1 text-sm font-medium rounded-md transition-colors {viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-gray-100'}"
            >
              📊 Tabella
            </button>
            <button 
              on:click={() => viewMode = 'map'}
              class="px-3 py-1 text-sm font-medium rounded-md transition-colors {viewMode === 'map' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-gray-100'}"
            >
              🗺️ Mappa
            </button>
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
          <span>Filtri</span>
        </h2>
        <button on:click={resetFilters} class="btn btn-secondary btn-sm">
          🔄 Reset
        </button>
      </div>
      
      <form id="filtersForm">
        <div class="flex items-end gap-2 flex-nowrap">
          <!-- Ricerca Libera -->
          <div class="min-w-24">
            <input 
              type="text" 
              name="search" 
              placeholder="Codice..."
              value={data.filters?.search || ''}
              class="form-input text-sm"
            />
          </div>
          
          <!-- Zona Filter -->
          <div class="min-w-24">
            <select name="zona" value={data.filters?.zona || ''} class="form-input text-sm">
              <option value="">Tutte zone</option>
              {#each data.zone || [] as zona}
                <option value={zona.zona}>{zona.zona}</option>
              {/each}
            </select>
          </div>
          
          <!-- Tipo Filter -->
          <div class="min-w-32">
            <select name="tipo" value={data.filters?.tipo || ''} class="form-input text-sm">
              <option value="">Tutti tipi</option>
              <option value="SCAFFALE">📦 Scaffale</option>
              <option value="PALLET">🚚 Pallet</option>
              <option value="FRIGO">🧊 Frigo</option>
              <option value="CONGELATORE">❄️ Congelatore</option>
            </select>
          </div>
          
          <!-- Zona Velocità Filter -->
          <div class="min-w-28">
            <select name="zona_velocita" value={data.filters?.zona_velocita || ''} class="form-input text-sm">
              <option value="">Tutte velocità</option>
              <option value="HOT">🔥 Hot</option>
              <option value="WARM">🌡️ Warm</option>
              <option value="COLD">🧊 Cold</option>
            </select>
          </div>
          
          <!-- Stato -->
          <div class="min-w-32">
            <select name="stato" value={data.filters?.stato || ''} class="form-input text-sm">
              <option value="">Tutti stati</option>
              <option value="vuoto">🟢 Vuoto</option>
              <option value="basso">🟡 Poco</option>
              <option value="medio">🟠 Medio</option>
              <option value="alto">🔴 Pieno</option>
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
              <p class="text-xs font-medium text-neutral-600 dark:text-gray-400">Ubicazioni</p>
              <p class="text-xl font-bold text-neutral-900 dark:text-gray-100">{data.statistiche.totale_ubicazioni}</p>
              <p class="text-xs text-neutral-500 dark:text-gray-400">{data.statistiche?.ubicazioni_occupate || 0} occupate</p>
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
            📍 Ubicazioni ({ubicazioniFiltrate?.length || 0})
          </h3>
          
          <!-- Paginazione Info -->
          <div class="text-sm text-neutral-500 dark:text-gray-400">
            Visualizzati {ubicazioniFiltrate?.length || 0} risultati
          </div>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200 dark:divide-gray-700 dark:divide-gray-700">
          <thead class="bg-neutral-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Ubicazione
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Zona
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Occupazione
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Velocità
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Dimensioni
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Azioni
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
            <option value="SCAFFALE">📦 Scaffale</option>
            <option value="PALLET">🚚 Pallet</option>
            <option value="FRIGO">🧊 Frigo</option>
            <option value="CONGELATORE">❄️ Congelatore</option>
          </select>
        </div>
        
        <!-- Zona Velocità Filter -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Zona Velocità</label>
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
              ➕ Crea Nuova Ubicazione
            </button>
          {:else}
            <button on:click={closeModals} class="btn btn-secondary w-full mb-2">
              ❌ Annulla Creazione
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
        <h3 class="font-semibold text-neutral-900 dark:text-gray-100 mb-4">📍 Dettagli Ubicazione</h3>
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
            <span class="text-sm text-neutral-600 dark:text-gray-400">Zona Velocità:</span>
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

<!-- Content Modal -->
{#if showContentModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeModals}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[80vh] overflow-y-auto" on:click|stopPropagation>
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-gray-100">
            📦 Contenuto Ubicazione {selectedUbicazione?.codice_ubicazione}
          </h3>
          <button on:click={closeModals} class="text-neutral-500 hover:text-neutral-700 dark:text-gray-300">
            ✕
          </button>
        </div>
        
        {#if ubicazioneContent.length > 0}
          <!-- Statistiche riassuntive -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-xl font-bold text-blue-600">{ubicazioneContent.length}</div>
                <div class="text-xs text-blue-800">SKU Diversi</div>
              </div>
              <div>
                <div class="text-xl font-bold text-green-600">{ubicazioneContent.reduce((sum, sku) => sum + sku.quantita_fisica_totale, 0)}</div>
                <div class="text-xs text-green-800">Pezzi Totali</div>
              </div>
              <div>
                <div class="text-xl font-bold text-orange-600">{new Set(ubicazioneContent.flatMap(sku => sku.proprietari.map(p => p.committente_id))).size}</div>
                <div class="text-xs text-orange-800">Committenti</div>
              </div>
            </div>
          </div>
          
          <!-- Contenuto gerarchico: SKU → Proprietari → Lotti -->
          <div class="space-y-4">
            {#each ubicazioneContent as sku}
              <div class="border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <!-- Header SKU -->
                <div class="bg-neutral-50 px-4 py-3 border-b">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div class="font-semibold text-lg text-blue-700">{sku.sku_code}</div>
                      </div>
                      <div class="text-sm text-neutral-600 mt-1">{sku.prodotto_nome || 'Prodotto senza descrizione'}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-xl font-bold text-neutral-900 dark:text-gray-100">{sku.quantita_fisica_totale} pz</div>
                      <div class="text-xs text-neutral-500 dark:text-gray-400">{(sku.volume_occupato_cm3 / 1000).toFixed(1)} L</div>
                    </div>
                  </div>
                </div>
                
                <!-- Proprietari (Multi-committente) -->
                <div class="p-4">
                  {#if sku.proprietari && sku.proprietari.length > 0}
                    <div class="space-y-3">
                      {#each sku.proprietari as proprietario}
                        <div class="bg-neutral-50 rounded-lg p-3 border-l-4" 
                             class:border-l-green-500={proprietario.stato === 'DISPONIBILE'}
                             class:border-l-yellow-500={proprietario.stato === 'RISERVATO'}
                             class:border-l-red-500={proprietario.stato === 'DANNEGGIATO'}>
                          
                          <!-- Header Proprietario -->
                          <div class="flex justify-between items-start mb-2">
                            <div class="flex-1">
                              <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-neutral-900 dark:text-gray-100">
                                  {proprietario.committente_nome}
                                </span>
                                <span class="text-xs px-2 py-1 rounded-full bg-neutral-200 text-neutral-600 dark:text-gray-400">
                                  {proprietario.committente_codice}
                                </span>
                                <span class="text-xs px-2 py-1 rounded-full" 
                                      class:bg-green-100={proprietario.stato === 'DISPONIBILE'}
                                      class:text-green-700={proprietario.stato === 'DISPONIBILE'}
                                      class:bg-yellow-100={proprietario.stato === 'RISERVATO'}
                                      class:text-yellow-700={proprietario.stato === 'RISERVATO'}
                                      class:bg-red-100={proprietario.stato === 'DANNEGGIATO'}
                                      class:text-red-700={proprietario.stato === 'DANNEGGIATO'}>
                                  {proprietario.stato}
                                </span>
                              </div>
                            </div>
                            <div class="text-right">
                              <div class="text-lg font-semibold text-green-600">{proprietario.quantita} pz</div>
                              <div class="text-xs text-neutral-500 dark:text-gray-400">{proprietario.percentuale}% del totale</div>
                            </div>
                          </div>
                          
                          <!-- Dettagli Lotto e Date -->
                          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div class="text-neutral-600 text-xs">Lotto</div>
                              <div class="font-medium">{proprietario.lotto || '—'}</div>
                            </div>
                            <div>
                              <div class="text-neutral-600 text-xs">Caricato</div>
                              <div class="font-medium">
                                {proprietario.data_posizionamento ? 
                                  new Date(proprietario.data_posizionamento).toLocaleDateString('it-IT') : '—'}
                              </div>
                              {#if proprietario.giorni_stoccaggio}
                                <div class="text-xs text-neutral-500 dark:text-gray-400">{proprietario.giorni_stoccaggio} giorni fa</div>
                              {/if}
                            </div>
                            <div>
                              <div class="text-neutral-600 text-xs">Scadenza</div>
                              <div class="font-medium" 
                                   class:text-red-600={proprietario.giorni_a_scadenza !== null && proprietario.giorni_a_scadenza < 30}
                                   class:text-yellow-600={proprietario.giorni_a_scadenza !== null && proprietario.giorni_a_scadenza < 90}>
                                {proprietario.data_scadenza ? 
                                  new Date(proprietario.data_scadenza).toLocaleDateString('it-IT') : '—'}
                              </div>
                              {#if proprietario.giorni_a_scadenza !== null}
                                <div class="text-xs" 
                                     class:text-red-500={proprietario.giorni_a_scadenza < 30}
                                     class:text-yellow-500={proprietario.giorni_a_scadenza < 90}>
                                  {proprietario.giorni_a_scadenza > 0 ? 
                                    `${proprietario.giorni_a_scadenza} giorni` : 
                                    'SCADUTO'}
                                </div>
                              {/if}
                            </div>
                            <div>
                              <div class="text-neutral-600 text-xs">Valore</div>
                              <div class="font-medium">
                                {proprietario.costo_acquisto ? 
                                  `€${(proprietario.costo_acquisto * proprietario.quantita).toFixed(2)}` : '—'}
                              </div>
                              {#if proprietario.costo_acquisto}
                                <div class="text-xs text-neutral-500 dark:text-gray-400">€{proprietario.costo_acquisto}/pz</div>
                              {/if}
                            </div>
                          </div>
                          
                          <!-- Note se presenti -->
                          {#if proprietario.note}
                            <div class="mt-2 pt-2 border-t border-neutral-200">
                              <div class="text-xs text-neutral-600 dark:text-gray-400">Note: <span class="text-neutral-800 dark:text-gray-200">{proprietario.note}</span></div>
                            </div>
                          {/if}
                          
                          <!-- Dettagli UDC -->
                          {#if proprietario.udc_details && proprietario.udc_details.length > 0}
                            <div class="mt-3 pt-3 border-t border-neutral-200">
                              <div class="text-xs font-medium text-neutral-700 mb-2">🏗️ Dettagli UDC ({proprietario.udc_count})</div>
                              <div class="space-y-2">
                                {#each proprietario.udc_details as udc}
                                  <div class="bg-white dark:bg-gray-800 border border-neutral-200 rounded p-2 text-xs">
                                    <div class="flex justify-between items-start">
                                      <div class="flex-1">
                                        <div class="font-medium text-blue-700">{udc.udc_barcode}</div>
                                        <div class="text-neutral-600 dark:text-gray-400">{udc.tipo_udc || 'Tipo UDC'} • {udc.udc_stato}</div>
                                        {#if udc.posizione}
                                          <div class="text-neutral-500">📍 {udc.posizione}</div>
                                        {/if}
                                      </div>
                                      <div class="text-right">
                                        <div class="font-semibold">{udc.quantita} pz</div>
                                        {#if udc.lotto}
                                          <div class="text-neutral-500">Lotto: {udc.lotto}</div>
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
                    <div class="text-center py-4 text-neutral-500">
                      <div class="text-2xl mb-2">⚠️</div>
                      <div class="text-sm">Nessun proprietario definito per questo SKU</div>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-neutral-500">
            <div class="text-4xl mb-2">📭</div>
            <div>Nessun contenuto in questa ubicazione</div>
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

<!-- Modal Creazione Ubicazione -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeModals}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-neutral-900 dark:text-gray-100">
            {bulkMode ? '⚡ Creazione Multipla Ubicazioni' : '➕ Crea Nuova Ubicazione'}
          </h3>
          <button on:click={closeModals} class="text-neutral-500 hover:text-neutral-700 text-xl">
            ✕
          </button>
        </div>
        
        <!-- Toggle Modalità -->
        <div class="mb-6 p-4 bg-neutral-50 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-neutral-900 dark:text-gray-100">Modalità Creazione</h4>
              <p class="text-sm text-neutral-600 dark:text-gray-400">
                {bulkMode ? 'Genera multiple ubicazioni con range di coordinate' : 'Crea una singola ubicazione'}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm {!bulkMode ? 'font-semibold text-blue-600' : 'text-neutral-500'}">Singola</span>
              <button 
                type="button"
                on:click={() => bulkMode = !bulkMode}
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 {bulkMode ? 'bg-blue-600' : 'bg-neutral-300'}"
              >
                <span class="sr-only">Toggle bulk mode</span>
                <span class="inline-block h-4 w-4 rounded-full bg-white dark:bg-gray-800 shadow transform transition-transform duration-200 {bulkMode ? 'translate-x-6' : 'translate-x-1'}"></span>
              </button>
              <span class="text-sm {bulkMode ? 'font-semibold text-blue-600' : 'text-neutral-500'}">Multipla</span>
            </div>
          </div>
        </div>
        
        <!-- Form con handler condizionale -->
        <form on:submit|preventDefault={bulkMode ? createBulkUbicazioni : createUbicazione} class="space-y-4">
          
          {#if bulkMode}
            <!-- Generazione Multipla -->
            <div class="bg-purple-50 p-4 rounded-lg mb-6">
              <h4 class="font-semibold text-purple-900 mb-3">⚡ Generazione Range Ubicazioni</h4>
              <div class="space-y-4">
                <div class="grid grid-cols-5 gap-3">
                  <!-- Area -->
                  <div>
                    <label class="block text-sm font-medium text-purple-700 mb-1">Area</label>
                    <div class="space-y-1">
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.area_start}
                        placeholder="A"
                        class="form-input w-full text-sm"
                        required
                      />
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.area_end}
                        placeholder="C"
                        class="form-input w-full text-sm"
                        required
                      />
                    </div>
                    <div class="text-xs text-purple-600 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Zona -->
                  <div>
                    <label class="block text-sm font-medium text-purple-700 mb-1">Zona</label>
                    <div class="space-y-1">
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.zona_start}
                        placeholder="01"
                        class="form-input w-full text-sm"
                        required
                      />
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.zona_end}
                        placeholder="03"
                        class="form-input w-full text-sm"
                        required
                      />
                    </div>
                    <div class="text-xs text-purple-600 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Fronte -->
                  <div>
                    <label class="block text-sm font-medium text-purple-700 mb-1">Fronte</label>
                    <div class="space-y-1">
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.fronte_start}
                        placeholder="01"
                        class="form-input w-full text-sm"
                        required
                      />
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.fronte_end}
                        placeholder="02"
                        class="form-input w-full text-sm"
                        required
                      />
                    </div>
                    <div class="text-xs text-purple-600 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Colonna -->
                  <div>
                    <label class="block text-sm font-medium text-purple-700 mb-1">Colonna</label>
                    <div class="space-y-1">
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.colonna_start}
                        placeholder="A"
                        class="form-input w-full text-sm"
                        required
                      />
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.colonna_end}
                        placeholder="D"
                        class="form-input w-full text-sm"
                        required
                      />
                    </div>
                    <div class="text-xs text-purple-600 mt-1">Da → A</div>
                  </div>
                  
                  <!-- Piano -->
                  <div>
                    <label class="block text-sm font-medium text-purple-700 mb-1">Piano</label>
                    <div class="space-y-1">
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.piano_start}
                        placeholder="1"
                        class="form-input w-full text-sm"
                        required
                      />
                      <input 
                        type="text" 
                        bind:value={bulkGeneration.piano_end}
                        placeholder="4"
                        class="form-input w-full text-sm"
                        required
                      />
                    </div>
                    <div class="text-xs text-purple-600 mt-1">Da → A</div>
                  </div>
                </div>
                
                <!-- Preview Generazione -->
                {#if previewCount > 0}
                  <div class="p-3 bg-white dark:bg-gray-800 rounded border border-purple-200">
                    <div class="flex items-center justify-between">
                      <div class="text-sm text-neutral-600 dark:text-gray-400">Ubicazioni da creare:</div>
                      <div class="text-lg font-bold text-purple-600">{previewCount}</div>
                    </div>
                    <div class="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                      Range: {bulkGeneration.area_start}-{bulkGeneration.zona_start}-{bulkGeneration.fronte_start}-{bulkGeneration.colonna_start}-{bulkGeneration.piano_start}
                      → {bulkGeneration.area_end}-{bulkGeneration.zona_end}-{bulkGeneration.fronte_end}-{bulkGeneration.colonna_end}-{bulkGeneration.piano_end}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {:else}
            <!-- Struttura Gerarchica Singola -->
            <div class="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 class="font-semibold text-blue-900 mb-3">🏗️ Struttura Gerarchica</h4>
              <div class="grid grid-cols-5 gap-3">
                <div>
                  <label class="block text-sm font-medium text-blue-700 mb-1">Area</label>
                  <input 
                    type="text" 
                    bind:value={newUbicazione.area}
                    placeholder="A"
                    class="form-input w-full text-sm"
                    required
                  />
                  <div class="text-xs text-blue-600 mt-1">Es: A, B, C</div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-blue-700 mb-1">Zona</label>
                  <input 
                    type="text" 
                    bind:value={newUbicazione.zona}
                    placeholder="01"
                    class="form-input w-full text-sm"
                    required
                  />
                  <div class="text-xs text-blue-600 mt-1">Es: 01, 02, 03</div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-blue-700 mb-1">Fronte</label>
                  <input 
                    type="text" 
                    bind:value={newUbicazione.fronte}
                    placeholder="01"
                    class="form-input w-full text-sm"
                    required
                  />
                  <div class="text-xs text-blue-600 mt-1">Es: 01, 02</div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-blue-700 mb-1">Colonna</label>
                  <input 
                    type="text" 
                    bind:value={newUbicazione.colonna}
                    placeholder="A"
                    class="form-input w-full text-sm"
                    required
                  />
                  <div class="text-xs text-blue-600 mt-1">Es: A, B, C</div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-blue-700 mb-1">Piano</label>
                  <input 
                    type="text" 
                    bind:value={newUbicazione.piano}
                    placeholder="1"
                    class="form-input w-full text-sm"
                    required
                  />
                  <div class="text-xs text-blue-600 mt-1">Es: 1, 2, 3</div>
                </div>
              </div>
              
              <!-- Anteprima Codice -->
              <div class="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                <div class="text-sm text-neutral-600 dark:text-gray-400">Codice Ubicazione:</div>
                <div class="text-lg font-bold text-blue-600 font-mono">
                  {newUbicazione.area}-{newUbicazione.zona}-{newUbicazione.fronte}-{newUbicazione.colonna}-{newUbicazione.piano}
                </div>
              </div>
            </div>
          {/if}
          
          <!-- Tipo e Caratteristiche -->
          <div class="grid grid-cols-2 gap-4">
            {#if bulkMode}
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Tipo Ubicazione</label>
                <select bind:value={bulkGeneration.tipo} class="form-input w-full">
                  <option value="SCAFFALE">📦 Scaffale</option>
                  <option value="PALLET">🚚 Pallet</option>
                  <option value="FRIGO">🧊 Frigo</option>
                  <option value="CONGELATORE">❄️ Congelatore</option>
                  <option value="QUARANTENA">⚠️ Quarantena</option>
                  <option value="UFFICIO">🏢 Ufficio</option>
                  <option value="PASSAGGIO">🚶 Passaggio</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Zona Velocità</label>
                <select bind:value={bulkGeneration.zona_velocita} class="form-input w-full">
                  <option value="HOT">🔥 Hot Zone (alta rotazione)</option>
                  <option value="WARM">🌡️ Warm Zone (media rotazione)</option>
                  <option value="COLD">🧊 Cold Zone (bassa rotazione)</option>
                </select>
              </div>
            {:else}
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Tipo Ubicazione</label>
                <select bind:value={newUbicazione.tipo} class="form-input w-full">
                  <option value="SCAFFALE">📦 Scaffale</option>
                  <option value="PALLET">🚚 Pallet</option>
                  <option value="FRIGO">🧊 Frigo</option>
                  <option value="CONGELATORE">❄️ Congelatore</option>
                  <option value="QUARANTENA">⚠️ Quarantena</option>
                  <option value="UFFICIO">🏢 Ufficio</option>
                  <option value="PASSAGGIO">🚶 Passaggio</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Zona Velocità</label>
                <select bind:value={newUbicazione.zona_velocita} class="form-input w-full">
                  <option value="HOT">🔥 Hot Zone (alta rotazione)</option>
                  <option value="WARM">🌡️ Warm Zone (media rotazione)</option>
                  <option value="COLD">🧊 Cold Zone (bassa rotazione)</option>
                </select>
              </div>
            {/if}
          </div>
          
          {#if bulkMode}
            <!-- Coordinate e Spaziatura Bulk -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">📍 Posizione e Spaziatura</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coordinata X Inizio</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_x_start}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coordinata Y Inizio</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_y_start}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spaziatura X (cm)</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_x_spacing}
                    min="50"
                    step="10"
                    class="form-input w-full"
                    required
                  />
                  <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Distanza tra ubicazioni orizzontalmente</div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spaziatura Y (cm)</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_y_spacing}
                    min="50"
                    step="10"
                    class="form-input w-full"
                    required
                  />
                  <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Distanza tra file verticalmente</div>
                </div>
              </div>
            </div>
            
            <!-- Dimensioni Standard Bulk -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Larghezza (cm)</label>
                <input 
                  type="number" 
                  bind:value={bulkGeneration.larghezza_cm}
                  min="10"
                  class="form-input w-full"
                  required
                />
                <div class="text-xs text-neutral-600 mt-1">Uguale per tutte</div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Profondità (cm)</label>
                <input 
                  type="number" 
                  bind:value={bulkGeneration.profondita_cm}
                  min="10"
                  class="form-input w-full"
                  required
                />
                <div class="text-xs text-neutral-600 mt-1">Uguale per tutte</div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Altezza (cm)</label>
                <input 
                  type="number" 
                  bind:value={bulkGeneration.altezza_cm}
                  min="10"
                  class="form-input w-full"
                  required
                />
                <div class="text-xs text-neutral-600 mt-1">Uguale per tutte</div>
              </div>
            </div>
          {:else}
            <!-- Coordinate Singola -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">📍 Posizione</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coordinata X</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.coordinata_x}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coordinata Y</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.coordinata_y}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                💡 Clicca sulla mappa per impostare automaticamente le coordinate
              </div>
            </div>
            
            <!-- Dimensioni Singola -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Larghezza (cm)</label>
                <input 
                  type="number" 
                  bind:value={newUbicazione.larghezza_cm}
                  min="10"
                  class="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Profondità (cm)</label>
                <input 
                  type="number" 
                  bind:value={newUbicazione.profondita_cm}
                  min="10"
                  class="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1">Altezza (cm)</label>
                <input 
                  type="number" 
                  bind:value={newUbicazione.altezza_cm}
                  min="10"
                  class="form-input w-full"
                  required
                />
              </div>
            </div>
          {/if}
          
          <!-- Pulsanti -->
          <div class="flex gap-3 pt-6 border-t">
            {#if bulkMode}
              <button type="button" on:click={() => {bulkMode = false; previewCount = 0;}} class="btn btn-secondary flex-1">
                ← Modalità Singola
              </button>
              <button type="submit" class="btn btn-primary flex-1" disabled={previewCount === 0}>
                ⚡ Crea {previewCount} Ubicazioni
              </button>
            {:else}
              <button type="button" on:click={resetNewUbicazione} class="btn btn-secondary flex-1">
                🔄 Reset Campi
              </button>
              <button type="submit" class="btn btn-primary flex-1">
                ✅ Crea Ubicazione
              </button>
            {/if}
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