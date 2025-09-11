import type { PageServerLoad, Actions } from './$types';
import { userRepository, type User } from '$lib/server/repositories/userRepository';
import { auditRepository } from '$lib/server/repositories/auditRepository';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';
import { fail } from '@sveltejs/kit';
import db from '$lib/server/database';

export const load: PageServerLoad = async ({ url, request }) => {
  try {
    // Filtri dalla query string
    const search = url.searchParams.get('search') || '';
    const ruolo_filter = url.searchParams.get('ruolo') || '';
    const committente_filter = url.searchParams.get('committente') || '';
    const attivo_filter = url.searchParams.get('attivo');

    const filters: any = {};
    if (search) filters.search = search;
    if (ruolo_filter) filters.ruolo = ruolo_filter;
    if (committente_filter && committente_filter !== 'all') {
      filters.committente_id = committente_filter === 'null' ? null : parseInt(committente_filter);
    }
    if (attivo_filter !== null && attivo_filter !== '') {
      filters.attivo = attivo_filter === 'true';
    }

    // Recupera utenti con filtri
    const utenti = userRepository.getAllUsers(filters);

    // Recupera committenti per filtro
    const committenti = db.prepare(`
      SELECT id, ragione_sociale, codice
      FROM committenti 
      WHERE stato = 'attivo'
      ORDER BY ragione_sociale
    `).all();

    // Statistiche utenti
    const statistiche = userRepository.getUserStats();

    // Sessioni attive
    const sessioniAttive = db.prepare(`
      SELECT 
        s.id, s.utente_id, s.data_login, s.ultimo_accesso, s.device_type,
        u.nome, u.cognome, u.email, u.ruolo,
        c.ragione_sociale as committente_nome
      FROM sessioni_utenti s
      JOIN utenti u ON s.utente_id = u.id
      LEFT JOIN committenti c ON s.committente_corrente_id = c.id
      WHERE s.attiva = 1
      ORDER BY s.ultimo_accesso DESC
    `).all();

    return {
      utenti,
      committenti,
      statistiche,
      sessioniAttive,
      filtri: {
        search,
        ruolo_filter,
        committente_filter,
        attivo_filter
      }
    };

  } catch (error) {
    console.error('Errore caricamento utenti:', error);
    throw error;
  }
};

