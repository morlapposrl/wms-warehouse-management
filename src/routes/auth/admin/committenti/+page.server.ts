import type { PageServerLoad } from './$types';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Solo super admin possono accedere alla gestione committenti
  if (!locals.user || locals.user.ruolo !== 'super_admin') {
    throw redirect(302, '/auth/dashboard');
  }

  try {
    // Carica statistiche generali
    const stats = committentiRepository.getStats();
    
    // Carica committenti con statistiche (prime 20 per performance)
    const committentiWithStats = committentiRepository.findWithStats();
    
    return {
      stats,
      committenti: committentiWithStats.slice(0, 20), // Limite per performance iniziale
      user: locals.user
    };
  } catch (error) {
    console.error('Errore nel caricamento committenti:', error);
    return {
      stats: null,
      committenti: [],
      error: 'Errore nel caricamento dei dati',
      user: locals.user
    };
  }
};