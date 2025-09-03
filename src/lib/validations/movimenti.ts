import { z } from 'zod';

// Schema per movimenti
export const movimentoSchema = z.object({
  committente_id: z
    .number()
    .int()
    .positive('Il committente ID deve essere un numero positivo'),
  
  tipo_movimento: z
    .enum(['CARICO', 'SCARICO', 'RETTIFICA_POSITIVA', 'RETTIFICA_NEGATIVA', 'TRASFERIMENTO'], {
      errorMap: () => ({ message: 'Tipo movimento non valido' })
    }),
  
  sku_code: z
    .string()
    .min(1, 'Il codice SKU è obbligatorio')
    .max(50, 'Il codice SKU non può superare 50 caratteri'),
  
  quantita: z
    .number()
    .int()
    .positive('La quantità deve essere un numero positivo'),
  
  ubicazione_da: z
    .string()
    .max(50, 'L\'ubicazione di origine non può superare 50 caratteri')
    .optional(),
  
  ubicazione_a: z
    .string()
    .max(50, 'L\'ubicazione di destinazione non può superare 50 caratteri')
    .optional(),
  
  operatore_id: z
    .number()
    .int()
    .positive('L\'operatore ID deve essere un numero positivo')
    .optional(),
  
  ordine_id: z
    .number()
    .int()
    .positive('L\'ordine ID deve essere un numero positivo')
    .optional(),
  
  lotto: z
    .string()
    .max(50, 'Il lotto non può superare 50 caratteri')
    .optional(),
  
  scadenza: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  
  costo_unitario: z
    .number()
    .min(0, 'Il costo unitario non può essere negativo')
    .max(999999.99, 'Il costo unitario è troppo alto')
    .optional(),
  
  note: z
    .string()
    .max(500, 'Le note non possono superare 500 caratteri')
    .optional(),
  
  timestamp_inizio: z
    .string()
    .datetime('Formato timestamp non valido')
    .optional(),
  
  timestamp_fine: z
    .string()
    .datetime('Formato timestamp non valido')
    .optional()
}).refine((data) => {
  // Validazione: TRASFERIMENTO richiede sia ubicazione_da che ubicazione_a
  if (data.tipo_movimento === 'TRASFERIMENTO') {
    return data.ubicazione_da && data.ubicazione_a;
  }
  return true;
}, {
  message: 'Per i trasferimenti sono richieste sia ubicazione di origine che destinazione',
  path: ['ubicazione_a']
}).refine((data) => {
  // Validazione: CARICO, RETTIFICA_POSITIVA richiedono ordine_id per tracciabilità
  const tipiRichiedonoOrdine = ['CARICO', 'RETTIFICA_POSITIVA'];
  if (tipiRichiedonoOrdine.includes(data.tipo_movimento)) {
    return data.ordine_id && data.ordine_id > 0;
  }
  return true;
}, {
  message: 'Movimenti di carico richiedono un ordine di riferimento per la tracciabilità',
  path: ['ordine_id']
});

// Schema per movimenti ottimizzati (estensione del movimento base)
export const movimentoOttimizzatoSchema = movimentoSchema.extend({
  tipo_movimento: z
    .enum([
      'RECEIVE', 'CROSS_DOCK', 'PUT_AWAY', 'PICK', 'REPLENISH', 
      'TRANSFER', 'ADJUST_PLUS', 'ADJUST_MINUS', 'RETURN_RECEIVE', 'DISPOSE'
    ], {
      errorMap: () => ({ message: 'Tipo movimento ottimizzato non valido' })
    }),
  
  wave_id: z
    .string()
    .max(50, 'Il wave ID non può superare 50 caratteri')
    .optional(),
  
  device_id: z
    .string()
    .max(50, 'Il device ID non può superare 50 caratteri')
    .optional(),
  
  durata_secondi: z
    .number()
    .int()
    .min(0, 'La durata non può essere negativa')
    .optional(),
  
  distanza_metri: z
    .number()
    .min(0, 'La distanza non può essere negativa')
    .optional()
});

