import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ubicazioniRepository } from '$lib/server/repositories/ubicazioniRepository.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { ubicazioni } = body;
    
    if (!ubicazioni || !Array.isArray(ubicazioni)) {
      return json({ error: 'Array ubicazioni richiesto' }, { status: 400 });
    }
    
    if (ubicazioni.length === 0) {
      return json({ error: 'Nessuna ubicazione da creare' }, { status: 400 });
    }
    
    if (ubicazioni.length > 1000) {
      return json({ error: 'Troppi elementi - massimo 1000 ubicazioni per volta' }, { status: 400 });
    }
    
    // Validazione base per ogni ubicazione
    for (const ubicazione of ubicazioni) {
      if (!ubicazione.codice_ubicazione || !ubicazione.tipo || !ubicazione.zona_velocita) {
        return json({ 
          error: 'Dati mancanti: codice_ubicazione, tipo e zona_velocita sono obbligatori' 
        }, { status: 400 });
      }
    }
    
    const created = ubicazioniRepository.createBulk(ubicazioni);
    
    return json({ 
      success: true, 
      created: created,
      message: `${created} ubicazioni create con successo`
    });
    
  } catch (error) {
    console.error('Errore creazione bulk ubicazioni:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return json({ 
        error: 'Una o più ubicazioni esistono già con lo stesso codice' 
      }, { status: 409 });
    }
    
    return json({ 
      error: 'Errore interno del server durante la creazione multipla' 
    }, { status: 500 });
  }
};