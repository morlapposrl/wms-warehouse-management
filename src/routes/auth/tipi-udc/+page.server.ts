import type { PageServerLoad } from './$types';
import { udcRepository } from '$lib/server/repositories/udcRepository';

export const load: PageServerLoad = async ({ url }) => {
  try {
    const tipiUdc = udcRepository.getAllTipiUDC();
    
    return {
      tipiUdc: tipiUdc || []
    };
  } catch (error) {
    console.error('Errore nel caricamento tipi UDC:', error);
    return {
      tipiUdc: [],
      error: 'Errore nel caricamento dei tipi UDC'
    };
  }
};