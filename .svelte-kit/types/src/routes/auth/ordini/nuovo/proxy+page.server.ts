// @ts-nocheck
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { createAuditTracker } from '$lib/server/middleware/auditMiddleware';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';
import { fornitoriRepository } from '$lib/server/repositories/fornitoriRepository';
import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Carica tutti i committenti
    const committenti = db.prepare(`
      SELECT id, codice, ragione_sociale
      FROM committenti
      ORDER BY ragione_sociale
    `).all();

    const committente_id = parseInt(url.searchParams.get('committente') || '1');
    
    // Carica prodotti per il committente selezionato
    const prodotti = db.prepare(`
      SELECT
        p.id,
        p.codice,
        p.descrizione,
        p.prezzo_vendita,
        c.descrizione as categoria,
        um.descrizione as unita_misura
      FROM prodotti p
      LEFT JOIN categorie c ON p.categoria_id = c.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      WHERE p.committente_id = ? AND p.attivo = 1
      ORDER BY p.descrizione
    `).all(committente_id);

    // Carica clienti già usati negli ordini per questo committente
    const clienti = db.prepare(`
      SELECT DISTINCT cliente_fornitore
      FROM ordini
      WHERE committente_id = ? AND cliente_fornitore IS NOT NULL AND cliente_fornitore != ''
      ORDER BY cliente_fornitore
    `).all(committente_id).map(row => row.cliente_fornitore);

    // Carica fornitori disponibili per questo committente:
    // 1. Fornitori specifici del committente
    // 2. Fornitori senza nessun committente (globali)
    const fornitori = db.prepare(`
      SELECT DISTINCT
        f.id,
        f.ragione_sociale,
        f.email,
        f.telefono,
        CASE 
          WHEN cf.committente_id = ? THEN 'specifico'
          WHEN cf.committente_id IS NULL THEN 'globale'
          ELSE 'altro'
        END as tipo_fornitore
      FROM fornitori f
      LEFT JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      WHERE cf.committente_id = ? OR f.id NOT IN (
        SELECT DISTINCT fornitore_id 
        FROM committenti_fornitori 
        WHERE fornitore_id IS NOT NULL
      )
      ORDER BY 
        CASE WHEN cf.committente_id = ? THEN 1 ELSE 2 END,
        f.ragione_sociale
    `).all(committente_id, committente_id, committente_id);

    // Carica tutti i fornitori per il filtro dinamico (mantenuto per compatibilità)
    const tutti_fornitori = db.prepare(`
      SELECT DISTINCT
        f.id,
        f.ragione_sociale,
        f.email,
        f.telefono,
        COALESCE(GROUP_CONCAT(cf.committente_id), '') as committenti_ids
      FROM fornitori f
      LEFT JOIN committenti_fornitori cf ON f.id = cf.fornitore_id
      GROUP BY f.id, f.ragione_sociale, f.email, f.telefono
      ORDER BY f.ragione_sociale
    `).all();

    // Info committente
    const committente = db.prepare(`
      SELECT
        id,
        codice,
        ragione_sociale
      FROM committenti
      WHERE id = ? AND stato = 'attivo'
    `).get(committente_id);

    if (!committente) {
      throw error(404, 'Committente non trovato');
    }

    // Carica dati del magazzino per precompilazione ordini INBOUND
    const magazzino = db.prepare(`
      SELECT 
        nome,
        indirizzo,
        citta,
        cap
      FROM magazzini 
      WHERE id = 1 AND attivo = 1
    `).get();

    return {
      committenti,
      committente,
      prodotti,
      fornitori,
      tutti_fornitori,
      clienti,
      magazzino
    };
  } catch (err) {
    console.error('Errore caricamento form ordine:', err);
    throw error(500, 'Errore nel caricamento del form');
  }
};

