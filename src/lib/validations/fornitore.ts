import { z } from 'zod';

// Regex per validazioni italiane
const PARTITA_IVA_REGEX = /^[0-9]{11}$/;
const CODICE_FISCALE_REGEX = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$|^[0-9]{11}$/;
const CAP_REGEX = /^[0-9]{5}$/;
const PROVINCIA_REGEX = /^[A-Z]{2}$/;

// Schema per creazione fornitore
export const createFornitoreSchema = z.object({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .max(20, 'Il codice non può superare 20 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice può contenere solo lettere maiuscole, numeri, underscore e trattini')
    .transform(s => s.toUpperCase()),
  ragione_sociale: z.string()
    .min(1, 'La ragione sociale è obbligatoria')
    .max(200, 'La ragione sociale non può superare 200 caratteri')
    .trim(),
  partita_iva: z.string()
    .regex(PARTITA_IVA_REGEX, 'La Partita IVA deve essere di 11 cifre')
    .optional()
    .or(z.literal('')),
  codice_fiscale: z.string()
    .regex(CODICE_FISCALE_REGEX, 'Codice fiscale non valido')
    .optional()
    .or(z.literal('')),
  indirizzo: z.string()
    .max(200, 'L\'indirizzo non può superare 200 caratteri')
    .trim()
    .optional()
    .or(z.literal('')),
  cap: z.string()
    .regex(CAP_REGEX, 'Il CAP deve essere di 5 cifre')
    .optional()
    .or(z.literal('')),
  citta: z.string()
    .max(100, 'La città non può superare 100 caratteri')
    .trim()
    .optional()
    .or(z.literal('')),
  provincia: z.string()
    .regex(PROVINCIA_REGEX, 'La provincia deve essere di 2 lettere maiuscole')
    .transform(s => s ? s.toUpperCase() : s)
    .optional()
    .or(z.literal('')),
  telefono: z.string()
    .max(20, 'Il telefono non può superare 20 caratteri')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Formato email non valido')
    .max(100, 'L\'email non può superare 100 caratteri')
    .optional()
    .or(z.literal(''))
}).refine(data => {
  // Almeno uno tra partita_iva e codice_fiscale deve essere presente
  return data.partita_iva || data.codice_fiscale;
}, {
  message: 'È obbligatorio inserire almeno la Partita IVA o il Codice Fiscale',
  path: ['partita_iva']
});

// Schema per aggiornamento fornitore
export const updateFornitoreSchema = createFornitoreSchema.partial().extend({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .max(20, 'Il codice non può superare 20 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice può contenere solo lettere maiuscole, numeri, underscore e trattini')
    .transform(s => s.toUpperCase())
    .optional()
});

// Schema per associazione fornitore-committente
export const associateFornitoreSchema = z.object({
  fornitore_id: z.number().int().positive('ID fornitore non valido'),
  attivo: z.boolean().optional().default(true),
  condizioni_specifiche: z.string()
    .max(1000, 'Le condizioni non possono superare 1000 caratteri')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Schema per aggiornamento associazione
export const updateAssociationSchema = z.object({
  attivo: z.boolean().optional(),
  condizioni_specifiche: z.string()
    .max(1000, 'Le condizioni non possono superare 1000 caratteri')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Schema per verifica disponibilità codice
export const checkCodeFornitoreSchema = z.object({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .transform(s => s.toUpperCase()),
  exclude_id: z.number().int().positive().optional()
});

// Schema per ricerca fornitori
export const searchFornitoreSchema = z.object({
  query: z.string()
    .min(1, 'Inserire almeno 1 carattere per la ricerca')
    .max(100, 'La ricerca non può superare 100 caratteri')
    .trim(),
  limit: z.number().int().min(1).max(100).optional().default(20)
});

// Schema per suggerimenti autocompletamento
export const suggestionsFornitoreSchema = z.object({
  query: z.string()
    .min(1, 'Query di ricerca obbligatoria')
    .max(50, 'Query troppo lunga')
    .trim(),
  limit: z.number().int().min(1).max(20).optional().default(10)
});

// Schema per copia fornitori tra committenti (admin)
export const copyFornitoriSchema = z.object({
  source_committente_id: z.number().int().positive('ID committente sorgente non valido'),
  target_committente_id: z.number().int().positive('ID committente destinazione non valido'),
  fornitore_ids: z.array(z.number().int().positive()).min(1, 'Selezionare almeno un fornitore'),
  mantieni_condizioni: z.boolean().optional().default(false)
}).refine(data => data.source_committente_id !== data.target_committente_id, {
  message: 'Il committente sorgente e destinazione devono essere diversi',
  path: ['target_committente_id']
});

// Funzioni di validazione
export function validateCreateFornitore(data: unknown) {
  try {
    const result = createFornitoreSchema.parse(data);
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

export function validateUpdateFornitore(data: unknown) {
  try {
    const result = updateFornitoreSchema.parse(data);
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

export function validateAssociateFornitore(data: unknown) {
  try {
    const result = associateFornitoreSchema.parse(data);
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

export function validateUpdateAssociation(data: unknown) {
  try {
    const result = updateAssociationSchema.parse(data);
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

export function validateCheckCodeFornitore(data: unknown) {
  try {
    const result = checkCodeFornitoreSchema.parse(data);
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

export function validateSearchFornitore(data: unknown) {
  try {
    const result = searchFornitoreSchema.parse(data);
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

export function validateSuggestionsFornitore(data: unknown) {
  try {
    const result = suggestionsFornitoreSchema.parse(data);
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

export function validateCopyFornitori(data: unknown) {
  try {
    const result = copyFornitoriSchema.parse(data);
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