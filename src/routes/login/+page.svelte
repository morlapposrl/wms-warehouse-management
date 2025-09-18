<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  import { setLanguage, locale, supportedLanguages } from '$lib/i18n';
  
  export let data;
  export let form;
  
  let isLoading = false;
  let showPassword = false;
  let showForgotPassword = false;
  let resetEmail = '';
  let resetLoading = false;
  
  $: emailValue = form?.email || '';
  $: errorMessage = form?.error || '';
  $: successMessage = form?.success || '';
  $: currentLang = $locale || 'it';
  $: resetSuccess = $page.url.searchParams.get('reset') === 'success';
  
  function switchLanguage(langCode: string) {
    setLanguage(langCode);
  }
  
  function handleForgotPassword() {
    resetEmail = emailValue; // Pre-compila con l'email inserita
    showForgotPassword = true;
  }
  
  function submitResetForm() {
    resetLoading = true;
  }

  async function sendResetEmail() {
    if (!resetEmail) return;
    
    resetLoading = true;
    
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail, language: $locale })
      });

      const result = await response.json();

      if (response.ok) {
        // Chiudi il modal e mostra messaggio di successo
        showForgotPassword = false;
        // Potresti voler mostrare un toast o messaggio di successo
        alert($t('forgotPassword.emailSent', { default: 'Email inviata! Controlla la tua casella di posta.' }));
      } else {
        alert(result.error || $t('forgotPassword.error', { default: 'Errore nell\'invio dell\'email' }));
      }
    } catch (error) {
      console.error('Errore invio email reset:', error);
      alert($t('forgotPassword.error', { default: 'Errore nell\'invio dell\'email' }));
    } finally {
      resetLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Gestionale Magazzino</title>
</svelte:head>

<div class="min-h-screen bg-black text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
  <!-- Background Gradient - Same style as hero section -->
  <div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 pointer-events-none"></div>
  <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
  <div class="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
  
  <div class="max-w-md w-full space-y-8 relative">
    
    <!-- Logo e Header -->
    <div class="text-center">
      <div class="mx-auto h-24 w-24 mb-8">
        <img src="https://connect.microlops.it:3304/morlappo-logo-white.png" alt="Morlappo Logo" class="w-full h-full object-contain">
      </div>
      
      <h2 class="text-3xl font-bold text-white mb-2">
        {$t('login.title')}
      </h2>
      <p class="text-sm text-gray-300 mb-6">
        {$t('login.subtitle')}
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
            <h3 class="text-sm font-medium text-red-800">{$t('login.error')}</h3>
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

    {#if resetSuccess}
      <div class="rounded-lg bg-green-900/20 p-4 border border-green-500/30 backdrop-blur-sm">
        <div class="flex">
          <div class="flex-shrink-0">
            <span class="text-green-400 text-xl">✅</span>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-300">{$t('resetPassword.successTitle')}</h3>
            <div class="text-sm text-green-400">{$t('resetPassword.successMessage')}</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Form di Login -->
    <div class="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-800">
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
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              📧 {$t('login.username')}
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              autocomplete="email" 
              required
              value={emailValue}
              class="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-400"
              placeholder="{$t('login.username')}"
              class:border-red-500={form?.error}
              disabled={isLoading}
            >
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              🔒 {$t('login.password')}
            </label>
            <div class="relative">
              <input 
                id="password" 
                name="password" 
                type={showPassword ? 'text' : 'password'}
                autocomplete="current-password" 
                required
                class="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-12 placeholder-gray-400"
                placeholder="{$t('login.password')}"
                class:border-red-500={form?.error}
                disabled={isLoading}
              >
              <button 
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                on:click={() => showPassword = !showPassword}
                disabled={isLoading}
              >
                <span class="text-gray-400 hover:text-gray-300 text-xl">
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </button>
            </div>
          </div>

          <!-- Language Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              🌐 {$t('login.language')}
            </label>
            <div class="flex items-center space-x-2">
              {#each supportedLanguages as language}
                <button
                  type="button"
                  on:click={() => switchLanguage(language.code)}
                  class="w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center {currentLang === language.code ? 'border-purple-500 scale-110 bg-purple-500/20' : 'border-gray-600 hover:border-gray-400'}"
                  title={language.name}
                >
                  <span class="text-lg">{language.flag}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input 
                id="remember" 
                name="remember" 
                type="checkbox" 
                class="h-4 w-4 text-purple-600 focus:ring-purple-500 bg-gray-800 border-gray-600 rounded"
                disabled={isLoading}
              >
              <label for="remember" class="ml-2 block text-sm text-gray-300">
                {$t('common.remember', { default: 'Ricordami' })}
              </label>
            </div>

            <div class="text-sm">
              <a href="#" on:click|preventDefault={handleForgotPassword} class="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                {$t('common.forgotPassword')}
              </a>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            disabled={isLoading}
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {#if isLoading}
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </span>
              {$t('login.loggingIn')}
            {:else}
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                🔓
              </span>
              {$t('login.loginButton')}
            {/if}
          </button>
        </div>
      </form>

    </div>

    <!-- Modal Reset Password -->
    {#if showForgotPassword}
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-md mx-4">
          <h3 class="text-xl font-bold text-white mb-4">{$t('forgotPassword.title')}</h3>
          <p class="text-gray-300 mb-6">{$t('forgotPassword.message')}</p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">{$t('forgotPassword.emailLabel')}</label>
              <input
                type="email"
                bind:value={resetEmail}
                placeholder="{$t('forgotPassword.emailPlaceholder')}"
                class="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-400"
                disabled={resetLoading}
              />
            </div>
            
            <div class="flex space-x-3">
              <button
                on:click={sendResetEmail}
                disabled={resetLoading || !resetEmail}
                class="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {#if resetLoading}
                  <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {$t('forgotPassword.sending')}
                  </div>
                {:else}
                  {$t('forgotPassword.sendButton')}
                {/if}
              </button>
              
              <button
                on:click={() => showForgotPassword = false}
                disabled={resetLoading}
                class="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-400 hover:text-white transition-colors"
              >
                {$t('forgotPassword.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Footer Info -->
    <div class="text-center">
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 mb-4">
        <p class="text-xs text-gray-300 mb-2">
          <strong class="text-white">{$t('login.company')}</strong><br>
          <span class="text-gray-400">Sede legale:</span> L.go Alvaro De Mendoza 4, 64027 Sant'Omero (TE)<br>
          <span class="text-gray-400">Sede operativa:</span> Via Braida, 16, 35010 Villa Del Conte (PD)<br>
          <span class="text-gray-400">P.IVA:</span> <span class="text-blue-300">02174570677</span><br>
          <span class="text-gray-400">Email:</span> <a href="mailto:info@morlappo.com" class="text-blue-300 hover:text-blue-200 transition-colors">info@morlappo.com</a>
        </p>
        
        <div class="border-t border-gray-600 pt-3 mt-3">
          <p class="text-xs text-gray-400">
            {$t('login.copyright')}
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