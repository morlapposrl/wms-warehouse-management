<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  let searchTerm = '';
  let isLoading = false;
  
  // Modal dettagli
  let showDetailsModal = false;
  let selectedOperation = null;

  // Formatta data per display
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Formatta durata
  function formatDuration(ms: number) {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
    return `${(ms/60000).toFixed(1)}m`;
  }

  // Colore badge per esito
  function getEsitoBadgeClass(esito: string) {
    switch(esito) {
      case 'SUCCESSO': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'ERRORE': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'WARNING': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }

  // Colore badge per importanza
  function getImportanzaBadgeClass(importanza: string) {
    switch(importanza) {
      case 'CRITICA': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 ring-1 ring-red-600 dark:ring-red-400';
      case 'ALTA': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'MEDIA': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'BASSA': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }

  // Icona per tipo operazione
  function getTipoOperazioneIcon(tipo: string) {
    switch(tipo) {
      case 'CREATE': return '➕';
      case 'READ': return '👁️';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'LOGIN': return '🔓';
      case 'LOGOUT': return '🔒';
      case 'MOVIMENTO': return '📦';
      case 'ORDINE': return '📋';
      case 'CARICO': return '⬇️';
      case 'SCARICO': return '⬆️';
      case 'INVENTARIO': return '📊';
      case 'TRASFERIMENTO': return '🔄';
      default: return '📝';
    }
  }

  // Applica filtri
  function applyFilters() {
    isLoading = true;
    const params = new URLSearchParams(window.location.search);
    
    const form = document.getElementById('filtri-form') as HTMLFormElement;
    const formData = new FormData(form);
    
    // Aggiorna parametri URL
    for (const [key, value] of formData.entries()) {
      if (value && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    }
    
    // Reset pagina quando cambiano filtri
    params.delete('page');
    
    window.location.search = params.toString();
  }

  // Reset filtri
  function resetFilters() {
    window.location.href = window.location.pathname;
  }

  // Cambia pagina
  function changePage(page: number) {
    const params = new URLSearchParams(window.location.search);
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    window.location.search = params.toString();
  }

  // Esporta audit trail
  function exportAuditTrail() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    window.open(`${window.location.pathname}/export?${params.toString()}`, '_blank');
  }

  // Mostra dettagli operazione
  function showOperationDetails(entry: any) {
    selectedOperation = entry;
    showDetailsModal = true;
  }
  
  // Chiudi modal dettagli
  function closeDetailsModal() {
    showDetailsModal = false;
    selectedOperation = null;
  }
  
  // Formatta JSON in modo leggibile
  function formatJsonData(jsonString: string) {
    if (!jsonString) return null;
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  }
</script>

<svelte:head>
  <title>Audit Trail - Gestionale Magazzino</title>
</svelte:head>

<div class="w-full px-4 py-6">
  <!-- Header con statistiche -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">🔍 Audit Trail</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Registro completo delle operazioni di sistema</p>
    </div>
    
    <div class="flex gap-4">
      <button 
        on:click={exportAuditTrail}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        📊 Esporta CSV
      </button>
    </div>
  </div>

  <!-- Statistiche -->
  {#if data.stats}
    <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div class="text-2xl font-bold text-blue-600">{data.stats.totale_operazioni || 0}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Operazioni Totali</div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div class="text-2xl font-bold text-green-600">{data.stats.operazioni_successo || 0}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Successi</div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div class="text-2xl font-bold text-red-600">{data.stats.operazioni_errore || 0}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Errori</div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div class="text-2xl font-bold text-orange-600">{data.stats.operazioni_critiche || 0}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Critiche</div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div class="text-2xl font-bold text-purple-600">{data.stats.utenti_attivi || 0}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Utenti Attivi</div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div class="text-2xl font-bold text-indigo-600">{data.stats.committenti_coinvolti || 0}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Committenti</div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div class="text-2xl font-bold text-teal-600">
          {data.stats.durata_media_ms ? formatDuration(data.stats.durata_media_ms) : '-'}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Durata Media</div>
      </div>
    </div>
  {/if}

  <!-- Filtri -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border mb-6">
    <h2 class="text-lg font-semibold mb-4">🔍 Filtri di Ricerca</h2>
    
    <form id="filtri-form" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Utente -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utente</label>
        <select name="utente_id" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">Tutti gli utenti</option>
          {#each data.utenti as utente}
            <option value={utente.id} selected={data.filters.utente_id === utente.id}>
              {utente.nome} {utente.cognome}
            </option>
          {/each}
        </select>
      </div>

      <!-- Tipo Operazione -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Operazione</label>
        <select name="tipo_operazione" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">Tutte le operazioni</option>
          {#each data.tipiOperazione as tipo}
            <option value={tipo} selected={data.filters.tipo_operazione === tipo}>
              {getTipoOperazioneIcon(tipo)} {tipo}
            </option>
          {/each}
        </select>
      </div>

      <!-- Modulo -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modulo</label>
        <select name="modulo" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">Tutti i moduli</option>
          {#each data.moduli as modulo}
            <option value={modulo} selected={data.filters.modulo === modulo}>
              {modulo}
            </option>
          {/each}
        </select>
      </div>

      <!-- Data Da -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Da</label>
        <input 
          name="data_da"
          type="date" 
          value={data.filters.data_da || ''}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
      </div>

      <!-- Data A -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data A</label>
        <input 
          name="data_a"
          type="date" 
          value={data.filters.data_a || ''}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
      </div>

      <!-- Committente (solo per super admin) -->
      {#if data.canViewAllCommittenti}
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Committente</label>
          <select name="committente_id" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="">Tutti i committenti</option>
            <!-- Qui andrebbero caricati i committenti -->
          </select>
        </div>
      {/if}

      <!-- Pulsanti -->
      <div class="flex gap-2 items-end">
        <button 
          type="button"
          on:click={applyFilters}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔍 Applica
        </button>
        
        <button 
          type="button"
          on:click={resetFilters}
          class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          🔄 Reset
        </button>
      </div>
    </form>
  </div>

  <!-- Tabella Audit Trail -->
  <div class="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data/Ora</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utente</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Operazione</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrizione</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modulo</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Esito</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Importanza</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durata</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each data.auditTrail as entry}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <!-- Data/Ora -->
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {formatDate(entry.timestamp)}
              </td>

              <!-- Utente -->
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.utente_nome}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{entry.utente_email}</div>
                {#if entry.indirizzo_ip}
                  <div class="text-xs text-gray-400 dark:text-gray-500">{entry.indirizzo_ip}</div>
                {/if}
              </td>

              <!-- Operazione -->
              <td class="px-4 py-3">
                <div class="flex items-center">
                  <span class="text-lg mr-2">{getTipoOperazioneIcon(entry.tipo_operazione)}</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.tipo_operazione}</span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{entry.tabella_principale}</div>
              </td>

              <!-- Descrizione -->
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                <div class="truncate" title={entry.descrizione_operazione}>
                  {entry.descrizione_operazione}
                </div>
              </td>

              <!-- Modulo -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {entry.modulo}
                </span>
                {#if entry.funzionalita}
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{entry.funzionalita}</div>
                {/if}
              </td>

              <!-- Esito -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEsitoBadgeClass(entry.esito)}">
                  {entry.esito}
                </span>
                {#if entry.messaggio_errore}
                  <div class="text-xs text-red-500 dark:text-red-400 mt-1" title={entry.messaggio_errore}>
                    ⚠️ Errore
                  </div>
                {/if}
              </td>

              <!-- Importanza -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getImportanzaBadgeClass(entry.importanza)}">
                  {entry.importanza}
                </span>
              </td>

              <!-- Durata -->
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {formatDuration(entry.durata_ms)}
              </td>

              <!-- Azioni -->
              <td class="px-4 py-3 text-sm">
                <button 
                  on:click={() => showOperationDetails(entry)}
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  title="Vedi dettagli"
                >
                  🔍 Dettagli
                </button>
              </td>
            </tr>
          {/each}

          {#if data.auditTrail.length === 0}
            <tr>
              <td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <div class="text-4xl mb-2">📝</div>
                <div class="text-lg font-medium text-gray-600 dark:text-gray-300">Nessuna operazione trovata</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Modifica i filtri per vedere più risultati</div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Paginazione -->
  {#if data.auditTrail.length > 0}
    <div class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Pagina {data.currentPage} • {data.auditTrail.length} risultati mostrati
      </div>
      
      <div class="flex gap-2">
        {#if data.currentPage > 1}
          <button 
            on:click={() => changePage(data.currentPage - 1)}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            ← Precedente
          </button>
        {/if}
        
        {#if data.auditTrail.length === 100}
          <button 
            on:click={() => changePage(data.currentPage + 1)}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            Successiva →
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Modal Dettagli Operazione -->
{#if showDetailsModal && selectedOperation}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" on:click={closeDetailsModal}>
    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" on:click|stopPropagation>
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div class="flex items-center gap-3">
          <div class="text-2xl">
            {getTipoOperazioneIcon(selectedOperation.tipo_operazione)}
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Dettagli Operazione</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">{selectedOperation.operazione_id}</p>
          </div>
        </div>
        <button 
          on:click={closeDetailsModal}
          class="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          title="Chiudi"
        >
          ×
        </button>
      </div>

      <!-- Contenuto Modal -->
      <div class="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Informazioni Generali -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 class="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">📋 Informazioni Generali</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="font-medium text-blue-700 dark:text-blue-300">Data/Ora:</span>
                <span class="text-blue-900 dark:text-blue-100">{formatDate(selectedOperation.data_operazione)}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-blue-700 dark:text-blue-300">Operazione:</span>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  {getTipoOperazioneIcon(selectedOperation.tipo_operazione)} {selectedOperation.tipo_operazione}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-blue-700 dark:text-blue-300">Tabella:</span>
                <span class="text-blue-900 dark:text-blue-100 font-mono">{selectedOperation.tabella_principale}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-blue-700 dark:text-blue-300">Modulo:</span>
                <span class="text-blue-900 dark:text-blue-100">{selectedOperation.modulo}</span>
              </div>
              {#if selectedOperation.funzionalita}
                <div class="flex justify-between">
                  <span class="font-medium text-blue-700 dark:text-blue-300">Funzionalità:</span>
                  <span class="text-blue-900 dark:text-blue-100">{selectedOperation.funzionalita}</span>
                </div>
              {/if}
              <div class="flex justify-between">
                <span class="font-medium text-blue-700 dark:text-blue-300">Esito:</span>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getEsitoBadgeClass(selectedOperation.esito)}">
                  {selectedOperation.esito}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-blue-700 dark:text-blue-300">Importanza:</span>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getImportanzaBadgeClass(selectedOperation.importanza)}">
                  {selectedOperation.importanza}
                </span>
              </div>
              {#if selectedOperation.durata_ms}
                <div class="flex justify-between">
                  <span class="font-medium text-blue-700 dark:text-blue-300">Durata:</span>
                  <span class="text-blue-900 dark:text-blue-100">{formatDuration(selectedOperation.durata_ms)}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Informazioni Utente -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 class="text-lg font-medium text-green-900 dark:text-green-100 mb-3">👤 Utente e Sessione</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="font-medium text-green-700 dark:text-green-300">Nome:</span>
                <span class="text-green-900 dark:text-green-100">{selectedOperation.utente_nome}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-green-700 dark:text-green-300">Email:</span>
                <span class="text-green-900 dark:text-green-100">{selectedOperation.utente_email}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-green-700 dark:text-green-300">IP:</span>
                <span class="text-green-900 dark:text-green-100 font-mono">{selectedOperation.indirizzo_ip}</span>
              </div>
              {#if selectedOperation.committente_nome}
                <div class="flex justify-between">
                  <span class="font-medium text-green-700 dark:text-green-300">Committente:</span>
                  <span class="text-green-900 dark:text-green-100">{selectedOperation.committente_nome}</span>
                </div>
              {/if}
              {#if selectedOperation.device_info}
                <div class="flex justify-between">
                  <span class="font-medium text-green-700 dark:text-green-300">Device:</span>
                  <span class="text-green-900 dark:text-green-100 text-xs">{selectedOperation.device_info}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Descrizione Operazione -->
        <div class="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">📝 Descrizione</h3>
          <p class="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-3 border">
            {selectedOperation.descrizione_operazione}
          </p>
        </div>

        <!-- Entità Coinvolte -->
        {#if selectedOperation.entita_coinvolte}
          <div class="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 class="text-lg font-medium text-purple-900 dark:text-purple-100 mb-3">🔗 Entità Coinvolte</h3>
            <pre class="text-sm text-purple-800 dark:text-purple-200 bg-white dark:bg-gray-800 rounded p-3 border overflow-x-auto">{formatJsonData(selectedOperation.entita_coinvolte)}</pre>
          </div>
        {/if}

        <!-- Dati Precedenti e Nuovi -->
        {#if selectedOperation.dati_precedenti || selectedOperation.dati_nuovi}
          <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {#if selectedOperation.dati_precedenti}
              <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <h3 class="text-lg font-medium text-red-900 dark:text-red-100 mb-3">📋 Dati Precedenti</h3>
                <pre class="text-sm text-red-800 dark:text-red-200 bg-white dark:bg-gray-800 rounded p-3 border overflow-x-auto max-h-40">{formatJsonData(selectedOperation.dati_precedenti)}</pre>
              </div>
            {/if}

            {#if selectedOperation.dati_nuovi}
              <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 class="text-lg font-medium text-green-900 dark:text-green-100 mb-3">📋 Dati Nuovi</h3>
                <pre class="text-sm text-green-800 dark:text-green-200 bg-white dark:bg-gray-800 rounded p-3 border overflow-x-auto max-h-40">{formatJsonData(selectedOperation.dati_nuovi)}</pre>
              </div>
            {/if}
          </div>
        {/if}

        {#if selectedOperation.messaggio_errore}
          <div class="mt-6 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 class="text-lg font-medium text-red-900 dark:text-red-100 mb-3">⚠️ Messaggio Errore</h3>
            <p class="text-red-800 dark:text-red-200 bg-white dark:bg-gray-800 rounded p-3 border">
              {selectedOperation.messaggio_errore}
            </p>
          </div>
        {/if}
      </div>

      <!-- Footer Modal -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <button 
          on:click={closeDetailsModal}
          class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Chiudi
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Animazioni per caricamento */
  .loading {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Miglioramenti responsive */
  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .grid-cols-1 {
      grid-template-columns: 1fr;
    }
    
    table {
      font-size: 0.875rem;
    }
    
    .truncate {
      max-width: 200px;
    }
  }

  /* Badge animations */
  .inline-flex {
    transition: all 0.2s ease;
  }

  .inline-flex:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
</style>