<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initializeI18n } from '$lib/i18n';
  
  let i18nReady = false;

  // Inizializza i18n al mount per evitare problemi SSR/hydration
  onMount(async () => {
    await initializeI18n();
    i18nReady = true;
  });
</script>

{#if i18nReady}
  <slot />
{:else}
  <div class="min-h-screen bg-gray-900 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p class="text-white">Caricamento...</p>
    </div>
  </div>
{/if}