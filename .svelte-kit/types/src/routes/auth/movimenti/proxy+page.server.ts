// @ts-nocheck
import database from '$lib/server/database.js';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';
import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';

// Schema validazione movimento ottimizzato
const movimentoSchema = z.object({
  committente_id: z.number().int().positive(),
  sku_code: z.string().min(1),
  tipo_movimento: z.enum(['RECEIVE', 'CROSS_DOCK', 'PUT_AWAY', 'PICK', 'REPLENISH', 'TRANSFER', 'ADJUST_PLUS', 'ADJUST_MINUS', 'RETURN_RECEIVE', 'DISPOSE']),
  quantita: z.number().int().positive(),
  from_ubicazione_id: z.number().int().optional(),
  to_ubicazione_id: z.number().int().optional(),
  operatore_id: z.number().int().optional(),
  device_id: z.string().optional(),
  wave_id: z.string().optional(),
  ordine_id: z.number().int().optional(),
  lotto: z.string().optional(),
  data_scadenza: z.string().optional(),
  costo_unitario: z.number().optional(),
  note: z.string().optional()
});

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Filtri dalla query string
    const committente_id = url.searchParams.get('committente') ? parseInt(url.searchParams.get('committente')!) : null;
    const prodotto_id = url.searchParams.get('prodotto') ? parseInt(url.searchParams.get('prodotto')!) : null;
    const search = url.searchParams.get('search') || '';
    const tipo_movimento = url.searchParams.get('tipo');
    const operatore_id = url.searchParams.get('operatore') ? parseInt(url.searchParams.get('operatore')!) : null;
    const data_da = url.searchParams.get('data_da');
    const data_a = url.searchParams.get('data_a');

    // Costruisci query dinamica con filtri
    let whereConditions = ['1=1'];
    let params: any[] = [];

    if (committente_id) {
      whereConditions.push('m.committente_id_origine = ?');
      params.push(committente_id);
    }
    if (prodotto_id) {
      whereConditions.push('m.prodotto_id = ?');
      params.push(prodotto_id);
    }
    if (search) {
      whereConditions.push('(p.codice LIKE ? OR p.descrizione LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (tipo_movimento) {
      whereConditions.push('m.tipo_movimento = ?');
      params.push(tipo_movimento);
    }
    if (data_da) {
      whereConditions.push('date(m.data_movimento) >= ?');
      params.push(data_da);
    }
    if (data_a) {
      whereConditions.push('date(m.data_movimento) <= ?');
      params.push(data_a);
    }

    const whereClause = whereConditions.join(' AND ');

    // Movimenti ottimizzati con ubicazioni e UDC reali
    const movimenti = database.prepare(`
      SELECT 
        mo.id,
        mo.committente_id,
        mo.tipo_movimento,
        mo.quantita,
        COALESCE(mo.costo_unitario, 0.0) as prezzo,
        CASE WHEN mo.costo_unitario IS NOT NULL AND mo.costo_unitario > 0 
          THEN ROUND(mo.quantita * mo.costo_unitario, 2) 
          ELSE 0.0 
        END as valore_totale,
        '-' as numero_documento,
        '-' as causale,
        COALESCE(u.nome || ' ' || u.cognome, 'Sistema') as operatore,
        COALESCE(m.note, mo.note, '-') as note,
        strftime('%d-%m-%Y %H:%M', mo.timestamp_inizio, 'localtime') as data_movimento_formatted,
        mo.timestamp_inizio as data_movimento,
        mo.sku_code as prodotto_codice,
        COALESCE(sm.descrizione, mo.sku_code) as prodotto_descrizione,
        COALESCE(c.ragione_sociale, 'N/A') as committente_nome,
        '-' as fornitore_nome,
        '-' as categoria_nome,
        'PZ' as unita_misura,
        COALESCE(o.numero_ordine, '-') as ordine_numero,
        COALESCE(o.tipo_ordine, '-') as ordine_tipo,
        
        -- UBICAZIONI REALI
        COALESCE(u_da.codice_ubicazione, '-') as ubicazione_da,
        COALESCE(u_a.codice_ubicazione, '-') as ubicazione_a,
        COALESCE(u_da.zona, '-') as zona_da,
        COALESCE(u_a.zona, '-') as zona_a,
        
        -- UDC REALI
        COALESCE(udc.barcode, '-') as udc_barcode,
        COALESCE(tu.nome, '-') as udc_tipo,
        COALESCE(udc.stato, '-') as udc_stato,
        
        -- DATI FACOLTATIVI DA UDC_CONTENUTO
        COALESCE(uc.lotto, '-') as lotto,
        COALESCE(DATE(uc.scadenza), '-') as scadenza,
        COALESCE(uc.peso_kg, 0) as peso_netto,
        COALESCE(udc.peso_attuale_kg, 0) as peso_lordo
        
      FROM movimenti_ottimizzati mo
      LEFT JOIN committenti c ON mo.committente_id = c.id
      LEFT JOIN utenti u ON mo.operatore_id = u.id
      LEFT JOIN sku_master sm ON mo.sku_code = sm.sku_code
      LEFT JOIN ubicazioni u_da ON mo.from_ubicazione_id = u_da.id
      LEFT JOIN ubicazioni u_a ON mo.to_ubicazione_id = u_a.id
      LEFT JOIN ordini o ON mo.ordine_id = o.id
      LEFT JOIN movimenti m ON mo.ordine_id = m.ordine_id 
                            AND mo.sku_code = (SELECT codice FROM prodotti WHERE id = m.prodotto_id)
                            AND datetime(mo.timestamp_inizio) = datetime(m.data_movimento)
      LEFT JOIN udc ON udc.id = m.udc_id
      LEFT JOIN tipi_udc tu ON udc.tipo_udc_id = tu.id
      LEFT JOIN udc_contenuto uc ON udc.id = uc.udc_id 
                                 AND uc.prodotto_id = (SELECT id FROM prodotti WHERE codice = mo.sku_code LIMIT 1)
      WHERE 1=1 ${committente_id ? 'AND mo.committente_id = ?' : ''}
      ORDER BY mo.timestamp_inizio DESC
      LIMIT 200
    `).all(...(committente_id ? [committente_id] : []));

    // Statistiche per dashboard movimenti (stessi filtri dei movimenti)
    const statistiche = database.prepare(`
      SELECT 
        COUNT(*) as totale_movimenti,
        COUNT(CASE WHEN m.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE', 'RECEIVE', 'RETTIFICA_POSITIVA') THEN 1 END) as carichi,
        COUNT(CASE WHEN m.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'PICK', 'RETTIFICA_NEGATIVA') THEN 1 END) as scarichi,
        COUNT(CASE WHEN m.tipo_movimento LIKE '%TRASFERIMENTO%' OR m.tipo_movimento = 'TRANSFER' THEN 1 END) as trasferimenti,
        SUM(CASE 
          WHEN m.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE', 'RECEIVE', 'RETTIFICA_POSITIVA') THEN m.quantita
          WHEN m.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'PICK', 'RETTIFICA_NEGATIVA', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE') THEN -m.quantita
          ELSE 0
        END) as saldo_netto,
        SUM(m.quantita) as pezzi_movimentati,
        SUM(CASE 
          WHEN m.prezzo IS NOT NULL AND m.prezzo > 0 THEN (m.quantita * m.prezzo)
          ELSE 0
        END) as valore_totale_movimenti
      FROM movimenti m
      JOIN prodotti p ON m.prodotto_id = p.id
      WHERE ${whereClause}
    `).get(...params);

    // Movimenti per tipo (oggi)
    const movimentiPerTipo = database.prepare(`
      SELECT 
        mo.tipo_movimento,
        COUNT(*) as count,
        SUM(mo.quantita) as quantita_totale,
        AVG(mo.durata_secondi) as durata_media
      FROM movimenti_ottimizzati mo
      WHERE date(mo.timestamp_inizio) = date('now')
      ${committente_id ? 'AND mo.committente_id = ?' : ''}
      GROUP BY mo.tipo_movimento
      ORDER BY count DESC
    `).all(...(committente_id ? [committente_id] : []));

    // Top operatori per produttività
    const topOperatori = database.prepare(`
      SELECT 
        u.id,
        u.nome,
        u.cognome,
        COUNT(*) as movimenti_count,
        SUM(mo.quantita) as pezzi_totali,
        AVG(mo.durata_secondi) as durata_media,
        COUNT(DISTINCT mo.tipo_movimento) as tipi_movimento
      FROM movimenti_ottimizzati mo
      INNER JOIN utenti u ON mo.operatore_id = u.id
      WHERE date(mo.timestamp_inizio) >= date('now', '-7 days')
      ${committente_id ? 'AND mo.committente_id = ?' : ''}
      GROUP BY u.id, u.nome, u.cognome
      HAVING movimenti_count > 0
      ORDER BY pezzi_totali DESC
      LIMIT 10
    `).all(...(committente_id ? [committente_id] : []));

    // Lista committenti per filtro
    const committenti = database.prepare(`
      SELECT id, codice, ragione_sociale 
      FROM committenti 
      WHERE stato = 'attivo'
      ORDER BY ragione_sociale
    `).all();

    // Lista operatori per filtro
    const operatori = database.prepare(`
      SELECT id, nome, cognome
      FROM utenti 
      WHERE ruolo IN ('operatore_magazzino', 'super_admin') 
      AND attivo = 1
      ORDER BY nome, cognome
    `).all();

    // Liste per movimenti
    const ubicazioni = database.prepare(`
      SELECT id, codice_ubicazione, zona, tipo
      FROM ubicazioni 
      WHERE attiva = 1
      ORDER BY zona, codice_ubicazione
    `).all();

    const skuMaster = database.prepare(`
      SELECT sku_code, descrizione, categoria_generale
      FROM sku_master
      ORDER BY descrizione
      LIMIT 100
    `).all();

    return {
      movimenti,
      statistiche,
      movimentiPerTipo,
      topOperatori,
      committenti,
      operatori,
      ubicazioni,
      skuMaster,
      filtri: {
        committente_id,
        prodotto_id,
        search,
        tipo_movimento,
        operatore_id,
        data_da,
        data_a
      }
    };

  } catch (err) {
    console.error('Errore caricamento movimenti:', err);
    throw error(500, 'Errore interno del server');
  }
};

