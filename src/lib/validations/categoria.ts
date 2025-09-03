import { z } from 'zod';

// Schema base per categoria
export const categoriaSchema = z.object({
  codice: z.string()
    .min(1, 'Codice obbligatorio')
    .max(20, 'Codice troppo lungo (max 20 caratteri)')
    .regex(/^[A-Z0-9_-]+$/i, 'Codice può contenere solo lettere, numeri, underscore e trattini')
    .transform(val => val.toUpperCase()), // Forza maiuscolo per consistency
  
  descrizione: z.string()
    .min(1, 'Descrizione obbligatoria')
    .max(100, 'Descrizione troppo lunga (max 100 caratteri)')
    .refine(val => val.trim().length > 0, {
      message: 'Descrizione non può essere solo spazi vuoti'
    }),
  
  attiva: z.boolean().default(true)
});

// Schema per la creazione (con committente_id)
export const createCategoriaSchema = z.object({
  committente_id: z.number()
    .int('Committente ID deve essere un numero intero')
    .positive('Committente ID deve essere positivo'),
}).merge(categoriaSchema);

// Schema per l'aggiornamento (tutti i campi opzionali eccetto committente)
export const updateCategoriaSchema = categoriaSchema.partial()
  .refine((data) => {
    // Almeno un campo deve essere presente per l'aggiornamento
    const hasFields = Object.values(data).some(val => val !== undefined);
    return hasFields;
  }, {
    message: 'Specificare almeno un campo da aggiornare'
  });

// Schema per filtri di ricerca per committente
export const categoriaFiltersSchema = z.object({
  committente_id: z.number().int().positive(),
  search: z.string().max(100).optional(),
  attiva: z.boolean().optional(),
  codice: z.string().max(20).optional(),
  descrizione: z.string().max(100).optional()
});

// Schema per operazioni di copia tra committenti
export const copyCategoriePtanSchema = z.object({
  source_committente_id: z.number()
    .int('ID committente sorgente deve essere un numero intero')
    .positive('ID committente sorgente deve essere positivo'),
  
  target_committente_id: z.number()
    .int('ID committente destinazione deve essere un numero intero')  
    .positive('ID committente destinazione deve essere positivo'),
    
  overwrite_existing: z.boolean().default(false)
}).refine(data => data.source_committente_id !== data.target_committente_id, {
  message: 'Committente sorgente e destinazione devono essere diversi',
  path: ['target_committente_id']
});

// Schema per verifica unicità codice
export const checkCategoriaCodeSchema = z.object({
  committente_id: z.number().int().positive(),
  codice: z.string().min(1).max(20),
  exclude_id: z.number().int().positive().optional()
});

// Tipi TypeScript derivati dagli schema
export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type CategoriaFilters = z.infer<typeof categoriaFiltersSchema>;
export type CopyCategoriePlan = z.infer<typeof copyCategoriePtanSchema>;
export type CheckCategoriaCode = z.infer<typeof checkCategoriaCodeSchema>;

// Funzioni di validazione con messaggi personalizzati
export function validateCategoria(data: unknown) {
  const result = categoriaSchema.safeParse(data);
  
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    
    result.error.errors.forEach((error) => {
      const field = error.path.join('.');
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(error.message);
    });
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

export function validateCreateCategoria(data: unknown) {
  const result = createCategoriaSchema.safeParse(data);
  
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    
    result.error.errors.forEach((error) => {
      const field = error.path.join('.');
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(error.message);
    });
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

export function validateUpdateCategoria(data: unknown) {
  const result = updateCategoriaSchema.safeParse(data);
  
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    
    result.error.errors.forEach((error) => {
      const field = error.path.join('.');
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(error.message);
    });
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

export function validateCategoriaFilters(data: unknown) {
  const result = categoriaFiltersSchema.safeParse(data);
  
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    
    result.error.errors.forEach((error) => {
      const field = error.path.join('.');
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(error.message);
    });
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

export function validateCopyCategoriePlan(data: unknown) {
  const result = copyCategoriePtanSchema.safeParse(data);
  
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    
    result.error.errors.forEach((error) => {
      const field = error.path.join('.');
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(error.message);
    });
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

// Costanti per i form
export const CATEGORIA_FORM_LABELS = {
  codice: 'Codice Categoria',
  descrizione: 'Descrizione',
  attiva: 'Categoria Attiva'
} as const;

// Messaggi di validazione personalizzati
export const CATEGORIA_VALIDATION_MESSAGES = {
  codice: {
    required: 'Il codice categoria è obbligatorio',
    invalid: 'Codice non valido: solo lettere, numeri, underscore e trattini',
    duplicate: 'Codice categoria già esistente per questo committente',
    tooLong: 'Codice troppo lungo (massimo 20 caratteri)'
  },
  descrizione: {
    required: 'La descrizione è obbligatoria',
    tooLong: 'Descrizione troppo lunga (massimo 100 caratteri)',
    empty: 'La descrizione non può essere vuota'
  },
  committente: {
    required: 'Committente obbligatorio',
    invalid: 'Committente non valido'
  }
} as const;

// Costanti per stati
export const CATEGORIA_STATI = {
  ATTIVA: true,
  INATTIVA: false
} as const;

// Helper per generare codici automatici
export function generateCategoriaCode(descrizione: string): string {
  return descrizione
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10);
}