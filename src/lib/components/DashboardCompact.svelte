<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from '../../routes/auth/dashboard/$types.js';

  export let data: PageData;

  let autoRefresh = true;
  let refreshInterval: NodeJS.Timeout;
  let lastUpdate = new Date();
  let isRefreshing = false;
  let pulseAnimation = false;

  import { realtimeData, connectionStatus, realtimeManager } from '$lib/stores/realtime.js';

  // Real-time data subscription
  $: rtData = $realtimeData;
  $: isConnected = $connectionStatus === 'connected';

  // 🔥 COMBINAZIONE DATI SERVER + REAL-TIME
  $: kpiSummary = {
    ordini_oggi: rtData?.kpi?.ordini_oggi || data.kpiData?.ordini_oggi || 0,
    movimenti_oggi: rtData?.kpi?.movimenti_oggi || data.kpiData?.movimenti_oggi || 0,
    operatori_attivi: rtData?.kpi?.operatori_attivi || data.kpiData?.operatori_attivi || 0,
    spedizioni_oggi: rtData?.kpi?.spedizioni_oggi || data.kpiData?.spedizioni_oggi || 0
  };

  $: operatoriPerformance = Array.isArray(rtData?.operatori) && rtData.operatori.length > 0
    ? rtData.operatori.map(op => ({
        nome: op.nome + ' ' + (op.cognome || ''),
        movimenti_completati: op.movimenti_completati || 0,
        zona: op.zona || 'A',
        status: op.status || 'INATTIVO'
      }))
    : (data.operatoriPerformance || []).map(op => ({
        nome: op.nome + ' ' + (op.cognome || ''),
        movimenti_completati: op.movimenti_completati || 0,
        zona: op.specializzazione || 'A',
        status: op.status_operatore || 'INATTIVO'
      }));

  $: zoneStatus = Array.isArray(rtData?.zone) && rtData.zone.length > 0
    ? rtData.zone.map(zona => ({
        zona: zona.zona || 'N/A',
        percentuale_occupazione: zona.percentuale_occupazione || 0,
        prodotti_diversi: zona.prodotti_diversi || 0
      }))
    : (data.zoneStatus || []).map(zona => ({
        zona: zona.zona_velocita || 'N/A',
        percentuale_occupazione: zona.percentuale_occupazione || 0,
        prodotti_diversi: zona.ubicazioni_occupate || 0
      }));

  $: alertsOperatori = Array.isArray(rtData?.alerts) && rtData.alerts.length > 0
    ? rtData.alerts 
    : data.alertsOperatori || [];

  $: giacenzeCritiche = Array.isArray(rtData?.giacenze) && rtData.giacenze.length > 0
    ? rtData.giacenze.filter(item => 
        item.quantita_disponibile <= 10
      ).map(item => ({
        prodotto_codice: item.prodotto_codice,
        prodotto_descrizione: item.prodotto_descrizione,
        quantita: item.quantita_disponibile,
        scorta_minima: item.scorta_minima || 50,
        livello_criticita: item.quantita_disponibile === 0 ? 'ESAURITO' : 'CRITICO'
      }))
    : (data.inventoryVelocity || []).filter(item => 
        item.quantita_disponibile <= 10
      ).map(item => ({
        prodotto_codice: item.sku_code,
        prodotto_descrizione: item.descrizione,
        quantita: item.quantita_disponibile,
        scorta_minima: 50,
        livello_criticita: item.quantita_disponibile === 0 ? 'ESAURITO' : 'CRITICO'
      }));

  $: movimentiRecenti = Array.isArray(rtData?.movimenti) && rtData.movimenti.length > 0
    ? rtData.movimenti.slice(0, 6).map(movimento => ({
        tipo_movimento: movimento.tipo_movimento || 'PICK',
        prodotto_codice: movimento.prodotto_codice || 'N/A',
        quantita: movimento.quantita || 0,
        data_movimento: movimento.data_movimento || new Date().toISOString(),
        operatore: movimento.operatore || 'Sistema'
      }))
    : (data.throughputOrario || []).slice(0, 6).map((throughput, index) => ({
        tipo_movimento: 'PICK',
        prodotto_codice: `SKU-${index + 1}`,
        quantita: throughput.picks_completati,
        data_movimento: new Date().toISOString(),
        operatore: 'Operatore'
      }));

  // Alert counters
  $: critici = alertsOperatori ? alertsOperatori.filter(a => a.priorita === 'CRITICO').length : 0;
  $: alti = alertsOperatori ? alertsOperatori.filter(a => a.priorita === 'ALTO').length : 0;
  $: medi = alertsOperatori ? alertsOperatori.filter(a => a.priorita === 'MEDIO').length : 0;

  onMount(() => {
    startAutoRefresh();
  });
  
  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        refreshData();
      }, 5000);
    }
  }
  
  $: {
    if (autoRefresh !== undefined) {
      startAutoRefresh();
    }
  }
  
  async function refreshData() {
    if (isRefreshing) return;
    isRefreshing = true;
    pulseAnimation = true;
    
    try {
      realtimeManager.forceUpdate();
      lastUpdate = new Date();
    } finally {
      setTimeout(() => {
        isRefreshing = false;
        pulseAnimation = false;
      }, 800);
    }
  }

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  function getPriorityColorDark(priorita: string): string {
    switch(priorita) {
      case 'CRITICO': return 'text-red-400 bg-red-900/30 border-red-500/40 shadow-red-500/20';
      case 'ALTO': return 'text-orange-400 bg-orange-900/30 border-orange-500/40 shadow-orange-500/20';
      case 'MEDIO': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/40 shadow-yellow-500/20';
      case 'BASSO': return 'text-blue-400 bg-blue-900/30 border-blue-500/40 shadow-blue-500/20';
      default: return 'text-gray-400 bg-gray-800/30 border-gray-600/40 shadow-gray-500/20';
    }
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calcolo statistiche live
  $: efficienzaOperatori = operatoriPerformance.length > 0 ? 
    operatoriPerformance.reduce((sum, op) => sum + (op.movimenti_completati || 0), 0) / operatoriPerformance.length : 0;

  // Funzioni per gli effetti dinamici
  function getStatusGlow(status: string): string {
    switch(status) {
      case 'ATTIVO': return 'shadow-green-500/60 animate-pulse';
      case 'RECENTE': return 'shadow-blue-500/60 animate-pulse';
      default: return 'shadow-gray-500/30';
    }
  }

  function getZoneIntensity(percentage: number): string {
    if (percentage > 85) return 'shadow-red-400/60 border-red-400/30';
    if (percentage > 70) return 'shadow-orange-400/60 border-orange-400/30';
    return 'shadow-green-400/60 border-green-400/30';
  }
</script>

<!-- 🚀 SPECTACULAR DARK DASHBOARD - OPTIMIZED FOR MACBOOK PRO 15" -->
<div class="w-full h-screen flex flex-col p-2 overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-black relative">
  
  <!-- ✨ Dynamic Background Effects -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <!-- Animated Grid -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
    
    <!-- Floating Orbs -->
    <div class="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute top-40 right-32 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute bottom-32 left-40 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
    <div class="absolute bottom-20 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 6s;"></div>
    
    <!-- Scanning Lines -->
    {#if isConnected}
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent animate-ping" style="animation-duration: 8s;"></div>
    {/if}
  </div>

  <!-- 🔥 Connection Status Indicator -->
  <div class="absolute top-4 right-6 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
    <div class="w-2 h-2 rounded-full {isConnected ? 'bg-emerald-400 animate-pulse shadow-emerald-400/60' : 'bg-red-400 animate-pulse shadow-red-400/60'} shadow-lg"></div>
    <span class="text-xs text-white/80 font-medium">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
    {#if isRefreshing}
      <div class="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
    {/if}
  </div>

  <!-- 🚀 ULTIMATE MODERN DASHBOARD -->
  <div class="flex-1 flex flex-col gap-2 overflow-hidden relative z-10 mt-2">
    
    <!-- 💎 TOP BAR: HERO KPI -->
    <div class="bg-gradient-to-r from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-6 relative overflow-hidden shadow-2xl {pulseAnimation ? 'animate-pulse' : ''}">
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/15 via-cyan-500/10 to-emerald-500/10 animate-gradient-x"></div>
      <div class="absolute -top-10 left-1/4 w-32 h-32 bg-blue-400/15 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-10 right-1/4 w-24 h-24 bg-purple-400/15 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      
      <div class="relative z-10">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-black text-white flex items-center gap-2">
            <span class="text-4xl animate-spin">⚡</span>
            <span class="bg-gradient-to-r from-blue-400 via-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:300%_300%] animate-gradient-x">
              CONTROL CENTER
            </span>
          </h1>
          <div class="flex items-center gap-2">
            <div class="text-sm text-white/70 font-mono bg-slate-800/60 px-3 py-2 rounded-full border border-white/10">
              {new Date().toLocaleDateString('it-IT')}
            </div>
            <div class="text-lg font-black text-white/90 bg-slate-800/60 px-3 py-2 rounded-full border border-white/10">
              {new Date().toLocaleTimeString('it-IT')}
            </div>
          </div>
        </div>
        
        <!-- 🎯 MEGA KPI CARDS -->
        <div class="grid grid-cols-4 gap-4">
          <div class="group relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-blue-600/40 rounded-2xl blur-sm group-hover:blur-none transition-all duration-500"></div>
            <div class="relative text-center p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl border-2 border-blue-400/50 backdrop-blur-xl shadow-2xl shadow-blue-500/30 hover:scale-105 hover:shadow-3xl hover:shadow-blue-500/50 transition-all duration-500 hover:border-blue-300/70">
              <div class="text-5xl font-black text-blue-300 drop-shadow-2xl mb-3 group-hover:animate-bounce transform group-hover:scale-110 transition-all duration-500">{kpiSummary.ordini_oggi}</div>
              <div class="text-lg text-blue-200 font-bold tracking-wider">ORDINI</div>
              <div class="text-sm text-blue-300/70 mt-2 font-medium">+12% oggi</div>
              <div class="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>
          
          <div class="group relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-emerald-600/40 rounded-2xl blur-sm group-hover:blur-none transition-all duration-500"></div>
            <div class="relative text-center p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 rounded-2xl border-2 border-emerald-400/50 backdrop-blur-xl shadow-2xl shadow-emerald-500/30 hover:scale-105 hover:shadow-3xl hover:shadow-emerald-500/50 transition-all duration-500 hover:border-emerald-300/70">
              <div class="text-5xl font-black text-emerald-300 drop-shadow-2xl mb-3 group-hover:animate-bounce transform group-hover:scale-110 transition-all duration-500">{kpiSummary.movimenti_oggi}</div>
              <div class="text-lg text-emerald-200 font-bold tracking-wider">MOVIMENTI</div>
              <div class="text-sm text-emerald-300/70 mt-2 font-medium">Real-time</div>
              <div class="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>
          
          <div class="group relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-orange-600/40 rounded-2xl blur-sm group-hover:blur-none transition-all duration-500"></div>
            <div class="relative text-center p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl border-2 border-orange-400/50 backdrop-blur-xl shadow-2xl shadow-orange-500/30 hover:scale-105 hover:shadow-3xl hover:shadow-orange-500/50 transition-all duration-500 hover:border-orange-300/70">
              <div class="text-5xl font-black text-orange-300 drop-shadow-2xl mb-3 group-hover:animate-bounce transform group-hover:scale-110 transition-all duration-500">{kpiSummary.operatori_attivi}</div>
              <div class="text-lg text-orange-200 font-bold tracking-wider">OPERATORI</div>
              <div class="text-sm text-orange-300/70 mt-2 font-medium">Attivi ora</div>
              <div class="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>
          
          <div class="group relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-purple-600/40 rounded-2xl blur-sm group-hover:blur-none transition-all duration-500"></div>
            <div class="relative text-center p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl border-2 border-purple-400/50 backdrop-blur-xl shadow-2xl shadow-purple-500/30 hover:scale-105 hover:shadow-3xl hover:shadow-purple-500/50 transition-all duration-500 hover:border-purple-300/70">
              <div class="text-5xl font-black text-purple-300 drop-shadow-2xl mb-3 group-hover:animate-bounce transform group-hover:scale-110 transition-all duration-500">{Math.round(efficienzaOperatori)}%</div>
              <div class="text-lg text-purple-200 font-bold tracking-wider">EFFICIENZA</div>
              <div class="text-sm text-purple-300/70 mt-2 font-medium">Media turno</div>
              <div class="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔥 MAIN CONTENT GRID -->
    <div class="grid grid-cols-4 gap-2 flex-1 overflow-hidden">
      
      <!-- 🎮 ZONE MAGAZZINO -->
      <div class="col-span-2 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/60 p-4 relative overflow-hidden shadow-2xl">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/8 to-cyan-500/5 animate-gradient-x"></div>
        <div class="absolute -top-8 -right-8 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
        
        <div class="relative z-10 h-full flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-black text-white flex items-center gap-3">
              <span class="text-2xl animate-spin">⚙️</span>
              <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ZONE MAGAZZINO</span>
            </h2>
            <div class="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-400/30 font-bold animate-pulse">LIVE</div>
          </div>
          
          <div class="grid grid-cols-3 gap-3 flex-1">
            {#each zoneStatus.slice(0, 6) as zona}
              <div class="group p-4 bg-slate-800/70 rounded-xl border-2 border-slate-600/60 backdrop-blur-xl hover:scale-105 transition-all duration-300 {getZoneIntensity(zona.percentuale_occupazione)} shadow-xl hover:shadow-2xl relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="relative z-10">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-6 h-6 rounded-full {zona.percentuale_occupazione > 85 ? 'bg-red-400 animate-pulse shadow-lg shadow-red-400/60' : zona.percentuale_occupazione > 70 ? 'bg-orange-400 shadow-lg shadow-orange-400/60' : 'bg-emerald-400 shadow-lg shadow-emerald-400/60'}"></div>
                    <span class="text-xs text-white/60 font-mono bg-slate-700/50 px-2 py-1 rounded">#{zona.zona}</span>
                  </div>
                  
                  <div class="text-center">
                    <h3 class="font-black text-white text-lg mb-2">ZONA {zona.zona}</h3>
                    <div class="text-4xl font-black drop-shadow-xl mb-3 {zona.percentuale_occupazione > 85 ? 'text-red-400 animate-pulse' : zona.percentuale_occupazione > 70 ? 'text-orange-400' : 'text-emerald-400'}">
                      {zona.percentuale_occupazione}%
                    </div>
                    
                    <div class="w-full bg-slate-700/80 rounded-full h-3 overflow-hidden shadow-inner mb-3">
                      <div class="h-3 rounded-full transition-all duration-1000 shadow-lg {zona.percentuale_occupazione > 85 ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-300 animate-pulse' : zona.percentuale_occupazione > 70 ? 'bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300' : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300'}" 
                           style="width: {zona.percentuale_occupazione}%"></div>
                    </div>
                    
                    <div class="text-sm text-white/80 font-bold">
                      {zona.prodotti_diversi} SKU diversi
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- 👥 OPERATORI & ALERTS -->
      <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/60 p-4 relative overflow-hidden shadow-2xl">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-red-500/5 to-emerald-500/5 animate-gradient-x"></div>
        <div class="absolute -top-8 -left-8 w-20 h-20 bg-emerald-400/10 rounded-full blur-2xl animate-pulse"></div>
        
        <div class="relative z-10 h-full flex flex-col">
          <!-- OPERATORI SECTION -->
          <div class="mb-6">
            <h2 class="text-lg font-black text-white mb-4 flex items-center gap-2">
              <span class="text-emerald-400 animate-pulse text-xl">👥</span>
              <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">OPERATORI</span>
            </h2>
            
            <div class="space-y-2">
              {#each operatoriPerformance.slice(0, 4) as operatore}
                <div class="flex items-center gap-3 p-3 bg-slate-800/70 rounded-xl border border-slate-600/60 backdrop-blur-xl hover:bg-slate-700/80 transition-all duration-300 hover:scale-[1.02] {getStatusGlow(operatore.status)} shadow-lg">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/50 border-2 border-emerald-400/60 flex items-center justify-center {operatore.status === 'ATTIVO' ? 'animate-pulse shadow-lg shadow-emerald-400/60' : ''}">
                    <span class="text-sm font-black text-emerald-200">{operatore.movimenti_completati}</span>
                  </div>
                  <div class="flex-1">
                    <div class="font-bold text-white text-sm">{operatore.nome}</div>
                    <div class="text-xs text-white/60">Zona {operatore.zona} • {operatore.status}</div>
                  </div>
                  <div class="text-emerald-400 font-black text-lg animate-pulse">
                    +{operatore.movimenti_completati}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- ALERTS SECTION -->
          <div class="flex-1">
            <h2 class="text-lg font-black text-white mb-4 flex items-center gap-2">
              <span class="text-red-400 animate-pulse text-xl">🚨</span>
              <span class="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">ALERTS</span>
            </h2>
            
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center p-3 bg-gradient-to-br from-red-500/20 to-red-600/30 rounded-xl border-2 border-red-400/50 backdrop-blur-xl shadow-lg shadow-red-500/30">
                <div class="text-2xl font-black text-red-300 drop-shadow-xl animate-pulse">{critici}</div>
                <div class="text-xs text-red-200 font-bold">CRITICI</div>
              </div>
              <div class="text-center p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-xl border-2 border-orange-400/50 backdrop-blur-xl shadow-lg shadow-orange-500/30">
                <div class="text-2xl font-black text-orange-300 drop-shadow-xl">{alti}</div>
                <div class="text-xs text-orange-200 font-bold">ALTI</div>
              </div>
              <div class="text-center p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 rounded-xl border-2 border-yellow-400/50 backdrop-blur-xl shadow-lg shadow-yellow-500/30">
                <div class="text-2xl font-black text-yellow-300 drop-shadow-xl">{medi}</div>
                <div class="text-xs text-yellow-200 font-bold">MEDI</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 📈 LIVE FEEDS -->
      <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/60 p-4 relative overflow-hidden shadow-2xl">
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-red-500/5 to-cyan-500/5 animate-gradient-x"></div>
        <div class="absolute -top-8 -right-8 w-20 h-20 bg-cyan-400/10 rounded-full blur-2xl animate-pulse"></div>
        
        <div class="relative z-10 h-full flex flex-col">
          <div class="grid grid-cols-1 gap-4 h-full">
            
            <!-- GIACENZE CRITICHE -->
            <div class="bg-slate-800/60 rounded-xl border-2 border-red-500/40 p-3 overflow-hidden">
              <h3 class="text-sm font-black text-white mb-3 flex items-center gap-2">
                <span class="text-red-400 animate-bounce">⚠️</span>
                <span class="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">GIACENZE CRITICHE</span>
              </h3>
              
              <div class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {#each giacenzeCritiche as giacenza}
                  <div class="flex items-center justify-between p-3 bg-slate-800/90 rounded-lg border border-red-500/40 hover:bg-red-500/15 transition-all duration-200 hover:scale-[1.01] shadow-lg">
                    <div class="flex-1 truncate mr-3">
                      <div class="font-bold text-white text-sm truncate leading-tight mb-1">{giacenza.prodotto_descrizione}</div>
                      <div class="text-xs text-white/80 font-mono bg-slate-700/60 px-2 py-1 rounded">{giacenza.prodotto_codice}</div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div class="text-red-400 font-black text-xl animate-pulse">{giacenza.quantita}</div>
                      <div class="text-xs text-white/60">Min: {giacenza.scorta_minima}</div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- MOVIMENTI LIVE -->
            <div class="bg-slate-800/60 rounded-xl border-2 border-cyan-500/40 p-3 overflow-hidden flex-1">
              <h3 class="text-sm font-black text-white mb-3 flex items-center gap-2">
                <span class="text-cyan-400 animate-bounce">📈</span>
                <span class="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">MOVIMENTI LIVE</span>
              </h3>
              
              <div class="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {#each movimentiRecenti.slice(0, 8) as movimento}
                  <div class="flex items-center justify-between p-2 bg-slate-800/80 rounded border border-cyan-500/30 hover:bg-cyan-500/10 transition-all duration-200 hover:scale-[1.01]">
                    <div class="flex-1 truncate">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span class="font-bold text-white text-xs">{movimento.tipo_movimento}</span>
                      </div>
                      <div class="text-xs text-white/70 font-mono truncate">{movimento.prodotto_codice}</div>
                      <div class="text-xs text-white/50">{formatDateTime(movimento.data_movimento)}</div>
                    </div>
                    <div class="text-emerald-400 font-black text-sm animate-pulse">+{movimento.quantita}</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* 🚀 SPECTACULAR ANIMATIONS AND EFFECTS */
  
  /* Gradient Animation for Backgrounds */
  @keyframes gradient-x {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  
  .animate-gradient-x {
    background-size: 400% 400%;
    animation: gradient-x 15s ease infinite;
  }
  
  /* Holographic Shine Effect */
  @keyframes holographic-shine {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  
  .holographic-effect::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s;
    animation: holographic-shine 3s infinite;
  }
  
  /* Pulsing Glow Animation */
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }
    50% {
      box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
    }
  }
  
  .pulse-glow {
    animation: pulse-glow 2s infinite;
  }
  
  /* Floating Animation */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  /* Data Stream Effect */
  @keyframes data-stream {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  .data-stream {
    animation: data-stream 0.8s ease-out;
  }
  
  /* Cyber Scan Lines */
  @keyframes cyber-scan {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(300vh); opacity: 0; }
  }
  
  .cyber-scan::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff88, transparent);
    animation: cyber-scan 4s linear infinite;
    z-index: 1000;
  }
  
  /* Custom Scrollbar for Dark Theme */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #60a5fa, #2563eb);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  }
  
  /* Neon Border Effect */
  @keyframes neon-border {
    0%, 100% {
      box-shadow: 
        0 0 5px rgba(59, 130, 246, 0.5),
        0 0 10px rgba(59, 130, 246, 0.3),
        0 0 15px rgba(59, 130, 246, 0.2);
    }
    50% {
      box-shadow: 
        0 0 10px rgba(59, 130, 246, 0.8),
        0 0 20px rgba(59, 130, 246, 0.6),
        0 0 30px rgba(59, 130, 246, 0.4);
    }
  }
  
  .neon-border {
    animation: neon-border 2s ease-in-out infinite alternate;
  }
  
  /* Matrix Rain Effect (Subtle) */
  @keyframes matrix-rain {
    0% { transform: translateY(-100vh); opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  
  .matrix-rain {
    position: absolute;
    color: #00ff88;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    animation: matrix-rain 3s linear infinite;
    pointer-events: none;
  }
  
  /* Glass Morphism Enhancement */
  .glass-morphism {
    background: rgba(15, 23, 42, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  /* Typing Effect for Live Data */
  @keyframes typing {
    from { width: 0; }
    to { width: 100%; }
  }
  
  .typing-effect {
    overflow: hidden;
    border-right: 2px solid #3b82f6;
    white-space: nowrap;
    animation: typing 2s steps(20, end), blink-caret 0.5s step-end infinite alternate;
  }
  
  @keyframes blink-caret {
    from, to { border-color: transparent; }
    50% { border-color: #3b82f6; }
  }
  
  /* Energy Wave Effect */
  @keyframes energy-wave {
    0% { 
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      transform: scale(1);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      transform: scale(1);
    }
  }
  
  .energy-wave {
    animation: energy-wave 2s infinite;
  }
  
  /* Holographic Text Effect */
  .holographic-text {
    background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
    background-size: 400% 400%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient-x 3s ease infinite;
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  }
  
  /* Particle Effect (Subtle) */
  @keyframes particle-float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
      opacity: 1;
    }
    33% {
      transform: translateY(-20px) rotate(120deg);
      opacity: 0.7;
    }
    66% {
      transform: translateY(-10px) rotate(240deg);
      opacity: 0.4;
    }
  }
  
  .particle {
    animation: particle-float 8s ease-in-out infinite;
  }
  
  /* Advanced Hover Effects */
  .advanced-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .advanced-hover:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 50px rgba(59, 130, 246, 0.2);
  }
  
  /* Liquid Motion Background */
  @keyframes liquid-motion {
    0%, 100% {
      border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    }
    50% {
      border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    }
  }
  
  .liquid-bg {
    animation: liquid-motion 10s ease-in-out infinite;
  }
  
  /* Status Light Breathing */
  @keyframes status-breathe {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.7;
    }
  }
  
  .status-breathe {
    animation: status-breathe 2s ease-in-out infinite;
  }
  
  /* Responsive Optimizations for MacBook Pro 15" */
  @media (max-width: 1440px) {
    .compact-text {
      font-size: 0.75rem;
    }
    
    .compact-number {
      font-size: 1.5rem;
    }
  }
</style>