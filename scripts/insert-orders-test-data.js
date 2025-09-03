#!/usr/bin/env node
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database/magazzino.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('🛒 Inserendo dati di test per Ordini Multi-Seller...');

try {
  // Ordini esempio con mix seller e fulfillment
  db.exec(`
    INSERT OR IGNORE INTO ordini_master (id, order_number, customer_name, customer_email,
                               shipping_address_line1, shipping_city, shipping_postal_code,
                               service_level, promised_date, total_amount, status) VALUES
    
    -- Ordine PRIME multi-seller
    (201, 'ORD-MULTI-201', 'Francesco Totti', 'francesco.totti@email.it',
     'Via Condotti 12', 'Roma', '00187',
     'PRIME', datetime('now', '+4 hours'), 549.98, 'PAYMENT_CONFIRMED'),
    
    -- Ordine STANDARD single seller
    (202, 'ORD-SINGLE-202', 'Valentina Rossi', 'valentina.rossi@email.it',
     'Corso di Porta Ticinese 87', 'Milano', '20123',
     'STANDARD', datetime('now', '+1 day'), 89.99, 'PAYMENT_CONFIRMED'),
    
    -- Ordine ECONOMY con mix FBW/FBM
    (203, 'ORD-MIX-203', 'Alessandro Borghese', 'alessandro.borghese@email.it',
     'Via del Babuino 45', 'Roma', '00187',
     'ECONOMY', datetime('now', '+3 days'), 234.50, 'PICKING_IN_PROGRESS'),
    
    -- Ordine urgente scaduto
    (204, 'ORD-URGENT-204', 'Chiara Ferragni', 'chiara.ferragni@email.it',
     'Via Montenapoleone 8', 'Milano', '20121',
     'PRIME', datetime('now', '-2 hours'), 1299.00, 'PICKING_IN_PROGRESS'),
    
    -- Ordine spedito
    (205, 'ORD-SHIPPED-205', 'Matteo Salvini', 'matteo.salvini@email.it',
     'Via del Tritone 123', 'Roma', '00187',
     'STANDARD', datetime('now', '+2 days'), 67.50, 'SHIPPED');
  `);

  // Righe ordini con mix committenti e fulfillment
  db.exec(`
    INSERT OR IGNORE INTO ordini_dettaglio (order_id, line_id, committente_id, sku_code, quantita, prezzo_unitario, fulfillment_type, picked_quantity, picked_at) VALUES
    
    -- Ordine 201 (multi-seller: smartphone + laptop + scarpe)
    (201, 1, 1, 'SKU001', 2, 149.99, 'FBW', 0, NULL),     -- Acme Corp
    (201, 2, 1, 'SKU002', 1, 199.99, 'FBW', 0, NULL),     -- Acme Corp  
    (201, 3, 1, 'SKU004', 1, 50.00, 'FBM', 1, datetime('now', '-1 hour')),  -- Scarpe via FBM
    
    -- Ordine 202 (single seller)
    (202, 1, 1, 'SKU003', 1, 89.99, 'FBW', 0, NULL),      -- Tavolo IKEA
    
    -- Ordine 203 (mix FBW/FBM)
    (203, 1, 1, 'SKU001', 1, 149.99, 'FBW', 1, datetime('now', '-30 minutes')),
    (203, 2, 1, 'SKU002', 1, 84.51, 'FBM', 0, NULL),      -- Laptop via merchant
    
    -- Ordine 204 (urgente multi-prodotto)
    (204, 1, 1, 'SKU001', 3, 149.99, 'FBW', 2, datetime('now', '-45 minutes')),
    (204, 2, 1, 'SKU002', 2, 199.99, 'FBW', 1, datetime('now', '-30 minutes')),
    (204, 3, 1, 'SKU004', 5, 79.99, 'FBW', 0, NULL),
    
    -- Ordine 205 (spedito)
    (205, 1, 1, 'SKU004', 1, 67.50, 'FBW', 1, datetime('now', '-2 days'));
  `);

  // Aggiorna carrier e tracking per ordini spediti
  db.exec(`
    UPDATE ordini_master SET 
      carrier = 'DHL Express',
      tracking_number = 'DHL123456789IT',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 205;
    
    UPDATE ordini_master SET 
      wave_id = 'WAVE_URGENT_' || strftime('%s', 'now'),
      updated_at = CURRENT_TIMESTAMP  
    WHERE id IN (203, 204);
  `);

  // Aggiorna giacenze per riflettere le prenotazioni
  db.exec(`
    UPDATE giacenze_logiche SET 
      quantita_riservata = quantita_riservata + 6,
      quantita_disponibile = quantita_disponibile - 6
    WHERE committente_id = 1 AND sku_code = 'SKU001';
    
    UPDATE giacenze_logiche SET 
      quantita_riservata = quantita_riservata + 4, 
      quantita_disponibile = quantita_disponibile - 4
    WHERE committente_id = 1 AND sku_code = 'SKU002';
    
    UPDATE giacenze_logiche SET 
      quantita_riservata = quantita_riservata + 1,
      quantita_disponibile = quantita_disponibile - 1  
    WHERE committente_id = 1 AND sku_code = 'SKU003';
  `);

  // Crea alcuni movimenti picking associati agli ordini
  db.exec(`
    INSERT OR IGNORE INTO movimenti_ottimizzati 
    (committente_id, sku_code, tipo_movimento, quantita, from_ubicazione_id, 
     operatore_id, device_id, ordine_id, timestamp_inizio, timestamp_fine, durata_secondi, note) VALUES
    
    -- Picking completati
    (1, 'SKU001', 'PICK', 1, 2, 2, 'MOBILE_004', 203,
     datetime('now', '-45 minutes'), datetime('now', '-43 minutes'), 120,
     'Picking ordine ORD-MIX-203 - completato'),
     
    (1, 'SKU001', 'PICK', 2, 2, 3, 'MOBILE_005', 204,
     datetime('now', '-50 minutes'), datetime('now', '-47 minutes'), 180,
     'Picking urgente ORD-URGENT-204 - parziale'),
     
    (1, 'SKU002', 'PICK', 1, 4, 3, 'MOBILE_005', 204,
     datetime('now', '-35 minutes'), datetime('now', '-33 minutes'), 120,
     'Picking laptop urgente'),
     
    -- Picking in corso
    (1, 'SKU004', 'PICK', 5, 12, 4, 'MOBILE_006', 204,
     datetime('now', '-15 minutes'), NULL, NULL,
     'Picking scarpe Nike - in corso');
  `);

  console.log('✅ Dati di test Ordini Multi-Seller inseriti con successo!');
  console.log('');
  console.log('📋 Dati creati:');
  console.log('   • 5 ordini con diversi stati e service level');
  console.log('   • Mix fulfillment FBW/FBM per simulare marketplace');
  console.log('   • Ordini multi-seller e single-seller');
  console.log('   • 1 ordine scaduto per test urgenze');
  console.log('   • 1 ordine spedito con tracking DHL');
  console.log('   • Prenotazioni giacenze automatiche');
  console.log('   • Movimenti picking associati agli ordini');
  console.log('');
  console.log('🚀 Accedi agli Ordini Multi-Seller a:');
  console.log('   https://connect.microlops.it:3304/ordini');

} catch (error) {
  console.error('❌ Errore durante inserimento dati:', error);
  process.exit(1);
} finally {
  db.close();
}