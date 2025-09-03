// Export di tutte le validazioni Zod
export * from './committenti';
export * from './prodotti';
export * from './movimenti';

// Utility generale per validation
export const validationUtils = {
  /**
   * Formatta gli errori di validazione per l'UI
   */
  formatErrors(errors: Record<string, string>): string {
    return Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');
  },

  /**
   * Controlla se ci sono errori di validazione
   */
  hasErrors(errors?: Record<string, string>): boolean {
    return errors ? Object.keys(errors).length > 0 : false;
  },

  /**
   * Ottiene il primo errore di validazione
   */
  getFirstError(errors?: Record<string, string>): string | null {
    if (!errors) return null;
    const keys = Object.keys(errors);
    return keys.length > 0 ? errors[keys[0]] : null;
  },

  /**
   * Pulisce i dati rimuovendo valori null/undefined/empty
   */
  cleanData<T extends Record<string, any>>(data: T): Partial<T> {
    const cleaned: Partial<T> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key as keyof T] = value;
      }
    });
    
    return cleaned;
  },

  /**
   * Converte stringhe numeriche in numeri per la validazione
   */
  normalizeFormData(data: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Converti stringhe numeriche in numeri
      if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
        normalized[key] = parseFloat(value);
      }
      // Converti stringhe boolean
      else if (value === 'true') {
        normalized[key] = true;
      }
      else if (value === 'false') {
        normalized[key] = false;
      }
      // Mantieni il valore originale
      else {
        normalized[key] = value;
      }
    });
    
    return normalized;
  }
};

// Messaggi di errore comuni in italiano
export const commonErrorMessages = {
  required: 'Questo campo è obbligatorio',
  invalidEmail: 'Formato email non valido',
  invalidPhone: 'Formato telefono non valido',
  invalidDate: 'Formato data non valido',
  tooShort: (min: number) => `Deve essere almeno ${min} caratteri`,
  tooLong: (max: number) => `Non può superare ${max} caratteri`,
  invalidNumber: 'Deve essere un numero valido',
  negativeNumber: 'Non può essere un numero negativo',
  invalidChoice: 'Scelta non valida',
  duplicateValue: 'Questo valore è già presente'
};