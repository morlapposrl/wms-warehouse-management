import type { PageServerLoad, Actions } from './$types';
import { udcRepository } from '$lib/server/repositories/udcRepository';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';
import db from '$lib/server/database';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
  try {
    // Filtri dalla query string
    const committente_filter = url.searchParams.get('committente');
    const stato_filter = url.searchParams.get('stato');
    const tipo_filter = url.searchParams.get('tipo');
    const ubicazione_filter = url.searchParams.get('ubicazione');
    const barcode_search = url.searchParams.get('barcode') || '';
    const scadenza_da = url.searchParams.get('scadenza_da');
    const scadenza_a = url.searchParams.get('scadenza_a');

    const filters: any = {};
    if (committente_filter) filters.committente_id = parseInt(committente_filter);
    if (stato_filter) filters.stato = stato_filter;
    if (tipo_filter) filters.tipo_udc = tipo_filter;
    if (ubicazione_filter) filters.ubicazione_id = parseInt(ubicazione_filter);
    if (barcode_search) filters.barcode = barcode_search;

    // Usa il repository esistente più una query aggiuntiva per i dettagli extra
    const udc_list = udcRepository.getAllUDC(filters);
    
    // Aggiungi i dati extra (lotto, scadenza, peso) per ogni UDC con filtro date scadenza
    let udcWithDetails = udc_list.map(udc => {
      const dettagli = db.prepare(`
        SELECT 
          uc.lotto,
          uc.scadenza,
          uc.peso_kg as peso_netto,
          uc.quantita as quantita_contenuto,
          p.codice as prodotto_codice,
          p.descrizione as prodotto_descrizione
        FROM udc_contenuto uc
        LEFT JOIN prodotti p ON uc.prodotto_id = p.id
        WHERE uc.udc_id = ?
        ORDER BY uc.data_inserimento DESC
        LIMIT 1
      `).get(udc.id);
      
      return {
        ...udc,
        // Mapping dei nomi dei campi dal repository
        tipo_udc: udc.tipo_codice,
        peso_max_kg: udc.tipo_peso_max_kg,
        lunghezza_cm: udc.tipo_lunghezza_cm,
        larghezza_cm: udc.tipo_larghezza_cm,
        altezza_max_cm: udc.tipo_altezza_max_cm,
        // Campi aggiuntivi
        lotto: dettagli?.lotto || null,
        scadenza: dettagli?.scadenza || null,
        peso_netto: dettagli?.peso_netto || 0,
        quantita_contenuto: dettagli?.quantita_contenuto || 0,
        prodotto_contenuto: dettagli ? `${dettagli.prodotto_codice} - ${dettagli.prodotto_descrizione}` : null
      };
    });

    // Applica filtro date scadenza se specificato
    if (scadenza_da || scadenza_a) {
      udcWithDetails = udcWithDetails.filter(udc => {
        if (!udc.scadenza) return false;
        
        const scadenzaDate = new Date(udc.scadenza);
        let isValid = true;
        
        if (scadenza_da) {
          const dataDa = new Date(scadenza_da);
          if (scadenzaDate < dataDa) isValid = false;
        }
        
        if (scadenza_a) {
          const dataA = new Date(scadenza_a);
          if (scadenzaDate > dataA) isValid = false;
        }
        
        return isValid;
      });
    }

    // Statistiche UDC
    const statistiche = udcRepository.getStatisticheUDC(filters.committente_id);

    // Liste per filtri
    const committenti = db.prepare(`
      SELECT id, codice, ragione_sociale 
      FROM committenti 
      WHERE stato = 'attivo'
      ORDER BY ragione_sociale
    `).all();

    const ubicazioni = db.prepare(`
      SELECT id, codice_ubicazione, zona, tipo
      FROM ubicazioni 
      WHERE attiva = 1
      ORDER BY zona, codice_ubicazione
    `).all();

    const operatori = db.prepare(`
      SELECT id, nome, cognome
      FROM utenti 
      WHERE ruolo IN ('operatore_magazzino', 'super_admin') 
      AND attivo = 1
      ORDER BY nome, cognome
    `).all();

    // UDC per zona (per dashboard)
    const udc_per_zona = db.prepare(`
      SELECT 
        ub.zona,
        COUNT(u.id) as numero_udc,
        SUM(u.peso_attuale_kg) as peso_totale,
        AVG(u.percentuale_riempimento) as riempimento_medio,
        COUNT(CASE WHEN u.stato = 'PIENO' THEN 1 END) as udc_pieni,
        COUNT(CASE WHEN u.stato = 'VUOTO' THEN 1 END) as udc_vuoti
      FROM udc u
      LEFT JOIN ubicazioni ub ON u.ubicazione_attuale_id = ub.id
      ${committente_filter ? 'WHERE u.committente_proprietario_id = ?' : 'WHERE 1=1'}
      GROUP BY ub.zona
      ORDER BY numero_udc DESC
    `).all(...(committente_filter ? [parseInt(committente_filter)] : []));

    return {
      udc_list: udcWithDetails,
      statistiche,
      committenti,
      ubicazioni,
      operatori,
      udc_per_zona,
      filtri: {
        committente_filter,
        stato_filter,
        tipo_filter,
        ubicazione_filter,
        barcode_search,
        scadenza_da,
        scadenza_a
      }
    };

  } catch (error) {
    console.error('Errore caricamento UDC:', error);
    throw error;
  }
};

