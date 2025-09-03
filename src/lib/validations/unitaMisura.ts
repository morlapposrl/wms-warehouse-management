import { z } from 'zod';

// Schema per creazione unità di misura
export const createUnitaMisuraSchema = z.object({
  committente_id: z.number().int().positive().optional(),
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .max(10, 'Il codice non può superare 10 caratteri')
    .regex(/^[A-Z0-9_]+$/, 'Il codice può contenere solo lettere maiuscole, numeri e underscore')
    .transform(s => s.toUpperCase()),
  descrizione: z.string()
    .min(1, 'La descrizione è obbligatoria')
    .max(100, 'La descrizione non può superare 100 caratteri')
    .trim(),
  tipo: z.enum(['sistema', 'personalizzata'], {
    errorMap: () => ({ message: 'Il tipo deve essere "sistema" o "personalizzata"' })
  }).optional().default('personalizzata'),
  attiva: z.boolean().optional().default(true)
});

// Schema per aggiornamento unità di misura
export const updateUnitaMisuraSchema = z.object({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .max(10, 'Il codice non può superare 10 caratteri')
    .regex(/^[A-Z0-9_]+$/, 'Il codice può contenere solo lettere maiuscole, numeri e underscore')
    .transform(s => s.toUpperCase())
    .optional(),
  descrizione: z.string()
    .min(1, 'La descrizione è obbligatoria')
    .max(100, 'La descrizione non può superare 100 caratteri')
    .trim()
    .optional(),
  attiva: z.boolean().optional(),
  committente_id: z.number().int().positive().optional()
});

// Schema per verifica disponibilità codice
export const checkCodeUnitaMisuraSchema = z.object({
  codice: z.string()
    .min(1, 'Il codice è obbligatorio')
    .transform(s => s.toUpperCase()),
  exclude_id: z.string().optional().transform(s => s ? parseInt(s) : undefined),
  committente_id: z.number().int().positive().optional()
});

// Schema per ricerca unità misura
export const searchUnitaMisuraSchema = z.object({
  query: z.string()
    .min(1, 'Inserire almeno 1 carattere per la ricerca')
    .max(50, 'La ricerca non può superare 50 caratteri')
    .trim(),
  committente_id: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional().default(10)
});

// Schema per copia unità misura tra committenti (solo admin)
export const copyUnitaMisuraSchema = z.object({
  source_committente_id: z.number().int().positive({
    message: 'ID committente sorgente non valido'
  }),
  target_committente_id: z.number().int().positive({
    message: 'ID committente destinazione non valido'
  })
}).refine(data => data.source_committente_id !== data.target_committente_id, {
  message: 'Il committente sorgente e destinazione devono essere diversi',
  path: ['target_committente_id']
});

// Schema per suggerimenti autocompletamento
export const suggestionsUnitaMisuraSchema = z.object({
  query: z.string()
    .min(1, 'Query di ricerca obbligatoria')
    .max(20, 'Query troppo lunga')
    .trim(),
  limit: z.number().int().min(1).max(20).optional().default(10)
});

// Funzioni di validazione
export function validateCreateUnitaMisura(data: unknown) {
  try {
    const result = createUnitaMisuraSchema.parse(data);
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

export function validateUpdateUnitaMisura(data: unknown) {
  try {
    const result = updateUnitaMisuraSchema.parse(data);
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

export function validateCheckCodeUnitaMisura(data: unknown) {
  try {
    const result = checkCodeUnitaMisuraSchema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors?.map(e => ({
          field: e.path.join('.'),
          message: e.message
        })) || []
      };
    }
    throw error;
  }
}

export function validateSearchUnitaMisura(data: unknown) {
  try {
    const result = searchUnitaMisuraSchema.parse(data);
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

export function validateCopyUnitaMisura(data: unknown) {
  try {
    const result = copyUnitaMisuraSchema.parse(data);
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

export function validateSuggestionsUnitaMisura(data: unknown) {
  try {
    const result = suggestionsUnitaMisuraSchema.parse(data);
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