import db from '../database.js';

export interface AuditTrailEntry {
  id?: number;
  operazione_id: string;
  tabella_principale: string;
  tipo_operazione: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'MOVIMENTO' | 'ORDINE' | 'CARICO' | 'SCARICO' | 'INVENTARIO' | 'TRASFERIMENTO';
  descrizione_operazione: string;
  entita_coinvolte?: string; // JSON
  dati_precedenti?: string; // JSON
  dati_nuovi?: string; // JSON
  utente_id: number;
  utente_nome: string;
  utente_email: string;
  committente_id?: number;
  committente_nome?: string;
  indirizzo_ip?: string;
  user_agent?: string;
  device_info?: string;
  sessione_id?: string;
  modulo: string;
  funzionalita?: string;
  importanza: 'BASSA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  esito: 'SUCCESSO' | 'ERRORE' | 'WARNING';
  messaggio_errore?: string;
  durata_ms?: number;
}

export interface SessioneUtente {
  id?: number;
  utente_id: number;
  sessione_id: string;
  data_login: string;
  indirizzo_ip?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ultimo_accesso: string;
  pagine_visitate: number;
  operazioni_eseguite: number;
  committente_corrente_id?: number;
  data_logout?: string;
  durata_sessione_minuti?: number;
  motivo_chiusura?: string;
  attiva: boolean;
}

export interface NotificaSistema {
  id?: number;
  utente_destinatario_id?: number;
  committente_destinatario_id?: number;
  ruolo_destinatario?: string;
  titolo: string;
  messaggio: string;
  tipo: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  priorita: 'BASSA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  azione_url?: string;
  azione_label?: string;
  modulo_origine?: string;
  evento_scatenante?: string;
  dati_aggiuntivi?: string; // JSON
  letta: boolean;
  data_lettura?: string;
  archiviata: boolean;
  data_scadenza?: string;
}

