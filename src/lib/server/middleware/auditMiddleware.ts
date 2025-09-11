import { auditRepository, type AuditTrailEntry } from '../repositories/auditRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface AuditContext {
  user_id: number;
  user_name: string;
  user_email: string;
  committente_id?: number;
  committente_name?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: string;
}

export interface OperationMetadata {
  table: string;
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'MOVIMENTO' | 'ORDINE' | 'CARICO' | 'SCARICO' | 'INVENTARIO' | 'TRASFERIMENTO';
  description: string;
  module: string;
  functionality?: string;
  importance: 'BASSA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  entities_involved?: Record<string, any>;
  data_before?: Record<string, any>;
  data_after?: Record<string, any>;
}

export class AuditTracker {
  private context: AuditContext;
  private startTime: number;

  constructor(context: AuditContext) {
    this.context = context;
    this.startTime = Date.now();
  }

  /**
   * Registra un'operazione nell'audit trail
   */
  async logOperation(
    metadata: OperationMetadata,
    result: 'SUCCESSO' | 'ERRORE' | 'WARNING' = 'SUCCESSO',
    errorMessage?: string
  ): Promise<void> {
    try {
      const endTime = Date.now();
      const duration = endTime - this.startTime;

      const auditEntry: AuditTrailEntry = {
        operazione_id: `${metadata.operation}_${uuidv4()}`,
        tabella_principale: metadata.table,
        tipo_operazione: metadata.operation,
        descrizione_operazione: metadata.description,
        entita_coinvolte: metadata.entities_involved ? JSON.stringify(metadata.entities_involved) : undefined,
        dati_precedenti: metadata.data_before ? JSON.stringify(metadata.data_before) : undefined,
        dati_nuovi: metadata.data_after ? JSON.stringify(metadata.data_after) : undefined,
        utente_id: this.context.user_id,
        utente_nome: this.context.user_name,
        utente_email: this.context.user_email,
        committente_id: this.context.committente_id,
        committente_nome: this.context.committente_name,
        indirizzo_ip: this.context.ip_address,
        user_agent: this.context.user_agent,
        device_info: this.context.device_info,
        sessione_id: this.context.session_id,
        modulo: metadata.module,
        funzionalita: metadata.functionality,
        importanza: metadata.importance,
        esito: result,
        messaggio_errore: errorMessage,
        durata_ms: duration
      };

      auditRepository.logOperation(auditEntry);

      // Aggiorna contatore operazioni in sessione
      if (this.context.session_id) {
        auditRepository.updateSession(this.context.session_id, {
          ultimo_accesso: new Date().toISOString(),
          operazioni_eseguite: undefined // Will be incremented in the repository
        });
      }

    } catch (error) {
      console.error('Errore nel logging audit trail:', error);
      // Non lanciare errore per non interrompere operazione principale
    }
  }

  /**
   * Helper per operazioni CRUD
   */
  async logCrud(
    table: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    entityId: number | string,
    module: string,
    dataBefore?: Record<string, any>,
    dataAfter?: Record<string, any>,
    importance: 'BASSA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA'
  ): Promise<void> {
    const descriptions = {
      CREATE: `Creato nuovo record in ${table}`,
      UPDATE: `Aggiornato record ${entityId} in ${table}`,
      DELETE: `Eliminato record ${entityId} in ${table}`
    };

    await this.logOperation({
      table,
      operation,
      description: descriptions[operation],
      module,
      functionality: `${operation.toLowerCase()}_${table}`,
      importance,
      entities_involved: { [table + '_id']: entityId },
      data_before: dataBefore,
      data_after: dataAfter
    });
  }

  /**
   * Helper per movimenti magazzino
   */
  async logMovimento(
    movimentoId: number,
    tipoMovimento: string,
    prodottoId: number,
    quantita: number,
    ordineId?: number,
    udcId?: number
  ): Promise<void> {
    await this.logOperation({
      table: 'movimenti',
      operation: 'MOVIMENTO',
      description: `${tipoMovimento}: ${quantita} unità prodotto ID ${prodottoId}`,
      module: 'MOVIMENTI',
      functionality: 'registrazione_movimento',
      importance: 'ALTA',
      entities_involved: {
        movimento_id: movimentoId,
        prodotto_id: prodottoId,
        ordine_id: ordineId,
        udc_id: udcId,
        quantita: quantita
      }
    });
  }

