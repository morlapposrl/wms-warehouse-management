<script>
  import { onMount } from 'svelte';
  
  let committenti = [];
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      const response = await fetch('/api/committenti');
      if (response.ok) {
        committenti = await response.json();
      } else {
        error = 'Errore nel caricamento dei committenti';
      }
    } catch (err) {
      error = 'Errore di connessione';
    } finally {
      loading = false;
    }
  });
</script>

<div class="max-w-7xl mx-auto">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900 mb-2">
        📋 Gestione Committenti
      </h1>
      <p class="text-neutral-600">
        Elenco e gestione di tutti i committenti del sistema multicommittente
      </p>
    </div>
    
    <a 
      href="/auth/admin/committenti/nuovo" 
      class="btn btn-primary btn-lg"
    >
      <span class="text-lg mr-1">+</span>
      Nuovo Committente
    </a>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="spinner w-8 h-8"></div>
      <span class="ml-3 text-neutral-600">Caricamento committenti...</span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      {error}
    </div>
  {:else if committenti.length === 0}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🏢</div>
      <h3 class="text-xl font-semibold text-neutral-700 mb-2">
        Nessun committente presente
      </h3>
      <p class="text-neutral-600 mb-6">
        Inizia aggiungendo il primo committente al sistema
      </p>
      <a href="/auth/admin/committenti/nuovo" class="btn btn-primary btn-lg">
        Aggiungi Primo Committente
      </a>
    </div>
  {:else}
    <!-- Griglia committenti -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each committenti as committente}
        <div class="card hover:shadow-lg transition-all duration-200">
          <div class="card-body">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-xl">🏢</span>
                </div>
                <div>
                  <h3 class="font-semibold text-neutral-900">
                    {committente.ragione_sociale}
                  </h3>
                  <p class="text-sm text-neutral-500">
                    ID: {committente.codice_committente}
                  </p>
                </div>
              </div>
              
              <span class="badge {committente.attivo ? 'badge-success' : 'badge-danger'}">
                {committente.attivo ? 'Attivo' : 'Sospeso'}
              </span>
            </div>
            
            <!-- Info committente -->
            <div class="space-y-2 mb-4 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-600">P.IVA:</span>
                <span class="font-mono">{committente.partita_iva || 'N/A'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Tipo:</span>
                <span class="capitalize">{committente.tipo_contratto}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Referente:</span>
                <span>{committente.referente_principale || 'N/A'}</span>
              </div>
            </div>
            
            <!-- Azioni -->
            <div class="flex gap-2">
              <a 
                href="/auth/committenti/{committente.id}"
                class="btn btn-primary btn-sm flex-1"
              >
                Gestisci
              </a>
              <a 
                href="/auth/committenti/{committente.id}/prodotti"
                class="btn btn-secondary btn-sm"
                title="Prodotti"
              >
                📦
              </a>
              <a 
                href="/auth/committenti/{committente.id}/giacenze"
                class="btn btn-secondary btn-sm"
                title="Giacenze"
              >
                📊
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Statistiche sommarie -->
    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-primary-100">
            <span class="text-primary-600 text-xl">🏢</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Totale Committenti</p>
            <p class="text-2xl font-bold text-neutral-900">
              {committenti.length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-secondary-100">
            <span class="text-secondary-600 text-xl">✅</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Attivi</p>
            <p class="text-2xl font-bold text-neutral-900">
              {committenti.filter(c => c.attivo).length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="flex items-center">
          <div class="stat-icon bg-yellow-100">
            <span class="text-yellow-600 text-xl">⚠️</span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Sospesi</p>
            <p class="text-2xl font-bold text-neutral-900">
              {committenti.filter(c => !c.attivo).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>