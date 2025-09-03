// TIPI BASE DEL SISTEMA MULTICOMMITTENTE

export interface Committente {
  id: number;
  codice: string;
  ragione_sociale: string;
  partita_iva?: string;
  codice_fiscale?: string;
  indirizzo_sede?: string;
  indirizzo_fatturazione?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  pec?: string;
  referente_principale?: string;
  tipo_contratto: 'deposito' | 'logistica' | 'misto';
  data_inizio_rapporto?: string;
  data_fine_rapporto?: string;
  stato: 'attivo' | 'sospeso' | 'cessato';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface Utente {
  id: number;
  email: string;
  password_hash: string;
  nome: string;
  cognome: string;
  ruolo: 'super_admin' | 'admin_committente' | 'operatore_magazzino' | 'utente_committente' | 'ospite';
  committente_id?: number;
  attivo: boolean;
  ultimo_accesso?: string;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: number;
  committente_id: number;
  codice: string;
  descrizione: string;
  attiva: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitaMisura {
  id: number;
  committente_id?: number; // null = globale, valorizzato = specifico committente
  codice: string;
  descrizione: string;
  tipo: 'sistema' | 'personalizzata';
  attiva: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fornitore {
  id: number;
  codice: string;
  ragione_sociale: string;
  partita_iva?: string;
  codice_fiscale?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface CommittenteFornitore {
  id: number;
  committente_id: number;
  fornitore_id: number;
  attivo: boolean;
  condizioni_specifiche?: string;
  created_at: string;
}

export interface Prodotto {
  id: number;
  committente_id: number;
  codice: string;
  descrizione: string;
  categoria_id: number;
  unita_misura_id: number;
  prezzo_acquisto: number;
  prezzo_vendita: number;
  scorta_minima: number;
  scorta_massima: number;
  ubicazione?: string;
  lotto_partita?: string;
  note?: string;
  attivo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Movimento {
  id: number;
  committente_id_origine: number;
  committente_id_destinazione?: number;
  tipo_movimento: 'CARICO' | 'SCARICO' | 'TRASFERIMENTO_INTERNO' | 'TRASFERIMENTO_INTER_COMMITTENTE' | 'RETTIFICA_POS' | 'RETTIFICA_NEG' | 'RESO_CLIENTE' | 'RESO_FORNITORE';
  prodotto_id: number;
  quantita: number;
  prezzo: number;
  fornitore_id?: number;
  numero_documento?: string;
  data_documento?: string;
  causale?: string;
  operatore?: string;
  note?: string;
  data_movimento: string;
  created_at: string;
  updated_at: string;
}

export interface Giacenza {
  id: number;
  committente_id: number;
  prodotto_id: number;
  quantita: number;
  valore_medio: number;
  ultima_modifica: string;
}

// TIPI PER FORM E API
export type CommittenteInput = Omit<Committente, 'id' | 'created_at' | 'updated_at'>;
export type CommittenteUpdate = Partial<CommittenteInput>;

// TIPI PER VISTE AGGREGATE (con JOIN)
export interface CommittenteWithStats extends Committente {
  num_prodotti?: number;
  num_movimenti_mese?: number;
  valore_giacenza?: number;
  spazio_occupato?: number;
}

// TIPI PER SICUREZZA E SESSIONI
export interface SessionUser {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: Utente['ruolo'];
  committente_id?: number;
  committenti_autorizzati?: number[]; // per utenti multi-committente
}

// TIPI PER FILTRI E RICERCHE
export interface CommittenteFilters {
  stato?: Committente['stato'];
  tipo_contratto?: Committente['tipo_contratto'];
  search?: string; // ricerca in ragione_sociale, codice, email
  data_inizio_da?: string;
  data_inizio_a?: string;
}

// TIPI PER PAGINAZIONE
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// TIPI PER API RESPONSES
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>; // per errori di validazione
}

// COSTANTI
export const STATI_COMMITTENTE = ['attivo', 'sospeso', 'cessato'] as const;
export const TIPI_CONTRATTO = ['deposito', 'logistica', 'misto'] as const;
export const RUOLI_UTENTE = ['super_admin', 'admin_committente', 'operatore_magazzino', 'utente_committente', 'ospite'] as const;