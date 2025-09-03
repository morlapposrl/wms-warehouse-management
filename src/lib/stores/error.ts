import { writable } from 'svelte/store';

export interface AppError {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  autoHide?: boolean;
  duration?: number;
}

export const errorStore = writable<AppError[]>([]);

export const errorHandler = {
  // Aggiunge un errore allo store
  addError(error: Omit<AppError, 'id' | 'timestamp'>) {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newError: AppError = {
      ...error,
      id,
      timestamp: new Date(),
      autoHide: error.autoHide ?? true,
      duration: error.duration ?? 5000
    };
    
    errorStore.update(errors => [...errors, newError]);
    
    // Auto-remove se specificato
    if (newError.autoHide) {
      setTimeout(() => {
        errorHandler.removeError(id);
      }, newError.duration);
    }
    
    // Log dell'errore
    console.error(`[${newError.type.toUpperCase()}] ${newError.title}: ${newError.message}`, newError.details || '');
  },

  // Rimuove un errore specifico
  removeError(id: string) {
    errorStore.update(errors => errors.filter(e => e.id !== id));
  },

  // Pulisce tutti gli errori
  clearErrors() {
    errorStore.update(() => []);
  },

  // Shortcuts per tipi comuni
  error(title: string, message: string, details?: string) {
    this.addError({ type: 'error', title, message, details, autoHide: false });
  },

  warning(title: string, message: string, details?: string) {
    this.addError({ type: 'warning', title, message, details });
  },

  info(title: string, message: string, details?: string) {
    this.addError({ type: 'info', title, message, details });
  },

  success(title: string, message: string, details?: string) {
    this.addError({ type: 'success', title, message, details });
  },

  // Gestisce errori di fetch API
  handleApiError(response: Response, operation: string = 'Operazione') {
    const status = response.status;
    let title = `Errore ${operation}`;
    let message = 'Si è verificato un errore sconosciuto';

    switch (status) {
      case 400:
        title = 'Dati non validi';
        message = 'I dati inseriti non sono corretti. Controllare e riprovare.';
        break;
      case 401:
        title = 'Accesso negato';
        message = 'Non sei autorizzato ad eseguire questa operazione.';
        break;
      case 403:
        title = 'Operazione vietata';
        message = 'Non hai i permessi necessari per questa operazione.';
        break;
      case 404:
        title = 'Risorsa non trovata';
        message = 'La risorsa richiesta non è stata trovata.';
        break;
      case 409:
        title = 'Conflitto';
        message = 'Esiste già un elemento con questi dati.';
        break;
      case 422:
        title = 'Validazione fallita';
        message = 'I dati inseriti non rispettano i requisiti richiesti.';
        break;
      case 500:
        title = 'Errore del server';
        message = 'Si è verificato un errore interno. Riprova più tardi.';
        break;
      case 503:
        title = 'Servizio non disponibile';
        message = 'Il servizio è temporaneamente non disponibile.';
        break;
    }

    this.error(title, message, `HTTP ${status} - ${operation}`);
  },

  // Gestisce errori di JavaScript
  handleJsError(error: Error, context: string = 'Applicazione') {
    this.error(
      'Errore JavaScript',
      error.message || 'Errore sconosciuto',
      `Context: ${context}\nStack: ${error.stack}`
    );
  },

  // Gestisce errori di validazione
  handleValidationError(errors: Record<string, string>) {
    const errorMessages = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');

    this.error(
      'Errore di Validazione',
      'I dati inseriti non sono validi',
      errorMessages
    );
  }
};

// Handler globale per errori non gestiti
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handleJsError(event.error, 'Global Error Handler');
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleJsError(
      new Error(event.reason),
      'Unhandled Promise Rejection'
    );
  });
}