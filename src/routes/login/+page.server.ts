import type { PageServerLoad, Actions } from './$types';
import { userRepository } from '$lib/server/repositories/userRepository';
import { auditRepository } from '$lib/server/repositories/auditRepository';
import { fail, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async ({ cookies }) => {
  // Se già autenticato, reindirizza alla dashboard
  const sessionId = cookies.get('session_id');
  if (sessionId) {
    // Verifica se la sessione è ancora valida
    const session = auditRepository.getActiveSessionBySessionId?.(sessionId);
    if (session) {
      throw redirect(302, '/auth');
    }
  }

  return {
    title: 'Login - Gestionale Magazzino'
  };
};

export const actions: Actions = {
  login: async ({ request, cookies, getClientAddress }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString() || '';
    
    try {
      const password = formData.get('password')?.toString() || '';
      const remember = formData.get('remember') === 'on';

      // Validazioni base
      if (!email || !password) {
        return fail(400, {
          error: 'Email e password sono obbligatorie',
          email
        });
      }

      // Verifica credenziali
      const user = await userRepository.verifyPassword(email, password);
      
      if (!user) {
        // Log tentativo di accesso fallito
        try {
          await auditRepository.logOperation({
            operazione_id: `LOGIN_FAILED_${uuidv4()}`,
            tabella_principale: 'utenti',
            tipo_operazione: 'LOGIN',
            descrizione_operazione: `Tentativo di login fallito per email: ${email}`,
            utente_id: 0,
            utente_nome: 'Unknown',
            utente_email: email,
            indirizzo_ip: getClientAddress(),
            user_agent: request.headers.get('user-agent') || '',
            modulo: 'AUTH',
            funzionalita: 'login_attempt',
            importanza: 'MEDIA',
            esito: 'ERRORE',
            messaggio_errore: 'Credenziali non valide'
          });
        } catch (auditError) {
          console.error('Errore nel logging audit:', auditError);
        }

        return fail(401, {
          error: 'Email o password non corretti',
          email
        });
      }

      if (!user.attivo) {
        return fail(403, {
          error: 'Account disattivato. Contattare l\'amministratore.',
          email
        });
      }

      // Genera session ID
      const sessionId = uuidv4();
      const userAgent = request.headers.get('user-agent') || '';
      
      // Determina device info
      const deviceInfo = extractDeviceInfo(userAgent);
      
      // Crea sessione nel database
      try {
        auditRepository.createSession({
          utente_id: user.id!,
          sessione_id: sessionId,
          data_login: new Date().toISOString(),
          indirizzo_ip: getClientAddress(),
          user_agent: userAgent,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ultimo_accesso: new Date().toISOString(),
          pagine_visitate: 0,
          operazioni_eseguite: 0,
          committente_corrente_id: user.committente_id,
          attiva: true
        });
      } catch (sessionError) {
        console.error('Errore creazione sessione:', sessionError);
        return fail(500, {
          error: 'Errore interno nel sistema di autenticazione'
        });
      }

      // Log login di successo
      try {
        await auditRepository.logOperation({
          operazione_id: `LOGIN_SUCCESS_${sessionId}`,
          tabella_principale: 'utenti',
          tipo_operazione: 'LOGIN',
          descrizione_operazione: `Login effettuato con successo da ${user.nome} ${user.cognome}`,
          utente_id: user.id!,
          utente_nome: `${user.nome} ${user.cognome}`,
          utente_email: user.email,
          committente_id: user.committente_id,
          committente_nome: user.committente_nome,
          indirizzo_ip: getClientAddress(),
          user_agent: userAgent,
          device_info: JSON.stringify(deviceInfo),
          sessione_id: sessionId,
          modulo: 'AUTH',
          funzionalita: 'successful_login',
          importanza: 'MEDIA',
          esito: 'SUCCESSO'
        });
      } catch (auditError) {
        console.error('Errore nel logging audit login:', auditError);
      }

      // Imposta cookie di sessione
      const cookieOptions = {
        httpOnly: true,
        secure: false, // In produzione impostare a true con HTTPS
        sameSite: 'lax' as const,
        maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 giorni se remember, altrimenti 1 giorno
        path: '/'
      };

      cookies.set('session_id', sessionId, cookieOptions);
      cookies.set('user_id', user.id!.toString(), cookieOptions);

    } catch (error) {
      console.error('Errore nel login:', error);
      return fail(500, {
        error: 'Errore interno del server',
        email
      });
    }

    // Reindirizza alla dashboard (fuori dal try-catch)
    throw redirect(302, '/auth');
  },

  logout: async ({ cookies, request }) => {
    try {
      const sessionId = cookies.get('session_id');
      const userId = cookies.get('user_id');

      if (sessionId && userId) {
        // Recupera info utente per audit
        const user = userRepository.getUserById(parseInt(userId));
        
        // Calcola durata sessione
        const session = auditRepository.getActiveSessionBySessionId?.(sessionId);
        let durataMinuti = 0;
        
        if (session) {
          const loginTime = new Date(session.data_login);
          const logoutTime = new Date();
          durataMinuti = Math.round((logoutTime.getTime() - loginTime.getTime()) / (1000 * 60));
        }

        // Chiudi sessione nel database
        auditRepository.updateSession(sessionId, {
          data_logout: new Date().toISOString(),
          durata_sessione_minuti: durataMinuti,
          motivo_chiusura: 'logout'
        });

        // Log logout
        if (user) {
          await auditRepository.logOperation({
            operazione_id: `LOGOUT_${sessionId}`,
            tabella_principale: 'utenti',
            tipo_operazione: 'LOGOUT',
            descrizione_operazione: `Logout effettuato da ${user.nome} ${user.cognome}`,
            utente_id: user.id!,
            utente_nome: `${user.nome} ${user.cognome}`,
            utente_email: user.email,
            committente_id: user.committente_id,
            sessione_id: sessionId,
            modulo: 'AUTH',
            funzionalita: 'logout',
            importanza: 'BASSA',
            esito: 'SUCCESSO',
            durata_ms: durataMinuti * 60 * 1000
          });
        }
      }

      // Rimuovi cookies
      cookies.delete('session_id', { path: '/' });
      cookies.delete('user_id', { path: '/' });

      throw redirect(302, '/login');

    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      
      console.error('Errore nel logout:', error);
      throw redirect(302, '/login');
    }
  }
};

// Helper function per estrarre info device
function extractDeviceInfo(userAgent: string) {
  let deviceType = 'desktop';
  let browser = 'unknown';
  let os = 'unknown';

  // Device type detection
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/Tablet|iPad/.test(userAgent)) {
    deviceType = 'tablet';
  }

  // Browser detection
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS')) {
    os = 'iOS';
  }

  return { deviceType, browser, os };
}

// Aggiungi metodo mancante al repository
declare module '$lib/server/repositories/auditRepository' {
  interface AuditRepository {
    getActiveSessionBySessionId(sessionId: string): any;
  }
}