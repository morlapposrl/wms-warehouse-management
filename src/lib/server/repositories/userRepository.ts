import db from '../database.js';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  email: string;
  password_hash?: string;
  nome: string;
  cognome: string;
  ruolo: 'super_admin' | 'admin_committente' | 'operatore_magazzino' | 'team_leader' | 'utente_committente' | 'ospite';
  specializzazione?: string;
  committente_id?: number;
  attivo: boolean;
  ultimo_accesso?: string;
  created_at?: string;
  updated_at?: string;
  // Join fields
  committente_nome?: string;
  committente_codice?: string;
}

export interface PreferenzeUtente {
  id?: number;
  utente_id: number;
  tema: 'light' | 'dark' | 'auto';
  lingua: string;
  fuso_orario: string;
  formato_data: string;
  formato_ora: string;
  dashboard_layout?: string;
  widget_preferiti?: string;
  committente_default_id?: number;
  categoria_default_id?: number;
  notifiche_email: boolean;
  notifiche_browser: boolean;
  notifiche_mobile: boolean;
  menu_compatto: boolean;
  ricordi_ultima_pagina: boolean;
  created_at?: string;
  updated_at?: string;
}

export const userRepository = {

  // === GESTIONE UTENTI ===
  
  /**
   * Crea nuovo utente con password hash
   */
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const passwordHash = await bcrypt.hash(userData.password_hash || '', 10);
    
    const stmt = db.prepare(`
      INSERT INTO utenti (
        email, password_hash, nome, cognome, ruolo, specializzazione,
        committente_id, attivo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userData.email,
      passwordHash,
      userData.nome,
      userData.cognome,
      userData.ruolo,
      userData.specializzazione || null,
      userData.committente_id || null,
      userData.attivo ? 1 : 0
    );

    const userId = result.lastInsertRowid as number;
    
    // Crea preferenze utente di default
    this.createDefaultPreferences(userId);
    
    return userId;
  },

  /**
   * Ottieni utente per ID
   */
  getUserById(id: number): User | null {
    const stmt = db.prepare(`
      SELECT 
        u.*,
        c.ragione_sociale as committente_nome,
        c.codice as committente_codice
      FROM utenti u
      LEFT JOIN committenti c ON u.committente_id = c.id
      WHERE u.id = ?
    `);
    
    const user = stmt.get(id) as User | null;
    if (user) {
      delete user.password_hash; // Non esporre hash password
    }
    return user;
  },

  /**
   * Ottieni utente per email (per login)
   */
  getUserByEmail(email: string): User | null {
    const stmt = db.prepare(`
      SELECT 
        u.*,
        c.ragione_sociale as committente_nome,
        c.codice as committente_codice
      FROM utenti u
      LEFT JOIN committenti c ON u.committente_id = c.id
      WHERE u.email = ? AND u.attivo = 1
    `);
    
    return stmt.get(email) as User | null;
  },

  /**
   * Verifica password utente
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = this.getUserByEmail(email);
    if (!user || !user.password_hash) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }
    
    // Aggiorna ultimo accesso
    this.updateLastAccess(user.id!);
    
    delete user.password_hash; // Non esporre hash
    return user;
  },

  /**
   * Ottieni tutti gli utenti con filtri
   */
  getAllUsers(filters: {
    committente_id?: number;
    ruolo?: string;
    attivo?: boolean;
    search?: string;
  } = {}): User[] {
    let query = `
      SELECT 
        u.id, u.email, u.nome, u.cognome, u.ruolo, u.specializzazione,
        u.committente_id, u.attivo, u.ultimo_accesso, u.created_at,
        c.ragione_sociale as committente_nome,
        c.codice as committente_codice
      FROM utenti u
      LEFT JOIN committenti c ON u.committente_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.committente_id !== undefined) {
      if (filters.committente_id === null) {
        query += ' AND u.committente_id IS NULL';
      } else {
        query += ' AND u.committente_id = ?';
        params.push(filters.committente_id);
      }
    }
    
    if (filters.ruolo) {
      query += ' AND u.ruolo = ?';
      params.push(filters.ruolo);
    }
    
    if (filters.attivo !== undefined) {
      query += ' AND u.attivo = ?';
      params.push(filters.attivo ? 1 : 0);
    }
    
    if (filters.search) {
      query += ' AND (u.nome LIKE ? OR u.cognome LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY u.nome, u.cognome';
    
    return db.prepare(query).all(...params) as User[];
  },

  /**
   * Aggiorna utente
   */
  updateUser(id: number, updates: Partial<User>): boolean {
    const fields = [];
    const params = [];
    
    if (updates.email) {
      fields.push('email = ?');
      params.push(updates.email);
    }
    
    if (updates.nome) {
      fields.push('nome = ?');
      params.push(updates.nome);
    }
    
    if (updates.cognome) {
      fields.push('cognome = ?');
      params.push(updates.cognome);
    }
    
    if (updates.ruolo) {
      fields.push('ruolo = ?');
      params.push(updates.ruolo);
    }
    
    if (updates.specializzazione !== undefined) {
      fields.push('specializzazione = ?');
      params.push(updates.specializzazione);
    }
    
    if (updates.committente_id !== undefined) {
      fields.push('committente_id = ?');
      params.push(updates.committente_id);
    }
    
    if (updates.attivo !== undefined) {
      fields.push('attivo = ?');
      params.push(updates.attivo ? 1 : 0);
    }
    
    if (fields.length === 0) return false;
    
    params.push(id);
    
    const stmt = db.prepare(`
      UPDATE utenti 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(...params);
    return result.changes > 0;
  },

  /**
   * Cambia password utente
   */
  async changePassword(id: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const stmt = db.prepare(`
      UPDATE utenti 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(passwordHash, id);
    return result.changes > 0;
  },

  /**
   * Attiva/disattiva utente
   */
  toggleUserStatus(id: number, attivo: boolean): boolean {
    const stmt = db.prepare(`
      UPDATE utenti 
      SET attivo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(attivo ? 1 : 0, id);
    return result.changes > 0;
  },

  /**
   * Aggiorna ultimo accesso
   */
  updateLastAccess(id: number): boolean {
    const stmt = db.prepare(`
      UPDATE utenti 
      SET ultimo_accesso = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    return result.changes > 0;
  },

  /**
   * Elimina utente (soft delete - disattiva)
   */
  deleteUser(id: number): boolean {
    return this.toggleUserStatus(id, false);
  },

  // === GESTIONE PREFERENZE ===
  
  /**
   * Crea preferenze utente di default
   */
  createDefaultPreferences(utente_id: number): number {
    const stmt = db.prepare(`
      INSERT INTO preferenze_utente (
        utente_id, tema, lingua, fuso_orario, formato_data, formato_ora,
        notifiche_email, notifiche_browser, notifiche_mobile,
        menu_compatto, ricordi_ultima_pagina
      ) VALUES (?, 'light', 'it', 'Europe/Rome', 'DD/MM/YYYY', '24h', 1, 1, 0, 0, 1)
    `);
    
    const result = stmt.run(utente_id);
    return result.lastInsertRowid as number;
  },

  /**
   * Ottieni preferenze utente
   */
  getUserPreferences(utente_id: number): PreferenzeUtente | null {
    const stmt = db.prepare(`
      SELECT * FROM preferenze_utente WHERE utente_id = ?
    `);
    
    return stmt.get(utente_id) as PreferenzeUtente | null;
  },

  /**
   * Aggiorna preferenze utente
   */
  updateUserPreferences(utente_id: number, preferences: Partial<PreferenzeUtente>): boolean {
    // Prima verifica se esistono le preferenze
    let existingPrefs = this.getUserPreferences(utente_id);
    
    if (!existingPrefs) {
      // Crea preferenze di default se non esistono
      this.createDefaultPreferences(utente_id);
      existingPrefs = this.getUserPreferences(utente_id);
    }
    
    const fields = [];
    const params = [];
    
    Object.keys(preferences).forEach(key => {
      if (key !== 'id' && key !== 'utente_id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        params.push(preferences[key as keyof PreferenzeUtente]);
      }
    });
    
    if (fields.length === 0) return false;
    
    params.push(utente_id);
    
    const stmt = db.prepare(`
      UPDATE preferenze_utente 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE utente_id = ?
    `);
    
    const result = stmt.run(...params);
    return result.changes > 0;
  },

  // === UTENTI PER COMMITTENTE ===
  
  /**
   * Ottieni utenti per committente specifico
   */
  getUsersByCommittente(committente_id: number): User[] {
    return this.getAllUsers({ committente_id });
  },

  /**
   * Ottieni operatori magazzino attivi
   */
  getOperatoriMagazzino(): User[] {
    return this.getAllUsers({ 
      ruolo: 'operatore_magazzino', 
      attivo: true 
    });
  },

  /**
   * Ottieni amministratori sistema
   */
  getSystemAdmins(): User[] {
    return this.getAllUsers({ 
      ruolo: 'super_admin', 
      attivo: true 
    });
  },

  /**
   * Verifica se utente può accedere a committente
   */
  canAccessCommittente(utente_id: number, committente_id: number): boolean {
    const user = this.getUserById(utente_id);
    if (!user || !user.attivo) return false;
    
    // Super admin può accedere a tutto
    if (user.ruolo === 'super_admin') return true;
    
    // Operatori magazzino possono accedere a tutti i committenti
    if (user.ruolo === 'operatore_magazzino' || user.ruolo === 'team_leader') return true;
    
    // Altri utenti solo al proprio committente
    return user.committente_id === committente_id;
  },

  /**
   * Statistiche utenti
   */
  getUserStats() {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totale_utenti,
        COUNT(CASE WHEN attivo = 1 THEN 1 END) as utenti_attivi,
        COUNT(CASE WHEN ruolo = 'super_admin' THEN 1 END) as super_admin,
        COUNT(CASE WHEN ruolo = 'admin_committente' THEN 1 END) as admin_committente,
        COUNT(CASE WHEN ruolo = 'operatore_magazzino' THEN 1 END) as operatori,
        COUNT(CASE WHEN ruolo = 'utente_committente' THEN 1 END) as utenti_committente,
        COUNT(CASE WHEN ultimo_accesso > datetime('now', '-7 days') THEN 1 END) as accessi_ultima_settimana
      FROM utenti
    `);
    
    return stmt.get();
  },

  // === GESTIONE RESET PASSWORD ===

  /**
   * Crea token di reset password
   */
  createPasswordResetToken(utente_id: number, token: string, expires_at: string): boolean {
    // Prima elimina eventuali token esistenti per questo utente
    const deleteStmt = db.prepare(`
      DELETE FROM password_reset_tokens 
      WHERE utente_id = ? OR expires_at < datetime('now')
    `);
    deleteStmt.run(utente_id);

    // Crea nuovo token
    const insertStmt = db.prepare(`
      INSERT INTO password_reset_tokens (utente_id, token, expires_at)
      VALUES (?, ?, ?)
    `);
    
    const result = insertStmt.run(utente_id, token, expires_at);
    return result.changes > 0;
  },

  /**
   * Verifica token di reset password
   */
  verifyResetToken(token: string): { utente_id: number; email: string } | null {
    const stmt = db.prepare(`
      SELECT 
        prt.utente_id,
        u.email
      FROM password_reset_tokens prt
      JOIN utenti u ON prt.utente_id = u.id
      WHERE prt.token = ? 
        AND prt.expires_at > datetime('now')
        AND prt.used = 0
        AND u.attivo = 1
    `);
    
    return stmt.get(token) as { utente_id: number; email: string } | null;
  },

  /**
   * Marca token come utilizzato
   */
  markTokenAsUsed(token: string): boolean {
    const stmt = db.prepare(`
      UPDATE password_reset_tokens 
      SET used = 1, used_at = datetime('now')
      WHERE token = ?
    `);
    
    const result = stmt.run(token);
    return result.changes > 0;
  },

  /**
   * Reset password con token
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    // Verifica token
    const tokenData = this.verifyResetToken(token);
    if (!tokenData) {
      return false;
    }

    // Cambia password
    const success = await this.changePassword(tokenData.utente_id, newPassword);
    
    if (success) {
      // Marca token come utilizzato
      this.markTokenAsUsed(token);
    }
    
    return success;
  }
};