export const auditRepository = {
  
  // === AUDIT TRAIL ===
  
  /**
   * Registra una operazione nell'audit trail
   */
  logOperation(entry: AuditTrailEntry): number {
    const stmt = db.prepare(`
      INSERT INTO audit_trail (
        operazione_id, tabella_principale, tipo_operazione, descrizione_operazione,
        entita_coinvolte, dati_precedenti, dati_nuovi,
        utente_id, utente_nome, utente_email, committente_id, committente_nome,
        indirizzo_ip, user_agent, device_info, sessione_id,
        modulo, funzionalita, importanza, esito, messaggio_errore, durata_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      entry.operazione_id,
      entry.tabella_principale,
      entry.tipo_operazione,
      entry.descrizione_operazione,
      entry.entita_coinvolte || null,
      entry.dati_precedenti || null,
      entry.dati_nuovi || null,
      entry.utente_id,
      entry.utente_nome,
      entry.utente_email,
      entry.committente_id || null,
      entry.committente_nome || null,
      entry.indirizzo_ip || null,
      entry.user_agent || null,
      entry.device_info || null,
      entry.sessione_id || null,
      entry.modulo,
      entry.funzionalita || null,
      entry.importanza,
      entry.esito,
      entry.messaggio_errore || null,
      entry.durata_ms || null
    );

    return result.lastInsertRowid as number;
  },

  /**
   * Recupera audit trail con filtri
   */
  getAuditTrail(filters: {
    utente_id?: number;
    committente_id?: number;
    tipo_operazione?: string;
    modulo?: string;
    data_da?: string;
    data_a?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = `
      SELECT 
        a.*,
        u.nome as utente_nome_completo,
        u.cognome as utente_cognome,
        c.ragione_sociale as committente_ragione_sociale
      FROM audit_trail a
      LEFT JOIN utenti u ON a.utente_id = u.id
      LEFT JOIN committenti c ON a.committente_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.utente_id) {
      query += ' AND a.utente_id = ?';
      params.push(filters.utente_id);
    }
    
    if (filters.committente_id) {
      query += ' AND a.committente_id = ?';
      params.push(filters.committente_id);
    }
    
    if (filters.tipo_operazione) {
      query += ' AND a.tipo_operazione = ?';
      params.push(filters.tipo_operazione);
    }
    
    if (filters.modulo) {
      query += ' AND a.modulo = ?';
      params.push(filters.modulo);
    }
    
    if (filters.data_da) {
      query += ' AND a.data_operazione >= ?';
      params.push(filters.data_da);
    }
    
    if (filters.data_a) {
      query += ' AND a.data_operazione <= ?';
      params.push(filters.data_a);
    }
    
    query += ' ORDER BY a.timestamp DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    return db.prepare(query).all(...params);
  },

  /**
   * Statistiche audit trail
   */
  getAuditStats(filters: {
    utente_id?: number;
    committente_id?: number;
    data_da?: string;
    data_a?: string;
  } = {}) {
    let query = `
      SELECT 
        COUNT(*) as totale_operazioni,
        COUNT(CASE WHEN esito = 'SUCCESSO' THEN 1 END) as operazioni_successo,
        COUNT(CASE WHEN esito = 'ERRORE' THEN 1 END) as operazioni_errore,
        COUNT(CASE WHEN importanza = 'CRITICA' THEN 1 END) as operazioni_critiche,
        COUNT(DISTINCT utente_id) as utenti_attivi,
        COUNT(DISTINCT committente_id) as committenti_coinvolti,
        AVG(durata_ms) as durata_media_ms
      FROM audit_trail
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.utente_id) {
      query += ' AND utente_id = ?';
      params.push(filters.utente_id);
    }
    
    if (filters.committente_id) {
      query += ' AND committente_id = ?';
      params.push(filters.committente_id);
    }
    
    if (filters.data_da) {
      query += ' AND data_operazione >= ?';
      params.push(filters.data_da);
    }
    
    if (filters.data_a) {
      query += ' AND data_operazione <= ?';
      params.push(filters.data_a);
    }
    
    return db.prepare(query).get(...params);
  },

  // === SESSIONI UTENTE ===
  
  /**
   * Crea nuova sessione utente
   */
  createSession(session: Omit<SessioneUtente, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO sessioni_utenti (
        utente_id, sessione_id, data_login, indirizzo_ip, user_agent,
        device_type, browser, os, ultimo_accesso, pagine_visitate,
        operazioni_eseguite, committente_corrente_id, attiva
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      session.utente_id,
      session.sessione_id,
      session.data_login,
      session.indirizzo_ip || null,
      session.user_agent || null,
      session.device_type || null,
      session.browser || null,
      session.os || null,
      session.ultimo_accesso,
      session.pagine_visitate,
      session.operazioni_eseguite,
      session.committente_corrente_id || null,
      session.attiva ? 1 : 0
    );

    return result.lastInsertRowid as number;
  },

  /**
   * Aggiorna sessione esistente
   */
  updateSession(sessione_id: string, updates: Partial<SessioneUtente>) {
    const fields = [];
    const params = [];
    
    if (updates.ultimo_accesso) {
      fields.push('ultimo_accesso = ?');
      params.push(updates.ultimo_accesso);
    }
    
    if (updates.pagine_visitate !== undefined) {
      fields.push('pagine_visitate = ?');
      params.push(updates.pagine_visitate);
    }
    
    if (updates.operazioni_eseguite !== undefined) {
      fields.push('operazioni_eseguite = ?');
      params.push(updates.operazioni_eseguite);
    }
    
    if (updates.committente_corrente_id !== undefined) {
      fields.push('committente_corrente_id = ?');
      params.push(updates.committente_corrente_id);
    }
    
    if (updates.data_logout) {
      fields.push('data_logout = ?, attiva = 0, motivo_chiusura = ?');
      params.push(updates.data_logout, updates.motivo_chiusura || 'logout');
      
      if (updates.durata_sessione_minuti) {
        fields.push('durata_sessione_minuti = ?');
        params.push(updates.durata_sessione_minuti);
      }
    }
    
    if (fields.length === 0) return;
    
    params.push(sessione_id);
    
    const stmt = db.prepare(`
      UPDATE sessioni_utenti 
      SET ${fields.join(', ')}
      WHERE sessione_id = ?
    `);
    
    return stmt.run(...params);
  },

  /**
   * Ottieni sessione attiva per utente
   */
  getActiveSession(utente_id: number): SessioneUtente | null {
    const stmt = db.prepare(`
      SELECT * FROM sessioni_utenti
      WHERE utente_id = ? AND attiva = 1
      ORDER BY data_login DESC
      LIMIT 1
    `);
    
    return stmt.get(utente_id) as SessioneUtente | null;
  },

  /**
   * Ottieni sessione attiva per session ID
   */
  getActiveSessionBySessionId(sessionId: string): SessioneUtente | null {
    const stmt = db.prepare(`
      SELECT * FROM sessioni_utenti
      WHERE sessione_id = ? AND attiva = 1
      LIMIT 1
    `);
    
    return stmt.get(sessionId) as SessioneUtente | null;
  },

  /**
   * Ottieni sessioni utente con filtri
   */
  getUserSessions(utente_id: number, limit: number = 10) {
    const stmt = db.prepare(`
      SELECT * FROM sessioni_utenti
      WHERE utente_id = ?
      ORDER BY data_login DESC
      LIMIT ?
    `);
    
    return stmt.all(utente_id, limit) as SessioneUtente[];
  },

  // === NOTIFICHE SISTEMA ===
  
  /**
   * Crea nuova notifica
   */
  createNotification(notification: Omit<NotificaSistema, 'id'>): number {
    const stmt = db.prepare(`
      INSERT INTO notifiche_sistema (
        utente_destinatario_id, committente_destinatario_id, ruolo_destinatario,
        titolo, messaggio, tipo, priorita, azione_url, azione_label,
        modulo_origine, evento_scatenante, dati_aggiuntivi,
        letta, archiviata, data_scadenza
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      notification.utente_destinatario_id || null,
      notification.committente_destinatario_id || null,
      notification.ruolo_destinatario || null,
      notification.titolo,
      notification.messaggio,
      notification.tipo,
      notification.priorita,
      notification.azione_url || null,
      notification.azione_label || null,
      notification.modulo_origine || null,
      notification.evento_scatenante || null,
      notification.dati_aggiuntivi || null,
      notification.letta ? 1 : 0,
      notification.archiviata ? 1 : 0,
      notification.data_scadenza || null
    );

    return result.lastInsertRowid as number;
  },

  /**
   * Ottieni notifiche per utente
   */
  getUserNotifications(utente_id: number, options: {
    solo_non_lette?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = `
      SELECT * FROM notifiche_sistema
      WHERE (utente_destinatario_id = ? OR utente_destinatario_id IS NULL)
      AND (data_scadenza IS NULL OR data_scadenza > datetime('now'))
      AND archiviata = 0
    `;
    
    const params: any[] = [utente_id];
    
    if (options.solo_non_lette) {
      query += ' AND letta = 0';
    }
    
    query += ' ORDER BY priorita DESC, created_at DESC';
    
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }
    
    return db.prepare(query).all(...params) as NotificaSistema[];
  },

  /**
   * Segna notifica come letta
   */
  markNotificationAsRead(id: number, utente_id: number) {
    const stmt = db.prepare(`
      UPDATE notifiche_sistema
      SET letta = 1, data_lettura = datetime('now')
      WHERE id = ? AND (utente_destinatario_id = ? OR utente_destinatario_id IS NULL)
    `);
    
    return stmt.run(id, utente_id);
  },

  /**
   * Archivia notifica
   */
  archiveNotification(id: number, utente_id: number) {
    const stmt = db.prepare(`
      UPDATE notifiche_sistema
      SET archiviata = 1
      WHERE id = ? AND (utente_destinatario_id = ? OR utente_destinatario_id IS NULL)
    `);
    
    return stmt.run(id, utente_id);
  },

  /**
   * Conta notifiche non lette
   */
  getUnreadNotificationsCount(utente_id: number): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM notifiche_sistema
      WHERE (utente_destinatario_id = ? OR utente_destinatario_id IS NULL)
      AND letta = 0 AND archiviata = 0
      AND (data_scadenza IS NULL OR data_scadenza > datetime('now'))
    `);
    
    const result = stmt.get(utente_id) as { count: number };
    return result.count;
  }
};