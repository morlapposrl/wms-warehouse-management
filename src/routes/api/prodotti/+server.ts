import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const committente = url.searchParams.get('committente');
    
    if (!committente) {
      return json({ error: 'Committente richiesto' }, { status: 400 });
    }
    
    const prodotti = db.prepare(`
      SELECT 
        p.id,
        p.committente_id,
        p.codice,
        p.descrizione,
        p.categoria_id,
        p.unita_misura_id,
        p.prezzo_vendita,
        p.scorta_minima,
        p.scorta_massima,
        p.richiede_temperatura_controllata,
        p.temperatura_min,
        p.temperatura_max,
        p.categoria_sicurezza,
        p.classe_pericolo,
        p.codice_adr,
        p.peso_unitario_kg,
        p.volume_unitario_cm3,
        p.altezza_cm,
        p.richiede_accesso_controllato,
        p.incompatibile_con_alimentari,
        p.shelf_life_giorni,
        p.tracking_lotto_obbligatorio,
        c.descrizione as categoria_nome,
        um.codice as unita_misura,
        COALESCE(g.quantita, 0) as giacenza_attuale
      FROM prodotti p
      LEFT JOIN categorie c ON p.categoria_id = c.id
      LEFT JOIN unita_misura um ON p.unita_misura_id = um.id
      LEFT JOIN giacenze g ON p.id = g.prodotto_id AND g.committente_id = p.committente_id
      WHERE p.committente_id = ?
      ORDER BY p.codice
    `).all(parseInt(committente));
    
    return json(prodotti);
    
  } catch (error) {
    console.error('Errore API prodotti:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    console.log('🔧 COMPATIBILITY DEBUG - Categoria sicurezza ricevuta:', data.categoria_sicurezza);
    console.log('🔧 COMPATIBILITY DEBUG - Richiede temperatura:', data.richiede_temperatura_controllata);
    console.log('🔧 COMPATIBILITY DEBUG - Peso unitario:', data.peso_unitario_kg);
    
    // Validazione dati richiesti
    if (!data.codice || !data.descrizione || !data.committente_id || !data.categoria_id || !data.unita_misura_id) {
      console.log('❌ VALIDAZIONE FALLITA:', {
        codice: !!data.codice,
        descrizione: !!data.descrizione,
        committente_id: !!data.committente_id,
        categoria_id: !!data.categoria_id,
        unita_misura_id: !!data.unita_misura_id
      });
      return json({ error: 'Codice, descrizione, committente, categoria e unità di misura sono obbligatori' }, { status: 400 });
    }
    
    // Verifica se il codice esiste già per questo committente
    const existing = db.prepare(`
      SELECT id FROM prodotti 
      WHERE codice = ? AND committente_id = ?
    `).get(data.codice, data.committente_id);
    
    if (existing) {
      return json({ error: 'Codice prodotto già esistente per questo committente' }, { status: 400 });
    }
    
    // Converti stringhe in numeri dove necessario
    const prodottoData = {
      ...data,
      committente_id: parseInt(data.committente_id),
      categoria_id: parseInt(data.categoria_id),
      unita_misura_id: parseInt(data.unita_misura_id),
      prezzo_vendita: parseFloat(data.prezzo_vendita) || 0,
      scorta_minima: parseInt(data.scorta_minima) || 0,
      scorta_massima: parseInt(data.scorta_massima) || 0
    };
    
    console.log('📊 DATI CONVERTITI:', prodottoData);
    
    // Inserisci il nuovo prodotto
    const result = db.prepare(`
      INSERT INTO prodotti (
        committente_id, codice, descrizione, categoria_id, 
        unita_misura_id, prezzo_vendita, scorta_minima, scorta_massima,
        richiede_temperatura_controllata, temperatura_min, temperatura_max,
        categoria_sicurezza, classe_pericolo, codice_adr,
        peso_unitario_kg, volume_unitario_cm3, altezza_cm,
        richiede_accesso_controllato, incompatibile_con_alimentari,
        shelf_life_giorni, tracking_lotto_obbligatorio,
        attivo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      prodottoData.committente_id,
      prodottoData.codice,
      prodottoData.descrizione,
      prodottoData.categoria_id,
      prodottoData.unita_misura_id,
      prodottoData.prezzo_vendita,
      prodottoData.scorta_minima,
      prodottoData.scorta_massima,
      // Campi compatibilità
      data.richiede_temperatura_controllata || false,
      data.temperatura_min || null,
      data.temperatura_max || null,
      data.categoria_sicurezza || 'STANDARD',
      data.classe_pericolo || null,
      data.codice_adr || null,
      data.peso_unitario_kg || 0,
      data.volume_unitario_cm3 || 0,
      data.altezza_cm || 0,
      data.richiede_accesso_controllato || false,
      data.incompatibile_con_alimentari || false,
      data.shelf_life_giorni || null,
      data.tracking_lotto_obbligatorio || false
    );
    
    return json({ success: true, id: result.lastInsertRowid });
    
  } catch (error) {
    console.error('Errore creazione prodotto:', error);
    return json({ error: 'Errore interno server' }, { status: 500 });
  }
};