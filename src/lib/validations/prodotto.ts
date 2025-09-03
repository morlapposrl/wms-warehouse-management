import { z } from 'zod';

// Schema per creazione prodotto
export const createProdottoSchema = z.object({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .max(50, 'Il codice non può superare 50 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice può contenere solo lettere maiuscole, numeri, underscore e trattini')
    .transform(s => s.toUpperCase()),
  descrizione: z.string()
    .min(1, 'La descrizione è obbligatoria')
    .max(500, 'La descrizione non può superare 500 caratteri')
    .trim(),
  categoria_id: z.number()
    .int('ID categoria non valido')
    .positive('Selezionare una categoria'),
  unita_misura_id: z.number()
    .int('ID unità di misura non valido')
    .positive('Selezionare un\'unità di misura'),
  prezzo_acquisto: z.number()
    .min(0, 'Il prezzo di acquisto non può essere negativo')
    .max(999999.99, 'Prezzo di acquisto troppo elevato')
    .optional()
    .default(0),
  prezzo_vendita: z.number()
    .min(0, 'Il prezzo di vendita non può essere negativo')
    .max(999999.99, 'Prezzo di vendita troppo elevato')
    .optional()
    .default(0),
  scorta_minima: z.number()
    .int('La scorta minima deve essere un numero intero')
    .min(0, 'La scorta minima non può essere negativa')
    .max(999999, 'Scorta minima troppo elevata')
    .optional()
    .default(0),
  scorta_massima: z.number()
    .int('La scorta massima deve essere un numero intero')
    .min(0, 'La scorta massima non può essere negativa')
    .max(999999, 'Scorta massima troppo elevata')
    .optional()
    .default(0),
  ubicazione: z.string()
    .max(100, 'L\'ubicazione non può superare 100 caratteri')
    .trim()
    .optional()
    .or(z.literal('')),
  lotto_partita: z.string()
    .max(50, 'Il lotto/partita non può superare 50 caratteri')
    .trim()
    .optional()
    .or(z.literal('')),
  note: z.string()
    .max(1000, 'Le note non possono superare 1000 caratteri')
    .trim()
    .optional()
    .or(z.literal('')),
  attivo: z.boolean().optional().default(true)
}).refine(data => {
  // Scorta massima deve essere >= scorta minima se entrambe > 0
  if (data.scorta_minima > 0 && data.scorta_massima > 0) {
    return data.scorta_massima >= data.scorta_minima;
  }
  return true;
}, {
  message: 'La scorta massima deve essere maggiore o uguale alla scorta minima',
  path: ['scorta_massima']
}).refine(data => {
  // Se c'è prezzo vendita, dovrebbe essere >= prezzo acquisto (warning, non errore bloccante)
  if (data.prezzo_acquisto > 0 && data.prezzo_vendita > 0) {
    return data.prezzo_vendita >= data.prezzo_acquisto;
  }
  return true;
}, {
  message: 'Attenzione: il prezzo di vendita è inferiore al prezzo di acquisto',
  path: ['prezzo_vendita']
});

// Schema per aggiornamento prodotto
export const updateProdottoSchema = createProdottoSchema.partial().extend({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .max(50, 'Il codice non può superare 50 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice può contenere solo lettere maiuscole, numeri, underscore e trattini')
    .transform(s => s.toUpperCase())
    .optional()
});

// Schema per verifica disponibilità codice
export const checkCodeProdottoSchema = z.object({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .transform(s => s.toUpperCase()),
  exclude_id: z.number().int().positive().optional()
});

// Schema per ricerca prodotti
export const searchProdottoSchema = z.object({
  query: z.string()
    .min(1, 'Inserire almeno 1 carattere per la ricerca')
    .max(100, 'La ricerca non può superare 100 caratteri')
    .trim(),
  categoria_id: z.number().int().positive().optional(),
  attivo: z.boolean().optional(),
  con_giacenza: z.boolean().optional(),
  scorte_basse: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50)
});

