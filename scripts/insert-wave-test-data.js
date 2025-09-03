#!/usr/bin/env node
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database/magazzino.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('🎯 Inserendo dati di test per Wave Planning...');

try {
  // Ordini master per testing wave planning
  db.exec(`
    INSERT OR IGNORE INTO ordini_master (id, order_number, customer_name, customer_email, 
                               shipping_address_line1, shipping_city, shipping_postal_code,
                               service_level, promised_date, total_amount, status) VALUES
    
    -- Ordini PRIME urgenti (scadenza oggi)
    (101, 'ORD-PRIME-101', 'Mario Rossi', 'mario.rossi@email.it', 
     'Via Roma 123', 'Milano', '20121', 
     'PRIME', datetime('now', '+6 hours'), 299.99, 'PAYMENT_CONFIRMED'),
    
    (102, 'ORD-PRIME-102', 'Giulia Bianchi', 'giulia.bianchi@email.it',
     'Via Dante 45', 'Milano', '20122',
     'PRIME', datetime('now', '+8 hours'), 159.50, 'PAYMENT_CONFIRMED'),
    
    -- Ordini STANDARD normali (scadenza domani)
    (103, 'ORD-STD-103', 'Luca Verdi', 'luca.verdi@email.it',
     'Corso Buenos Aires 78', 'Milano', '20124',
     'STANDARD', datetime('now', '+1 day', '+2 hours'), 89.00, 'PAYMENT_CONFIRMED'),
    
    (104, 'ORD-STD-104', 'Anna Neri', 'anna.neri@email.it',
     'Via Torino 234', 'Milano', '20123',
     'STANDARD', datetime('now', '+1 day', '+4 hours'), 199.99, 'PAYMENT_CONFIRMED'),
    
    (105, 'ORD-STD-105', 'Paolo Ferrari', 'paolo.ferrari@email.it',
     'Via Venezia 67', 'Milano', '20125',
     'STANDARD', datetime('now', '+1 day', '+6 hours'), 45.50, 'PAYMENT_CONFIRMED'),
    
    -- Ordini ECONOMY con priorità bassa
    (106, 'ORD-ECO-106', 'Sara Blu', 'sara.blu@email.it',
     'Via Napoli 89', 'Milano', '20126',
     'ECONOMY', datetime('now', '+3 days'), 29.99, 'PAYMENT_CONFIRMED'),
    
    (107, 'ORD-ECO-107', 'Marco Gialli', 'marco.gialli@email.it',
     'Via Palermo 12', 'Milano', '20127',
     'ECONOMY', datetime('now', '+4 days'), 75.00, 'PAYMENT_CONFIRMED');
  `);

  // Righe ordini dettaglio
  db.exec(`
    INSERT OR IGNORE INTO ordini_dettaglio (order_id, line_id, committente_id, sku_code, quantita, prezzo_unitario, fulfillment_type) VALUES
    
    -- Ordine PRIME-101 (smartphone + laptop)
    (101, 1, 1, 'SKU001', 2, 149.99, 'FBW'),  -- Smartphone Samsung
    (101, 2, 1, 'SKU002', 1, 149.99, 'FBW'),  -- Laptop Lenovo
    
    -- Ordine PRIME-102 (solo smartphone)
    (102, 1, 1, 'SKU001', 1, 159.50, 'FBW'),
    
    -- Ordine STD-103 (tavolo IKEA)
    (103, 1, 1, 'SKU003', 1, 89.00, 'FBW'),
    
    -- Ordine STD-104 (smartphone + scarpe)
    (104, 1, 1, 'SKU001', 1, 149.99, 'FBW'),
    (104, 2, 1, 'SKU004', 1, 50.00, 'FBW'),   -- Scarpe Nike
    
    -- Ordine STD-105 (solo scarpe)
    (105, 1, 1, 'SKU004', 1, 45.50, 'FBW'),
    
    -- Ordine ECO-106 (solo scarpe)
    (106, 1, 1, 'SKU004', 1, 29.99, 'FBW'),
    
    -- Ordine ECO-107 (smartphone + tavolo)
    (107, 1, 1, 'SKU001', 1, 149.99, 'FBW'),
    (107, 2, 1, 'SKU003', 1, 75.00, 'FBW');
  `);

  // Aggiungi colonna specializzazione se non esiste
  try {
    db.exec(`ALTER TABLE utenti ADD COLUMN specializzazione TEXT;`);
  } catch (e) {
    // Colonna già esistente
  }

  // Specializzazioni operatori per wave planning
  db.exec(`
    UPDATE utenti SET specializzazione = 'Picking Veloce' WHERE id = 2;
    UPDATE utenti SET specializzazione = 'Prodotti Pesanti' WHERE id = 3;
    UPDATE utenti SET specializzazione = 'Multi-Zone' WHERE id = 4;
  `);

  // Wave di esempio già in corso
  db.exec(`
    INSERT OR IGNORE INTO ordini_master (id, order_number, customer_name, customer_email,
                               shipping_address_line1, shipping_city, shipping_postal_code,
                               service_level, promised_date, total_amount, status, wave_id) VALUES
    
    (108, 'ORD-WAVE-108', 'Cliente Wave 1', 'wave1@email.it',
     'Via Test 1', 'Milano', '20100',
     'PRIME', datetime('now', '+2 hours'), 199.99, 'PICKING_IN_PROGRESS', 'WAVE_1693564800000'),
     
    (109, 'ORD-WAVE-109', 'Cliente Wave 2', 'wave2@email.it', 
     'Via Test 2', 'Milano', '20101',
     'STANDARD', datetime('now', '+4 hours'), 89.50, 'PICKING_IN_PROGRESS', 'WAVE_1693564800000');
  `);

  db.exec(`
    INSERT OR IGNORE INTO ordini_dettaglio (order_id, line_id, committente_id, sku_code, quantita, prezzo_unitario, fulfillment_type) VALUES
    (108, 1, 1, 'SKU001', 1, 199.99, 'FBW'),
    (109, 1, 1, 'SKU003', 1, 89.50, 'FBW');
  `);

  // Movimenti associati alla wave in corso
  db.exec(`
    INSERT OR IGNORE INTO movimenti_ottimizzati 
    (committente_id, sku_code, tipo_movimento, quantita, from_ubicazione_id, 
     operatore_id, device_id, wave_id, ordine_id, timestamp_inizio, note) VALUES
    
    (1, 'SKU001', 'PICK', 1, 2, 2, 'MOBILE_001', 'WAVE_1693564800000', 108,
     datetime('now', '-1 hour'), 'Picking per ordine PRIME - Wave 1'),
     
    (1, 'SKU003', 'PICK', 1, 6, 2, 'MOBILE_001', 'WAVE_1693564800000', 109,
     datetime('now', '-50 minutes'), 'Picking per ordine STANDARD - Wave 1');
  `);

  console.log('✅ Dati di test Wave Planning inseriti con successo!');
  console.log('');
  console.log('📋 Dati creati:');
  console.log('   • 7 ordini pronti per picking');
  console.log('   • Ordini PRIME, STANDARD ed ECONOMY');
  console.log('   • 1 wave attiva in corso (WAVE_1693564800000)');
  console.log('   • Specializzazioni operatori assegnate');
  console.log('   • Movimenti di picking associati a wave');
  console.log('');
  console.log('🚀 Accedi al Wave Planning a:');
  console.log('   https://connect.microlops.it:3304/wave-planning');

} catch (error) {
  console.error('❌ Errore durante inserimento dati:', error);
  process.exit(1);
} finally {
  db.close();
}