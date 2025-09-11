<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  export let data: PageData;
  export let form: ActionData;

  let creating = false;
  let updatingWaveId: number | null = null;

  // Stato form creazione wave
  let createFormOpen = false;

  // Funzioni selezione ordini
  function selectAllOrders() {
    const checkboxes = document.querySelectorAll('input[name="selected_orders"]') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(cb => cb.checked = true);
  }

  function deselectAllOrders() {
    const checkboxes = document.querySelectorAll('input[name="selected_orders"]') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(cb => cb.checked = false);
  }

  // Funzioni report
  function openPreviewReport(event: Event) {
    const form = (event.target as HTMLButtonElement).closest('form') as HTMLFormElement;
    const formData = new FormData(form);
    const url = `/api/wave-planning/preview-report?${new URLSearchParams(formData as any)}`;
    window.open(url, '_blank');
  }

  function openPerformanceReport(event: Event) {
    const form = (event.target as HTMLButtonElement).closest('form') as HTMLFormElement;
    const formData = new FormData(form);
    const url = `/api/wave-planning/performance-report?${new URLSearchParams(formData as any)}`;
    window.open(url, '_blank');
  }

  // Funzioni helper
  function getBadgeClass(stato: string): string {
    switch (stato) {
      case 'PIANIFICATA': return 'badge-info';
      case 'IN_CORSO': return 'badge-warning';
      case 'COMPLETATA': return 'badge-success';
      case 'ANNULLATA': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('it-IT');
  }

  function formatTipoWave(tipo: string): string {
    const types = {
      'BATCH_PICKING': 'Batch Picking',
      'ZONE_PICKING': 'Zone Picking',
      'DISCRETE_PICKING': 'Discrete Picking',
      'WAVE_PICKING': 'Wave Picking'
    };
    return types[tipo] || tipo;
  }

  function calculateEfficiency(wave: any): string {
    if (!wave.data_inizio || !wave.data_fine || !wave.tempo_stimato_minuti) return '-';
    
    const inicio = new Date(wave.data_inizio);
    const fine = new Date(wave.data_fine);
    const durata_reale = (fine.getTime() - inicio.getTime()) / (1000 * 60); // minuti
    
    const efficienza = (wave.tempo_stimato_minuti / durata_reale) * 100;
    return efficienza.toFixed(1) + '%';
  }

  // Utente admin check (mock - andrà implementato con vero sistema di ruoli)
  $: isAdmin = true; // TODO: implementare controllo ruolo reale

  function toggleCreateForm() {
    createFormOpen = !createFormOpen;
  }
</script>

<div class="w-full px-6 py-8">
  
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="h1">🌊 Wave Planning</h1>
      <p class="text-neutral-600 mt-1">
        Ottimizzazione picking multicommittente
      </p>
    </div>
    <div class="flex gap-2">
      <button 
        class="btn btn-primary"
        on:click={toggleCreateForm}
        disabled={data.ordiniDisponibili.length === 0}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Crea Nuova Wave
      </button>
    </div>
  </div>

  <!-- Alert successo/errore -->
  {#if form?.success}
    <div class="alert alert-success mb-6">
      <strong>Successo:</strong> {form.success}
    </div>
  {/if}
  
  {#if form?.error}
    <div class="alert alert-error mb-6">
      <strong>Errore:</strong> {form.error}
    </div>
  {/if}

  <!-- Statistiche Wave -->
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
    <div class="stat-card text-center bg-blue-50">
      <div class="text-2xl font-bold text-blue-600">{data.statistics?.totale_waves || 0}</div>
      <div class="text-xs text-blue-700">Wave Totali</div>
    </div>
    <div class="stat-card text-center bg-yellow-50">
      <div class="text-2xl font-bold text-yellow-600">{data.statistics?.pianificate || 0}</div>
      <div class="text-xs text-yellow-700">Pianificate</div>
    </div>
    <div class="stat-card text-center bg-orange-50">
      <div class="text-2xl font-bold text-orange-600">{data.statistics?.in_corso || 0}</div>
      <div class="text-xs text-orange-700">In Corso</div>
    </div>
    <div class="stat-card text-center bg-green-50">
      <div class="text-2xl font-bold text-green-600">{data.statistics?.completate || 0}</div>
      <div class="text-xs text-green-700">Completate</div>
    </div>
    <div class="stat-card text-center bg-red-50">
      <div class="text-2xl font-bold text-red-600">{data.statistics?.annullate || 0}</div>
      <div class="text-xs text-red-700">Annullate</div>
    </div>
    <div class="stat-card text-center bg-purple-50">
      <div class="text-2xl font-bold text-purple-600">{data.statistics?.ordini_totali || 0}</div>
      <div class="text-xs text-purple-700">Ordini</div>
    </div>
    <div class="stat-card text-center bg-indigo-50">
      <div class="text-2xl font-bold text-indigo-600">{data.statistics?.picks_totali || 0}</div>
      <div class="text-xs text-indigo-700">Picks</div>
    </div>
    <div class="stat-card text-center bg-gray-50">
      <div class="text-lg font-bold text-gray-600 dark:text-gray-400">{Math.round(data.statistics?.tempo_medio_minuti || 0)}'</div>
      <div class="text-xs text-gray-700 dark:text-gray-300">Tempo Medio</div>
    </div>
  </div>

  <!-- Form Creazione Wave (Collassabile) -->
  {#if createFormOpen}
    <div class="card mb-6">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Crea Nuova Wave Ottimizzata</h2>
          <button class="btn btn-ghost btn-sm" on:click={toggleCreateForm}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-body">
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="text-sm text-blue-800">
              <strong>Ordini disponibili:</strong> {data.ordiniDisponibili.length} ordini pronti per il picking
              {#if data.ordiniDisponibili.length === 0}
                <br><span class="text-red-600 font-medium">⚠️ Nessun ordine disponibile. Verifica che ci siano ordini con stato NUOVO o CONFERMATO.</span>
              {/if}
            </div>
          </div>
        </div>

        <form method="POST" action="?/createWave" use:enhance={({ submitting }) => {
          creating = submitting;
          return async ({ result }) => {
            creating = false;
            if (result.type === 'success') {
              createFormOpen = false;
              goto('/auth/wave-planning', { invalidateAll: true });
            }
          };
        }}>
          
          <!-- Selezione Ordini Specifici -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="text-lg font-semibold mb-3">🎯 Selezione Ordini per Wave</h3>
            <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
              {#each data.ordiniDisponibili as ordine (ordine.id)}
                <label class="flex items-center p-3 hover:bg-white dark:bg-gray-800 border-b border-gray-100 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="selected_orders" 
                    value={ordine.id}
                    class="rounded border-gray-300 text-blue-600"
                  />
                  <div class="ml-3 flex-1">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-medium text-gray-900 dark:text-gray-100">{ordine.numero_ordine}</span>
                        <span class="text-sm text-gray-500 ml-2">({ordine.committente_nome})</span>
                      </div>
                      <div class="text-right text-sm">
                        <div class="text-gray-600 dark:text-gray-400">{ordine.righe_totali} righe</div>
                        <div class="text-blue-600 font-medium">{ordine.quantita_totale} pz</div>
                      </div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      Cliente: {ordine.cliente_fornitore || 'N/D'} | 
                      Data: {new Date(ordine.data_ordine).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </label>
              {:else}
                <div class="p-4 text-center text-gray-500">
                  Nessun ordine disponibile per il wave picking
                </div>
              {/each}
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Seleziona gli ordini da includere nella wave</span>
              <div class="flex gap-2">
                <button 
                  type="button" 
                  class="text-blue-600 hover:underline"
                  on:click={selectAllOrders}
                >
                  Seleziona tutto
                </button>
                <button 
                  type="button" 
                  class="text-gray-600 dark:text-gray-400 hover:underline"
                  on:click={deselectAllOrders}
                >
                  Deseleziona tutto
                </button>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <!-- Committente (opzionale per wave globali) -->
            <div>
              <label class="form-label">Committente</label>
              <select name="committente_id" class="form-input">
                <option value="">🌐 Wave Globale (Multi-Committente)</option>
                {#each data.committenti as committente}
                  <option value={committente.id} selected={committente.id.toString() === data.filters.committente_filter}>
                    {committente.ragione_sociale}
                  </option>
                {/each}
              </select>
              <div class="text-xs text-neutral-500 mt-1">
                Lascia vuoto per wave cross-committente
              </div>
            </div>

            <!-- Tipo Wave -->
            <div>
              <label class="form-label">Algoritmo Ottimizzazione</label>
              <select name="tipo_wave" class="form-input" required>
                <option value="BATCH_PICKING">🔄 Batch Picking (Prodotti Comuni)</option>
                <option value="ZONE_PICKING">🗺️ Zone Picking (Per Zone)</option>
                <option value="DISCRETE_PICKING">⚡ Discrete Picking (Singoli)</option>
                <option value="WAVE_PICKING">🌊 Wave Picking (Standard)</option>
              </select>
            </div>

            <!-- Max Ordini -->
            <div>
              <label class="form-label">Max Ordini per Wave</label>
              <input type="number" name="max_ordini" class="form-input" min="1" max="50" value="20" required>
            </div>

            <!-- Priorità Minima -->
            <div>
              <label class="form-label">Priorità Minima</label>
              <input type="number" name="priorita_minima" class="form-input" min="1" max="10" value="1" required>
            </div>

            <!-- Filtro Date -->
            <div>
              <label class="form-label">Data Da</label>
              <input type="date" name="data_da" class="form-input">
            </div>

            <div>
              <label class="form-label">Data A</label>
              <input type="date" name="data_a" class="form-input">
            </div>

            <!-- Operatore Assegnato -->
            <div class="md:col-span-2 lg:col-span-1">
              <label class="form-label">👤 Operatore Assegnato</label>
              <select name="operatore_id" class="form-input" required>
                <option value="">⚠️ Seleziona operatore obbligatoriamente</option>
                {#each data.operatori as operatore}
                  <option value={operatore.id}>
                    🧑‍💼 {operatore.nome} {operatore.email ? `(${operatore.email})` : ''}
                  </option>
                {/each}
              </select>
              <div class="text-xs text-red-600 mt-1">
                ⚠️ Operatore obbligatorio per l'assegnazione della wave
              </div>
            </div>

          </div>

          <!-- Area Azioni -->
          <div class="flex justify-between items-center mt-6">
            
            <!-- Pulsanti Report -->
            <div class="flex gap-2">
              <button 
                type="button" 
                class="btn btn-secondary"
                on:click={openPreviewReport}
              >
                📊 Anteprima Report
              </button>
              
              <button 
                type="button" 
                class="btn btn-info"
                on:click={openPerformanceReport}
              >
                📈 Report Performance
              </button>
            </div>

            <!-- Pulsante Creazione Wave -->
            <div class="flex gap-2">
              <button type="submit" class="btn btn-primary" disabled={creating || data.ordiniDisponibili.length === 0}>
                {creating ? 'Creazione wave...' : '🚀 Crea Wave Ottimizzata'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  {/if}

  <!-- Filtri -->
  <div class="card mb-6">
    <div class="card-body py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg">🔍</span>
        <span class="text-md font-semibold text-neutral-900 dark:text-gray-100">Filtri</span>
      </div>
      <div class="flex items-end gap-2 flex-nowrap">
        
        <!-- Filtro Committente -->
        <div class="w-36">
          <label class="text-xs text-neutral-600 block">Committente</label>
          <select 
            class="form-input text-sm"
            value={data.filters.committente_filter}
            on:change={(e) => {
              const params = new URLSearchParams(window.location.search);
              const value = e.target.value;
              if (value) {
                params.set('committente', value);
              } else {
                params.delete('committente');
              }
              goto(`/auth/wave-planning?${params.toString()}`);
            }}
          >
            <option value="">Tutti i committenti</option>
            {#each data.committenti as committente}
              <option value={committente.id}>{committente.ragione_sociale}</option>
            {/each}
          </select>
        </div>

        <!-- Filtro Stato -->
        <div class="min-w-36">
          <select 
            class="form-input"
            value={data.filters.stato_filter}
            on:change={(e) => {
              const params = new URLSearchParams(window.location.search);
              const value = e.target.value;
              if (value) {
                params.set('stato', value);
              } else {
                params.delete('stato');
              }
              goto(`/auth/wave-planning?${params.toString()}`);
            }}
          >
            <option value="">Tutti gli stati</option>
            <option value="PIANIFICATA">Pianificate</option>
            <option value="IN_CORSO">In Corso</option>
            <option value="COMPLETATA">Completate</option>
            <option value="ANNULLATA">Annullate</option>
          </select>
        </div>

        <div class="text-sm text-neutral-600 dark:text-gray-400">
          {data.waves.length} wave trovate
        </div>

      </div>
    </div>
  </div>

  <!-- Lista Wave -->
  {#if data.waves.length > 0}
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">Wave Attive</h2>
      </div>
      <div class="card-body">
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Wave</th>
                <th>Tipo</th>
                <th>Committente</th>
                <th>Stato</th>
                <th>Ordini</th>
                <th>Picks</th>
                <th>Tempo Stimato</th>
                <th>Distanza</th>
                <th>Efficienza</th>
                <th>Creata</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each data.waves as wave}
                <tr>
                  <!-- Wave Number -->
                  <td>
                    <div class="font-mono font-medium text-sm">{wave.wave_number}</div>
                    {#if wave.operatore_nome}
                      <div class="text-xs text-neutral-500">👤 {wave.operatore_nome}</div>
                    {/if}
                  </td>

                  <!-- Tipo -->
                  <td>
                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {formatTipoWave(wave.tipo_wave)}
                    </span>
                  </td>

                  <!-- Committente -->
                  <td>
                    <div class="text-sm">
                      {wave.committente_nome || '🌐 Multi-Committente'}
                    </div>
                  </td>

                  <!-- Stato -->
                  <td>
                    <span class="badge {getBadgeClass(wave.stato)}">{wave.stato}</span>
                  </td>

                  <!-- Ordini -->
                  <td class="text-center">
                    <div class="font-medium">{wave.totale_ordini}</div>
                  </td>

                  <!-- Picks -->
                  <td class="text-center">
                    <div class="font-medium">{wave.totale_picks || 0}</div>
                  </td>

                  <!-- Tempo -->
                  <td class="text-center">
                    <div class="font-mono text-sm">
                      {wave.tempo_stimato_minuti ? `${wave.tempo_stimato_minuti}'` : '-'}
                    </div>
                  </td>

                  <!-- Distanza -->
                  <td class="text-center">
                    <div class="font-mono text-sm">
                      {wave.distanza_stimata_metri ? `${Math.round(wave.distanza_stimata_metri)}m` : '-'}
                    </div>
                  </td>

                  <!-- Efficienza -->
                  <td class="text-center">
                    <div class="font-mono text-sm {
                      wave.stato === 'COMPLETATA' ? 'text-green-600' : 
                      wave.stato === 'IN_CORSO' ? 'text-blue-600' : 
                      'text-neutral-400'
                    }">
                      {calculateEfficiency(wave)}
                    </div>
                  </td>

                  <!-- Creata -->
                  <td>
                    <div class="text-sm">{formatDateTime(wave.data_creazione)}</div>
                  </td>

                  <!-- Azioni -->
                  <td>
                    <div class="flex gap-1">
                      
                      <!-- Visualizza Dettaglio -->
                      <a href="/auth/wave-planning/{wave.id}" class="btn btn-ghost btn-sm" title="Visualizza dettaglio">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </a>

                      <!-- Cambia Stato -->
                      {#if wave.stato === 'PIANIFICATA'}
                        <form method="POST" action="?/updateWaveStatus" use:enhance={({ submitting }) => {
                          updatingWaveId = submitting ? wave.id : null;
                          return async ({ result }) => {
                            updatingWaveId = null;
                            if (result.type === 'success') {
                              goto('/auth/wave-planning', { invalidateAll: true });
                            }
                          };
                        }}>
                          <input type="hidden" name="wave_id" value={wave.id}>
                          <input type="hidden" name="nuovo_stato" value="IN_CORSO">
                          <button type="submit" class="btn btn-success btn-sm" disabled={updatingWaveId === wave.id} title="Avvia picking">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"/>
                            </svg>
                          </button>
                        </form>
                      {:else if wave.stato === 'IN_CORSO'}
                        <form method="POST" action="?/updateWaveStatus" use:enhance={({ submitting }) => {
                          updatingWaveId = submitting ? wave.id : null;
                          return async ({ result }) => {
                            updatingWaveId = null;
                            if (result.type === 'success') {
                              goto('/auth/wave-planning', { invalidateAll: true });
                            }
                          };
                        }}>
                          <input type="hidden" name="wave_id" value={wave.id}>
                          <input type="hidden" name="nuovo_stato" value="COMPLETATA">
                          <button type="submit" class="btn btn-primary btn-sm" disabled={updatingWaveId === wave.id} title="Completa wave">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </button>
                        </form>
                      {/if}

                      <!-- Pulsante PDF Picking -->
                      {#if wave.stato === 'PIANIFICATA' || wave.stato === 'IN_CORSO'}
                        <a 
                          href="/api/wave-planning/{wave.id}/picking-pdf" 
                          target="_blank"
                          class="btn btn-secondary btn-sm" 
                          title="Genera PDF Picking per Operatore"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </a>
                      {/if}

                    </div>
                  </td>

                </tr>
              {/each}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  {:else}
    <div class="text-center py-12 text-neutral-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p class="text-lg font-medium">Nessuna wave trovata</p>
      <p class="text-sm mt-2">Crea la prima wave per ottimizzare il picking</p>
      {#if data.ordiniDisponibili.length > 0}
        <button class="btn btn-primary mt-4" on:click={toggleCreateForm}>
          Crea Prima Wave
        </button>
      {:else}
        <p class="text-sm text-red-600 mt-4">⚠️ Non ci sono ordini disponibili per creare wave</p>
      {/if}
    </div>
  {/if}

  <!-- Sezione Algoritmi per Admin -->
  {#if isAdmin}
    <div class="card mt-8">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">📚 Algoritmi di Ottimizzazione - Documentazione Tecnica</h2>
        <p class="text-sm text-neutral-600 mt-1">Visibile solo agli amministratori</p>
      </div>
      <div class="card-body">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Batch Picking -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-3">🔄 Batch Picking Algorithm</h3>
            <div class="text-sm text-blue-800 space-y-2">
              <p><strong>Principio:</strong> Raggruppa ordini che condividono gli stessi prodotti/ubicazioni</p>
              <p><strong>Ottimizzazione:</strong> Riduce i movimenti ripetuti verso la stessa ubicazione</p>
              <p><strong>Ideale per:</strong> Magazzini con alta densità di SKU comuni tra ordini</p>
              <p><strong>Algoritmo:</strong></p>
              <ul class="text-xs list-disc list-inside ml-2 space-y-1">
                <li>Raggruppa task per prodotto_id + ubicazione_id</li>
                <li>Consolida quantità richieste per batch</li>
                <li>Applica TSP (Nearest Neighbor) per percorso ottimale</li>
                <li>Tempo stimato: 45s base + 15s per ordine aggiuntivo</li>
              </ul>
            </div>
          </div>

          <!-- Zone Picking -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 class="font-semibold text-green-900 mb-3">🗺️ Zone Picking Algorithm</h3>
            <div class="text-sm text-green-800 space-y-2">
              <p><strong>Principio:</strong> Divide il magazzino in zone, ogni operatore gestisce una zona</p>
              <p><strong>Ottimizzazione:</strong> Riduce spostamenti cross-zone, aumenta specializzazione</p>
              <p><strong>Ideale per:</strong> Magazzini grandi con layout definito e team multipli</p>
              <p><strong>Algoritmo:</strong></p>
              <ul class="text-xs list-disc list-inside ml-2 space-y-1">
                <li>Raggruppa task per zona (HOT/WARM/COLD)</li>
                <li>Ottimizza percorso interno per ogni zona</li>
                <li>Applica Nearest Neighbor TSP per zona</li>
                <li>Sequenza zone: HOT → WARM → COLD</li>
              </ul>
            </div>
          </div>

          <!-- Discrete Picking -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="font-semibold text-yellow-900 mb-3">⚡ Discrete Picking Algorithm</h3>
            <div class="text-sm text-yellow-800 space-y-2">
              <p><strong>Principio:</strong> Un operatore processa un ordine completo alla volta</p>
              <p><strong>Ottimizzazione:</strong> Zero errori di sorting, alta tracciabilità</p>
              <p><strong>Ideale per:</strong> Ordini urgenti, prodotti di alto valore, ordini piccoli</p>
              <p><strong>Algoritmo:</strong></p>
              <ul class="text-xs list-disc list-inside ml-2 space-y-1">
                <li>Processa ordini singolarmente per priorità</li>
                <li>Calcola percorso ottimale TSP per ogni ordine</li>
                <li>Inizio dal punto più vicino a (0,0) - entrata magazzino</li>
                <li>Tempo stimato: 60s primo pick + 30s + 2*distanza per i successivi</li>
              </ul>
            </div>
          </div>

          <!-- Wave Picking -->
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 class="font-semibold text-purple-900 mb-3">🌊 Wave Picking Algorithm (Standard)</h3>
            <div class="text-sm text-purple-800 space-y-2">
              <p><strong>Principio:</strong> Bilanciamento tra efficienza e flessibilità</p>
              <p><strong>Ottimizzazione:</strong> Combina vantaggi di zone e batch picking</p>
              <p><strong>Ideale per:</strong> Operazioni standard, mix di tipologie ordine</p>
              <p><strong>Algoritmo:</strong></p>
              <ul class="text-xs list-disc list-inside ml-2 space-y-1">
                <li>Seleziona ordini con algoritmo FIFO pesato per priorità</li>
                <li>Applica TSP globale con nearest neighbor</li>
                <li>Considera zone ma non vincola rigidamente</li>
                <li>Adatta velocità di movimento: 2s/metro + tempo base pick</li>
              </ul>
            </div>
          </div>

        </div>

        <!-- Algoritmi Supporto -->
        <div class="bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">⚙️ Algoritmi di Supporto</h3>
          <div class="text-sm text-gray-700 dark:text-gray-300 space-y-3">
            
            <div>
              <strong>🎯 Traveling Salesman Problem (TSP) - Nearest Neighbor:</strong>
              <p class="text-xs mt-1">Euristica per trovare percorso sub-ottimale in tempo O(n²). Inizia dall'entrata magazzino (0,0), sceglie sempre l'ubicazione più vicina non visitata.</p>
            </div>

            <div>
              <strong>📐 Calcolo Distanza Euclidea:</strong>
              <p class="text-xs mt-1">Distanza = √[(x₂-x₁)² + (y₂-y₁)²]. Usata per calcolare tempo di movimento: tempo_base + (distanza * fattore_velocità).</p>
            </div>

            <div>
              <strong>🎲 Wave Number Generation:</strong>
              <p class="text-xs mt-1">Formato: WAVE-[C1|GLOBAL]-YYYYMMDD-NNN. Numerazione progressiva giornaliera per committente o globale.</p>
            </div>

            <div>
              <strong>⚡ Ottimizzazioni Performance:</strong>
              <p class="text-xs mt-1">Indici database su zona+sequenza, prepared statements, transazioni atomiche per batch operations.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  {/if}

</div>