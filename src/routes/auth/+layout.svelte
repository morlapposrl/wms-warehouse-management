<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import ErrorNotifications from '$lib/components/ErrorNotifications.svelte';
  import ThemeSelector from '$lib/components/ThemeSelector.svelte';
  import { t } from '$lib/i18n';
  import '../../app.css';
  
  let showUserMenu = false;

  // Menu principale sistema multicommittente - LOGICA CORRETTA
  const mainMenu = [
    {
      href: '/auth/dashboard',
      labelKey: 'layout.globalDashboard',
      icon: 'chart-bar',
      descriptionKey: 'layout.globalDashboardDesc'
    },
    {
      href: '/auth/admin/committenti',
      labelKey: 'layout.clientManagement',
      icon: 'building-office',
      descriptionKey: 'layout.clientManagementDesc',
      adminOnly: true
    },
    {
      type: 'dropdown',
      labelKey: 'layout.masterData',
      icon: 'cog-6-tooth',
      descriptionKey: 'layout.masterDataDesc',
      items: [
        {
          href: '/auth/categorie',
          labelKey: 'layout.categories',
          icon: 'tag',
          descriptionKey: 'layout.categoriesDesc'
        },
        {
          href: '/auth/unita-misura',
          labelKey: 'layout.units',
          icon: 'scale',
          descriptionKey: 'layout.unitsDesc'
        },
        {
          href: '/auth/fornitori',
          labelKey: 'layout.suppliers',
          icon: 'truck',
          descriptionKey: 'layout.suppliersDesc'
        },
        {
          href: '/auth/magazzini',
          labelKey: 'layout.warehouses',
          icon: 'building-office-2',
          descriptionKey: 'layout.warehousesDesc'
        },
        {
          href: '/auth/tipi-udc',
          labelKey: 'layout.udcTypes',
          icon: 'cube-transparent',
          descriptionKey: 'layout.udcTypesDesc'
        },
        { type: 'separator' },
        {
          href: '/auth/causali',
          labelKey: 'layout.transferCauses',
          icon: 'document-text',
          descriptionKey: 'layout.transferCausesDesc'
        }
      ]
    },
    {
      href: '/auth/prodotti',
      labelKey: 'layout.globalProducts',
      icon: 'cube',
      descriptionKey: 'layout.globalProductsDesc'
    },
    {
      href: '/auth/giacenze',
      labelKey: 'layout.globalInventory',
      icon: 'archive-box',
      descriptionKey: 'layout.globalInventoryDesc'
    },
    {
      href: '/auth/udc',
      labelKey: 'layout.globalUdc',
      icon: 'cube-transparent',
      descriptionKey: 'layout.globalUdcDesc'
    },
    {
      href: '/auth/movimenti',
      labelKey: 'layout.globalMovements',
      icon: 'arrows-right-left',
      descriptionKey: 'layout.globalMovementsDesc'
    },
    {
      href: '/auth/magazzino',
      labelKey: 'layout.warehouseLayout',
      icon: 'building-office-2',
      descriptionKey: 'layout.warehouseLayoutDesc'
    },
    {
      href: '/auth/ordini',
      labelKey: 'layout.orderManagement',
      icon: 'shopping-bag',
      descriptionKey: 'layout.orderManagementDesc'
    },
    {
      href: '/auth/wave-planning',
      labelKey: 'layout.wavePlanning',
      icon: 'adjustments-horizontal',
      descriptionKey: 'layout.wavePlanningDesc'
    },
    {
      href: '/auth/reports',
      labelKey: 'layout.reportsAnalytics',
      icon: 'chart-line',
      descriptionKey: 'layout.reportsAnalyticsDesc'
    }
  ];
  
  let showCommittentiMenu = false;
  let showAnagraficheMenu = false;
  let showThemeMenu = false;
  
  // Gestione temi moderna con Tailwind
  const themes = [
    { id: 'light', nameKey: 'layout.light', icon: '☀️', description: 'Tema chiaro professionale' },
    { id: 'dark', nameKey: 'layout.dark', icon: '🌙', description: 'Tema scuro moderno' },
    { id: 'system', nameKey: 'layout.system', icon: '🖥️', description: 'Segue le preferenze del sistema' }
  ];
  
  let currentTheme = 'system';
  
  // Carica tema salvato e applica
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme') || 'system';
    currentTheme = savedTheme;
    applyThemeInternal(currentTheme);
  }
  
  function applyThemeInternal(themeId: string) {
    const htmlElement = document.documentElement;
    
    if (themeId === 'dark') {
      htmlElement.classList.add('dark');
    } else if (themeId === 'light') {
      htmlElement.classList.remove('dark');
    } else if (themeId === 'system') {
      // Usa le preferenze del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
  }
  
  function applyTheme(themeId: string) {
    localStorage.setItem('theme', themeId);
    currentTheme = themeId;
    showThemeMenu = false;
    applyThemeInternal(themeId);
  }
  
  function getCurrentTheme() {
    return themes.find(t => t.id === currentTheme) || themes[0];
  }
  
  // Setup listener per preferenze sistema
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    // Ascolta i cambi delle preferenze del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        applyThemeInternal('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });

  function isActive(href: string): boolean {
    if (href === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(href);
  }
  
  function isDropdownActive(items: any[]): boolean {
    return items.some(item => item.href && isActive(item.href));
  }
  
  // Chiudi menu quando si clicca fuori
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.user-menu-container')) {
      showUserMenu = false;
      showThemeMenu = false;
    }
    if (!target.closest('.committenti-menu-container')) {
      showCommittentiMenu = false;
    }
    if (!target.closest('.anagrafiche-menu-container')) {
      showAnagraficheMenu = false;
    }
  }
