import { AuditTracker, type AuditContext } from '../middleware/auditMiddleware';
import { userRepository } from '../repositories/userRepository';
import { auditRepository } from '../repositories/auditRepository';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

/**
 * Helper per creare audit tracker nelle form actions
 * Fix per il problema di request.locals undefined nelle form actions
 */
export function createAuditTrackerForAction(
  request: Request,
  cookies: Cookies
): AuditTracker | null {
  try {
    const sessionId = cookies.get('session_id');
    const userId = cookies.get('user_id');
    
    if (!sessionId || !userId) {
      console.log('❌ AUDIT: Mancano sessionId o userId nei cookies');
      return null;
    }
    
    // Recupera dati utente dal database
    const user = userRepository.getUserById(parseInt(userId));
    const session = auditRepository.getActiveSessionBySessionId(sessionId);
    
    if (!user || !session) {
      console.log('❌ AUDIT: User o session non trovati nel database');
      return null;
    }
    
    const context: AuditContext = {
      user_id: user.id!,
      user_name: `${user.nome} ${user.cognome}`,
      user_email: user.email,
      committente_id: user.committente_id,
      committente_name: user.committente_nome,
      session_id: sessionId,
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || undefined
    };
    
    return new AuditTracker(context);
  } catch (error) {
    console.error('❌ AUDIT: Errore creazione tracker per action:', error);
    return null;
  }
}

/**
 * Helper per creare audit tracker nelle load functions (usa i locals)
 */
export function createAuditTrackerForLoad(event: RequestEvent): AuditTracker | null {
  if (!event.locals?.user) {
    return null;
  }
  
  const user = event.locals.user;
  const committente = event.locals.committente;
  const session = event.locals.session;
  
  const context: AuditContext = {
    user_id: user.id,
    user_name: `${user.nome} ${user.cognome}`,
    user_email: user.email,
    committente_id: committente?.id,
    committente_name: committente?.ragione_sociale,
    session_id: session?.sessione_id,
    ip_address: event.getClientAddress(),
    user_agent: event.request.headers.get('user-agent') || undefined
  };
  
  return new AuditTracker(context);
}