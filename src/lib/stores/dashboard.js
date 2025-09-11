import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Store per la modalità dashboard (normale o compatta)
function createDashboardModeStore() {
  const { subscribe, set, update } = writable('normal');

  return {
    subscribe,
    // Inizializza la modalità dal localStorage
    init: () => {
      if (browser) {
        const saved = localStorage.getItem('dashboard-mode');
        if (saved && (saved === 'normal' || saved === 'compact')) {
          set(saved);
        }
      }
    },
    // Cambia modalità e salva nel localStorage
    toggle: () => {
      update(mode => {
        const newMode = mode === 'normal' ? 'compact' : 'normal';
        if (browser) {
          localStorage.setItem('dashboard-mode', newMode);
        }
        return newMode;
      });
    },
    // Imposta modalità specifica
    setMode: (mode) => {
      if (mode === 'normal' || mode === 'compact') {
        set(mode);
        if (browser) {
          localStorage.setItem('dashboard-mode', mode);
        }
      }
    }
  };
}

export const dashboardMode = createDashboardModeStore();