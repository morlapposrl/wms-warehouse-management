import type { Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/database';
import { userRepository } from '$lib/server/repositories/userRepository';
import { auditRepository } from '$lib/server/repositories/auditRepository';
import { redirect } from '@sveltejs/kit';

// Inizializza il database all'avvio del server
initializeDatabase();

export const handle: Handle = async ({ event, resolve }) => {
  const { cookies, url } = event;
  
  // Route che non richiedono autenticazione
  const publicRoutes = ['/login', '/api/health', '/api/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));
  
  // Se è una route pubblica, continua senza controlli
  if (isPublicRoute) {
    return resolve(event);
  }

  // Recupera session ID dai cookies
  const sessionId = cookies.get('session_id');
  const userId = cookies.get('user_id');

  // Se non ci sono cookies di autenticazione, reindirizza al login
  if (!sessionId || !userId) {
    if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/api')) {
      throw redirect(302, '/login');
    }
    return resolve(event);
  }

  try {
    // Verifica che la sessione sia ancora attiva
    const session = auditRepository.getActiveSessionBySessionId(sessionId);
    if (!session) {
      // Sessione scaduta o non valida
      cookies.delete('session_id', { path: '/' });
      cookies.delete('user_id', { path: '/' });
      throw redirect(302, '/login');
    }

    // Recupera dati utente
    const user = userRepository.getUserById(parseInt(userId));
    if (!user || !user.attivo) {
      // Utente non trovato o disattivato
      cookies.delete('session_id', { path: '/' });
      cookies.delete('user_id', { path: '/' });
      throw redirect(302, '/login');
    }

    // Aggiorna ultimo accesso della sessione
    auditRepository.updateSession(sessionId, {
      ultimo_accesso: new Date().toISOString(),
      pagine_visitate: session.pagine_visitate + 1
    });

    // Aggiungi dati utente e sessione al context
    event.locals.user = user;
    event.locals.session = session;

    // Se l'utente è associato a un committente specifico, caricalo
    if (user.committente_id) {
      // Qui andrebbe aggiunto un metodo per caricare il committente
      event.locals.committente = {
        id: user.committente_id,
        ragione_sociale: user.committente_nome || '',
        codice: user.committente_codice || ''
      };
    }

    // Log della visita pagina per audit (solo per pagine importanti)
    if (url.pathname.startsWith('/auth/') && !url.pathname.includes('/api/')) {
      try {
        await auditRepository.logOperation({
          operazione_id: `PAGE_VISIT_${sessionId}_${Date.now()}`,
          tabella_principale: 'sessioni_utenti',
          tipo_operazione: 'READ',
          descrizione_operazione: `Visita pagina: ${url.pathname}`,
          utente_id: user.id!,
          utente_nome: `${user.nome} ${user.cognome}`,
          utente_email: user.email,
          committente_id: user.committente_id,
          indirizzo_ip: event.getClientAddress(),
          user_agent: event.request.headers.get('user-agent') || '',
          sessione_id: sessionId,
          modulo: 'NAVIGATION',
          funzionalita: 'page_visit',
          importanza: 'BASSA',
          esito: 'SUCCESSO'
        });
      } catch (error) {
        // Log dell'errore ma non interrompere la richiesta
        console.error('Errore nel logging della visita pagina:', error);
      }
    }

  } catch (error) {
    // Se è un redirect, lascialo passare
    if (error instanceof Response) {
      throw error;
    }
    
    console.error('Errore nel middleware di autenticazione:', error);
    
    // In caso di errore, pulisci i cookies e reindirizza
    cookies.delete('session_id', { path: '/' });
    cookies.delete('user_id', { path: '/' });
    throw redirect(302, '/login');
  }

  return resolve(event);
};

// Aggiungi i tipi per i locals
declare global {
  namespace App {
    interface Locals {
      user?: {
        id: number;
        email: string;
        nome: string;
        cognome: string;
        ruolo: string;
        specializzazione?: string;
        committente_id?: number;
        attivo: boolean;
        ultimo_accesso?: string;
        committente_nome?: string;
        committente_codice?: string;
      };
      session?: {
        id: number;
        utente_id: number;
        sessione_id: string;
        data_login: string;
        ultimo_accesso: string;
        pagine_visitate: number;
        operazioni_eseguite: number;
        committente_corrente_id?: number;
        attiva: boolean;
      };
      committente?: {
        id: number;
        codice: string;
        ragione_sociale: string;
      };
    }
  }
}