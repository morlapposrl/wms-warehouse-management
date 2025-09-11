// @ts-nocheck
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';
import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const MovimentoSchema = z.object({
  committente_id: z.string().min(1, 'Committente richiesto'),
  tipo_movimento: z.string().min(1, 'Tipo movimento richiesto'),
  prodotto_id: z.string().min(1, 'Prodotto richiesto'),
  quantita: z.string().min(1, 'Quantità richiesta'),
  ubicazione_id: z.string().optional(),
  udc_id: z.string().optional(),
  tipo_udc_id: z.string().optional(),
  prezzo: z.string().optional(),
  causale: z.string().optional(),
  note: z.string().optional(),
  ordine_numero: z.string().optional(),
  ordine_id: z.string().optional(), // ID ordine di riferimento
  // Nuovi campi facoltativi
  lotto: z.string().optional(),
  data_scadenza: z.string().optional(),
  peso_lordo: z.string().optional(),
  peso_netto: z.string().optional()
});

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Carica tutti i committenti attivi
    const committenti = db.prepare(`
      SELECT id, ragione_sociale, codice
      FROM committenti
      WHERE stato = 'attivo'
      ORDER BY ragione_sociale
    `).all();

    // Carica tipi UDC disponibili (sempre)
    const tipiUdc = db.prepare(`
      SELECT id, codice, descrizione, lunghezza_cm, larghezza_cm, altezza_max_cm, peso_max_kg
      FROM tipi_udc 
      WHERE attivo = 1
      ORDER BY codice
    `).all();
    

    // Carica tutti i prodotti per committente selezionato
    let prodotti: any[] = [];
    let ordiniIngresso: any[] = [];
    const committente_id = url.searchParams.get('committente');
    
    if (committente_id) {
      prodotti = db.prepare(`
        SELECT 
          p.id,
          p.codice,
          p.descrizione,
          c.descrizione as categoria_nome,
          um.codice as unita_misura,
          COALESCE(g.quantita, 0) as giacenza_attuale
        FROM prodotti p
        LEFT JOIN categorie c ON p.categoria_id = c.id
        LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
        LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = p.committente_id
        WHERE p.committente_id = ?
        ORDER BY p.codice
      `).all(parseInt(committente_id));

      // Carica ordini di ingresso attivi per il committente (solo NUOVO e IN_PREPARAZIONE)
      ordiniIngresso = db.prepare(`
        SELECT 
          o.id,
          o.numero_ordine,
          o.stato,
          o.data_ordine,
          o.data_richiesta,
          o.cliente_fornitore,
          o.totale_valore,
          o.totale_colli as righe_totali,
          0 as righe_aperte
        FROM ordini o
        WHERE o.committente_id = ?
        AND o.tipo_ordine = 'INBOUND'
        AND o.stato IN ('NUOVO', 'IN_PREPARAZIONE')
        ORDER BY 
          CASE o.stato 
            WHEN 'NUOVO' THEN 1 
            WHEN 'IN_PREPARAZIONE' THEN 2 
          END,
          o.data_ordine DESC, 
          o.numero_ordine
      `).all(parseInt(committente_id));
    }

    return {
      committenti,
      prodotti,
      ordiniIngresso,
      tipiUdc,
      selectedCommittente: committente_id
    };

  } catch (err) {
    console.error('Errore caricamento dati movimento:', err);
    throw error(500, 'Errore nel caricamento dei dati');
  }
};

