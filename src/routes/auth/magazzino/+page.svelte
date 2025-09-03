<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import LocationPicker from '$lib/components/LocationPicker.svelte';
  
  export let data;
  
  let selectedUbicazione: any = null;
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let dragStart = { x: 0, y: 0, panX: 0, panY: 0 };
  
  // Initialize default bounds
  let magazzinoBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
  let ubicazioniFiltrate: any[] = [];
  
  // Calcola boundaries del magazzino
  $: if (data && data.ubicazioni && data.ubicazioni.length > 0) {
    magazzinoBounds = {
      minX: Math.min(...data.ubicazioni.map(u => u.coordinata_x - u.larghezza_cm/200)),
      maxX: Math.max(...data.ubicazioni.map(u => u.coordinata_x + u.larghezza_cm/200)),
      minY: Math.min(...data.ubicazioni.map(u => u.coordinata_y - u.profondita_cm/200)),
      maxY: Math.max(...data.ubicazioni.map(u => u.coordinata_y + u.profondita_cm/200))
    };
  }
  
  // Filtra ubicazioni in base ai filtri attivi
  $: if (data && data.ubicazioni) {
    ubicazioniFiltrate = data.ubicazioni.filter(ubicazione => {
      if (data.filters && data.filters.zona && ubicazione.zona !== data.filters.zona) return false;
      if (data.filters && data.filters.tipo && ubicazione.tipo !== data.filters.tipo) return false;
      if (data.filters && data.filters.zona_velocita && ubicazione.zona_velocita !== data.filters.zona_velocita) return false;
      return true;
    });
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
      const response = await fetch(`/api/ubicazioni/${ubicazioneId}/content`);
      if (response.ok) {
        const result = await response.json();
        ubicazioneContent = result.content || [];
        showContentModal = true;
      } else {
        console.error('Failed to load content');
      }
    } catch (error) {
      console.error('Error loading content:', error);
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

<div class="flex h-screen bg-neutral-50">
  
  <!-- Sidebar Controls -->
  <div class="w-80 bg-white shadow-lg flex flex-col">
    
    <!-- Header -->
    <div class="p-6 border-b">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <span class="text-xl">🏭</span>
        </div>
        <div>
          <h1 class="text-xl font-bold text-neutral-900">Layout Magazzino</h1>
          <p class="text-sm text-neutral-600">Vista interattiva ubicazioni</p>
        </div>
      </div>
      
      <!-- Quick Stats -->
      {#if data.statistiche}
        <div class="grid grid-cols-2 gap-3">
          <div class="stat-mini">
            <div class="text-lg font-bold text-blue-600">{data.statistiche.totale_ubicazioni}</div>
            <div class="text-xs text-neutral-600">Ubicazioni</div>
          </div>
          <div class="stat-mini">
            <div class="text-lg font-bold text-green-600">{data.statistiche.occupazione_media}%</div>
            <div class="text-xs text-neutral-600">Occupazione</div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Filters -->
    <div class="p-6 border-b">
      <h3 class="font-semibold text-neutral-900 mb-4">🔍 Filtri</h3>
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
    <div class="p-6 border-b">
      <h3 class="font-semibold text-neutral-900 mb-4">🎛️ Controlli Vista</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-neutral-700">Zoom: {Math.round(zoomLevel * 100)}%</span>
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
        
        <div class="text-sm text-neutral-600">
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
      <div class="p-6 flex-1 overflow-y-auto">
        <h3 class="font-semibold text-neutral-900 mb-4">📍 Dettagli Ubicazione</h3>
        <div class="space-y-3">
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600">Codice:</span>
            <span class="text-sm font-mono font-medium">{selectedUbicazione.codice_ubicazione}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600">Zona:</span>
            <span class="text-sm font-medium">{selectedUbicazione.zona}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600">Tipo:</span>
            <span class="text-sm">{selectedUbicazione.tipo}</span>
          </div>
          
          {#if selectedUbicazione.percentuale_occupazione !== null}
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-sm text-neutral-600">Occupazione:</span>
                <span class="text-sm font-medium">{selectedUbicazione.percentuale_occupazione}%</span>
              </div>
              <div class="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full" 
                  style="width: {selectedUbicazione.percentuale_occupazione}%; background-color: {getOccupationColor(selectedUbicazione.percentuale_occupazione)}"
                ></div>
              </div>
            </div>
          {/if}
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600">Zona Velocità:</span>
            <span class="text-sm">
              {#if selectedUbicazione.zona_velocita === 'HOT'}🔥 Hot
              {:else if selectedUbicazione.zona_velocita === 'WARM'}🌡️ Warm
              {:else}🧊 Cold{/if}
            </span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-sm text-neutral-600">Accessibilità:</span>
            <span class="text-sm">{selectedUbicazione.accessibilita}</span>
          </div>
          
          {#if selectedUbicazione.temperatura_controllata}
            <div class="flex justify-between">
              <span class="text-sm text-neutral-600">Temperatura:</span>
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
            <button 
              class="btn btn-secondary w-full"
              on:click={() => suggestOptimization(selectedUbicazione)}
            >
              🎯 Ottimizza Posizione
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
        {#each ubicazioniFiltrate as ubicazione}
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
    <div class="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
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
    <div class="absolute top-4 right-4 bg-white rounded-lg shadow px-3 py-1">
      <span class="text-sm font-medium">Zoom: {Math.round(zoomLevel * 100)}%</span>
    </div>
    
  </div>
  
</div>

<!-- Content Modal -->
{#if showContentModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeModals}>
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" on:click|stopPropagation>
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900">
            📦 Contenuto Ubicazione {selectedUbicazione?.codice_ubicazione}
          </h3>
          <button on:click={closeModals} class="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        
        {#if ubicazioneContent.length > 0}
          <div class="space-y-3">
            {#each ubicazioneContent as item}
              <div class="border rounded-lg p-4 bg-neutral-50">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <div class="font-semibold text-blue-600">{item.sku_code}</div>
                    <div class="text-sm text-neutral-600">{item.descrizione || 'Prodotto'}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-green-600">{item.quantita} pz</div>
                    <div class="text-xs text-neutral-500">Committente #{item.committente_id}</div>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-neutral-600">Lotto:</span>
                    <span class="font-medium">{item.lotto || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="text-neutral-600">Data carico:</span>
                    <span class="font-medium">{new Date(item.data_posizionamento).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span class="text-neutral-600">Volume:</span>
                    <span class="font-medium">{item.volume?.toFixed(1)} cm³</span>
                  </div>
                  <div>
                    <span class="text-neutral-600">Peso:</span>
                    <span class="font-medium">{item.peso?.toFixed(1)} kg</span>
                  </div>
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
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" on:click|stopPropagation>
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900">
            🎯 Ottimizzazione Ubicazione {selectedUbicazione?.codice_ubicazione}
          </h3>
          <button on:click={closeModals} class="text-neutral-500 hover:text-neutral-700">
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
                <div class="text-sm text-neutral-500">
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
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-neutral-900">
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
              <h4 class="font-medium text-neutral-900">Modalità Creazione</h4>
              <p class="text-sm text-neutral-600">
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
                <span class="inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 {bulkMode ? 'translate-x-6' : 'translate-x-1'}"></span>
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
                  <div class="p-3 bg-white rounded border border-purple-200">
                    <div class="flex items-center justify-between">
                      <div class="text-sm text-neutral-600">Ubicazioni da creare:</div>
                      <div class="text-lg font-bold text-purple-600">{previewCount}</div>
                    </div>
                    <div class="text-xs text-neutral-500 mt-1">
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
              <div class="mt-3 p-3 bg-white rounded border">
                <div class="text-sm text-neutral-600">Codice Ubicazione:</div>
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
              <h4 class="font-semibold text-gray-700 mb-3">📍 Posizione e Spaziatura</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Coordinata X Inizio</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_x_start}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Coordinata Y Inizio</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_y_start}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Spaziatura X (cm)</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_x_spacing}
                    min="50"
                    step="10"
                    class="form-input w-full"
                    required
                  />
                  <div class="text-xs text-gray-600 mt-1">Distanza tra ubicazioni orizzontalmente</div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Spaziatura Y (cm)</label>
                  <input 
                    type="number" 
                    bind:value={bulkGeneration.coordinata_y_spacing}
                    min="50"
                    step="10"
                    class="form-input w-full"
                    required
                  />
                  <div class="text-xs text-gray-600 mt-1">Distanza tra file verticalmente</div>
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
              <h4 class="font-semibold text-gray-700 mb-3">📍 Posizione</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Coordinata X</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.coordinata_x}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Coordinata Y</label>
                  <input 
                    type="number" 
                    bind:value={newUbicazione.coordinata_y}
                    step="0.1"
                    class="form-input w-full"
                    required
                  />
                </div>
              </div>
              <div class="text-sm text-gray-600 mt-2">
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
    @apply bg-neutral-50 rounded-lg p-3 text-center;
  }
</style>