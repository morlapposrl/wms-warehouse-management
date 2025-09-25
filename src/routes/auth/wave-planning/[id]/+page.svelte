<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  $: wave = data.wave;
  $: ordini = data.ordini;
  $: pickTasks = data.pickTasks;
  $: statistiche = data.statistiche;
  $: prodotti_dettaglio = data.prodotti_dettaglio;
  $: ubicazioni_coinvolte = data.ubicazioni_coinvolte;
  $: progress = data.progress;
  $: timeline = data.timeline;

  // Calcola percentuali progress
  $: progressPercent = {
    ordini: progress.ordini_totali > 0 ? Math.round((progress.ordini_completati / progress.ordini_totali) * 100) : 0,
    picks: progress.picks_totali > 0 ? Math.round((progress.picks_completati / progress.picks_totali) * 100) : 0
  };

  // Funzione per ottenere il colore dello stato
  function getStatoColor(stato: string): string {
    switch (stato) {
      case 'PIANIFICATA': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'IN_CORSO': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'COMPLETATA': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'ANNULLATA': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/D';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(minuti: number | null): string {
    if (!minuti) return 'N/D';
    const ore = Math.floor(minuti / 60);
    const min = minuti % 60;
    return ore > 0 ? `${ore}h ${min}m` : `${min}m`;
  }
</script>

<svelte:head>
  <title>Wave {wave.wave_number} - Dettaglio</title>
</svelte:head>

<div class="w-full p-6">
  
  <!-- Header Wave -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📦 Wave {wave.wave_number}
        </h1>
        <div class="flex items-center gap-4">
          <span class="px-3 py-1 rounded-full text-sm font-medium {getStatoColor(wave.stato)}">
            {wave.stato}
          </span>
          <span class="text-gray-600 dark:text-gray-400">{wave.tipo_wave}</span>
          {#if wave.operatore_nome}
            <span class="text-gray-600 dark:text-gray-400">👤 {wave.operatore_nome}</span>
          {/if}
        </div>
      </div>
      <div class="text-right">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Creata il</div>
        <div class="font-medium text-gray-900 dark:text-gray-100">{formatDate(wave.data_creazione)}</div>
        {#if wave.data_inizio}
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">Avviata il</div>
          <div class="font-medium text-gray-900 dark:text-gray-100">{formatDate(wave.data_inizio)}</div>
        {/if}
        {#if wave.data_fine}
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">Completata il</div>
          <div class="font-medium text-gray-900 dark:text-gray-100">{formatDate(wave.data_fine)}</div>
        {/if}
      </div>
    </div>

    <!-- Progress Bars -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Progress Ordini -->
      <div>
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress Ordini</span>
          <span>{progress.ordini_completati}/{progress.ordini_totali}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div class="bg-green-600 h-2 rounded-full transition-all duration-300" 
               style="width: {progressPercent.ordini}%"></div>
        </div>
        <div class="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{progressPercent.ordini}%</div>
      </div>

      <!-- Progress Picks -->
      <div>
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress Picks</span>
          <span>{progress.picks_completati}/{progress.picks_totali}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
               style="width: {progressPercent.picks}%"></div>
        </div>
        <div class="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{progressPercent.picks}%</div>
      </div>
    </div>
  </div>

  <!-- Statistiche Wave -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="text-2xl font-bold text-blue-600">{statistiche?.ordini_totali || 0}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Ordini Totali</div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="text-2xl font-bold text-green-600">{statistiche?.pick_tasks_totali || 0}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Pick Tasks</div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="text-2xl font-bold text-purple-600">
        {formatDuration(wave.tempo_stimato_minuti)}
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Tempo Stimato</div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="text-2xl font-bold text-orange-600">
        {Math.round(wave.distanza_stimata_metri || 0)}m
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Distanza Stimata</div>
    </div>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
    
    <!-- Ordini in Wave -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">📋 Ordini nella Wave ({ordini.length})</h2>
      </div>
      <div class="p-4">
        {#if ordini.length > 0}
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each ordini as ordine}
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div>
                  <div class="font-medium text-gray-900 dark:text-gray-100">{ordine.numero_ordine}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{ordine.cliente_fornitore || 'N/D'}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Seq: {ordine.sequenza} • Colli: {ordine.totale_colli || 0}</div>
                </div>
                <div class="text-right">
                  <div class="px-2 py-1 rounded text-xs font-medium {getStatoColor(ordine.stato)}">
                    {ordine.stato}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ordine.picks_completati}/{ordine.picks_totali} picks
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Nessun ordine nella wave
          </div>
        {/if}
      </div>
    </div>

    <!-- Prodotti Coinvolti -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">📦 Prodotti Coinvolti ({prodotti_dettaglio.length})</h2>
      </div>
      <div class="p-4">
        {#if prodotti_dettaglio.length > 0}
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each prodotti_dettaglio as prodotto}
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div class="flex-1">
                  <div class="font-medium text-sm text-gray-900 dark:text-gray-100">{prodotto.codice}</div>
                  <div class="text-xs text-gray-600 dark:text-gray-400 truncate">{prodotto.descrizione}</div>
                </div>
                <div class="text-right text-sm">
                  <div class="font-medium text-gray-900 dark:text-gray-100">{prodotto.quantita_totale} {prodotto.unita_misura}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{prodotto.tasks_count} pick tasks</div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Nessun prodotto definito
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Ubicazioni e Timeline -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    
    <!-- Ubicazioni Coinvolte -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">🏢 Ubicazioni Coinvolte ({ubicazioni_coinvolte.length})</h2>
      </div>
      <div class="p-4">
        {#if ubicazioni_coinvolte.length > 0}
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each ubicazioni_coinvolte as ubicazione}
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div>
                  <div class="font-medium text-gray-900 dark:text-gray-100">{ubicazione.codice_ubicazione}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Zona: {ubicazione.zona}</div>
                </div>
                <div class="text-right text-sm">
                  <div class="font-medium text-gray-900 dark:text-gray-100">{ubicazione.quantita_totale} unità</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{ubicazione.picks_count} picks</div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Nessuna ubicazione definita
          </div>
        {/if}
      </div>
    </div>

    <!-- Timeline Attività -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">⏱️ Timeline Attività</h2>
      </div>
      <div class="p-4">
        {#if timeline.length > 0}
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each timeline as evento}
              <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div class="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2"></div>
                <div class="flex-1">
                  <div class="font-medium text-sm text-gray-900 dark:text-gray-100">{evento.stato}</div>
                  {#if evento.operatore_nome}
                    <div class="text-xs text-gray-600 dark:text-gray-400">da {evento.operatore_nome}</div>
                  {/if}
                  {#if evento.note}
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{evento.note}</div>
                  {/if}
                </div>
                <div class="text-right text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(evento.data_cambio)}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Nessuna attività registrata
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Azioni -->
  <div class="mt-6 flex gap-3">
    <a href="/auth/wave-planning" 
       class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
      ⬅️ Torna alla Lista
    </a>
    
    <a href="/api/wave-planning/{wave.id}/picking-pdf" target="_blank"
       class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
      📄 Scarica PDF Picking
    </a>
    
    {#if wave.stato === 'PIANIFICATA'}
      <form method="POST" action="/auth/wave-planning?/updateWaveStatus" class="inline">
        <input type="hidden" name="wave_id" value={wave.id} />
        <input type="hidden" name="nuovo_stato" value="IN_CORSO" />
        <button type="submit" 
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
          ▶️ Avvia Wave
        </button>
      </form>
    {/if}
    
    {#if wave.stato === 'IN_CORSO'}
      <form method="POST" action="/auth/wave-planning?/updateWaveStatus" class="inline">
        <input type="hidden" name="wave_id" value={wave.id} />
        <input type="hidden" name="nuovo_stato" value="COMPLETATA" />
        <button type="submit" 
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          ✅ Completa Wave
        </button>
      </form>
    {/if}
  </div>
</div>