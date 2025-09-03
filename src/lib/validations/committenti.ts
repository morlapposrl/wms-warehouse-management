import { z } from 'zod';

// Schema per committenti
export const committenteSchema = z.object({
  codice: z
    .string()
    .min(3, 'Il codice deve essere almeno 3 caratteri')
    .max(20, 'Il codice non può superare 20 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice può contenere solo lettere maiuscole, numeri, _ e -'),
  
  ragione_sociale: z
    .string()
    .min(2, 'La ragione sociale deve essere almeno 2 caratteri')
    .max(255, 'La ragione sociale non può superare 255 caratteri'),
  
  partita_iva: z
    .string()
    .regex(/^[0-9]{11}$/, 'La partita IVA deve contenere esattamente 11 cifre')
    .optional()
    .or(z.literal('')),
  
  codice_fiscale: z
    .string()
    .regex(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/, 'Formato codice fiscale non valido')
    .optional()
    .or(z.literal('')),
  
  indirizzo_sede: z
    .string()
    .max(255, 'L\'indirizzo sede non può superare 255 caratteri')
    .optional(),
  
  indirizzo_fatturazione: z
    .string()
    .max(255, 'L\'indirizzo fatturazione non può superare 255 caratteri')
    .optional(),
  
  cap: z
    .string()
    .regex(/^[0-9]{5}$/, 'Il CAP deve contenere esattamente 5 cifre')
    .optional()
    .or(z.literal('')),
  
  citta: z
    .string()
    .max(100, 'La città non può superare 100 caratteri')
    .optional(),
  
  provincia: z
    .string()
    .length(2, 'La provincia deve essere esattamente 2 caratteri')
    .regex(/^[A-Z]{2}$/, 'La provincia deve contenere solo lettere maiuscole')
    .optional()
    .or(z.literal('')),
  
  telefono: z
    .string()
    .regex(/^[\d\s\-\+\(\)]{6,20}$/, 'Formato telefono non valido')
    .optional()
    .or(z.literal('')),
  
  email: z
    .string()
    .email('Formato email non valido')
    .max(255, 'L\'email non può superare 255 caratteri')
    .optional()
    .or(z.literal('')),
  
  pec: z
    .string()
    .email('Formato PEC non valido')
    .max(255, 'La PEC non può superare 255 caratteri')
    .optional()
    .or(z.literal('')),
  
  referente_principale: z
    .string()
    .max(255, 'Il referente principale non può superare 255 caratteri')
    .optional(),
  
  tipo_contratto: z
    .enum(['deposito', 'logistica', 'misto'], {
      errorMap: () => ({ message: 'Tipo contratto deve essere: deposito, logistica o misto' })
    }),
  
  data_inizio_rapporto: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  
  data_fine_rapporto: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  
  stato: z
    .enum(['attivo', 'sospeso', 'cessato'], {
      errorMap: () => ({ message: 'Stato deve essere: attivo, sospeso o cessato' })
    }),
  
  note: z
    .string()
    .max(1000, 'Le note non possono superare 1000 caratteri')
    .optional()
});

// Schema per l'update (tutti i campi opzionali tranne l'ID)
export const committenteUpdateSchema = committenteSchema.partial();

// Schema per la creazione (campi obbligatori)
export const committenteCreateSchema = committenteSchema.omit({});

// Type inference
export type Committente = z.infer<typeof committenteSchema>;
export type CommittenteCreate = z.infer<typeof committenteCreateSchema>;
export type CommittenteUpdate = z.infer<typeof committenteUpdateSchema>;

// Validazione personalizzata
export const validateCommittente = {
  create: (data: unknown): { success: boolean; data?: CommittenteCreate; errors?: Record<string, string> } => {
    const result = committenteCreateSchema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
  },
  
  update: (data: unknown): { success: boolean; data?: CommittenteUpdate; errors?: Record<string, string> } => {
    const result = committenteUpdateSchema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
  }
};