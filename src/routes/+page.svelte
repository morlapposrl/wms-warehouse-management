<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    goto('/auth/dashboard');
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
  <div class="text-center">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">🏭 Gestionale Magazzino</h1>
    <p class="text-neutral-600 dark:text-gray-400 mb-4">Reindirizzamento alla dashboard...</p>
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
  </div>
</div>