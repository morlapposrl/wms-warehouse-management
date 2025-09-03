<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';

  const committente_id = parseInt($page.params.committente_id);

  // Stato committente
  let committente: {
    id: number;
    ragione_sociale: string;
    codice: string;
    stato: string;
  } | null = null;

  let loading = true;

  // Menu di navigazione con icone moderne
  const menuItems = [
    {
      href: `/auth/committenti/${committente_id}`,
      label: 'Dashboard',
      icon: 'dashboard',
      description: 'Panoramica generale'
    },
    {
      href: `/auth/committenti/${committente_id}/prodotti`,
      label: 'Prodotti',
      icon: 'products',
      description: 'Gestisci catalogo prodotti'
    },
    {
      href: `/auth/committenti/${committente_id}/movimenti`,
      label: 'Movimenti',
      icon: 'movements',
      description: 'Carichi e scarichi magazzino'
    },
    {
      href: `/auth/committenti/${committente_id}/giacenze`,
      label: 'Giacenze',
      icon: 'inventory',
      description: 'Stock attuale'
    },
    {
      href: `/auth/committenti/${committente_id}/inventari`,
      label: 'Inventari',
      icon: 'clipboard',
      description: 'Inventari fisici'
    },
    {
      href: `/auth/committenti/${committente_id}/categorie`,
      label: 'Categorie',
      icon: 'categories',
      description: 'Classi merceologiche'
    },
    {
      href: `/auth/committenti/${committente_id}/fornitori`,
      label: 'Fornitori',
      icon: 'suppliers',
      description: 'Anagrafica fornitori'
    },
    {
      href: `/auth/committenti/${committente_id}/unita-misura`,
      label: 'Unità di Misura',
      icon: 'units',
      description: 'Definizioni metriche'
    },
    {
      href: `/auth/committenti/${committente_id}/magazzino`,
      label: 'Magazzino',
      icon: 'map',
      description: 'Layout e ubicazioni'
    }
  ];

  // Carica info committente
  async function loadCommittente() {
    try {
      const response = await fetch(`/api/admin/committenti/${committente_id}`);
      
      if (response.ok) {
        const data = await response.json();
        committente = data.committente;
      }
    } catch (err) {
      console.error('Errore caricamento committente:', err);
    } finally {
      loading = false;
    }
  }

  // Aggiorna l'ora corrente ogni secondo
  function updateTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }

  onMount(() => {
    loadCommittente();
    
    // Avvia aggiornamento ora
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Cleanup interval on destroy
    return () => {
      clearInterval(interval);
    };
  });

  // Controlla se il menu item è attivo
  function isActive(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
  <!-- Header con gradiente moderno -->
  <header class="relative">
    <div class="absolute inset-0 gradient-primary opacity-95"></div>
    <div class="relative z-10 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <a href="/" class="flex items-center space-x-3 text-white hover:text-primary-100 transition-colors">
                <Icon name="warehouse" size={28} className="text-white" />
                <span class="text-2xl font-bold tracking-tight">Gestionale Magazzino</span>
              </a>
            </div>
            {#if committente}
              <div class="ml-8 flex items-center space-x-4">
                <div class="h-8 w-px bg-white/30"></div>
                <div class="text-white/90 text-sm font-medium">Committente:</div>
                <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                  <div class="text-white font-semibold text-lg leading-tight">
                    {committente.ragione_sociale}
                  </div>
                  <div class="text-primary-100 text-sm">
                    Codice: {committente.codice}
                  </div>
                </div>
                <span class="badge badge-success bg-white/20 text-white border border-white/30">
                  <Icon name="active" size={14} className="mr-1" />
                  {committente.stato}
                </span>
              </div>
            {/if}
          </div>
          
          <div class="flex items-center space-x-4">
            <a 
              href="/auth/committenti" 
              class="flex items-center space-x-2 text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/30"
            >
              <Icon name="home" size={16} />
              <span class="font-medium">Tutti i Committenti</span>
            </a>
            <div class="h-8 w-px bg-white/30"></div>
            <div class="flex items-center space-x-2 text-white/90">
              <Icon name="users" size={16} />
              <span class="text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Navigation moderna con hover effects -->
  <nav class="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex overflow-x-auto scrollbar-hide">
        {#each menuItems as item}
          <a
            href={item.href}
            class="nav-item group relative min-w-0 flex-shrink-0 {isActive(item.href) ? 'active' : ''}"
            title={item.description}
          >
            <Icon name={item.icon} size={20} className="mr-3 group-hover:scale-110 transition-transform duration-200" />
            <div class="flex flex-col items-start">
              <span class="font-semibold">{item.label}</span>
              <span class="text-xs text-neutral-500 group-hover:text-neutral-700 transition-colors">
                {item.description}
              </span>
            </div>
            
            <!-- Indicatore attivo con animazione -->
            {#if isActive(item.href)}
              <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-primary rounded-full"></div>
            {/if}
            
            <!-- Hover effect -->
            <div class="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg -z-10"></div>
          </a>
        {/each}
      </div>
    </div>
  </nav>

  <!-- Content con animazioni -->
  <main class="fade-in">
    <slot />
  </main>

  <!-- Footer moderno (opzionale) -->
  <footer class="bg-white border-t border-neutral-200 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex justify-between items-center text-sm text-neutral-500">
        <div class="flex items-center space-x-2">
          <Icon name="warehouse" size={16} />
          <span>© 2024 Gestionale Magazzino - Sistema Multi-committente</span>
        </div>
        <div class="flex items-center space-x-4">
          <span>v1.0.0</span>
          <div class="h-4 w-px bg-neutral-300"></div>
          <span class="flex items-center space-x-1">
            <Icon name="clock" size={14} />
            <span id="current-time"></span>
          </span>
        </div>
      </div>
    </div>
  </footer>
</div>


<style>
  /* Custom scrollbar per la navigazione mobile */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Miglioramenti hover per la navigazione */
  .nav-item {
    @apply relative px-6 py-4 transition-all duration-300 ease-out;
    min-height: 80px;
  }

  .nav-item:not(.active):hover {
    @apply transform -translate-y-0.5;
  }

  .nav-item.active {
    @apply bg-primary-50 text-primary-700;
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
    border-radius: 0 0 4px 4px;
  }
</style>