</script>

<!-- Sistema base senza header per evitare sovrapposizioni -->
<div class="min-h-screen bg-neutral-50 dark:bg-gray-900" on:click={handleClickOutside}>
  <!-- Header solo per pagine non-committente -->
  {#if !$page.url.pathname.includes('/committenti/')}
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-neutral-200 dark:border-gray-700">
      <div class="w-full px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-12 mr-8">
            <div>
              <div class="flex items-center gap-4">
                <img src="/morlappo-logo-white.png" alt="Morlappo" class="h-10" />
                <h1 class="text-xl font-bold text-neutral-900 dark:text-white">{$t('layout.wms')}</h1>
              </div>
              <p class="text-sm text-neutral-800 dark:text-gray-200 mt-1 font-bold whitespace-nowrap">{$t('layout.company')}</p>
            </div>
            <span class="badge badge-primary">{$t('layout.multiClient')}</span>
          </div>
          
          <nav class="flex items-center gap-1">
            {#each mainMenu as item}
              {#if item.type === 'dropdown' && item.labelKey === 'layout.masterData'}
                <div class="relative anagrafiche-menu-container">
                  <button 
                    on:click={() => showAnagraficheMenu = !showAnagraficheMenu}
                    class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors {isDropdownActive(item.items) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}"
                    title={$t(item.descriptionKey)}
                  >
                    <Icon name={item.icon} class="w-4 h-4" />
                    <span class="hidden md:inline">{$t(item.labelKey)}</span>
                    <Icon name="chevron-down" class="w-3 h-3 ml-1 transition-transform {showAnagraficheMenu ? 'rotate-180' : ''}" />
                  </button>
                  
                  {#if showAnagraficheMenu}
                    <div class="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-neutral-200 dark:border-gray-700 py-2 z-50">
                      {#each item.items as subItem}
                        {#if subItem.type === 'separator'}
                          <div class="border-t border-neutral-200 dark:border-gray-700 my-2"></div>
                        {:else}
                          <a 
                            href={subItem.href}
                            class="flex items-center gap-3 px-4 py-3 text-sm transition-colors {isActive(subItem.href) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}"
                            title={$t(subItem.descriptionKey)}
                            on:click={() => showAnagraficheMenu = false}
                          >
                            <Icon name={subItem.icon} class="w-4 h-4" />
                            <div class="flex-1">
                              <div class="font-medium">{$t(subItem.labelKey)}</div>
                              <div class="text-xs text-neutral-500 dark:text-gray-400 mt-0.5">{$t(subItem.descriptionKey)}</div>
                            </div>
                          </a>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <a 
                  href={item.adminOnly && $page.data.user?.ruolo !== 'super_admin' ? '#' : item.href}
                  class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors {isActive(item.href) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'} {item.adminOnly && $page.data.user?.ruolo !== 'super_admin' ? 'cursor-not-allowed opacity-50' : ''}"
                  title={item.adminOnly && $page.data.user?.ruolo !== 'super_admin' ? $t('layout.adminOnly') : $t(item.descriptionKey)}
                  on:click={(e) => {
                    if (item.adminOnly && $page.data.user?.ruolo !== 'super_admin') {
                      e.preventDefault();
                    }
                  }}
                >
                  <Icon name={item.icon} class="w-4 h-4" />
                  <span class="hidden md:inline">{$t(item.labelKey)}</span>
                </a>
              {/if}
            {/each}
            
            <div class="ml-4 relative user-menu-container">
              <button 
                on:click={() => showUserMenu = !showUserMenu}
                class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon name="user" class="w-4 h-4 text-blue-600" />
                </div>
                <Icon name="chevron-down" class="w-4 h-4 text-neutral-400 dark:text-gray-500" />
              </button>
              
              {#if showUserMenu}
                <div class="absolute right-0 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-neutral-200 dark:border-gray-700 py-1 z-50" style="transform: translateX(-50%); top: 100%;">
                  <a 
                    href="/auth/sistema" 
                    class="block px-4 py-2 text-sm text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                    on:click={() => showUserMenu = false}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">🔧</span>
                      <span>{$t('layout.systemStatus')}</span>
                    </div>
                  </a>
                  <a 
                    href="/auth/utenti" 
                    class="block px-4 py-2 text-sm text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                    on:click={() => showUserMenu = false}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">👥</span>
                      <span>{$t('layout.userManagement')}</span>
                    </div>
                  </a>
                  <a 
                    href="/auth/audit" 
                    class="block px-4 py-2 text-sm text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                    on:click={() => showUserMenu = false}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">🔍</span>
                      <span>{$t('layout.auditTrail')}</span>
                    </div>
                  </a>
                  <hr class="my-1 border-neutral-200 dark:border-gray-700">
                  <a 
                    href="#" 
                    class="block px-4 py-2 text-sm text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                    on:click={() => showUserMenu = false}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">👤</span>
                      <span>{$t('layout.profile')}</span>
                    </div>
                  </a>
                  <a 
                    href="#" 
                    class="block px-4 py-2 text-sm text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                    on:click={() => showUserMenu = false}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">⚙️</span>
                      <span>{$t('layout.settings')}</span>
                    </div>
                  </a>
                  
                  <!-- Sottomenu Temi -->
                  <div class="relative">
                    <button 
                      type="button"
                      class="w-full text-left block px-4 py-2 text-sm text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                      on:click|stopPropagation={() => showThemeMenu = !showThemeMenu}
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-lg">{getCurrentTheme().icon}</span>
                          <span>{$t('layout.themes')}</span>
                        </div>
                        <Icon name="chevron-left" class="w-3 h-3 transition-transform {showThemeMenu ? '-rotate-90' : ''}" />
                      </div>
                    </button>
                    
                    {#if showThemeMenu}
                      <div class="absolute right-full top-0 mr-1 w-44 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg border border-neutral-200 dark:border-gray-700 py-1 z-60">
                        <div class="px-3 py-2 text-xs text-neutral-500 dark:text-gray-400 border-b border-neutral-200 dark:border-gray-700">{$t('layout.selectTheme')}</div>
                        {#each themes as theme}
                          <button
                            type="button"
                            class="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 {theme.id === currentTheme ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}"
                            on:click={() => applyTheme(theme.id)}
                          >
                            <span class="text-sm">{theme.icon}</span>
                            <span class="flex-1">{$t(theme.nameKey)}</span>
                            {#if theme.id === currentTheme}
                              <Icon name="check" class="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            {/if}
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  
                  <hr class="my-1 border-neutral-200 dark:border-gray-700">
                  <button 
                    type="button"
                    class="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    on:click={async (e) => {
                      showUserMenu = false;
                      console.log('Logout clicked - calling logout API...');
                      
                      try {
                        // Chiama l'azione di logout
                        const response = await fetch('/login?/logout', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                          },
                          body: ''
                        });
                        
                        // Redirect immediato al login dopo logout
                        console.log('Logout successful, redirecting to login...');
                        window.location.href = '/login';
                        
                      } catch (error) {
                        console.error('Logout error:', error);
                        // Se c'è errore, vai comunque al login
                        window.location.href = '/login';
                      }
                    }}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">🚪</span>
                      <span>{$t('layout.logout')}</span>
                    </div>
                  </button>
                </div>
              {/if}
            </div>
          </nav>
        </div>
      </div>
    </header>

    <!-- Contenuto per pagine non-committente -->
    <main class="w-full px-6 py-8 bg-transparent">
      <slot />
    </main>
  {:else}
    <!-- Per le pagine committente, usa solo il contenuto (layout committente gestisce header) -->
    <slot />
  {/if}
  
  <!-- Sistema di Notifiche Errori -->
  <ErrorNotifications />
</div>