export const actions = {
  default: async ({ request, url, cookies }: import('./$types').RequestEvent) => {
    console.log('🎯 SERVER: Ricevuta richiesta POST per creare ordine');
    let ordine_id;
    let committente_id;
    
    
    try {
      const formData = await request.formData();
      console.log('📋 SERVER: Dati form ricevuti:', Object.fromEntries(formData.entries()));
      committente_id = parseInt(formData.get('committente_id')?.toString() || '1');
      
      // Dati ordine principale
      const numero_ordine = formData.get('numero_ordine')?.toString() || '';
      const tipo_ordine = formData.get('tipo_ordine')?.toString() || 'OUTBOUND';
      const cliente_fornitore = formData.get('cliente_fornitore')?.toString() || '';
      const modalita_cliente = formData.get('modalita_cliente')?.toString() || 'esistente';
      const data_richiesta = formData.get('data_richiesta')?.toString() || null;
      const indirizzo_destinazione = formData.get('indirizzo_destinazione')?.toString() || '';
      const contatti_destinazione = formData.get('contatti_destinazione')?.toString() || '';
      const note_spedizione = formData.get('note_spedizione')?.toString() || '';

      // Validazioni base
      if (!numero_ordine || !cliente_fornitore) {
        return fail(400, {
          error: 'Numero ordine e cliente/fornitore sono obbligatori'
        });
      }

      // Controlla unicità numero ordine per committente
      const existing = db.prepare(`
        SELECT id FROM ordini 
        WHERE committente_id = ? AND numero_ordine = ?
      `).get(committente_id, numero_ordine);

      if (existing) {
        return fail(400, {
          error: 'Numero ordine già esistente per questo committente'
        });
      }

      // Crea automaticamente fornitore/cliente se necessario
      if (modalita_cliente === 'nuovo') {
        try {
          console.log(`📝 Creazione automatica ${tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'}:`, cliente_fornitore);
          
          // Verifica se esiste già un fornitore con questa ragione sociale
          const fornitoreEsistente = db.prepare(`
            SELECT * FROM fornitori 
            WHERE ragione_sociale = ?
          `).get(cliente_fornitore);
          
          if (fornitoreEsistente) {
            console.log(`ℹ️ ${tipo_ordine === 'INBOUND' ? 'Fornitore' : 'Cliente'} già esistente:`, fornitoreEsistente.id);
            
            // Verifica se è già associato al committente
            const associazioneEsistente = db.prepare(`
              SELECT * FROM committenti_fornitori 
              WHERE committente_id = ? AND fornitore_id = ?
            `).get(committente_id, fornitoreEsistente.id);
            
            if (!associazioneEsistente) {
              // Associa al committente se non già associato
              fornitoriRepository.associateToCommittente(fornitoreEsistente.id, committente_id, {
                attivo: true,
                condizioni_specifiche: `Associato automaticamente da ordine ${numero_ordine}`
              });
              console.log(`✅ ${tipo_ordine === 'INBOUND' ? 'Fornitore' : 'Cliente'} esistente associato al committente`);
            }
          } else {
            // Non esiste, crealo
            console.log(`📝 Creazione nuovo ${tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'}`);
            
            // Genera codice automatico
            const codice_auto = `${tipo_ordine === 'INBOUND' ? 'FOR' : 'CLI'}-${Date.now().toString().slice(-6)}`;
            
            // Parse contatti per estrarre telefono ed email se possibile
            let telefono_parsed = '';
            let email_parsed = '';
            if (contatti_destinazione) {
              // Cerca pattern email
              const emailMatch = contatti_destinazione.match(/[\w.-]+@[\w.-]+\.\w+/);
              if (emailMatch) {
                email_parsed = emailMatch[0];
              }
              // Cerca pattern telefono (numeri, +, spazi, -, /)
              const phoneMatch = contatti_destinazione.match(/[\+]?[\d\s\-\/\(\)]{6,}/);
              if (phoneMatch) {
                telefono_parsed = phoneMatch[0].trim();
              }
              // Se non trova pattern specifici, usa tutto come telefono
              if (!telefono_parsed && !email_parsed) {
                telefono_parsed = contatti_destinazione;
              }
            }

            // Parse indirizzo per estrarre città e CAP se possibile
            let indirizzo_parsed = indirizzo_destinazione || '';
            let cap_parsed = '';
            let citta_parsed = '';
            if (indirizzo_destinazione) {
              // Cerca CAP (5 cifre)
              const capMatch = indirizzo_destinazione.match(/\b\d{5}\b/);
              if (capMatch) {
                cap_parsed = capMatch[0];
                // Rimuovi CAP dall'indirizzo e prendi quello che segue come città
                const parts = indirizzo_destinazione.split(cap_parsed);
                if (parts.length > 1) {
                  citta_parsed = parts[1].trim().split(' ')[0]; // Prima parola dopo CAP
                  indirizzo_parsed = parts[0].trim(); // Parte prima del CAP
                }
              }
            }

            // Crea il fornitore (vale anche per clienti, usiamo la stessa tabella)
            const nuovoFornitore = fornitoriRepository.create({
              codice: codice_auto,
              ragione_sociale: cliente_fornitore,
              indirizzo: indirizzo_parsed || undefined,
              cap: cap_parsed || undefined,
              citta: citta_parsed || undefined,
              telefono: telefono_parsed || undefined,
              email: email_parsed || undefined,
            });
            
            // Associa automaticamente al committente
            fornitoriRepository.associateToCommittente(nuovoFornitore.id!, committente_id, {
              attivo: true,
              condizioni_specifiche: `Creato automaticamente da ordine ${numero_ordine}${note_spedizione ? '\nNote: ' + note_spedizione : ''}`
            });
            
            console.log(`✅ ${tipo_ordine === 'INBOUND' ? 'Fornitore' : 'Cliente'} creato con ID:`, nuovoFornitore.id);
            
            // Log audit per creazione fornitore/cliente
            const tracker = createAuditTrackerForAction(request, cookies);
            if (tracker) {
              await tracker.logOperation({
                table: 'fornitori',
                operation: 'CREATE',
                description: `Creato automaticamente ${tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'} "${cliente_fornitore}" da ordine ${numero_ordine}`,
                module: 'FORNITORI',
                functionality: 'auto_create_from_order',
                importance: 'MEDIA',
                entities_involved: { 
                  fornitore_id: nuovoFornitore.id,
                  committente_id: committente_id,
                  ordine_numero: numero_ordine,
                  codice_generato: codice_auto
                },
                data_after: {
                  codice: codice_auto,
                  ragione_sociale: cliente_fornitore,
                  indirizzo: indirizzo_destinazione,
                  telefono: contatti_destinazione,
                  note_spedizione: note_spedizione,
                  associato_a_committente: committente_id
                }
              });
            }
          }
          
        } catch (error) {
          console.error(`❌ Errore creazione ${tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'}:`, error);
          return fail(500, {
            error: `Errore nella creazione automatica del ${tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'}`
          });
        }
      }

      // Raccogli righe ordine
      const righe: Array<{
        prodotto_id: number;
        quantita: number;
        prezzo_unitario: number;
        note_riga?: string;
      }> = [];

      let totale_colli = 0;
      let totale_valore = 0;

      // Processa le righe ordine dal form
      let i = 0;
      while (formData.has(`riga_${i}_prodotto_id`)) {
        const prodotto_id = parseInt(formData.get(`riga_${i}_prodotto_id`)?.toString() || '0');
        const quantita = parseInt(formData.get(`riga_${i}_quantita`)?.toString() || '0');
        const prezzo_unitario = parseFloat(formData.get(`riga_${i}_prezzo`)?.toString() || '0');
        const note_riga = formData.get(`riga_${i}_note`)?.toString() || '';

        if (prodotto_id && quantita > 0 && prezzo_unitario >= 0) {
          righe.push({
            prodotto_id,
            quantita,
            prezzo_unitario,
            note_riga: note_riga || undefined
          });

          totale_colli += quantita;
          totale_valore += quantita * prezzo_unitario;
        }
        i++;
      }

      if (righe.length === 0) {
        return fail(400, {
          error: 'Aggiungere almeno una riga ordine'
        });
      }

      console.log('🔍 SERVER: Validazione dati prima inserimento');
      console.log('📋 Committente ID:', committente_id);
      console.log('📦 Righe da inserire:', righe);
      console.log('🎯 Numero ordine:', numero_ordine);

      // Verifica che il committente esista
      const committenteExists = db.prepare('SELECT id FROM committenti WHERE id = ?').get(committente_id);
      console.log('👤 Committente esiste:', !!committenteExists);

      // Verifica che tutti i prodotti esistano
      for (const riga of righe) {
        const prodottoExists = db.prepare('SELECT id FROM prodotti WHERE id = ?').get(riga.prodotto_id);
        console.log(`📦 Prodotto ${riga.prodotto_id} esiste:`, !!prodottoExists);
      }

      // Inizia transazione
      const transaction = db.transaction(() => {
        // Inserisci ordine principale
        const ordineResult = db.prepare(`
          INSERT INTO ordini (
            committente_id,
            numero_ordine,
            tipo_ordine,
            stato,
            data_ordine,
            data_richiesta,
            cliente_fornitore,
            indirizzo_destinazione,
            contatti_destinazione,
            note_spedizione,
            totale_colli,
            totale_valore
          ) VALUES (?, ?, ?, 'NUOVO', date('now'), ?, ?, ?, ?, ?, ?, ?)
        `).run(
          committente_id,
          numero_ordine,
          tipo_ordine,
          data_richiesta,
          cliente_fornitore,
          indirizzo_destinazione,
          contatti_destinazione,
          note_spedizione,
          totale_colli,
          totale_valore
        );

        const ordine_id = ordineResult.lastInsertRowid;

        // Inserisci righe ordine
        const insertRiga = db.prepare(`
          INSERT INTO ordini_dettaglio_new (
            ordine_id,
            prodotto_id,
            quantita_ordinata,
            prezzo_unitario,
            note_riga
          ) VALUES (?, ?, ?, ?, ?)
        `);

        for (const riga of righe) {
          insertRiga.run(
            ordine_id,
            riga.prodotto_id,
            riga.quantita,
            riga.prezzo_unitario,
            riga.note_riga
          );
        }

        // Log operazione
        db.prepare(`
          INSERT INTO ordini_tracking (
            ordine_id,
            stato_precedente,
            stato_nuovo,
            note
          ) VALUES (?, NULL, 'NUOVO', 'Ordine creato')
        `).run(ordine_id);

        return ordine_id;
      });

      ordine_id = transaction();
      
      // Log audit per creazione ordine
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'ordini',
          operation: 'CREATE',
          description: `Creato ordine ${numero_ordine} per ${cliente_fornitore}`,
          module: 'ORDINI',
          functionality: 'create_order',
          importance: 'ALTA',
          entities_involved: { 
            ordine_id: ordine_id,
            numero_ordine: numero_ordine,
            committente_id: committente_id,
            cliente_fornitore: cliente_fornitore,
            righe_count: righe.length
          },
          data_after: {
            numero_ordine,
            tipo_ordine,
            cliente_fornitore,
            data_richiesta,
            indirizzo_destinazione,
            totale_colli,
            totale_valore,
            righe_ordine: righe
          }
        });
      }
      
    } catch (err) {
      console.error('Errore creazione ordine:', err);
      return fail(500, {
        error: 'Errore nella creazione dell\'ordine'
      });
    }
    
    console.log('✅ SERVER: Ordine creato con successo, ID:', ordine_id);
    console.log('🔄 SERVER: Eseguendo redirect...');
    
    // Redirect alla lista ordini (FINALMENTE fuori dal try/catch!)
    throw redirect(302, `/auth/ordini?committente=${committente_id}&success=created`);
  }
};;null as any as Actions;