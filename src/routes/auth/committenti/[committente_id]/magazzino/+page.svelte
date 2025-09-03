<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types.js';

  export let data: PageData;

  $: committente = data.committente;
  $: magazzino = data.magazzino;
  $: zone = data.zone;
  $: corridoi = data.corridoi;
  $: ubicazioni = data.ubicazioni;
  $: topUbicazioni = data.topUbicazioni;
  $: statisticheZone = data.statisticheZone;
  $: movimentiRecenti = data.movimentiRecenti;

  // Stato visualizzazione
  let scale = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  let selectedUbicazione = null;
  let showZones = true;
  let showCorridoi = true;
  let showTooltip = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipData = null;

  // Dimensioni SVG (magazzino in metri * 10 per pixel)
  $: svgWidth = magazzino.larghezza_metri * 10;
  $: svgHeight = magazzino.lunghezza_metri * 10;

  function formatNumber(num) {
    return new Intl.NumberFormat('it-IT').format(num);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getOccupationColor(percentage) {
    if (percentage >= 90) return '#EF4444'; // Rosso - pieno
    if (percentage >= 70) return '#F59E0B'; // Giallo - medio
    if (percentage >= 40) return '#10B981'; // Verde - basso
    return '#6B7280'; // Grigio - vuoto
  }

  function getVelocityColor(velocita) {
    switch (velocita) {
      case 'HOT': return '#EF4444';
      case 'WARM': return '#F59E0B';
      case 'COLD': return '#3B82F6';
      default: return '#6B7280';
    }
  }

  function handleUbicazioneClick(ubicazione) {
    selectedUbicazione = selectedUbicazione?.id === ubicazione.id ? null : ubicazione;
  }

  function handleMouseOver(event, ubicazione) {
    tooltipData = ubicazione;
    tooltipX = event.clientX + 10;
    tooltipY = event.clientY - 10;
    showTooltip = true;
  }

  function handleMouseOut() {
    showTooltip = false;
    tooltipData = null;
  }

  function zoomIn() {
    scale = Math.min(scale * 1.2, 3.0);
  }

  function zoomOut() {
    scale = Math.max(scale / 1.2, 0.3);
  }

  function resetView() {
    scale = 1.0;
    offsetX = 0;
    offsetY = 0;
  }

  function getTipoMovimentoIcon(tipo) {
    switch (tipo) {
      case 'RECEIVE': return '📥';
      case 'PUT_AWAY': return '📦';
      case 'PICK': return '🔍';
      case 'REPLENISH': return '🔄';
      case 'TRANSFER': return '↔️';
      default: return '📦';
    }
  }
</script>

<svelte:head>
  <title>Magazzino - {committente?.ragione_sociale} | Gestionale Magazzino</title>
</svelte:head>

<div class="container mx-auto max-w-full p-4">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="flex items-center gap-3">
      <Icon name="building-office" class="w-8 h-8 text-primary-600" />
      Magazzino - {magazzino?.nome}
    </h1>
    <div class="flex items-center gap-4 mt-2 text-sm text-neutral-600">
      <span>{magazzino?.indirizzo}, {magazzino?.citta}</span>
      <span>•</span>
      <span>{formatNumber(magazzino?.superficie_mq)} m²</span>
      <span>•</span>
      <span>Altezza: {magazzino?.altezza_metri}m</span>
      <span>•</span>
      <span>Volume: {formatNumber(magazzino?.volume_mc)} m³</span>
    </div>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
    <!-- Visualizzazione Magazzino -->
    <div class="xl:col-span-3">
      <div class="card mb-6">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-2">
              <Icon name="map" class="w-5 h-5" />
              Layout Magazzino
            </h2>
            <div class="flex items-center gap-2">
              <!-- Controlli visualizzazione -->
              <div class="flex items-center gap-2 mr-4">
                <label class="flex items-center gap-1 text-sm">
                  <input type="checkbox" bind:checked={showZones} class="form-checkbox h-3 w-3">
                  Zone
                </label>
                <label class="flex items-center gap-1 text-sm">
                  <input type="checkbox" bind:checked={showCorridoi} class="form-checkbox h-3 w-3">
                  Corridoi
                </label>
              </div>
              
              <!-- Controlli zoom -->
              <div class="flex items-center gap-1">
                <button on:click={zoomOut} class="btn btn-secondary btn-sm">
                  <Icon name="minus" class="w-4 h-4" />
                </button>
                <span class="text-sm px-2">{Math.round(scale * 100)}%</span>
                <button on:click={zoomIn} class="btn btn-secondary btn-sm">
                  <Icon name="plus" class="w-4 h-4" />
                </button>
                <button on:click={resetView} class="btn btn-secondary btn-sm ml-2">
                  <Icon name="home" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-body p-2">
          <div class="warehouse-container overflow-auto border border-neutral-200 rounded-lg bg-neutral-50" style="height: 600px;">
            <svg 
              width={svgWidth} 
              height={svgHeight}
              viewBox="0 0 {svgWidth} {svgHeight}"
              class="warehouse-map"
              style="transform: scale({scale}) translate({offsetX}px, {offsetY}px); transform-origin: 0 0;"
            >
              <!-- Background Grid -->
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E5E7EB" stroke-width="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              <!-- Zone logiche -->
              {#if showZones}
                {#each zone as zona}
                  <polygon
                    points={zona.poligono.map(p => `${p.x * 10},${p.y * 10}`).join(' ')}
                    fill={zona.colore_hex}
                    fill-opacity="0.2"
                    stroke={zona.colore_hex}
                    stroke-width="2"
                    class="zone-area"
                  />
                  <!-- Label zona -->
                  {#if zona.poligono.length >= 3}
                    {@const centerX = zona.poligono.reduce((sum, p) => sum + p.x, 0) / zona.poligono.length * 10}
                    {@const centerY = zona.poligono.reduce((sum, p) => sum + p.y, 0) / zona.poligono.length * 10}
                    <text x={centerX} y={centerY} text-anchor="middle" class="zone-label text-xs font-semibold" fill={zona.colore_hex}>
                      {zona.nome}
                    </text>
                  {/if}
                {/each}
              {/if}

              <!-- Corridoi -->
              {#if showCorridoi}
                {#each corridoi as corridoio}
                  {#if corridoio.percorso.length >= 2}
                    <polyline
                      points={corridoio.percorso.map(p => `${p.x * 10},${p.y * 10}`).join(' ')}
                      fill="none"
                      stroke="#6B7280"
                      stroke-width={corridoio.larghezza_cm / 10}
                      stroke-linecap="round"
                      opacity="0.4"
                    />
                  {/if}
                {/each}
              {/if}

              <!-- Ubicazioni -->
              {#each ubicazioni as ubicazione}
                {@const hasGiacenza = ubicazione.giacenza_committente > 0}
                {@const occupationColor = hasGiacenza ? getOccupationColor(ubicazione.percentuale_occupazione) : '#E5E7EB'}
                
                <rect
                  x={ubicazione.coordinata_x * 10 - ubicazione.larghezza_cm / 20}
                  y={ubicazione.coordinata_y * 10 - ubicazione.profondita_cm / 20}
                  width={ubicazione.larghezza_cm / 10}
                  height={ubicazione.profondita_cm / 10}
                  fill={occupationColor}
                  stroke={selectedUbicazione?.id === ubicazione.id ? '#1F2937' : occupationColor}
                  stroke-width={selectedUbicazione?.id === ubicazione.id ? 3 : 1}
                  opacity={hasGiacenza ? 0.8 : 0.3}
                  class="ubicazione cursor-pointer hover:stroke-2 transition-all"
                  transform={ubicazione.orientamento ? `rotate(${ubicazione.orientamento} ${ubicazione.coordinata_x * 10} ${ubicazione.coordinata_y * 10})` : ''}
                  on:click={() => handleUbicazioneClick(ubicazione)}
                  on:mouseover={(e) => handleMouseOver(e, ubicazione)}
                  on:mouseout={handleMouseOut}
                />
                
                <!-- Label ubicazione se selezionata o ha giacenza -->
                {#if selectedUbicazione?.id === ubicazione.id || hasGiacenza}
                  <text 
                    x={ubicazione.coordinata_x * 10} 
                    y={ubicazione.coordinata_y * 10 + 4} 
                    text-anchor="middle" 
                    class="ubicazione-label text-xs font-medium fill-current"
                    style="fill: {hasGiacenza ? 'white' : '#6B7280'}"
                  >
                    {ubicazione.codice_ubicazione}
                  </text>
                {/if}
              {/each}
            </svg>
          </div>
        </div>
      </div>

      <!-- Legenda -->
      <div class="card">
        <div class="card-header">
          <h3>Legenda</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-500 rounded"></div>
              <span class="text-sm">Pieno (>90%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-yellow-500 rounded"></div>
              <span class="text-sm">Medio (70-90%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-500 rounded"></div>
              <span class="text-sm">Basso (<70%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-gray-300 rounded"></div>
              <span class="text-sm">Vuoto</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pannello laterale -->
    <div class="xl:col-span-1 space-y-6">
      <!-- Statistiche Zone -->
      <div class="card">
        <div class="card-header">
          <h3 class="flex items-center gap-2">
            <Icon name="chart-bar" class="w-4 h-4" />
            Statistiche Zone
          </h3>
        </div>
        <div class="card-body">
          <div class="space-y-3">
            {#each statisticheZone as stat}
              <div class="flex items-center justify-between p-2 bg-neutral-50 rounded">
                <div>
                  <p class="font-medium text-sm">Zona {stat.zona}</p>
                  <p class="text-xs text-neutral-600">
                    {stat.ubicazioni_occupate}/{stat.totale_ubicazioni} occupate
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-sm">{formatNumber(stat.quantita_totale)}</p>
                  <p class="text-xs text-neutral-600">{Math.round(stat.occupazione_media)}% avg</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Top Ubicazioni -->
      <div class="card">
        <div class="card-header">
          <h3 class="flex items-center gap-2">
            <Icon name="trophy" class="w-4 h-4" />
            Top Ubicazioni
          </h3>
        </div>
        <div class="card-body">
          <div class="space-y-2">
            {#each topUbicazioni.slice(0, 5) as ubicazione, index}
              <div class="flex items-center gap-2 p-2 bg-neutral-50 rounded text-sm">
                <span class="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full font-semibold text-xs">
                  {index + 1}
                </span>
                <div class="flex-1">
                  <p class="font-medium">{ubicazione.codice_ubicazione}</p>
                  <p class="text-xs text-neutral-600">
                    {formatNumber(ubicazione.quantita_committente)} pz • {ubicazione.sku_diversi} SKU
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Movimenti Recenti -->
      <div class="card">
        <div class="card-header">
          <h3 class="flex items-center gap-2">
            <Icon name="clock" class="w-4 h-4" />
            Movimenti Recenti
          </h3>
        </div>
        <div class="card-body">
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each movimentiRecenti.slice(0, 10) as movimento}
              <div class="flex items-center gap-2 p-2 bg-neutral-50 rounded text-xs">
                <span class="text-lg">{getTipoMovimentoIcon(movimento.tipo_movimento)}</span>
                <div class="flex-1">
                  <p class="font-medium">{movimento.tipo_movimento}</p>
                  <p class="text-neutral-600">
                    {movimento.from_ubicazione || 'EXT'} → {movimento.to_ubicazione || 'EXT'}
                  </p>
                  <p class="text-neutral-500">{formatDate(movimento.timestamp_inizio)}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{formatNumber(movimento.quantita)}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Tooltip -->
  {#if showTooltip && tooltipData}
    <div 
      class="fixed z-50 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 pointer-events-none"
      style="left: {tooltipX}px; top: {tooltipY}px;"
    >
      <div class="text-sm">
        <p class="font-semibold">{tooltipData.codice_ubicazione}</p>
        <p class="text-neutral-600">{tooltipData.zona} • {tooltipData.tipo}</p>
        {#if tooltipData.giacenza_committente > 0}
          <p class="text-green-600">{formatNumber(tooltipData.giacenza_committente)} disponibili</p>
          {#if tooltipData.giacenza_riservata > 0}
            <p class="text-yellow-600">{formatNumber(tooltipData.giacenza_riservata)} riservati</p>
          {/if}
        {:else}
          <p class="text-neutral-500">Nessuna giacenza</p>
        {/if}
        <p class="text-xs text-neutral-500 mt-1">
          Occupazione: {Math.round(tooltipData.percentuale_occupazione)}%
        </p>
      </div>
    </div>
  {/if}

  <!-- Dettagli Ubicazione Selezionata -->
  {#if selectedUbicazione}
    <div class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Dettagli Ubicazione</h3>
            <button 
              on:click={() => selectedUbicazione = null}
              class="btn btn-secondary btn-sm"
            >
              <Icon name="x-mark" class="w-4 h-4" />
            </button>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 class="font-medium mb-2">Informazioni Generali</h4>
              <dl class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <dt class="text-neutral-600">Codice:</dt>
                  <dd class="font-medium">{selectedUbicazione.codice_ubicazione}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-600">Zona:</dt>
                  <dd>{selectedUbicazione.zona}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-600">Tipo:</dt>
                  <dd>{selectedUbicazione.tipo}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-600">Coordinate:</dt>
                  <dd>{selectedUbicazione.coordinata_x}m, {selectedUbicazione.coordinata_y}m</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 class="font-medium mb-2">Giacenze Committente</h4>
              <dl class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <dt class="text-neutral-600">Disponibili:</dt>
                  <dd class="font-medium text-green-600">{formatNumber(selectedUbicazione.giacenza_committente)}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-600">Riservate:</dt>
                  <dd class="font-medium text-yellow-600">{formatNumber(selectedUbicazione.giacenza_riservata)}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-600">SKU Diversi:</dt>
                  <dd>{selectedUbicazione.sku_diversi}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-600">Occupazione:</dt>
                  <dd class="font-medium">{Math.round(selectedUbicazione.percentuale_occupazione)}%</dd>
                </div>
              </dl>
            </div>
          </div>

          <div class="flex gap-2">
            <a 
              href="/committenti/{committente.id}/giacenze?ubicazione={selectedUbicazione.codice_ubicazione}"
              class="btn btn-primary btn-sm"
            >
              <Icon name="eye" class="w-4 h-4 mr-2" />
              Vedi Giacenze
            </a>
            <a 
              href="/committenti/{committente.id}/movimenti?ubicazione={selectedUbicazione.codice_ubicazione}"
              class="btn btn-secondary btn-sm"
            >
              <Icon name="arrows-right-left" class="w-4 h-4 mr-2" />
              Vedi Movimenti
            </a>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .warehouse-map {
    cursor: grab;
  }
  .warehouse-map:active {
    cursor: grabbing;
  }
  .ubicazione:hover {
    filter: brightness(1.1);
  }
  .zone-label {
    pointer-events: none;
    user-select: none;
  }
  .ubicazione-label {
    pointer-events: none;
    user-select: none;
  }
</style>