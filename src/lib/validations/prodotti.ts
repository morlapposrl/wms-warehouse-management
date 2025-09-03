import { z } from 'zod';

// Schema per prodotti
export const prodottoSchema = z.object({
  committente_id: z
    .number()
    .int()
    .positive('Il committente ID deve essere un numero positivo'),
  
  codice: z
    .string()
    .min(1, 'Il codice prodotto è obbligatorio')
    .max(50, 'Il codice prodotto non può superare 50 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice può contenere solo lettere maiuscole, numeri, _ e -'),
  
  descrizione: z
    .string()
    .min(2, 'La descrizione deve essere almeno 2 caratteri')
    .max(255, 'La descrizione non può superare 255 caratteri'),
  
  categoria_id: z
    .number()
    .int()
    .positive('Seleziona una categoria valida'),
  
  unita_misura_id: z
    .number()
    .int()
    .positive('Seleziona un\'unità di misura valida'),
  
  prezzo_acquisto: z
    .number()
    .min(0, 'Il prezzo acquisto non può essere negativo')
    .max(999999.99, 'Il prezzo acquisto è troppo alto')
    .optional()
    .default(0),
  
  prezzo_vendita: z
    .number()
    .min(0, 'Il prezzo vendita non può essere negativo')
    .max(999999.99, 'Il prezzo vendita è troppo alto')
    .optional()
    .default(0),
  
  scorta_minima: z
    .number()
    .int()
    .min(0, 'La scorta minima non può essere negativa')
    .max(999999, 'La scorta minima è troppo alta')
    .optional()
    .default(0),
  
  scorta_massima: z
    .number()
    .int()
    .min(0, 'La scorta massima non può essere negativa')
    .max(999999, 'La scorta massima è troppo alta')
    .optional()
    .default(0),
  
  ubicazione: z
    .string()
    .max(50, 'L\'ubicazione non può superare 50 caratteri')
    .optional(),
  
  lotto_partita: z
    .string()
    .max(50, 'Il lotto/partita non può superare 50 caratteri')
    .optional(),
  
  note: z
    .string()
    .max(1000, 'Le note non possono superare 1000 caratteri')
    .optional(),
  
  attivo: z
    .boolean()
    .default(true)
}).refine((data) => {
  // Validazione custom: scorta_minima <= scorta_massima
  if (data.scorta_minima && data.scorta_massima && data.scorta_minima > data.scorta_massima) {
    return false;
  }
  return true;
}, {
  message: 'La scorta minima non può essere maggiore della scorta massima',
  path: ['scorta_massima']
}).refine((data) => {
  // Validazione custom: prezzo_vendita >= prezzo_acquisto (se entrambi specificati)
  if (data.prezzo_acquisto && data.prezzo_vendita && data.prezzo_vendita < data.prezzo_acquisto) {
    return false;
  }
  return true;
}, {
  message: 'Il prezzo di vendita dovrebbe essere maggiore o uguale al prezzo di acquisto',
  path: ['prezzo_vendita']
});

// Schema per categorie
export const categoriaSchema = z.object({
  committente_id: z
    .number()
    .int()
    .positive('Il committente ID deve essere un numero positivo'),
  
  codice: z
    .string()
    .min(1, 'Il codice categoria è obbligatorio')
    .max(20, 'Il codice categoria non può superare 20 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice può contenere solo lettere maiuscole, numeri, _ e -'),
  
  descrizione: z
    .string()
    .min(2, 'La descrizione deve essere almeno 2 caratteri')
    .max(255, 'La descrizione non può superare 255 caratteri'),
  
  attiva: z
    .boolean()
    .default(true)
});

// Schema per unità di misura
export const unitaMisuraSchema = z.object({
  committente_id: z
    .number()
    .int()
    .positive('Il committente ID deve essere un numero positivo')
    .optional()
    .nullable(), // null = globale
  
  codice: z
    .string()
    .min(1, 'Il codice unità è obbligatorio')
    .max(10, 'Il codice unità non può superare 10 caratteri')
    .regex(/^[A-Z0-9]+$/, 'Il codice può contenere solo lettere maiuscole e numeri'),
  
  descrizione: z
    .string()
    .min(2, 'La descrizione deve essere almeno 2 caratteri')
    .max(100, 'La descrizione non può superare 100 caratteri'),
  
  tipo: z
    .enum(['sistema', 'personalizzata'], {
      errorMap: () => ({ message: 'Tipo deve essere: sistema o personalizzata' })
    }),
  
  attiva: z
    .boolean()
    .default(true)
});

// Schema per fornitori
export const fornitoreSchema = z.object({
  codice: z
    .string()
    .min(1, 'Il codice fornitore è obbligatorio')
    .max(20, 'Il codice fornitore non può superare 20 caratteri')
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
  
  indirizzo: z
    .string()
    .max(255, 'L\'indirizzo non può superare 255 caratteri')
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
  
  contatto_principale: z
    .string()
    .max(255, 'Il contatto principale non può superare 255 caratteri')
    .optional(),
  
  note: z
    .string()
    .max(1000, 'Le note non possono superare 1000 caratteri')
    .optional(),
  
  attivo: z
    .boolean()
    .default(true)
});

// Update schemas (campi opzionali)
export const prodottoUpdateSchema = prodottoSchema.partial().omit({ committente_id: true });
export const categoriaUpdateSchema = categoriaSchema.partial().omit({ committente_id: true });
export const unitaMisuraUpdateSchema = unitaMisuraSchema.partial();
export const fornitoreUpdateSchema = fornitoreSchema.partial();

// Type inference
export type Prodotto = z.infer<typeof prodottoSchema>;
export type ProdottoUpdate = z.infer<typeof prodottoUpdateSchema>;
export type Categoria = z.infer<typeof categoriaSchema>;
export type CategoriaUpdate = z.infer<typeof categoriaUpdateSchema>;
export type UnitaMisura = z.infer<typeof unitaMisuraSchema>;
export type UnitaMisuraUpdate = z.infer<typeof unitaMisuraUpdateSchema>;
export type Fornitore = z.infer<typeof fornitoreSchema>;
export type FornitoreUpdate = z.infer<typeof fornitoreUpdateSchema>;

// Utility di validazione
export const validateProdotto = {
  create: (data: unknown) => {
    const result = prodottoSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const errors: Record<string, string> = {};
    result.error.errors.forEach(err => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return { success: false, errors };
  },
  
  update: (data: unknown) => {
    const result = prodottoUpdateSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const errors: Record<string, string> = {};
    result.error.errors.forEach(err => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return { success: false, errors };
  }
};