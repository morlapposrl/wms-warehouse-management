import { z } from 'zod';

// Schema per la creazione di un inventario
export const createInventarioSchema = z.object({
  committente_id: z.number({
    required_error: 'Il committente è obbligatorio',
    invalid_type_error: 'Il committente deve essere un numero'
  }).int('Il committente deve essere un numero intero').positive('Il committente deve essere positivo'),

  codice_inventario: z.string({
    required_error: 'Il codice inventario è obbligatorio',
    invalid_type_error: 'Il codice inventario deve essere una stringa'
  }).min(1, 'Il codice inventario non può essere vuoto')
    .max(50, 'Il codice inventario non può superare i 50 caratteri')
    .regex(/^[A-Z0-9_-]+$/, 'Il codice inventario può contenere solo lettere maiuscole, numeri, underscore e trattini'),

  descrizione: z.string({
    required_error: 'La descrizione è obbligatoria',
    invalid_type_error: 'La descrizione deve essere una stringa'
  }).min(1, 'La descrizione non può essere vuota')
    .max(200, 'La descrizione non può superare i 200 caratteri'),

  tipo: z.enum(['TOTALE', 'PARZIALE', 'CICLICO'], {
    required_error: 'Il tipo di inventario è obbligatorio',
    invalid_type_error: 'Tipo di inventario non valido'
  }),

  data_pianificazione: z.string({
    required_error: 'La data di pianificazione è obbligatoria',
    invalid_type_error: 'La data di pianificazione deve essere una stringa'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La data di pianificazione deve essere nel formato YYYY-MM-DD'),

  operatore_responsabile: z.string()
    .max(100, 'Il nome operatore non può superare i 100 caratteri')
    .optional()
    .or(z.literal('')),

  categoria_id: z.number({
    invalid_type_error: 'La categoria deve essere un numero'
  }).int('La categoria deve essere un numero intero').positive('La categoria deve essere positiva').optional(),

  ubicazione_filtro: z.string()
    .max(100, 'Il filtro ubicazione non può superare i 100 caratteri')
    .optional()
    .or(z.literal('')),

  note: z.string()
    .max(1000, 'Le note non possono superare i 1000 caratteri')
    .optional()
    .or(z.literal(''))
}).refine((data) => {
  // Se il tipo è PARZIALE, deve avere almeno un filtro
  if (data.tipo === 'PARZIALE') {
    return data.categoria_id !== undefined || (data.ubicazione_filtro && data.ubicazione_filtro.length > 0);
  }
  return true;
}, {
  message: 'Per gli inventari parziali è necessario specificare almeno un filtro (categoria o ubicazione)',
  path: ['categoria_id']
}).refine((data) => {
  // La data di pianificazione non può essere nel passato
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const dataPianificazione = new Date(data.data_pianificazione);
  return dataPianificazione >= oggi;
}, {
  message: 'La data di pianificazione non può essere nel passato',
  path: ['data_pianificazione']
});

// Schema per l'aggiornamento di un conteggio
export const updateConteggioSchema = z.object({
  quantita_contata: z.number({
    required_error: 'La quantità contata è obbligatoria',
    invalid_type_error: 'La quantità contata deve essere un numero'
  }).int('La quantità contata deve essere un numero intero').min(0, 'La quantità contata non può essere negativa'),

  operatore_conteggio: z.string()
    .max(100, 'Il nome operatore non può superare i 100 caratteri')
    .optional()
    .or(z.literal('')),

  note_conteggio: z.string()
    .max(500, 'Le note di conteggio non possono superare i 500 caratteri')
    .optional()
    .or(z.literal(''))
});

// Schema per filtri di ricerca inventari
export const filterInventariSchema = z.object({
  stato: z.enum(['PIANIFICATO', 'IN_CORSO', 'COMPLETATO', 'ANNULLATO']).optional(),
  
  tipo: z.enum(['TOTALE', 'PARZIALE', 'CICLICO']).optional(),
  
  data_inizio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data inizio deve essere nel formato YYYY-MM-DD').optional(),
  
  data_fine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data fine deve essere nel formato YYYY-MM-DD').optional(),
  
  operatore_responsabile: z.string().optional()
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
export type CreateInventarioInput = z.infer<typeof createInventarioSchema>;
export type UpdateConteggioInput = z.infer<typeof updateConteggioSchema>;
export type FilterInventariInput = z.infer<typeof filterInventariSchema>;

// Helper per ottenere le descrizioni dei tipi inventario
export const tipiInventarioDescrizioni = {
  'TOTALE': 'Inventario Totale',
  'PARZIALE': 'Inventario Parziale',
  'CICLICO': 'Inventario Ciclico'
} as const;

// Helper per ottenere le descrizioni degli stati inventario
export const statiInventarioDescrizioni = {
  'PIANIFICATO': 'Pianificato',
  'IN_CORSO': 'In Corso',
  'COMPLETATO': 'Completato',
  'ANNULLATO': 'Annullato'
} as const;

// Helper per ottenere i colori dei badge degli stati inventario
export const statiInventarioColori = {
  'PIANIFICATO': 'bg-gray-100 text-gray-800',
  'IN_CORSO': 'bg-blue-100 text-blue-800',
  'COMPLETATO': 'bg-green-100 text-green-800',
  'ANNULLATO': 'bg-red-100 text-red-800'
} as const;

// Helper per ottenere i colori dei badge dei tipi inventario
export const tipiInventarioColori = {
  'TOTALE': 'bg-purple-100 text-purple-800',
  'PARZIALE': 'bg-yellow-100 text-yellow-800',
  'CICLICO': 'bg-blue-100 text-blue-800'
} as const;

// Helper per ottenere i colori delle differenze di conteggio
export const differenzeConteggioColori = {
  'OK': 'bg-green-100 text-green-800',
  'SURPLUS': 'bg-blue-100 text-blue-800',
  'DEFICIT': 'bg-red-100 text-red-800',
  'PENDING': 'bg-gray-100 text-gray-800'
} as const;

// Helper per ottenere le descrizioni delle differenze di conteggio
export const differenzeConteggioDescrizioni = {
  'OK': 'Corretto',
  'SURPLUS': 'Eccedenza',
  'DEFICIT': 'Mancanza',
  'PENDING': 'Da contare'
} as const;