  /**
   * Helper per operazioni su ordini
   */
  async logOrdineOperation(
    ordineId: number,
    operation: string,
    statoVecchio?: string,
    statoNuovo?: string,
    dettagli?: Record<string, any>
  ): Promise<void> {
    let description = `Operazione ordine ${ordineId}: ${operation}`;
    if (statoVecchio && statoNuovo) {
      description = `Cambio stato ordine ${ordineId}: ${statoVecchio} → ${statoNuovo}`;
    }

    await this.logOperation({
      table: 'ordini',
      operation: 'ORDINE',
      description,
      module: 'ORDINI',
      functionality: 'gestione_ordine',
      importance: 'ALTA',
      entities_involved: {
        ordine_id: ordineId,
        stato_precedente: statoVecchio,
        stato_nuovo: statoNuovo,
        ...dettagli
      }
    });
  }
}

/**
 * Middleware factory per creare tracker audit
 */
export function createAuditTracker(
  request: {
    locals?: {
      user?: any;
      committente?: any;
      session?: any;
    };
    getClientAddress?: () => string;
    headers?: Record<string, string>;
  }
): AuditTracker | null {
  try {
    // Verifica che ci sia un utente autenticato
    if (!request.locals?.user) {
      return null;
    }

    const user = request.locals.user;
    const committente = request.locals.committente;
    const session = request.locals.session;

    const context: AuditContext = {
      user_id: user.id,
      user_name: `${user.nome} ${user.cognome}`,
      user_email: user.email,
      committente_id: committente?.id,
      committente_name: committente?.ragione_sociale,
      session_id: session?.sessione_id,
      ip_address: request.getClientAddress ? request.getClientAddress() : undefined,
      user_agent: request.headers?.['user-agent'],
      device_info: extractDeviceInfo(request.headers?.['user-agent'] || '')
    };

    return new AuditTracker(context);
  } catch (error) {
    console.error('Errore nella creazione del tracker audit:', error);
    return null;
  }
}

/**
 * Estrae informazioni device dal user agent
 */
function extractDeviceInfo(userAgent: string): string {
  try {
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

    return JSON.stringify({ deviceType, browser, os });
  } catch {
    return JSON.stringify({ deviceType: 'unknown', browser: 'unknown', os: 'unknown' });
  }
}

/**
 * Hook per SvelteKit - da usare negli +page.server.ts per azioni
 */
export async function withAudit<T>(
  request: any,
  metadata: OperationMetadata,
  operation: () => Promise<T>
): Promise<T> {
  const tracker = createAuditTracker(request);
  
  try {
    const result = await operation();
    
    if (tracker) {
      await tracker.logOperation(metadata, 'SUCCESSO');
    }
    
    return result;
  } catch (error) {
    if (tracker) {
      await tracker.logOperation(
        metadata,
        'ERRORE',
        error instanceof Error ? error.message : 'Errore sconosciuto'
      );
    }
    
    throw error;
  }
}

/**
 * Funzione helper per logging rapido di operazioni critiche
 */
export async function quickAuditLog(
  context: AuditContext,
  table: string,
  operation: string,
  description: string,
  module: string,
  importance: 'BASSA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA',
  entities?: Record<string, any>
): Promise<void> {
  try {
    const tracker = new AuditTracker(context);
    await tracker.logOperation({
      table,
      operation: operation as any,
      description,
      module,
      importance,
      entities_involved: entities
    });
  } catch (error) {
    console.error('Errore nel quick audit log:', error);
  }
}

/**
 * Middleware per tracking automatico sessioni
 */
export async function trackPageVisit(
  sessionId: string,
  pagePath: string
): Promise<void> {
  try {
    // Aggiorna ultima attività sessione
    auditRepository.updateSession(sessionId, {
      ultimo_accesso: new Date().toISOString(),
      pagine_visitate: undefined // Will be incremented
    });

    // Log della visita pagina
    const context = { } as AuditContext; // Context will be retrieved from session
    const tracker = new AuditTracker(context);
    
    await tracker.logOperation({
      table: 'sessioni_utenti',
      operation: 'READ',
      description: `Visita pagina: ${pagePath}`,
      module: 'NAVIGATION',
      functionality: 'page_visit',
      importance: 'BASSA'
    });
  } catch (error) {
    console.error('Errore nel tracking visita pagina:', error);
  }
}

export default {
  createAuditTracker,
  AuditTracker,
  withAudit,
  quickAuditLog,
  trackPageVisit
};