// Schema per suggerimenti autocompletamento
export const suggestionsProdottoSchema = z.object({
  query: z.string()
    .min(1, 'Query di ricerca obbligatoria')
    .max(50, 'Query troppo lunga')
    .trim(),
  limit: z.number().int().min(1).max(20).optional().default(10)
});

// Schema per copia prodotti tra committenti
export const copyProdottiSchema = z.object({
  source_committente_id: z.number().int().positive('ID committente sorgente non valido'),
  target_committente_id: z.number().int().positive('ID committente destinazione non valido'),
  prodotto_ids: z.array(z.number().int().positive()).min(1, 'Selezionare almeno un prodotto').optional(),
  copia_prezzi: z.boolean().optional().default(false),
  copia_scorte: z.boolean().optional().default(false),
  sovrascrivi_esistenti: z.boolean().optional().default(false)
}).refine(data => data.source_committente_id !== data.target_committente_id, {
  message: 'Il committente sorgente e destinazione devono essere diversi',
  path: ['target_committente_id']
});

// Schema per filtri avanzati
export const filterProdottiSchema = z.object({
  categoria_id: z.number().int().positive().optional(),
  attivo: z.boolean().optional(),
  prezzo_min: z.number().min(0).optional(),
  prezzo_max: z.number().min(0).optional(),
  scorta_minima_definita: z.boolean().optional(),
  con_giacenza: z.boolean().optional(),
  scorte_basse: z.boolean().optional(),
  ultima_modifica_da: z.string().date().optional(),
  ultima_modifica_a: z.string().date().optional()
}).refine(data => {
  if (data.prezzo_min && data.prezzo_max) {
    return data.prezzo_max >= data.prezzo_min;
  }
  return true;
}, {
  message: 'Il prezzo massimo deve essere maggiore del prezzo minimo',
  path: ['prezzo_max']
});

// Schema per aggiornamento prezzi di massa
export const updatePrezziSchema = z.object({
  prodotto_ids: z.array(z.number().int().positive()).min(1, 'Selezionare almeno un prodotto'),
  tipo_aggiornamento: z.enum(['assoluto', 'percentuale'], {
    errorMap: () => ({ message: 'Tipo aggiornamento non valido' })
  }),
  campo_prezzo: z.enum(['prezzo_acquisto', 'prezzo_vendita'], {
    errorMap: () => ({ message: 'Campo prezzo non valido' })
  }),
  valore: z.number(),
  applica_solo_se_zero: z.boolean().optional().default(false)
}).refine(data => {
  if (data.tipo_aggiornamento === 'percentuale') {
    return data.valore >= -100 && data.valore <= 1000; // -100% a +1000%
  }
  return data.valore >= 0; // Prezzo assoluto non negativo
}, {
  message: 'Valore non valido per il tipo di aggiornamento selezionato',
  path: ['valore']
});

// Funzioni di validazione
export function validateCreateProdotto(data: unknown) {
  try {
    const result = createProdottoSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

export function validateUpdateProdotto(data: unknown) {
  try {
    // Controllo di sicurezza per dati malformatti
    if (data === null || data === undefined || typeof data !== 'object') {
      return {
        success: false,
        data: null,
        errors: [{ field: 'root', message: 'Dati non validi o mancanti' }]
      };
    }
    
    const result = updateProdottoSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

export function validateCheckCodeProdotto(data: unknown) {
  try {
    const result = checkCodeProdottoSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

export function validateSearchProdotto(data: unknown) {
  try {
    const result = searchProdottoSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

export function validateSuggestionsProdotto(data: unknown) {
  try {
    const result = suggestionsProdottoSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

export function validateCopyProdotti(data: unknown) {
  try {
    const result = copyProdottiSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

export function validateFilterProdotti(data: unknown) {
  try {
    const result = filterProdottiSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

export function validateUpdatePrezzi(data: unknown) {
  try {
    const result = updatePrezziSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}