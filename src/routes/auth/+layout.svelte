<script lang="ts">
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import ErrorNotifications from '$lib/components/ErrorNotifications.svelte';
  import '../../app.css';

  // Menu principale sistema multicommittente - LOGICA CORRETTA
  const mainMenu = [
    {
      href: '/auth/dashboard',
      label: 'Dashboard Globale',
      icon: 'chart-bar',
      description: 'Vista aggregata di tutti i committenti'
    },
    {
      href: '/auth/committenti',
      label: 'Committenti',
      icon: 'building-office',
      description: 'Gestione clienti/committenti'
    },
    {
      href: '/auth/prodotti',
      label: 'Prodotti Globali',
      icon: 'cube',
      description: 'Tutti i prodotti di tutti i committenti'
    },
    {
      href: '/auth/giacenze',
      label: 'Giacenze Globali',
      icon: 'archive-box',
      description: 'Inventario aggregato di tutto il magazzino'
    },
    {
      href: '/auth/movimenti',
      label: 'Movimenti Globali',
      icon: 'arrows-right-left',
      description: 'Tutte le movimentazioni magazzino'
    },
    {
      href: '/auth/ordini',
      label: 'Gestione Ordini',
      icon: 'shopping-bag',
      description: 'Ordini B2B per committenti'
    },
    {
      href: '/auth/wave-planning',
      label: 'Wave Planning',
      icon: 'adjustments-horizontal',
      description: 'Ottimizzazione picking multi-committente'
    },
    {
      href: '/auth/reports',
      label: 'Report & Analytics',
      icon: 'chart-line',
      description: 'Report aggregati e per committente'
    }
  ];

  function isActive(href: string): boolean {
    if (href === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(href);
  }
</script>

<!-- Sistema base senza header per evitare sovrapposizioni -->
<div class="min-h-screen bg-neutral-50">
  <!-- Header solo per pagine non-committente -->
  {#if !$page.url.pathname.includes('/committenti/')}
    <header class="bg-white shadow-sm border-b border-neutral-200">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold text-neutral-900">
              🏭 Gestionale Magazzino
            </h1>
            <span class="badge badge-primary">Multi-Committente</span>
          </div>
          
          <nav class="flex items-center gap-1">
            {#each mainMenu as item}
              <a 
                href={item.href}
                class="nav-link {isActive(item.href) ? 'nav-link-active' : ''}"
                title={item.description}
              >
                <Icon name={item.icon} class="w-4 h-4" />
                <span class="hidden md:inline">{item.label}</span>
              </a>
            {/each}
            
            <div class="ml-4 flex items-center gap-2">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Icon name="user" class="w-4 h-4 text-primary-600" />
              </div>
              <span class="text-sm text-neutral-700 hidden md:inline">Operatore</span>
            </div>
          </nav>
        </div>
      </div>
    </header>

    <!-- Contenuto per pagine non-committente -->
    <main class="container mx-auto px-6 py-8">
      <slot />
    </main>
  {:else}
    <!-- Per le pagine committente, usa solo il contenuto (layout committente gestisce header) -->
    <slot />
  {/if}
  
  <!-- Sistema di Notifiche Errori -->
  <ErrorNotifications />
</div>

<style>
  .nav-link {
    @apply px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors;
  }
  
  .nav-link-active {
    @apply bg-primary-50 text-primary-700 hover:bg-primary-100;
  }
</style>