// Schema per ordini
export const ordineSchema = z.object({
  customer_id: z
    .number()
    .int()
    .positive('Il customer ID deve essere un numero positivo'),
  
  order_number: z
    .string()
    .min(1, 'Il numero ordine è obbligatorio')
    .max(50, 'Il numero ordine non può superare 50 caratteri'),
  
  service_level: z
    .enum(['PRIME', 'STANDARD', 'ECONOMY'], {
      errorMap: () => ({ message: 'Service level deve essere: PRIME, STANDARD o ECONOMY' })
    }),
  
  promised_date: z
    .string()
    .datetime('Formato data promessa non valido'),
  
  shipping_address: z
    .string()
    .min(10, 'L\'indirizzo di spedizione deve essere almeno 10 caratteri')
    .max(500, 'L\'indirizzo di spedizione non può superare 500 caratteri'),
  
  total_amount: z
    .number()
    .min(0, 'L\'importo totale non può essere negativo')
    .max(999999.99, 'L\'importo totale è troppo alto'),
  
  status: z
    .enum([
      'PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PENDING_PICKING', 
      'PICKING_IN_PROGRESS', 'PICKED_COMPLETE', 'PENDING_PACKING', 
      'PACKED', 'LABELED', 'SHIPPED', 'OUT_FOR_DELIVERY', 
      'DELIVERED', 'RETURNED'
    ], {
      errorMap: () => ({ message: 'Status ordine non valido' })
    }),
  
  wave_id: z
    .string()
    .max(50, 'Il wave ID non può superare 50 caratteri')
    .optional(),
  
  carrier: z
    .string()
    .max(100, 'Il corriere non può superare 100 caratteri')
    .optional(),
  
  tracking_number: z
    .string()
    .max(100, 'Il numero tracking non può superare 100 caratteri')
    .optional(),
  
  note: z
    .string()
    .max(1000, 'Le note non possono superare 1000 caratteri')
    .optional()
});

// Schema per dettagli ordine
export const ordineDettaglioSchema = z.object({
  order_id: z
    .number()
    .int()
    .positive('L\'order ID deve essere un numero positivo'),
  
  line_id: z
    .number()
    .int()
    .positive('Il line ID deve essere un numero positivo'),
  
  committente_id: z
    .number()
    .int()
    .positive('Il committente ID deve essere un numero positivo'),
  
  sku_code: z
    .string()
    .min(1, 'Il codice SKU è obbligatorio')
    .max(50, 'Il codice SKU non può superare 50 caratteri'),
  
  quantita: z
    .number()
    .int()
    .positive('La quantità deve essere un numero positivo'),
  
  prezzo_unitario: z
    .number()
    .min(0, 'Il prezzo unitario non può essere negativo')
    .max(999999.99, 'Il prezzo unitario è troppo alto'),
  
  fulfillment_type: z
    .enum(['FBW', 'FBM'], {
      errorMap: () => ({ message: 'Fulfillment type deve essere: FBW o FBM' })
    }),
  
  status_riga: z
    .enum(['PENDING', 'ALLOCATED', 'PICKED', 'PACKED', 'SHIPPED'], {
      errorMap: () => ({ message: 'Status riga non valido' })
    })
    .default('PENDING')
});

// Update schemas
export const movimentoUpdateSchema = movimentoSchema.partial().omit({ committente_id: true });
export const ordineUpdateSchema = ordineSchema.partial();
export const ordineDettaglioUpdateSchema = ordineDettaglioSchema.partial();

// Type inference
export type Movimento = z.infer<typeof movimentoSchema>;
export type MovimentoUpdate = z.infer<typeof movimentoUpdateSchema>;
export type MovimentoOttimizzato = z.infer<typeof movimentoOttimizzatoSchema>;
export type Ordine = z.infer<typeof ordineSchema>;
export type OrdineUpdate = z.infer<typeof ordineUpdateSchema>;
export type OrdineDettaglio = z.infer<typeof ordineDettaglioSchema>;
export type OrdineDettaglioUpdate = z.infer<typeof ordineDettaglioUpdateSchema>;

// Utility di validazione
export const validateMovimento = {
  create: (data: unknown) => {
    const result = movimentoSchema.safeParse(data);
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

export const validateOrdine = {
  create: (data: unknown) => {
    const result = ordineSchema.safeParse(data);
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