export const actions: Actions = {
  createUser: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        email: formData.get('email')?.toString() || '',
        password_hash: formData.get('password')?.toString() || '',
        nome: formData.get('nome')?.toString() || '',
        cognome: formData.get('cognome')?.toString() || '',
        ruolo: formData.get('ruolo')?.toString() as any || 'utente_committente',
        specializzazione: formData.get('specializzazione')?.toString() || '',
        committente_id: formData.get('committente_id') ? parseInt(formData.get('committente_id')!.toString()) : undefined,
        attivo: true
      };

      // Validazioni
      if (!userData.email || !userData.password_hash || !userData.nome || !userData.cognome) {
        return fail(400, {
          error: 'Tutti i campi obbligatori devono essere compilati'
        });
      }

      // Verifica email univoca
      const existingUser = userRepository.getUserByEmail(userData.email);
      if (existingUser) {
        return fail(400, {
          error: 'Email già esistente nel sistema'
        });
      }

      // Crea utente
      const userId = await userRepository.createUser(userData);

      // Log audit
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'utenti',
          operation: 'CREATE',
          description: `Creato nuovo utente: ${userData.nome} ${userData.cognome} (${userData.email})`,
          module: 'USERS',
          functionality: 'create_user',
          importance: 'ALTA',
          entities_involved: { user_id: userId },
          data_after: { 
            email: userData.email, 
            nome: userData.nome, 
            cognome: userData.cognome, 
            ruolo: userData.ruolo 
          }
        });
      }

      return {
        success: `Utente ${userData.nome} ${userData.cognome} creato con successo`
      };

    } catch (error) {
      console.error('Errore creazione utente:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  },

  updateUser: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const userId = parseInt(formData.get('user_id')?.toString() || '0');
      if (!userId) {
        return fail(400, { error: 'ID utente mancante' });
      }

      // Recupera dati precedenti per audit
      const oldUser = userRepository.getUserById(userId);
      if (!oldUser) {
        return fail(404, { error: 'Utente non trovato' });
      }

      const updates: Partial<User> = {};
      
      const email = formData.get('email')?.toString();
      if (email) updates.email = email;
      
      const nome = formData.get('nome')?.toString();
      if (nome) updates.nome = nome;
      
      const cognome = formData.get('cognome')?.toString();
      if (cognome) updates.cognome = cognome;
      
      const ruolo = formData.get('ruolo')?.toString() as any;
      if (ruolo) updates.ruolo = ruolo;
      
      const specializzazione = formData.get('specializzazione')?.toString();
      if (specializzazione !== undefined) updates.specializzazione = specializzazione;
      
      const committente_id = formData.get('committente_id')?.toString();
      if (committente_id !== undefined) {
        updates.committente_id = committente_id ? parseInt(committente_id) : undefined;
      }
      
      const attivo = formData.get('attivo')?.toString();
      if (attivo !== undefined) updates.attivo = attivo === 'true';

      // Aggiorna utente
      const success = userRepository.updateUser(userId, updates);
      
      if (!success) {
        return fail(400, { error: 'Nessuna modifica applicata' });
      }

      // Log audit
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'utenti',
          operation: 'UPDATE',
          description: `Aggiornato utente: ${oldUser.nome} ${oldUser.cognome}`,
          module: 'USERS',
          functionality: 'update_user',
          importance: 'ALTA',
          entities_involved: { user_id: userId },
          data_before: {
            email: oldUser.email,
            nome: oldUser.nome,
            cognome: oldUser.cognome,
            ruolo: oldUser.ruolo,
            attivo: oldUser.attivo
          },
          data_after: updates
        });
      }

      return {
        success: 'Utente aggiornato con successo'
      };

    } catch (error) {
      console.error('Errore aggiornamento utente:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  },

  changePassword: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const userId = parseInt(formData.get('user_id')?.toString() || '0');
      const newPassword = formData.get('new_password')?.toString() || '';
      
      if (!userId || !newPassword) {
        return fail(400, { error: 'Dati mancanti' });
      }

      if (newPassword.length < 8) {
        return fail(400, { error: 'La password deve essere di almeno 8 caratteri' });
      }

      const success = await userRepository.changePassword(userId, newPassword);
      
      if (!success) {
        return fail(400, { error: 'Errore nel cambio password' });
      }

      // Log audit
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        const user = userRepository.getUserById(userId);
        await tracker.logOperation({
          table: 'utenti',
          operation: 'UPDATE',
          description: `Cambiata password per utente: ${user?.nome} ${user?.cognome}`,
          module: 'USERS',
          functionality: 'change_password',
          importance: 'CRITICA',
          entities_involved: { user_id: userId }
        });
      }

      return {
        success: 'Password cambiata con successo'
      };

    } catch (error) {
      console.error('Errore cambio password:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  },

  toggleUserStatus: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const userId = parseInt(formData.get('user_id')?.toString() || '0');
      const attivo = formData.get('attivo')?.toString() === 'true';
      
      if (!userId) {
        return fail(400, { error: 'ID utente mancante' });
      }

      const user = userRepository.getUserById(userId);
      if (!user) {
        return fail(404, { error: 'Utente non trovato' });
      }

      const success = userRepository.toggleUserStatus(userId, attivo);
      
      if (!success) {
        return fail(400, { error: 'Errore nel cambio stato' });
      }

      // Log audit
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'utenti',
          operation: 'UPDATE',
          description: `${attivo ? 'Attivato' : 'Disattivato'} utente: ${user.nome} ${user.cognome}`,
          module: 'USERS',
          functionality: 'toggle_status',
          importance: 'ALTA',
          entities_involved: { user_id: userId },
          data_before: { attivo: user.attivo },
          data_after: { attivo: attivo }
        });
      }

      return {
        success: `Utente ${attivo ? 'attivato' : 'disattivato'} con successo`
      };

    } catch (error) {
      console.error('Errore cambio stato utente:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  }
};