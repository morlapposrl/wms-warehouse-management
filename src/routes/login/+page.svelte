<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  
  export let data;
  export let form;
  
  let isLoading = false;
  let showPassword = false;
  
  $: emailValue = form?.email || '';
  $: errorMessage = form?.error || '';
  $: successMessage = form?.success || '';
</script>

<svelte:head>
  <title>Login - Gestionale Magazzino</title>
</svelte:head>

<div class="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
  <!-- Elegant Background Pattern -->
  <div class="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-gray-900/30"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent"></div>
  
  <!-- Subtle animated dots -->
  <div class="absolute inset-0 opacity-30">
    <div class="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
    <div class="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute bottom-32 left-40 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute bottom-20 right-20 w-1 h-1 bg-blue-300 rounded-full animate-pulse" style="animation-delay: 3s;"></div>
  </div>
  
  <div class="max-w-md w-full space-y-8 relative">
    <!-- Logo e Header -->
    <div class="text-center">
      <div class="mx-auto h-20 w-20 bg-gray-900 rounded-xl flex items-center justify-center mb-6 p-2">
        <img src="https://connect.microlops.it:3304/morlappo-logo-white.png" alt="Morlappo Logo" class="h-16 w-16 object-contain">
      </div>
      
      <h2 class="text-3xl font-bold text-white mb-2">
        Gestionale Magazzino
      </h2>
      <p class="text-sm text-gray-300 mb-6">
        Sistema WMS Multicommittente
      </p>
    </div>

    <!-- Alert Messages -->
    {#if errorMessage}
      <div class="rounded-lg bg-red-50 p-4 border border-red-200">
        <div class="flex">
          <div class="flex-shrink-0">
            <span class="text-red-400 text-xl">⚠️</span>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Errore di Accesso</h3>
            <div class="mt-2 text-sm text-red-700">{errorMessage}</div>
          </div>
        </div>
      </div>
    {/if}

    {#if successMessage}
      <div class="rounded-lg bg-green-50 p-4 border border-green-200">
        <div class="flex">
          <div class="flex-shrink-0">
            <span class="text-green-400 text-xl">✅</span>
          </div>
          <div class="ml-3">
            <div class="text-sm text-green-700">{successMessage}</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Form di Login -->
    <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200/20">
      <form method="POST" action="?/login" use:enhance={() => {
        isLoading = true;
        return async ({ update, result }) => {
          await update();
          isLoading = false;
        };
      }}>
        <div class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📧 Email
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              autocomplete="email" 
              required
              value={emailValue}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="utente@esempio.com"
              class:border-red-300={form?.error}
              disabled={isLoading}
            >
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔒 Password
            </label>
            <div class="relative">
              <input 
                id="password" 
                name="password" 
                type={showPassword ? 'text' : 'password'}
                autocomplete="current-password" 
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                placeholder="La tua password"
                class:border-red-300={form?.error}
                disabled={isLoading}
              >
              <button 
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                on:click={() => showPassword = !showPassword}
                disabled={isLoading}
              >
                <span class="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-xl">
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </button>
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input 
                id="remember" 
                name="remember" 
                type="checkbox" 
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              >
              <label for="remember" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Ricordami per 30 giorni
              </label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Password dimenticata?
              </a>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            disabled={isLoading}
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {#if isLoading}
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </span>
              Accesso in corso...
            {:else}
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                🔓
              </span>
              Accedi al Sistema
            {/if}
          </button>
        </div>
      </form>

    </div>

    <!-- Footer Info -->
    <div class="text-center">
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 mb-4">
        <p class="text-xs text-gray-300 mb-2">
          <strong class="text-white">MORLAPPO Srl</strong><br>
          <span class="text-gray-400">Sede legale:</span> L.go Alvaro De Mendoza 4, 64027 Sant'Omero (TE)<br>
          <span class="text-gray-400">Sede operativa:</span> Via Braida, 16, 35010 Villa Del Conte (PD)<br>
          <span class="text-gray-400">P.IVA:</span> <span class="text-blue-300">02174570677</span><br>
          <span class="text-gray-400">Email:</span> <a href="mailto:info@morlappo.com" class="text-blue-300 hover:text-blue-200 transition-colors">info@morlappo.com</a>
        </p>
        
        <div class="border-t border-gray-600 pt-3 mt-3">
          <p class="text-xs text-gray-400">
            © 2025 Morlappo - Tutti i diritti riservati
          </p>
          <p class="text-xs text-gray-500 mt-1">
            <a href="https://morlappo.com" target="_blank" class="text-blue-300 hover:text-blue-200 transition-colors">www.morlappo.com</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Animazioni personalizzate */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Effetto hover sui demo accounts */
  .bg-gray-50:hover, .bg-blue-50:hover, .bg-green-50:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
</style>