export const actions = {
  // Azione per creare nuovo movimento
  create: async ({ request, cookies }: import('./$types').RequestEvent) => {
    try {
      const formData = await request.formData();
      
      const data = {
        committente_id: parseInt(formData.get('committente_id') as string),
        sku_code: formData.get('sku_code') as string,
        tipo_movimento: formData.get('tipo_movimento') as string,
        quantita: parseInt(formData.get('quantita') as string),
        from_ubicazione_id: formData.get('from_ubicazione_id') ? parseInt(formData.get('from_ubicazione_id') as string) : undefined,
        to_ubicazione_id: formData.get('to_ubicazione_id') ? parseInt(formData.get('to_ubicazione_id') as string) : undefined,
        operatore_id: formData.get('operatore_id') ? parseInt(formData.get('operatore_id') as string) : undefined,
        device_id: formData.get('device_id') as string || undefined,
        wave_id: formData.get('wave_id') as string || undefined,
        ordine_id: formData.get('ordine_id') ? parseInt(formData.get('ordine_id') as string) : undefined,
        lotto: formData.get('lotto') as string || undefined,
        data_scadenza: formData.get('data_scadenza') as string || undefined,
        costo_unitario: formData.get('costo_unitario') ? parseFloat(formData.get('costo_unitario') as string) : undefined,
        note: formData.get('note') as string || undefined
      };

      // Validazione
      const validatedData = movimentoSchema.parse(data);

      // Verifica che SKU esista
      const sku = database.prepare(`
        SELECT * FROM sku_master WHERE sku_code = ?
      `).get(validatedData.sku_code);

      if (!sku) {
        return fail(400, {
          error: 'SKU non trovato',
          field: 'sku_code'
        });
      }

      // Verifica che committente abbia accesso al prodotto (se specificato)
      if (validatedData.committente_id) {
        const prodottoCommittente = database.prepare(`
          SELECT * FROM prodotti_committente_v2 
          WHERE committente_id = ? AND sku_code = ?
        `).get(validatedData.committente_id, validatedData.sku_code);

        if (!prodottoCommittente) {
          return fail(400, {
            error: 'Committente non autorizzato per questo SKU',
            field: 'committente_id'
          });
        }
      }

      // Inizia transazione
      database.prepare('BEGIN').run();

      try {
        // Inserisci movimento
        const insertMovimento = database.prepare(`
          INSERT INTO movimenti_ottimizzati (
            committente_id, sku_code, tipo_movimento, quantita,
            from_ubicazione_id, to_ubicazione_id, operatore_id, device_id,
            wave_id, ordine_id, lotto, data_scadenza, costo_unitario, note,
            timestamp_inizio
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const result = insertMovimento.run(
          validatedData.committente_id,
          validatedData.sku_code,
          validatedData.tipo_movimento,
          validatedData.quantita,
          validatedData.from_ubicazione_id || null,
          validatedData.to_ubicazione_id || null,
          validatedData.operatore_id || null,
          validatedData.device_id || null,
          validatedData.wave_id || null,
          validatedData.ordine_id || null,
          validatedData.lotto || null,
          validatedData.data_scadenza || null,
          validatedData.costo_unitario || null,
          validatedData.note || null
        );

        const movimentoId = result.lastInsertRowid;

        // Log audit per creazione movimento
        const tracker = createAuditTrackerForAction(request, cookies);
        if (tracker) {
          await tracker.logOperation({
            table: 'movimenti_ottimizzati',
            operation: 'CREATE',
            description: `Creato movimento ${validatedData.tipo_movimento}: ${validatedData.quantita} x ${validatedData.sku_code}`,
            module: 'MOVIMENTI',
            functionality: 'create_movimento',
            importance: 'ALTA',
            entities_involved: { 
              movimento_id: movimentoId,
              sku_code: validatedData.sku_code,
              committente_id: validatedData.committente_id,
              ordine_id: validatedData.ordine_id
            },
            data_after: validatedData
          });
        }

        // Aggiorna giacenze logiche
        await aggiornaGiacenzeLogiche(validatedData, database);

        // Aggiorna giacenze fisiche
        await aggiornaGiacenzeFisiche(validatedData, database);

        // Commit transazione
        database.prepare('COMMIT').run();

        return {
          success: true,
          movimento_id: movimentoId,
          message: 'Movimento registrato con successo'
        };

      } catch (error) {
        database.prepare('ROLLBACK').run();
        throw error;
      }

    } catch (err) {
      console.error('Errore creazione movimento:', err);
      
      if (err instanceof z.ZodError) {
        return fail(400, {
          error: 'Dati non validi',
          details: err.errors
        });
      }
      
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  },

  // Azione per completare movimento in corso
  complete: async ({ request, cookies }: import('./$types').RequestEvent) => {
    try {
      const formData = await request.formData();
      const movimento_id = parseInt(formData.get('movimento_id') as string);
      const durata_secondi = formData.get('durata_secondi') ? parseInt(formData.get('durata_secondi') as string) : null;
      const distanza_metri = formData.get('distanza_metri') ? parseFloat(formData.get('distanza_metri') as string) : null;

      // Aggiorna movimento come completato
      const updateMovimento = database.prepare(`
        UPDATE movimenti_ottimizzati 
        SET timestamp_fine = CURRENT_TIMESTAMP,
            durata_secondi = COALESCE(?, 
              CAST((julianday(CURRENT_TIMESTAMP) - julianday(timestamp_inizio)) * 86400 AS INTEGER)
            ),
            distanza_metri = ?
        WHERE id = ? AND timestamp_fine IS NULL
      `);

      // Recupera dati movimento prima dell'aggiornamento per audit
      const oldMovimento = database.prepare(`
        SELECT * FROM movimenti_ottimizzati WHERE id = ?
      `).get(movimento_id);

      const result = updateMovimento.run(durata_secondi, distanza_metri, movimento_id);

      if (result.changes === 0) {
        return fail(404, {
          error: 'Movimento non trovato o già completato'
        });
      }

      // Log audit per completamento movimento
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker && oldMovimento) {
        await tracker.logOperation({
          table: 'movimenti_ottimizzati',
          operation: 'UPDATE',
          description: `Completato movimento ${oldMovimento.tipo_movimento}: ${oldMovimento.sku_code}`,
          module: 'MOVIMENTI',
          functionality: 'complete_movimento',
          importance: 'ALTA',
          entities_involved: { 
            movimento_id: movimento_id,
            sku_code: oldMovimento.sku_code,
            committente_id: oldMovimento.committente_id
          },
          data_before: {
            timestamp_fine: oldMovimento.timestamp_fine,
            durata_secondi: oldMovimento.durata_secondi,
            distanza_metri: oldMovimento.distanza_metri
          },
          data_after: {
            timestamp_fine: 'CURRENT_TIMESTAMP',
            durata_secondi: durata_secondi,
            distanza_metri: distanza_metri
          }
        });
      }

      return {
        success: true,
        message: 'Movimento completato con successo'
      };

    } catch (err) {
      console.error('Errore completamento movimento:', err);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  }
};

// Funzione helper per aggiornare giacenze logiche
async function aggiornaGiacenzeLogiche(movimento: any, db: any) {
  const { committente_id, sku_code, tipo_movimento, quantita, costo_unitario } = movimento;

  // Calcola variazione quantità
  let deltaDisponibile = 0;
  let deltaRiservata = 0;
  let deltaInTransito = 0;

  switch (tipo_movimento) {
    case 'RECEIVE':
    case 'RETURN_RECEIVE':
    case 'ADJUST_PLUS':
      deltaDisponibile = quantita;
      break;
    case 'PICK':
    case 'DISPOSE':
    case 'ADJUST_MINUS':
      deltaDisponibile = -quantita;
      break;
    case 'PUT_AWAY':
      deltaInTransito = -quantita;
      deltaDisponibile = quantita;
      break;
    case 'CROSS_DOCK':
      // Bypassa giacenze
      break;
    case 'TRANSFER':
    case 'REPLENISH':
      // Movimento interno - no impact su totali
      break;
  }

  if (deltaDisponibile !== 0 || deltaRiservata !== 0 || deltaInTransito !== 0) {
    // Upsert giacenza logica
    const upsertGiacenza = db.prepare(`
      INSERT INTO giacenze_logiche (
        committente_id, sku_code, quantita_disponibile, quantita_riservata, 
        quantita_in_transito, costo_medio_ponderato, valore_totale, ultima_movimentazione
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(committente_id, sku_code) DO UPDATE SET
        quantita_disponibile = quantita_disponibile + ?,
        quantita_riservata = quantita_riservata + ?,
        quantita_in_transito = quantita_in_transito + ?,
        costo_medio_ponderato = CASE 
          WHEN ? > 0 AND ? IS NOT NULL THEN 
            ((costo_medio_ponderato * quantita_disponibile) + (? * ?)) / (quantita_disponibile + ?)
          ELSE costo_medio_ponderato
        END,
        valore_totale = (quantita_disponibile + ?) * costo_medio_ponderato,
        ultima_movimentazione = CURRENT_TIMESTAMP
    `);

    upsertGiacenza.run(
      committente_id, sku_code, Math.max(0, deltaDisponibile), Math.max(0, deltaRiservata),
      Math.max(0, deltaInTransito), costo_unitario, 
      deltaDisponibile > 0 ? quantita * (costo_unitario || 0) : 0,
      deltaDisponibile, deltaRiservata, deltaInTransito,
      deltaDisponibile, costo_unitario, costo_unitario, quantita, deltaDisponibile,
      deltaDisponibile
    );
  }
}

// Funzione helper per aggiornare giacenze fisiche
async function aggiornaGiacenzeFisiche(movimento: any, db: any) {
  const { sku_code, tipo_movimento, quantita, from_ubicazione_id, to_ubicazione_id } = movimento;

  // Ottieni peso e volume del SKU
  const skuInfo = db.prepare(`
    SELECT peso_kg, volume_cm3 FROM sku_master WHERE sku_code = ?
  `).get(sku_code);

  const peso_totale = (skuInfo?.peso_kg || 0) * quantita;
  const volume_totale = (skuInfo?.volume_cm3 || 0) * quantita;

  // Gestisci movimenti che cambiano ubicazioni fisiche
  if (from_ubicazione_id && ['PICK', 'TRANSFER', 'DISPOSE'].includes(tipo_movimento)) {
    // Rimuovi da ubicazione origine
    const updateFrom = db.prepare(`
      UPDATE giacenze_fisiche 
      SET quantita_totale = quantita_totale - ?,
          peso_totale_kg = peso_totale_kg - ?,
          volume_occupato_cm3 = volume_occupato_cm3 - ?,
          ultima_movimentazione = CURRENT_TIMESTAMP
      WHERE ubicazione_id = ? AND sku_code = ? AND quantita_totale >= ?
    `);
    updateFrom.run(quantita, peso_totale, volume_totale, from_ubicazione_id, sku_code, quantita);
  }

  if (to_ubicazione_id && ['PUT_AWAY', 'TRANSFER', 'REPLENISH'].includes(tipo_movimento)) {
    // Aggiungi a ubicazione destinazione
    const upsertTo = db.prepare(`
      INSERT INTO giacenze_fisiche (
        ubicazione_id, sku_code, quantita_totale, peso_totale_kg, 
        volume_occupato_cm3, ultima_movimentazione
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(ubicazione_id, sku_code) DO UPDATE SET
        quantita_totale = quantita_totale + ?,
        peso_totale_kg = peso_totale_kg + ?,
        volume_occupato_cm3 = volume_occupato_cm3 + ?,
        ultima_movimentazione = CURRENT_TIMESTAMP
    `);
    upsertTo.run(
      to_ubicazione_id, sku_code, quantita, peso_totale, volume_totale,
      quantita, peso_totale, volume_totale
    );
  }
};null as any as Actions;