export const actions: Actions = {
  createUDC: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const udcData = {
        barcode: formData.get('barcode')?.toString() || '',
        tipo_udc: formData.get('tipo_udc')?.toString() as any,
        stato: 'VUOTO' as const,
        committente_proprietario_id: formData.get('committente_id') ? parseInt(formData.get('committente_id')!.toString()) : undefined,
        ubicazione_attuale_id: formData.get('ubicazione_id') ? parseInt(formData.get('ubicazione_id')!.toString()) : undefined,
        lunghezza_cm: parseInt(formData.get('lunghezza_cm')?.toString() || '120'),
        larghezza_cm: parseInt(formData.get('larghezza_cm')?.toString() || '80'),
        altezza_max_cm: parseInt(formData.get('altezza_max_cm')?.toString() || '180'),
        peso_max_kg: parseFloat(formData.get('peso_max_kg')?.toString() || '1000'),
        operatore_ultimo_movimento: parseInt(formData.get('operatore_id')?.toString() || '1'),
        note: formData.get('note')?.toString(),
        qr_code: formData.get('qr_code')?.toString()
      };

      // Validazioni
      if (!udcData.barcode) {
        return fail(400, {
          error: 'Barcode obbligatorio'
        });
      }

      // Verifica barcode univoco
      const existing = udcRepository.getUDCByBarcode(udcData.barcode);
      if (existing) {
        return fail(400, {
          error: 'Barcode già esistente'
        });
      }

      const udc_id = udcRepository.createUDC(udcData);

      // Log audit per creazione UDC
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'udc',
          operation: 'CREATE',
          description: `Creata nuova UDC: ${udcData.tipo_udc} - ${udcData.barcode}`,
          module: 'UDC',
          functionality: 'create_udc',
          importance: 'ALTA',
          entities_involved: { 
            udc_id: udc_id,
            barcode: udcData.barcode,
            committente_id: udcData.committente_proprietario_id
          },
          data_after: udcData
        });
      }

      // Registra movimento di creazione
      udcRepository.createMovimentoUDC({
        udc_id,
        tipo_movimento: 'CREAZIONE',
        ubicazione_a_id: udcData.ubicazione_attuale_id,
        operatore_id: udcData.operatore_ultimo_movimento!,
        note_movimento: `UDC creato: ${udcData.tipo_udc} - ${udcData.barcode}`,
        durata_secondi: 60
      });

      return {
        success: `UDC ${udcData.barcode} creato con successo`
      };

    } catch (error) {
      console.error('Errore creazione UDC:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  },

  updateUDC: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const udc_id = parseInt(formData.get('udc_id')?.toString() || '0');
      const nuovo_stato = formData.get('nuovo_stato')?.toString();
      const nuova_ubicazione = formData.get('nuova_ubicazione') ? parseInt(formData.get('nuova_ubicazione')!.toString()) : undefined;
      const operatore_id = parseInt(formData.get('operatore_id')?.toString() || '1');
      const note = formData.get('note')?.toString();

      if (!udc_id) {
        return fail(400, { error: 'ID UDC mancante' });
      }

      // Recupera dati precedenti per audit
      const oldUdc = udcRepository.getUDCById(udc_id);
      if (!oldUdc) {
        return fail(404, { error: 'UDC non trovata' });
      }

      const updateData: any = {};
      if (nuovo_stato) updateData.stato = nuovo_stato;
      if (nuova_ubicazione) updateData.ubicazione_attuale_id = nuova_ubicazione;
      if (note !== undefined) updateData.note = note;
      updateData.operatore_ultimo_movimento = operatore_id;

      udcRepository.updateUDC(udc_id, updateData);

      // Log audit per aggiornamento UDC
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'udc',
          operation: 'UPDATE',
          description: `Aggiornata UDC ${oldUdc.barcode}`,
          module: 'UDC',
          functionality: 'update_udc',
          importance: 'ALTA',
          entities_involved: { 
            udc_id: udc_id,
            barcode: oldUdc.barcode
          },
          data_before: {
            stato: oldUdc.stato,
            ubicazione_attuale_id: oldUdc.ubicazione_attuale_id,
            note: oldUdc.note
          },
          data_after: updateData
        });
      }

      // Registra movimento se cambio ubicazione
      if (nuova_ubicazione) {
        const udc = udcRepository.getUDCById(udc_id);
        udcRepository.createMovimentoUDC({
          udc_id,
          tipo_movimento: 'TRASFERIMENTO',
          ubicazione_da_id: udc.ubicazione_attuale_id !== nuova_ubicazione ? udc.ubicazione_attuale_id : undefined,
          ubicazione_a_id: nuova_ubicazione,
          operatore_id,
          note_movimento: `Trasferimento UDC - ${note || 'Spostamento operativo'}`,
          durata_secondi: 120
        });
      }

      return {
        success: 'UDC aggiornato con successo'
      };

    } catch (error) {
      console.error('Errore aggiornamento UDC:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  },

  addContenuto: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const udc_id = parseInt(formData.get('udc_id')?.toString() || '0');
      const prodotto_id = parseInt(formData.get('prodotto_id')?.toString() || '0');
      const quantita = parseInt(formData.get('quantita')?.toString() || '0');
      const lotto = formData.get('lotto')?.toString();
      const posizione = formData.get('posizione_in_udc')?.toString();
      const peso_kg = formData.get('peso_kg') ? parseFloat(formData.get('peso_kg')!.toString()) : undefined;
      const volume_cm3 = formData.get('volume_cm3') ? parseInt(formData.get('volume_cm3')!.toString()) : undefined;
      const operatore_id = parseInt(formData.get('operatore_id')?.toString() || '1');
      const note = formData.get('note_contenuto')?.toString();

      if (!udc_id || !prodotto_id || !quantita) {
        return fail(400, {
          error: 'Dati mancanti per aggiunta contenuto'
        });
      }

      udcRepository.addContenutoUDC({
        udc_id,
        prodotto_id,
        quantita,
        lotto,
        posizione_in_udc: posizione,
        peso_kg,
        volume_cm3,
        operatore_inserimento: operatore_id,
        note_contenuto: note
      });

      // Registra movimento di carico
      udcRepository.createMovimentoUDC({
        udc_id,
        tipo_movimento: 'CARICO',
        operatore_id,
        quantita_movimentata: quantita,
        note_movimento: `Caricamento prodotto ID:${prodotto_id} qty:${quantita} ${lotto ? `lotto:${lotto}` : ''}`,
        durata_secondi: 90
      });

      return {
        success: 'Contenuto aggiunto con successo all\'UDC'
      };

    } catch (error) {
      console.error('Errore aggiunta contenuto UDC:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  },

  removeContenuto: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      
      const udc_id = parseInt(formData.get('udc_id')?.toString() || '0');
      const prodotto_id = parseInt(formData.get('prodotto_id')?.toString() || '0');
      const quantita = formData.get('quantita') ? parseInt(formData.get('quantita')!.toString()) : undefined;
      const operatore_id = parseInt(formData.get('operatore_id')?.toString() || '1');

      if (!udc_id || !prodotto_id) {
        return fail(400, {
          error: 'UDC e Prodotto obbligatori'
        });
      }

      udcRepository.removeContenutoUDC(udc_id, prodotto_id, quantita);

      // Registra movimento di scarico
      udcRepository.createMovimentoUDC({
        udc_id,
        tipo_movimento: 'SCARICO',
        operatore_id,
        quantita_movimentata: quantita || 0,
        note_movimento: `Scaricamento prodotto ID:${prodotto_id} ${quantita ? `qty:${quantita}` : 'completo'}`,
        durata_secondi: 60
      });

      return {
        success: quantita ? 'Quantità rimossa dall\'UDC' : 'Prodotto rimosso completamente dall\'UDC'
      };

    } catch (error) {
      console.error('Errore rimozione contenuto UDC:', error);
      return fail(500, {
        error: 'Errore interno del server'
      });
    }
  }
};