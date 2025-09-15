<script lang="ts">
  import { setLanguage, locale, supportedLanguages } from '$lib/i18n';

  let currentLang = 'it';
  let isOpen = false;

  // Reattivo per aggiornare la lingua corrente
  $: currentLang = $locale || 'it';

  function selectLanguage(langCode: string) {
    setLanguage(langCode);
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  // Trova la lingua corrente per mostrare nome e bandiera
  $: currentLanguage = supportedLanguages.find(lang => lang.code === currentLang) || supportedLanguages[0];
</script>

<div class="relative inline-block text-left">
  <div>
    <button 
      type="button"
      class="inline-flex justify-center items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      on:click={toggleDropdown}
    >
      <span class="mr-2">{currentLanguage.flag}</span>
      <span class="mr-2">{currentLanguage.name}</span>
      <svg class="-mr-1 ml-2 h-5 w-5 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
           xmlns="http://www.w3.org/2000/svg" 
           viewBox="0 0 20 20" 
           fill="currentColor">
        <path fill-rule="evenodd" 
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
              clip-rule="evenodd" />
      </svg>
    </button>
  </div>

  {#if isOpen}
    <div class="absolute right-0 bottom-full z-10 mb-2 w-56 origin-bottom-right bg-white border border-gray-300 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
      <div class="py-1">
        {#each supportedLanguages as language}
          <button
            type="button"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 {currentLang === language.code ? 'bg-blue-50 text-blue-700' : ''}"
            on:click={() => selectLanguage(language.code)}
          >
            <span class="mr-3 text-lg">{language.flag}</span>
            <span class="font-medium">{language.name}</span>
            {#if currentLang === language.code}
              <svg class="ml-auto h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Chiudi dropdown se si clicca fuori -->
{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div 
    class="fixed inset-0 z-0" 
    on:click={() => isOpen = false}
  ></div>
{/if}