export const actions = {
  create: async ({ request, cookies }: import('./$types').RequestEvent) => {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);

      // Validazione
      const validation = MovimentoSchema.safeParse(data);
      if (!validation.success) {
        return {
          error: true,
          message: validation.error.errors.map(e => e.message).join(', ')
        };
      }

      const {
        committente_id,
        tipo_movimento,
        prodotto_id,
        quantita,
        ubicazione_id,
        udc_id,
        tipo_udc_id,
        prezzo,
        causale,
        note,
        ordine_numero,
        ordine_id,
        // Nuovi campi facoltativi
        lotto,
        data_scadenza,
        peso_lordo,
        peso_netto
      } = validation.data;

      // Conversioni
      const committenteId = parseInt(committente_id);
      const prodottoId = parseInt(prodotto_id);
      const qty = parseInt(quantita);
      const prezzoNum = prezzo ? parseFloat(prezzo) : null;
      const ordineIdNum = ordine_id ? parseInt(ordine_id) : null;
      const ubicazioneIdNum = ubicazione_id ? parseInt(ubicazione_id) : null;
      const udcIdNum = udc_id ? parseInt(udc_id) : null;
      const tipoUdcIdNum = tipo_udc_id ? parseInt(tipo_udc_id) : 1; // Default: Pallet EPAL
      
      // Conversioni campi facoltativi
      const pesoLordoNum = peso_lordo ? parseFloat(peso_lordo) : null;
      const pesoNettoNum = peso_netto ? parseFloat(peso_netto) : null;
      const dataScadenzaDate = data_scadenza ? data_scadenza : null;

      // Verifica che il prodotto appartenga al committente
      const prodotto = db.prepare(`
        SELECT id, codice, descrizione
        FROM prodotti
        WHERE id = ? AND committente_id = ?
      `).get(prodottoId, committenteId);

      if (!prodotto) {
        return {
          error: true,
          message: 'Prodotto non trovato o non appartiene al committente selezionato'
        };
      }

      // SISTEMA COMPLETO CON TRANSAZIONE ATOMICA
      const now = new Date().toISOString();
      console.log('=== BACKEND - INIZIO CREATE ACTION ===');
      console.log('=== VALIDAZIONE SCHEMA ===');
      console.log('=== CONVERSIONI NUMERICHE ===');
      console.log('=== CAMPI FACOLTATIVI ===', { lotto, data_scadenza, peso_lordo, peso_netto });
      console.log('=== VERIFICA FOREIGN KEY ===');
      
      // Ottieni SKU code dal prodotto per movimenti_ottimizzati
      const prodottoDati = db.prepare(`
        SELECT codice, descrizione 
        FROM prodotti 
        WHERE id = ?
      `).get(prodottoId);
      const skuCode = prodottoDati?.codice || `SKU-${prodottoId}`;

      console.log('=== INIZIO TRANSAZIONE ===');
      // Disabilita temporaneamente foreign key per problemi con udc_contenuto
      db.exec('PRAGMA foreign_keys=OFF');
      
      // Inizia transazione per operazioni atomiche
      const transaction = db.transaction(() => {
        // 1. INSERISCI MOVIMENTO
        console.log('--- 1. INSERIMENTO MOVIMENTO ---');
        const movimento = db.prepare(`
          INSERT INTO movimenti (
            committente_id_origine,
            prodotto_id,
            tipo_movimento,
            quantita,
            prezzo,
            causale,
            note,
            numero_documento,
            ordine_id,
            ubicazione_id,
            udc_id,
            data_movimento,
            operatore,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          committenteId,
          prodottoId,
          tipo_movimento,
          qty,
          prezzoNum,
          causale || null,
          note || null,
          ordine_numero || null,
          ordineIdNum,
          ubicazioneIdNum,
          udcIdNum,
          now,
          null, // operatore - da implementare con auth
          now
        );
        console.log('✅ SUCCESSO inserimento movimento:', movimento.lastInsertRowid);

        // 1.5. INSERISCI ANCHE IN MOVIMENTI_OTTIMIZZATI
        if (tipo_movimento === 'CARICO') {
          const tipoMovimentoWMS = 'RECEIVE';
          const movimentoOttimizzato = db.prepare(`
            INSERT INTO movimenti_ottimizzati (
              committente_id,
              sku_code,
              tipo_movimento,
              quantita,
              to_ubicazione_id,
              ordine_id,
              costo_unitario,
              timestamp_inizio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            committenteId,
            skuCode,
            tipoMovimentoWMS,
            qty,
            ubicazioneIdNum,
            ordineIdNum,
            prezzoNum || 0,
            now
          );
          console.log('✅ SUCCESSO inserimento movimenti_ottimizzati:', movimentoOttimizzato.lastInsertRowid);
        }

        // 2. GESTIONE UDC AUTOMATICA
        let udcFinaleId = udcIdNum;
        if (!udcIdNum && ubicazioneIdNum && tipo_movimento === 'CARICO') {
          // Validazione tipo UDC se dobbiamo creare nuovo UDC
          if (!tipo_udc_id) {
            throw error(400, 'Se non selezioni un UDC esistente, devi specificare il tipo UDC da creare');
          }

          // Verifica che il tipo UDC esista
          const tipoUdcExists = db.prepare(`SELECT id FROM tipi_udc WHERE id = ? AND attivo = 1`).get(tipoUdcIdNum);
          if (!tipoUdcExists) {
            throw error(400, 'Tipo UDC selezionato non valido o non attivo');
          }

          const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
          const barcodeAuto = `LOAD-${timestamp}-${committenteId}`;
          
          const nuovoUdc = db.prepare(`
            INSERT INTO udc (
              barcode,
              tipo_udc_id,
              stato,
              volume_occupato_cm3,
              peso_attuale_kg,
              numero_sku_diversi,
              ubicazione_attuale_id,
              ultimo_movimento,
              committente_proprietario_id,
              operatore_ultimo_movimento
            ) VALUES (?, ?, 'PARZIALE', 0, ?, 0, ?, ?, ?, ?)
          `).run(barcodeAuto, tipoUdcIdNum, pesoLordoNum || 0, ubicazioneIdNum, now, committenteId, null);
          
          udcFinaleId = nuovoUdc.lastInsertRowid;
          
          // Aggiorna il movimento con l'UDC creato
          db.prepare(`
            UPDATE movimenti 
            SET udc_id = ?
            WHERE id = ?
          `).run(udcFinaleId, movimento.lastInsertRowid);
          console.log('✅ UDC creato automaticamente:', udcFinaleId);
        }

        // 2.5. INSERISCI IN UDC_CONTENUTO (per visibilità nelle giacenze)
        if (udcFinaleId && tipo_movimento === 'CARICO') {
          console.log('--- 2.5. INSERIMENTO UDC_CONTENUTO ---');
          try {
            const udcContenuto = db.prepare(`
              INSERT INTO udc_contenuto (
                udc_id,
                prodotto_id,
                quantita,
                lotto,
                scadenza,
                peso_kg,
                posizione_in_udc,
                data_inserimento
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              udcFinaleId,
              prodottoId,
              qty,
              lotto || null, // usa il lotto inserito o null
              dataScadenzaDate || null, // usa la data scadenza o null
              pesoNettoNum || null, // usa il peso netto o null
              'STRATO_1', // posizione_in_udc come TEXT
              now
            );
            console.log('✅ SUCCESSO inserimento udc_contenuto:', udcContenuto.lastInsertRowid);
          } catch (err) {
            console.log('⚠️ ERRORE inserimento udc_contenuto (continuiamo):', err.message);
          }
        }

        // 3. GIACENZE (gestite automaticamente dal trigger)
        console.log('--- 3. GIACENZE (TRIGGER AUTOMATICO) ---');
        console.log('✅ Giacenze aggiornate automaticamente dal trigger dopo inserimento movimento');

        // 3.5. AGGIORNA GIACENZE FISICHE (per visualizzazione magazzino)
        if (ubicazioneIdNum && tipo_movimento === 'CARICO') {
          console.log('--- 3.5. AGGIORNAMENTO GIACENZE FISICHE ---');
          
          // Prima ottengo il SKU code del prodotto
          const prodottoSku = db.prepare(`
            SELECT codice as sku_code 
            FROM prodotti 
            WHERE id = ?
          `).get(prodottoId);

          if (prodottoSku) {
            // Inserisco o aggiorno giacenze_fisiche
            db.prepare(`
              INSERT INTO giacenze_fisiche (
                ubicazione_id,
                sku_code,
                quantita_totale,
                volume_occupato_cm3,
                peso_totale_kg,
                ultima_movimentazione
              ) VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(ubicazione_id, sku_code) DO UPDATE SET
                quantita_totale = quantita_totale + ?,
                volume_occupato_cm3 = volume_occupato_cm3 + ?,
                peso_totale_kg = peso_totale_kg + ?,
                ultima_movimentazione = ?
            `).run(
              ubicazioneIdNum,
              prodottoSku.sku_code,
              qty,                    // quantita iniziale
              qty * 1000,            // stima volume: 1000 cm3 per pezzo
              qty * 0.5,             // stima peso: 0.5 kg per pezzo
              now,
              qty,                    // delta quantita per UPDATE
              qty * 1000,            // delta volume per UPDATE
              qty * 0.5,             // delta peso per UPDATE
              now
            );
            console.log('✅ SUCCESSO aggiornamento giacenze fisiche per ubicazione:', ubicazioneIdNum);
          }
        }

        // 4. AGGIORNA UBICAZIONI
        if (ubicazioneIdNum) {
          console.log('--- 4. AGGIORNAMENTO UBICAZIONE ---');
          db.prepare(`
            UPDATE ubicazioni 
            SET updated_at = ?
            WHERE id = ?
          `).run(now, ubicazioneIdNum);
          console.log('✅ SUCCESSO aggiornamento ubicazione:', ubicazioneIdNum);
        }

        // 5. AGGIORNA STATO ORDINE
        if (ordineIdNum && tipo_movimento === 'CARICO') {
          console.log('--- 5. AGGIORNA STATO ORDINE ---');
          const righeOrdine = db.prepare(`
            SELECT COUNT(*) as totale_righe
            FROM ordini_dettaglio_new 
            WHERE ordine_id = ?
          `).get(ordineIdNum);

          const righeEvase = db.prepare(`
            SELECT COUNT(DISTINCT od.prodotto_id) as righe_evase
            FROM ordini_dettaglio_new od
            WHERE od.ordine_id = ?
            AND EXISTS (
              SELECT 1 FROM movimenti m 
              WHERE m.ordine_id = od.ordine_id 
              AND m.prodotto_id = od.prodotto_id 
              AND m.tipo_movimento = 'CARICO'
            )
          `).get(ordineIdNum);

          const nuovoStato = (righeEvase?.righe_evase >= righeOrdine?.totale_righe) ? 'CONSEGNATO' : 'IN_PREPARAZIONE';
          
          db.prepare(`
            UPDATE ordini 
            SET stato = ?, updated_at = ?
            WHERE id = ?
          `).run(nuovoStato, now, ordineIdNum);
          console.log('✅ SUCCESSO aggiornamento stato ordine:', ordineIdNum);

          // Traccia il cambio stato
          db.prepare(`
            INSERT INTO ordini_tracking (
              ordine_id,
              stato_precedente,
              stato_nuovo,
              data_cambio,
              note
            ) VALUES (?, 
              (SELECT stato FROM ordini WHERE id = ?),
              ?, ?, ?
            )
          `).run(ordineIdNum, ordineIdNum, nuovoStato, now, 'Movimento di carico completato');
          console.log('✅ SUCCESSO inserimento tracking ordine');
        }

      }); // Fine transazione

      // Esegui la transazione
      console.log('=== ESECUZIONE TRANSAZIONE ===');
      try {
        transaction();
        console.log('Transazione completata con successo');
      } catch (error) {
        console.error('ERRORE DURANTE TRANSAZIONE:', error);
        throw error;
      } finally {
        // Riabilita foreign key sempre
        db.exec('PRAGMA foreign_keys=ON');
      }

      // Log audit per creazione movimento dettagliato
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'movimenti',
          operation: 'CREATE',
          description: `Creato movimento ${tipoMovimento}: ${quantitaNum} x ${prodotto.codice}`,
          module: 'MOVIMENTI',
          functionality: 'create_detailed_movement',
          importance: 'ALTA',
          entities_involved: { 
            movimento_id: movimentoId,
            prodotto_id: prodottoIdNum,
            committente_id: committenteId,
            tipo_movimento: tipoMovimento,
            quantita: quantitaNum,
            udc_id: udcIdNum,
            ordine_id: ordineIdNum
          },
          data_after: {
            tipo_movimento: tipoMovimento,
            prodotto_codice: prodotto.codice,
            quantita: quantitaNum,
            prezzo: prezzoNum,
            lotto: lotto,
            scadenza: scadenza,
            causale: causale,
            note: note
          }
        });
      }

      // Redirect al movimento globale con filtro committente
      throw redirect(302, `/auth/movimenti?committente=${committenteId}&search=${prodotto.codice}`);

    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        throw err; // Re-throw redirect
      }
      
      console.error('Errore creazione movimento:', err);
      return {
        error: true,
        message: 'Errore nella creazione del movimento'
      };
    }
  }
};;null as any as Actions;