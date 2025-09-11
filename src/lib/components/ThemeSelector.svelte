<script lang="ts">
  import { onMount } from 'svelte';
  
  const themes = [
    { id: 'light', name: 'Chiaro', icon: '☀️', description: 'Tema chiaro professionale' },
    { id: 'dark', name: 'Scuro', icon: '🌙', description: 'Tema scuro moderno' },
    { id: 'system', name: 'Sistema', icon: '🖥️', description: 'Segue le preferenze del sistema' }
  ];
  
  let currentTheme = 'system';
  let isOpen = false;
  
  onMount(() => {
    // Carica il tema salvato dal localStorage
    const savedTheme = localStorage.getItem('theme') || 'system';
    currentTheme = savedTheme;
    applyTheme(currentTheme);
  });
  
  function applyTheme(themeId: string) {
    localStorage.setItem('theme', themeId);
    currentTheme = themeId;
    isOpen = false;
    
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
  
  function getCurrentTheme() {
    return themes.find(t => t.id === currentTheme) || themes[0];
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.theme-selector')) {
      isOpen = false;
    }
  }
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    // Ascolta i cambi delle preferenze del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addListener(handleSystemThemeChange);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      mediaQuery.removeListener(handleSystemThemeChange);
    };
  });
</script>

<div class="theme-selector relative">
  <button
    on:click={() => isOpen = !isOpen}
    class="btn btn-secondary btn-sm flex items-center gap-2"
    title="Cambio tema"
  >
    <span class="text-lg">{getCurrentTheme().icon}</span>
    <span class="hidden sm:inline">{getCurrentTheme().name}</span>
    <svg 
      class="w-4 h-4 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  
  {#if isOpen}
    <div class="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2">
      <div class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        Seleziona Tema
      </div>
      
      <div class="py-2">
        {#each themes as theme}
          <button
            on:click={() => applyTheme(theme.id)}
            class="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 {theme.id === currentTheme ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}"
          >
            <span class="text-lg">{theme.icon}</span>
            <div class="flex-1 text-left">
              <div class="font-medium">{theme.name}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{theme.description}</div>
            </div>
            {#if theme.id === currentTheme}
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
      
      <div class="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Il tema viene applicato immediatamente e salvato
      </div>
    </div>
  {/if}
</div>