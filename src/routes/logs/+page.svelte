<script lang="ts">
  import { onMount } from 'svelte';
  
  let logs = '';
  let autoRefresh = true;
  let isLoading = false;
  
  async function fetchLogs() {
    if (isLoading) return;
    isLoading = true;
    
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        logs = data.logs;
      } else {
        logs = 'Errore nel caricamento dei log: ' + response.status;
      }
    } catch (error) {
      logs = 'Errore di connessione: ' + error.message;
    } finally {
      isLoading = false;
    }
  }
  
  onMount(() => {
    fetchLogs();
    
    // Auto refresh ogni 2 secondi se attivato
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchLogs();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Debug Logs - WMS Gestionale Magazzino</title>
</svelte:head>

<div class="min-h-screen bg-neutral-900 text-green-400 font-mono p-4">
  <div class="max-w-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 border-b border-neutral-700 pb-4">
      <h1 class="text-2xl font-bold text-white">🔍 Debug Logs Viewer</h1>
      
      <div class="flex items-center gap-4">
        <!-- Auto Refresh Toggle -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            bind:checked={autoRefresh} 
            class="w-4 h-4 text-green-600 bg-neutral-800 border-neutral-600 rounded focus:ring-green-500"
          >
          <span class="text-sm text-neutral-300">Auto Refresh (2s)</span>
        </label>
        
        <!-- Manual Refresh Button -->
        <button 
          on:click={fetchLogs}
          disabled={isLoading}
          class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg text-sm transition-colors"
        >
          {#if isLoading}
            🔄 Loading...
          {:else}
            🔄 Refresh
          {/if}
        </button>
        
        <!-- Clear Button -->
        <button 
          on:click={() => logs = ''}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
    
    <!-- Status Info -->
    <div class="mb-4 text-sm text-neutral-400">
      <p>📄 File: /root/warehouse/gestionale-magazzino/debug.log</p>
      <p>🕒 Last update: {new Date().toLocaleString('it-IT')}</p>
      <p>📊 Auto refresh: {autoRefresh ? '✅ Active' : '❌ Disabled'}</p>
      <p>⏰ Order: Most recent first (latest entries at top)</p>
    </div>
    
    <!-- Logs Display -->
    <div class="bg-neutral-950 border border-neutral-700 rounded-lg overflow-hidden">
      <div class="bg-neutral-800 px-4 py-2 border-b border-neutral-700">
        <span class="text-white font-semibold">Debug Output</span>
        <span class="text-neutral-400 text-sm ml-2">
          {logs.split('\n').length} lines
        </span>
      </div>
      
      <div class="p-4 h-96 overflow-auto">
        {#if logs}
          <pre class="text-xs leading-relaxed whitespace-pre-wrap">{logs}</pre>
        {:else}
          <p class="text-neutral-500 italic">No logs available or logs cleared</p>
        {/if}
      </div>
    </div>
    
    <!-- Instructions -->
    <div class="mt-4 text-xs text-neutral-500 bg-neutral-800 p-3 rounded-lg">
      <h3 class="text-neutral-300 font-semibold mb-2">📝 Instructions:</h3>
      <ul class="space-y-1">
        <li>• Logs are automatically refreshed every 2 seconds when auto-refresh is enabled</li>
        <li>• Use the "Refresh" button to manually update logs</li>
        <li>• Click "Clear" to empty the display (doesn't delete the actual log file)</li>
        <li>• Most recent entries appear at the top, scroll down for older entries</li>
        <li>• This page shows the last 1000 lines of the debug.log file</li>
      </ul>
    </div>
  </div>
</div>