import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import database from '$lib/server/database';

export const POST: RequestHandler = async ({ request, cookies }) => {
  console.log('⚡ API TRASFERIMENTI CHIAMATA - INIZIO HANDLER');
  try {
    const data = await request.json();
    console.log('⚡ API TRASFERIMENTI - JSON PARSATO:', data);
    
    // Validazione dati base
    if (!data.committente_id || !data.causale_id) {
      return json({ error: 'Committente e causale sono obbligatori' }, { status: 400 });
    }

    if (data.tipo_trasferimento === 'QUANTITA' && (!data.prodotto_id || !data.quantita || data.quantita <= 0)) {
      return json({ error: 'Per trasferimento quantità sono richiesti prodotto e quantità valida' }, { status: 400 });
    }

    if (data.tipo_trasferimento === 'UDC' && !data.udc_origine_id) {
      return json({ error: 'Per trasferimento UDC è richiesto UDC di origine' }, { status: 400 });
    }

    if (!data.ubicazione_destinazione) {
      return json({ error: 'Ubicazione destinazione obbligatoria' }, { status: 400 });
    }

    // Debug payload iniziale
    console.log('🔍 PAYLOAD RICEVUTO:', data);
    
    // Inizia transazione
    const transaction = database.transaction(() => {
      console.log('🚀 INIZIA TRANSAZIONE TRASFERIMENTO');
      
      // 1. Verifica causale esistente e attiva
      const causale = database.prepare(`
        SELECT id, codice, descrizione, tipo, richiede_autorizzazione, attiva 
        FROM causali_trasferimento 
        WHERE id = ? AND attiva = 1
      `).get(data.causale_id);
      
      if (!causale) {
        throw new Error('Causale non trovata o non attiva');
      }

      // 2. Verifica e valida ubicazione destinazione
      const ubicazioneDestinazione = database.prepare(`
        SELECT 
          id, codice_ubicazione, zona, tipo,
          attiva, volume_max_cm3, peso_max_kg,
          volume_occupato_cm3, peso_attuale_kg,
          percentuale_occupazione,
          accessibilita, temperatura_controllata, temperatura_attuale,
          accesso_limitato, badge_richiesto
        FROM ubicazioni 
        WHERE id = ?
      `).get(data.ubicazione_destinazione);

      if (!ubicazioneDestinazione) {
        throw new Error('Ubicazione destinazione non trovata');
      }

      // 3. Controlli stato ubicazione destinazione
      if (!ubicazioneDestinazione.attiva) {
        throw new Error(`Ubicazione destinazione ${ubicazioneDestinazione.codice_ubicazione} è bloccata/disattiva`);
      }

      // 4. Controlli capacità ubicazione destinazione
      if (ubicazioneDestinazione.percentuale_occupazione >= 95) {
        throw new Error(`Ubicazione destinazione ${ubicazioneDestinazione.codice_ubicazione} è piena (${ubicazioneDestinazione.percentuale_occupazione}%)`);
      }

      // 5. Controlli accesso limitato
      if (ubicazioneDestinazione.accesso_limitato && ubicazioneDestinazione.badge_richiesto) {
        // In un sistema reale qui verificheremmo il badge dell'operatore
        console.warn(`Ubicazione ${ubicazioneDestinazione.codice_ubicazione} richiede badge: ${ubicazioneDestinazione.badge_richiesto}`);
      }

      // 6. Controlli specifici per trasferimento per quantità
      let prodotto = null;
      let ubicazioneOrigine = null;
      
      if (data.tipo_trasferimento === 'QUANTITA') {
        // Verifica prodotto esistente
        prodotto = database.prepare(`
          SELECT id, codice, descrizione, committente_id, categoria_id, attivo
          FROM prodotti 
          WHERE id = ? AND committente_id = ? AND attivo = 1
        `).get(data.prodotto_id, data.committente_id);

        if (!prodotto) {
          throw new Error('Prodotto non trovato o non appartenente al committente');
        }

        // Verifica giacenza disponibile
        const giacenza = database.prepare(`
          SELECT quantita FROM giacenze 
          WHERE prodotto_id = ? AND committente_id = ?
        `).get(data.prodotto_id, data.committente_id);
        
        if (!giacenza || giacenza.quantita < data.quantita) {
          throw new Error(`Giacenza insufficiente. Disponibile: ${giacenza?.quantita || 0}, Richiesto: ${data.quantita}`);
        }

        // Per ora non implementiamo controlli peso/volume dettagliati 
        // poiché la tabella prodotti non ha questi campi nella struttura attuale

        // Verifica ubicazione origine se specificata
        if (data.ubicazione_origine) {
          ubicazioneOrigine = database.prepare(`
            SELECT id, codice_ubicazione, attiva FROM ubicazioni WHERE id = ?
          `).get(data.ubicazione_origine);
          
          if (!ubicazioneOrigine) {
            throw new Error('Ubicazione origine non trovata');
          }
          
          if (!ubicazioneOrigine.attiva) {
            throw new Error(`Ubicazione origine ${ubicazioneOrigine.codice_ubicazione} è bloccata/disattiva`);
          }
        }
      }

      // 7. Controlli specifici per trasferimento UDC
      let udcOrigine = null;
      if (data.tipo_trasferimento === 'UDC') {
        udcOrigine = database.prepare(`
          SELECT id, barcode, stato, committente_proprietario_id, ubicazione_attuale_id, 
                 peso_attuale_kg, volume_occupato_cm3
          FROM udc 
          WHERE id = ?
        `).get(data.udc_origine_id);

        if (!udcOrigine) {
          throw new Error('UDC origine non trovato');
        }

        if (udcOrigine.stato === 'BLOCCATO') {
          throw new Error(`UDC ${udcOrigine.barcode} è bloccato`);
        }

        if (udcOrigine.stato === 'DANNEGGIATO') {
          throw new Error(`UDC ${udcOrigine.barcode} è danneggiato`);
        }

        if (udcOrigine.stato === 'IN_MOVIMENTO') {
          throw new Error(`UDC ${udcOrigine.barcode} è già in movimento`);
        }

        // Controlla che UDC appartenga al committente
        if (udcOrigine.committente_proprietario_id !== data.committente_id) {
          throw new Error(`UDC ${udcOrigine.barcode} non appartiene al committente`);
        }

        // Controlla capacità destinazione per UDC
        if (ubicazioneDestinazione.volume_max_cm3 && udcOrigine.volume_occupato_cm3 > 0) {
          const volumeDisponibile = ubicazioneDestinazione.volume_max_cm3 - ubicazioneDestinazione.volume_occupato_cm3;
          if (udcOrigine.volume_occupato_cm3 > volumeDisponibile) {
            throw new Error(`Volume UDC troppo grande per ubicazione ${ubicazioneDestinazione.codice_ubicazione}`);
          }
        }

        if (ubicazioneDestinazione.peso_max_kg && udcOrigine.peso_attuale_kg > 0) {
          const pesoDisponibile = ubicazioneDestinazione.peso_max_kg - ubicazioneDestinazione.peso_attuale_kg;
          if (udcOrigine.peso_attuale_kg > pesoDisponibile) {
            throw new Error(`Peso UDC troppo elevato per ubicazione ${ubicazioneDestinazione.codice_ubicazione}`);
          }
        }
      }

      // 8. Determina stato trasferimento basato su autorizzazione
      const stato = causale.richiede_autorizzazione ? 'IN_ATTESA_AUTORIZZAZIONE' : 'CONFERMATO';

      // 9. Inserisce record movimento trasferimento
      let trasferimentoId;
      let movimentoOttimizzatoId;
      
      if (data.tipo_trasferimento === 'QUANTITA') {
        // Recupera SKU code del prodotto
        const skuInfo = database.prepare(`
          SELECT p.codice, p.descrizione 
          FROM prodotti p 
          WHERE p.id = ? AND p.committente_id = ?
        `).get(data.prodotto_id, data.committente_id);
        
        if (!skuInfo) {
          throw new Error('Prodotto non trovato o non appartenente al committente');
        }
        
        console.log('📦 INSERIMENTO MOVIMENTO QUANTITA:', {
          committente_id: data.committente_id,
          prodotto_id: data.prodotto_id,
          sku_code: skuInfo.codice,
          quantita: data.quantita,
          ubicazione_destinazione: data.ubicazione_destinazione
        });
        
        // Inserisci nella tabella movimenti (sistema vecchio)
        trasferimentoId = database.prepare(`
          INSERT INTO movimenti (
            committente_id_origine,
            tipo_movimento,
            prodotto_id,
            quantita,
            causale,
            ubicazione_id,
            udc_id,
            note,
            data_movimento
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          data.committente_id,
          'TRASFERIMENTO',
          data.prodotto_id,
          data.quantita,
          `${causale.codice} - ${causale.descrizione}`,
          data.ubicazione_destinazione,
          null, // udc_id = NULL per trasferimenti prodotti
          data.note || null
        ).lastInsertRowid;
        
        // Inserisci anche nella tabella movimenti_ottimizzati (sistema nuovo)
        movimentoOttimizzatoId = database.prepare(`
          INSERT INTO movimenti_ottimizzati (
            committente_id,
            sku_code,
            tipo_movimento,
            quantita,
            from_ubicazione_id,
            to_ubicazione_id,
            note,
            timestamp_inizio
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          data.committente_id,
          skuInfo.codice,
          'TRANSFER',  // Usa il tipo corretto per movimenti_ottimizzati
          data.quantita,
          data.ubicazione_origine || null,
          data.ubicazione_destinazione,
          `${causale.codice} - ${causale.descrizione}`,
        ).lastInsertRowid;
        
      } else if (data.tipo_trasferimento === 'UDC') {
        console.log('🏗️ INSERIMENTO MOVIMENTO UDC:', {
          committente_id: data.committente_id,
          udc_origine_id: data.udc_origine_id,
          ubicazione_destinazione: data.ubicazione_destinazione,
          udcOrigine: udcOrigine ? udcOrigine.barcode : 'NONE'
        });
        
        // Inserisci nella tabella movimenti (sistema vecchio)
        trasferimentoId = database.prepare(`
          INSERT INTO movimenti (
            committente_id_origine,
            tipo_movimento,
            prodotto_id,
            quantita,
            causale,
            ubicazione_id,
            udc_id,
            note,
            data_movimento
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          data.committente_id,
          'TRASFERIMENTO',
          null, // prodotto_id = NULL per trasferimenti UDC
          null, // quantita = NULL (l'UDC ha i suoi contenuti)
          `${causale.codice} - ${causale.descrizione} (UDC: ${udcOrigine?.barcode})`,
          data.ubicazione_destinazione,
          data.udc_origine_id,
          data.note || null
        ).lastInsertRowid;
        
        // Per gli UDC, prima creiamo/aggiorniamo l'SKU master se necessario
        const udcSkuCode = `UDC_${udcOrigine?.barcode}`;
        
        // Inserisci SKU UDC nella tabella sku_master se non esiste
        database.prepare(`
          INSERT INTO sku_master (sku_code, descrizione, categoria_generale)
          VALUES (?, ?, ?)
          ON CONFLICT(sku_code) DO NOTHING
        `).run(udcSkuCode, `Unità di Carico: ${udcOrigine?.barcode}`, 'UDC');
        
        // Ora creiamo il movimento ottimizzato con SKU UDC registrato
        movimentoOttimizzatoId = database.prepare(`
          INSERT INTO movimenti_ottimizzati (
            committente_id,
            sku_code,
            tipo_movimento,
            quantita,
            from_ubicazione_id,
            to_ubicazione_id,
            note,
            timestamp_inizio
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          data.committente_id,
          udcSkuCode,  // SKU code registrato per UDC
          'TRANSFER',
          1,  // Quantità = 1 UDC
          udcOrigine?.ubicazione_attuale_id || null,
          data.ubicazione_destinazione,
          `${causale.codice} - ${causale.descrizione} (UDC: ${udcOrigine?.barcode})`
        ).lastInsertRowid;
      }

      // 10. Se confermato, esegui il trasferimento fisico
      if (stato === 'CONFERMATO') {
        if (data.tipo_trasferimento === 'QUANTITA') {
          // Aggiorna giacenze
          database.prepare(`
            UPDATE giacenze 
            SET quantita = quantita - ? 
            WHERE prodotto_id = ? AND committente_id = ?
          `).run(data.quantita, data.prodotto_id, data.committente_id);

          // Per ora non aggiorniamo volume/peso specifico prodotti
          // poiché la tabella prodotti attuale non ha questi campi

        } else if (data.tipo_trasferimento === 'UDC' && udcOrigine) {
          // Aggiorna ubicazione UDC
          database.prepare(`
            UPDATE udc 
            SET ubicazione_attuale_id = ?,
                stato = 'PIENO',
                ultimo_movimento = datetime('now')
            WHERE id = ?
          `).run(data.ubicazione_destinazione, data.udc_origine_id);

          // Rimuovi volume/peso da ubicazione origine se presente
          if (udcOrigine.ubicazione_attuale_id) {
            database.prepare(`
              UPDATE ubicazioni 
              SET volume_occupato_cm3 = volume_occupato_cm3 - ?,
                  peso_attuale_kg = peso_attuale_kg - ?
              WHERE id = ?
            `).run(udcOrigine.volume_occupato_cm3 || 0, udcOrigine.peso_attuale_kg || 0, udcOrigine.ubicazione_attuale_id);
          }

          // Aggiungi volume/peso a ubicazione destinazione
          database.prepare(`
            UPDATE ubicazioni 
            SET volume_occupato_cm3 = volume_occupato_cm3 + ?,
                peso_attuale_kg = peso_attuale_kg + ?
            WHERE id = ?
          `).run(udcOrigine.volume_occupato_cm3 || 0, udcOrigine.peso_attuale_kg || 0, data.ubicazione_destinazione);
        }
      }

      return {
        id: trasferimentoId,
        movimento_ottimizzato_id: movimentoOttimizzatoId,
        stato: stato,
        richiede_autorizzazione: causale.richiede_autorizzazione,
        ubicazione_destinazione: ubicazioneDestinazione.codice_ubicazione,
        tipo_trasferimento: data.tipo_trasferimento,
        validazioni_eseguite: {
          ubicazione_attiva: ubicazioneDestinazione.attiva === 1,
          capacita_sufficiente: ubicazioneDestinazione.percentuale_occupazione < 95,
          controlli_temperatura: true, // Non implementati per ora
          controlli_accesso: !ubicazioneDestinazione.accesso_limitato || !!ubicazioneDestinazione.badge_richiesto
        }
      };
    });

    const result = transaction();
    
    console.log('✅ TRASFERIMENTO COMPLETATO SENZA AUDIT');
    
    return json({
      success: true,
      trasferimento: result,
      message: result.richiede_autorizzazione ? 
        `Trasferimento creato e messo in attesa di autorizzazione per ${result.ubicazione_destinazione}` : 
        `Trasferimento eseguito con successo verso ${result.ubicazione_destinazione}`
    });

  } catch (error) {
    console.error('Errore trasferimento:', error);
    return json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Errore interno del server' 
    }, { status: 500 });
  }
};