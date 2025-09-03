import { z } from 'zod';

// Schema per la creazione di un movimento
export const createMovimentoSchema = z.object({
  committente_id_origine: z.number({
    required_error: 'Il committente di origine è obbligatorio',
    invalid_type_error: 'Il committente deve essere un numero'
  }).int('Il committente deve essere un numero intero').positive('Il committente deve essere positivo'),

  committente_id_destinazione: z.number({
    invalid_type_error: 'Il committente di destinazione deve essere un numero'
  }).int('Il committente deve essere un numero intero').positive('Il committente deve essere positivo').optional(),

  tipo_movimento: z.enum(['CARICO', 'SCARICO', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE', 'RETTIFICA_POS', 'RETTIFICA_NEG', 'RESO_CLIENTE', 'RESO_FORNITORE'], {
    required_error: 'Il tipo di movimento è obbligatorio',
    invalid_type_error: 'Tipo di movimento non valido'
  }),

  prodotto_id: z.number({
    required_error: 'Il prodotto è obbligatorio',
    invalid_type_error: 'Il prodotto deve essere un numero'
  }).int('Il prodotto deve essere un numero intero').positive('Il prodotto deve essere positivo'),

  quantita: z.number({
    required_error: 'La quantità è obbligatoria',
    invalid_type_error: 'La quantità deve essere un numero'
  }).int('La quantità deve essere un numero intero').positive('La quantità deve essere positiva'),

  prezzo: z.number({
    invalid_type_error: 'Il prezzo deve essere un numero'
  }).min(0, 'Il prezzo deve essere positivo o zero').optional(),

  fornitore_id: z.number({
    invalid_type_error: 'Il fornitore deve essere un numero'
  }).int('Il fornitore deve essere un numero intero').positive('Il fornitore deve essere positivo').optional(),

  numero_documento: z.string().max(100, 'Il numero documento non può superare i 100 caratteri').optional().or(z.literal('')),

  data_documento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data documento deve essere nel formato YYYY-MM-DD').optional().or(z.literal('')),

  causale: z.string().max(500, 'La causale non può superare i 500 caratteri').optional().or(z.literal('')),

  operatore: z.string().max(100, 'Il nome operatore non può superare i 100 caratteri').optional().or(z.literal('')),

  note: z.string().max(1000, 'Le note non possono superare i 1000 caratteri').optional().or(z.literal('')),

  data_movimento: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'La data movimento deve essere nel formato ISO').optional()
}).refine((data) => {
  // Se il tipo è TRASFERIMENTO_INTER_COMMITTENTE, il committente destinazione è obbligatorio
  if (data.tipo_movimento === 'TRASFERIMENTO_INTER_COMMITTENTE') {
    return data.committente_id_destinazione !== undefined && data.committente_id_destinazione !== null;
  }
  return true;
}, {
  message: 'Il committente di destinazione è obbligatorio per i trasferimenti inter-committente',
  path: ['committente_id_destinazione']
}).refine((data) => {
  // Se è un CARICO, il fornitore è spesso necessario
  if (data.tipo_movimento === 'CARICO' && !data.fornitore_id) {
    // Warn ma non bloccare - potrebbe essere un carico da inventario
    return true;
  }
  return true;
});

// Schema per l'aggiornamento di un movimento (solo campi modificabili)
export const updateMovimentoSchema = z.object({
  numero_documento: z.string().max(100, 'Il numero documento non può superare i 100 caratteri').optional().or(z.literal('')),

  data_documento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data documento deve essere nel formato YYYY-MM-DD').optional().or(z.literal('')),

  causale: z.string().max(500, 'La causale non può superare i 500 caratteri').optional().or(z.literal('')),

  operatore: z.string().max(100, 'Il nome operatore non può superare i 100 caratteri').optional().or(z.literal('')),

  note: z.string().max(1000, 'Le note non possono superare i 1000 caratteri').optional().or(z.literal(''))
});

// Schema per filtri di ricerca movimenti
export const filterMovimentiSchema = z.object({
  data_inizio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data inizio deve essere nel formato YYYY-MM-DD').optional(),
  
  data_fine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data fine deve essere nel formato YYYY-MM-DD').optional(),
  
  tipo_movimento: z.enum(['CARICO', 'SCARICO', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE', 'RETTIFICA_POS', 'RETTIFICA_NEG', 'RESO_CLIENTE', 'RESO_FORNITORE']).optional(),
  
  prodotto_id: z.number().int().positive().optional(),
  
  fornitore_id: z.number().int().positive().optional()
}).refine((data) => {
  // Se entrambe le date sono fornite, data_inizio deve essere <= data_fine
  if (data.data_inizio && data.data_fine) {
    return new Date(data.data_inizio) <= new Date(data.data_fine);
  }
  return true;
}, {
  message: 'La data di inizio deve essere precedente o uguale alla data di fine',
  path: ['data_fine']
});

// Tipi TypeScript derivati dagli schemi
export type CreateMovimentoInput = z.infer<typeof createMovimentoSchema>;
export type UpdateMovimentoInput = z.infer<typeof updateMovimentoSchema>;
export type FilterMovimentiInput = z.infer<typeof filterMovimentiSchema>;

// Helper per ottenere le descrizioni dei tipi movimento
export const tipiMovimentoDescrizioni = {
  'CARICO': 'Carico (entrata merce)',
  'SCARICO': 'Scarico (uscita merce)',
  'TRASFERIMENTO_INTERNO': 'Trasferimento interno',
  'TRASFERIMENTO_INTER_COMMITTENTE': 'Trasferimento tra committenti',
  'RETTIFICA_POS': 'Rettifica positiva',
  'RETTIFICA_NEG': 'Rettifica negativa',
  'RESO_CLIENTE': 'Reso da cliente',
  'RESO_FORNITORE': 'Reso a fornitore'
} as const;

// Helper per ottenere i colori dei badge dei tipi movimento
export const tipiMovimentoColori = {
  'CARICO': 'bg-green-100 text-green-800',
  'SCARICO': 'bg-red-100 text-red-800',
  'TRASFERIMENTO_INTERNO': 'bg-blue-100 text-blue-800',
  'TRASFERIMENTO_INTER_COMMITTENTE': 'bg-purple-100 text-purple-800',
  'RETTIFICA_POS': 'bg-green-100 text-green-800',
  'RETTIFICA_NEG': 'bg-red-100 text-red-800',
  'RESO_CLIENTE': 'bg-yellow-100 text-yellow-800',
  'RESO_FORNITORE': 'bg-orange-100 text-orange-800'
} as const;