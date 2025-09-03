import { z } from 'zod';
import { STATI_COMMITTENTE, TIPI_CONTRATTO } from '$lib/types';

// Schema base per committente
export const committenteSchema = z.object({
  codice: z.string()
    .min(1, 'Codice obbligatorio')
    .max(20, 'Codice troppo lungo (max 20 caratteri)')
    .regex(/^[A-Z0-9_-]+$/i, 'Codice può contenere solo lettere, numeri, underscore e trattini'),
  
  ragione_sociale: z.string()
    .min(1, 'Ragione sociale obbligatoria')
    .max(200, 'Ragione sociale troppo lunga (max 200 caratteri)'),
  
  partita_iva: z.string()
    .optional()
    .refine((val) => !val || /^\d{11}$/.test(val), {
      message: 'Partita IVA deve essere di 11 cifre'
    }),
  
  codice_fiscale: z.string()
    .optional()
    .refine((val) => !val || /^[A-Z0-9]{11,16}$/i.test(val), {
      message: 'Codice fiscale non valido'
    }),
  
  indirizzo_sede: z.string()
    .max(200, 'Indirizzo troppo lungo (max 200 caratteri)')
    .optional(),
  
  indirizzo_fatturazione: z.string()
    .max(200, 'Indirizzo fatturazione troppo lungo (max 200 caratteri)')
    .optional(),
  
  cap: z.string()
    .optional()
    .refine((val) => !val || /^\d{5}$/.test(val), {
      message: 'CAP deve essere di 5 cifre'
    }),
  
  citta: z.string()
    .max(100, 'Città troppo lunga (max 100 caratteri)')
    .optional(),
  
  provincia: z.string()
    .max(2, 'Provincia deve essere di 2 caratteri')
    .optional()
    .refine((val) => !val || /^[A-Z]{2}$/i.test(val), {
      message: 'Provincia deve essere di 2 lettere maiuscole (es. MI, TO)'
    }),
  
  telefono: z.string()
    .optional()
    .refine((val) => !val || /^[\+\d\s\-\(\)]{6,20}$/.test(val), {
      message: 'Formato telefono non valido'
    }),
  
  email: z.string()
    .email('Email non valida')
    .max(100, 'Email troppo lunga')
    .optional(),
  
  pec: z.string()
    .email('PEC non valida')
    .max(100, 'PEC troppo lunga')
    .optional(),
  
  referente_principale: z.string()
    .max(100, 'Nome referente troppo lungo (max 100 caratteri)')
    .optional(),
  
  tipo_contratto: z.enum(TIPI_CONTRATTO, {
    errorMap: () => ({ message: 'Tipo contratto deve essere: deposito, logistica o misto' })
  }).default('deposito'),
  
  data_inizio_rapporto: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Data inizio rapporto non valida'
    }),
  
  data_fine_rapporto: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Data fine rapporto non valida'
    }),
  
  stato: z.enum(STATI_COMMITTENTE, {
    errorMap: () => ({ message: 'Stato deve essere: attivo, sospeso o cessato' })
  }).default('attivo'),
  
  note: z.string()
    .max(1000, 'Note troppo lunghe (max 1000 caratteri)')
    .optional()
})
.refine((data) => {
  // Almeno un contatto deve essere presente
  return data.telefono || data.email || data.pec;
}, {
  message: 'Inserire almeno un contatto (telefono, email o PEC)',
  path: ['telefono'] // Mostra l'errore sul campo telefono
})
.refine((data) => {
  // Se presente partita IVA, deve essere univoca nel sistema (verrà verificato lato server)
  // Se presente email, deve essere valida
  if (data.partita_iva && data.codice_fiscale) {
    // Verifica coerenza P.IVA e C.F. per persone giuridiche
    return data.partita_iva !== data.codice_fiscale;
  }
  return true;
}, {
  message: 'Partita IVA e Codice Fiscale non possono essere identici',
  path: ['codice_fiscale']
})
.refine((data) => {
  // Se data fine rapporto presente, deve essere successiva a data inizio
  if (data.data_inizio_rapporto && data.data_fine_rapporto) {
    const dataInizio = new Date(data.data_inizio_rapporto);
    const dataFine = new Date(data.data_fine_rapporto);
    return dataFine > dataInizio;
  }
  return true;
}, {
  message: 'Data fine rapporto deve essere successiva alla data di inizio',
  path: ['data_fine_rapporto']
});

// Schema per la creazione (tutti i campi richiesti)
export const createCommittenteSchema = committenteSchema;

// Schema per l'aggiornamento (tutti i campi opzionali eccetto quelli critici)
export const updateCommittenteSchema = committenteSchema.partial({
  codice: true, // Il codice non può essere modificato dopo la creazione
}).refine((data) => {
  // Almeno un campo deve essere presente per l'aggiornamento
  const fields = Object.values(data).filter(val => val !== undefined && val !== null && val !== '');
  return fields.length > 0;
}, {
  message: 'Specificare almeno un campo da aggiornare'
});

// Schema per filtri di ricerca
export const committenteFiltersSchema = z.object({
  stato: z.enum(STATI_COMMITTENTE).optional(),
  tipo_contratto: z.enum(TIPI_CONTRATTO).optional(),
  search: z.string().max(100).optional(),
  data_inizio_da: z.string().optional(),
  data_inizio_a: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
}).refine((data) => {
  // Se entrambe le date sono presenti, verifica la coerenza
  if (data.data_inizio_da && data.data_inizio_a) {
    const dataDa = new Date(data.data_inizio_da);
    const dataA = new Date(data.data_inizio_a);
    return dataA >= dataDa;
  }
  return true;
}, {
  message: 'Data fine deve essere successiva o uguale alla data inizio',
  path: ['data_inizio_a']
});

// Schema per soft delete
export const softDeleteSchema = z.object({
  conferma: z.boolean().refine(val => val === true, {
    message: 'Conferma richiesta per procedere'
  })
});

// Tipi TypeScript derivati dagli schema
export type CommittenteValidation = z.infer<typeof committenteSchema>;
export type CreateCommittenteValidation = z.infer<typeof createCommittenteSchema>;
export type UpdateCommittenteValidation = z.infer<typeof updateCommittenteSchema>;
export type CommittenteFiltersValidation = z.infer<typeof committenteFiltersSchema>;

// Funzioni di validazione con messaggi di errore personalizzati
export function validateCommittente(data: unknown) {
  const result = committenteSchema.safeParse(data);
  
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

export function validateUpdateCommittente(data: unknown) {
  const result = updateCommittenteSchema.safeParse(data);
  
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

export function validateCommittenteFilters(data: unknown) {
  const result = committenteFiltersSchema.safeParse(data);
  
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
export const COMMITTENTE_FORM_LABELS = {
  codice: 'Codice Committente',
  ragione_sociale: 'Ragione Sociale',
  partita_iva: 'Partita IVA',
  codice_fiscale: 'Codice Fiscale',
  indirizzo_sede: 'Indirizzo Sede',
  indirizzo_fatturazione: 'Indirizzo Fatturazione',
  cap: 'CAP',
  citta: 'Città',
  provincia: 'Provincia',
  telefono: 'Telefono',
  email: 'Email',
  pec: 'PEC',
  referente_principale: 'Referente Principale',
  tipo_contratto: 'Tipo Contratto',
  data_inizio_rapporto: 'Data Inizio Rapporto',
  data_fine_rapporto: 'Data Fine Rapporto',
  stato: 'Stato',
  note: 'Note'
} as const;