<script lang="ts">
  import { errorStore, errorHandler } from '$lib/stores/error';
  import Icon from './Icon.svelte';

  $: errors = $errorStore;

  function getErrorIcon(type: string) {
    switch (type) {
      case 'error': return 'x-circle';
      case 'warning': return 'exclamation-triangle';
      case 'info': return 'information-circle';
      case 'success': return 'check-circle';
      default: return 'information-circle';
    }
  }

  function getErrorClasses(type: string) {
    switch (type) {
      case 'error': return 'alert-error border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'alert-warning border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'alert-info border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'success': return 'alert-success border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      default: return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
    }
  }

  function getIconClasses(type: string) {
    switch (type) {
      case 'error': return 'text-red-500 dark:text-red-400';
      case 'warning': return 'text-yellow-500 dark:text-yellow-400';
      case 'info': return 'text-blue-500 dark:text-blue-400';
      case 'success': return 'text-green-500 dark:text-green-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  }
</script>

{#if errors.length > 0}
  <!-- Error Notifications Container -->
  <div class="fixed top-4 right-4 z-50 space-y-2 w-80">
    {#each errors as error (error.id)}
      <div 
        class="alert {getErrorClasses(error.type)} shadow-lg border-l-4 animate-in slide-in-from-right duration-300"
        role="alert"
      >
        <div class="flex items-start space-x-3">
          <!-- Icon -->
          <div class="flex-shrink-0 mt-1">
            <Icon 
              name={getErrorIcon(error.type)} 
              class="w-5 h-5 {getIconClasses(error.type)}" 
            />
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {error.title}
            </h4>
            <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {error.message}
            </p>
            
            <!-- Timestamp -->
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {error.timestamp.toLocaleTimeString('it-IT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              
              <!-- Details toggle (if present) -->
              {#if error.details}
                <button 
                  class="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                  on:click={() => {
                    const detailsEl = document.getElementById(`error-details-${error.id}`);
                    if (detailsEl) {
                      detailsEl.classList.toggle('hidden');
                    }
                  }}
                >
                  Dettagli
                </button>
              {/if}
            </div>
            
            <!-- Details (collapsible) -->
            {#if error.details}
              <div id="error-details-{error.id}" class="hidden mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                <pre class="whitespace-pre-wrap">{error.details}</pre>
              </div>
            {/if}
          </div>
          
          <!-- Close Button -->
          <button
            class="flex-shrink-0 ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            on:click={() => errorHandler.removeError(error.id)}
            aria-label="Chiudi notifica"
          >
            <Icon name="x" class="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if errors.length > 3}
  <!-- Clear All Button (when too many errors) -->
  <div class="fixed top-4 right-4 z-50 mt-2">
    <button
      class="btn btn-secondary btn-sm shadow-lg"
      on:click={errorHandler.clearErrors}
    >
      <Icon name="x" class="w-4 h-4 mr-1" />
      Chiudi Tutti ({errors.length})
    </button>
  </div>
{/if}

<style>
  .animate-in {
    animation: slideInFromRight 0.3s ease-out forwards;
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Auto-hide animation */
  .alert {
    animation: fadeOut 0.3s ease-in forwards;
    animation-delay: 4.7s; /* Start fade out before auto-hide */
  }

  .alert:hover {
    animation-play-state: paused; /* Pause fade out on hover */
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
</style>