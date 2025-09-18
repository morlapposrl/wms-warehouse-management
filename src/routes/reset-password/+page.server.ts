import type { PageServerLoad, Actions } from './$types';
import { userRepository } from '$lib/server/repositories/userRepository';
import { auditRepository } from '$lib/server/repositories/auditRepository';
import { fail, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const token = url.searchParams.get('token');
  
  if (!token) {
    return {
      error: 'Token mancante'
    };
  }

  // Verifica token
  const tokenData = userRepository.verifyResetToken(token);
  
  if (!tokenData) {
    return {
      error: 'Token non valido o scaduto'
    };
  }

  return {
    token,
    email: tokenData.email
  };
};

export const actions: Actions = {
  resetPassword: async ({ request, getClientAddress }) => {
    const formData = await request.formData();
    const token = formData.get('token')?.toString() || '';
    const password = formData.get('password')?.toString() || '';
    const confirmPassword = formData.get('confirmPassword')?.toString() || '';

    try {
      // Validazioni
      if (!token || !password || !confirmPassword) {
        return fail(400, {
          error: 'Tutti i campi sono obbligatori'
        });
      }

      if (password.length < 8) {
        return fail(400, {
          error: 'La password deve essere di almeno 8 caratteri'
        });
      }

      if (password !== confirmPassword) {
        return fail(400, {
          error: 'Le password non coincidono'
        });
      }

      // Verifica token
      const tokenData = userRepository.verifyResetToken(token);
      if (!tokenData) {
        return fail(400, {
          error: 'Token non valido o scaduto'
        });
      }

      // Reset password
      const success = await userRepository.resetPasswordWithToken(token, password);
      
      if (!success) {
        return fail(500, {
          error: 'Errore durante l\'aggiornamento della password'
        });
      }

      // Log operazione
      try {
        await auditRepository.logOperation({
          operazione_id: `PWD_RESET_SUCCESS_${uuidv4()}`,
          tabella_principale: 'utenti',
          tipo_operazione: 'UPDATE',
          descrizione_operazione: `Password resettata con successo per utente: ${tokenData.email}`,
          utente_id: tokenData.utente_id,
          utente_nome: 'Reset Token',
          utente_email: tokenData.email,
          indirizzo_ip: getClientAddress(),
          user_agent: request.headers.get('user-agent') || '',
          modulo: 'AUTH',
          funzionalita: 'password_reset_complete',
          importanza: 'ALTA',
          esito: 'SUCCESSO'
        });
      } catch (auditError) {
        console.error('Errore nel logging audit:', auditError);
      }

      // Restituisci messaggio di successo (senza redirect)
      return {
        success: true,
        message: 'Password aggiornata con successo! Ora puoi effettuare il login.'
      };

    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      
      console.error('Errore nel reset password:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  }
};