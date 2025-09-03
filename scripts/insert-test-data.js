#!/usr/bin/env node
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connetti al database
const dbPath = join(__dirname, '../database/magazzino.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('🎯 Inserendo dati di test per sistema movimenti...');

try {
  // Utenti operatori di esempio
  db.exec(`
    INSERT OR IGNORE INTO utenti (id, email, password_hash, nome, cognome, ruolo, attivo) VALUES
    (2, 'mario.rossi@magazzino.it', '$2a$10$example.hash.here', 'Mario', 'Rossi', 'operatore_magazzino', 1),
    (3, 'giulia.bianchi@magazzino.it', '$2a$10$example.hash.here', 'Giulia', 'Bianchi', 'operatore_magazzino', 1),
    (4, 'luca.verdi@magazzino.it', '$2a$10$example.hash.here', 'Luca', 'Verdi', 'operatore_magazzino', 1);
  `);

  // Movimenti di esempio per oggi e ieri
  console.log('📦 Inserendo movimenti ottimizzati...');
  
  // Movimenti di oggi
  db.exec(`
    INSERT INTO movimenti_ottimizzati 
    (committente_id, sku_code, tipo_movimento, quantita, from_ubicazione_id, to_ubicazione_id, 
     operatore_id, device_id, timestamp_inizio, timestamp_fine, durata_secondi, note) VALUES
    
    -- Ricevimenti mattutini
    (1, 'SKU001', 'RECEIVE', 50, NULL, 1, 2, 'SCANNER_001', 
     datetime('now', '-8 hours'), datetime('now', '-8 hours', '+3 minutes'), 180, 
     'Ricevimento da Samsung - Lotto A123'),
    
    (1, 'SKU002', 'RECEIVE', 25, NULL, 1, 2, 'SCANNER_001',
     datetime('now', '-8 hours', '+10 minutes'), datetime('now', '-8 hours', '+12 minutes'), 120,
     'Ricevimento Lenovo - Controllo qualità OK'),
     
    (1, 'SKU003', 'RECEIVE', 10, NULL, 6, 3, 'SCANNER_002',
     datetime('now', '-7 hours'), datetime('now', '-7 hours', '+5 minutes'), 300,
     'Ricevimento tavoli IKEA - Richiede muletto'),
    
    -- Put-away (posizionamento in stock)
    (1, 'SKU001', 'PUT_AWAY', 25, 1, 2, 2, 'SCANNER_001',
     datetime('now', '-7 hours', '+30 minutes'), datetime('now', '-7 hours', '+35 minutes'), 300,
     'Posizionamento in zona A - HOT'),
     
    (1, 'SKU001', 'PUT_AWAY', 25, 1, 3, 2, 'SCANNER_001',
     datetime('now', '-7 hours', '+40 minutes'), datetime('now', '-7 hours', '+45 minutes'), 300,
     'Posizionamento restanti in zona A'),
     
    (1, 'SKU002', 'PUT_AWAY', 25, 1, 4, 3, 'SCANNER_002',
     datetime('now', '-6 hours'), datetime('now', '-6 hours', '+8 minutes'), 480,
     'Posizionamento laptop in zona B - WARM'),
    
    -- Prelievi per ordini
    (1, 'SKU001', 'PICK', 10, 2, NULL, 4, 'MOBILE_003',
     datetime('now', '-5 hours'), datetime('now', '-5 hours', '+2 minutes'), 120,
     'Prelievo per ordine ORD-001'),
     
    (1, 'SKU002', 'PICK', 3, 4, NULL, 4, 'MOBILE_003',
     datetime('now', '-5 hours', '+10 minutes'), datetime('now', '-5 hours', '+12 minutes'), 120,
     'Prelievo laptop per ordine ORD-001'),
    
    -- Rifornimento zone picking
    (1, 'SKU001', 'REPLENISH', 15, 3, 2, 2, 'SCANNER_001',
     datetime('now', '-4 hours'), datetime('now', '-4 hours', '+5 minutes'), 300,
     'Rifornimento zona picking da bulk'),
    
    -- Trasferimenti interni
    (1, 'SKU003', 'TRANSFER', 2, 6, 12, 3, 'MULETTO_001',
     datetime('now', '-3 hours'), datetime('now', '-3 hours', '+10 minutes'), 600,
     'Trasferimento da pallet a zona normale'),
    
    -- Rettifiche inventario
    (1, 'SKU001', 'ADJUST_PLUS', 2, NULL, 2, 2, 'SCANNER_001',
     datetime('now', '-2 hours'), datetime('now', '-2 hours', '+1 minute'), 60,
     'Rettifica inventario - trovati 2 pezzi extra'),
     
    -- Movimenti in corso (non ancora completati)
    (1, 'SKU004', 'RECEIVE', 20, NULL, 1, 3, 'SCANNER_002',
     datetime('now', '-30 minutes'), NULL, NULL,
     'Ricevimento scarpe Nike in corso'),
     
    (1, 'SKU002', 'PICK', 5, 4, NULL, 4, 'MOBILE_003',
     datetime('now', '-15 minutes'), NULL, NULL,
     'Prelievo per ordine urgente ORD-URGENT');
  `);

  // Movimenti di ieri
  console.log('📅 Inserendo movimenti di ieri...');
  db.exec(`
    INSERT INTO movimenti_ottimizzati 
    (committente_id, sku_code, tipo_movimento, quantita, from_ubicazione_id, to_ubicazione_id, 
     operatore_id, device_id, timestamp_inizio, timestamp_fine, durata_secondi, note) VALUES
    
    -- Movimenti di ieri per statistiche
    (1, 'SKU001', 'RECEIVE', 100, NULL, 1, 2, 'SCANNER_001',
     datetime('now', '-1 day', '-8 hours'), datetime('now', '-1 day', '-8 hours', '+5 minutes'), 300,
     'Grande ricevimento Samsung'),
     
    (1, 'SKU001', 'PUT_AWAY', 50, 1, 2, 2, 'SCANNER_001',
     datetime('now', '-1 day', '-7 hours'), datetime('now', '-1 day', '-7 hours', '+10 minutes'), 600,
     'Posizionamento metà stock'),
     
    (1, 'SKU001', 'PUT_AWAY', 50, 1, 3, 3, 'SCANNER_002',
     datetime('now', '-1 day', '-7 hours', '+15 minutes'), datetime('now', '-1 day', '-7 hours', '+25 minutes'), 600,
     'Posizionamento resto stock'),
     
    (1, 'SKU001', 'PICK', 30, 2, NULL, 4, 'MOBILE_003',
     datetime('now', '-1 day', '-4 hours'), datetime('now', '-1 day', '-4 hours', '+8 minutes'), 480,
     'Picking multiplo per 5 ordini'),
     
    (1, 'SKU002', 'RECEIVE', 40, NULL, 1, 2, 'SCANNER_001',
     datetime('now', '-1 day', '-6 hours'), datetime('now', '-1 day', '-6 hours', '+3 minutes'), 180,
     'Ricevimento Lenovo'),
     
    (1, 'SKU002', 'PUT_AWAY', 40, 1, 4, 3, 'SCANNER_002',
     datetime('now', '-1 day', '-5 hours'), datetime('now', '-1 day', '-5 hours', '+12 minutes'), 720,
     'Posizionamento laptop'),
     
    (1, 'SKU002', 'PICK', 15, 4, NULL, 4, 'MOBILE_003',
     datetime('now', '-1 day', '-3 hours'), datetime('now', '-1 day', '-3 hours', '+6 minutes'), 360,
     'Picking laptop per ordini B2B');
  `);

  // Aggiorna giacenze ownership basate sui movimenti
  console.log('💰 Aggiornando giacenze ownership...');
  db.exec(`
    INSERT OR REPLACE INTO giacenze_ownership 
    (ubicazione_id, sku_code, committente_id, quantita, lotto, data_carico, costo_acquisto, stato) VALUES
    
    -- Giacenze SKU001 (smartphone)
    (2, 'SKU001', 1, 27, 'LOTTO_A123', datetime('now', '-8 hours'), 450.00, 'DISPONIBILE'),
    (3, 'SKU001', 1, 35, 'LOTTO_A123', datetime('now', '-7 hours'), 450.00, 'DISPONIBILE'),
    
    -- Giacenze SKU002 (laptop)
    (4, 'SKU002', 1, 47, 'LOTTO_L456', datetime('now', '-6 hours'), 850.00, 'DISPONIBILE'),
    
    -- Giacenze SKU003 (tavoli)
    (6, 'SKU003', 1, 8, NULL, datetime('now', '-7 hours'), 65.00, 'DISPONIBILE'),
    (12, 'SKU003', 1, 2, NULL, datetime('now', '-3 hours'), 65.00, 'DISPONIBILE'),
    
    -- Giacenze SKU004 (in arrivo)
    (1, 'SKU004', 1, 20, NULL, datetime('now', '-30 minutes'), 80.00, 'DISPONIBILE');
  `);

  // Aggiorna giacenze logiche
  console.log('📊 Aggiornando giacenze logiche...');
  db.exec(`
    INSERT OR REPLACE INTO giacenze_logiche 
    (committente_id, sku_code, quantita_disponibile, quantita_riservata, quantita_in_transito, 
     costo_medio_ponderato, valore_totale, ultima_movimentazione) VALUES
     
    (1, 'SKU001', 62, 5, 0, 450.00, 27900.00, datetime('now', '-2 hours')),
    (1, 'SKU002', 47, 5, 0, 850.00, 39950.00, datetime('now', '-15 minutes')),
    (1, 'SKU003', 10, 0, 0, 65.00, 650.00, datetime('now', '-3 hours')),
    (1, 'SKU004', 20, 0, 0, 80.00, 1600.00, datetime('now', '-30 minutes'));
  `);

  // Aggiorna giacenze fisiche
  console.log('🏠 Aggiornando giacenze fisiche...');
  db.exec(`
    INSERT OR REPLACE INTO giacenze_fisiche 
    (ubicazione_id, sku_code, quantita_totale, volume_occupato_cm3, peso_totale_kg, ultima_movimentazione) VALUES
    
    (2, 'SKU001', 27, 1768.5, 4.536, datetime('now', '-7 hours')),
    (3, 'SKU001', 35, 2292.5, 5.88, datetime('now', '-7 hours')),
    (4, 'SKU002', 47, 133950.0, 65.8, datetime('now', '-6 hours')),
    (6, 'SKU003', 8, 1000000.0, 204.0, datetime('now', '-7 hours')),
    (12, 'SKU003', 2, 250000.0, 51.0, datetime('now', '-3 hours')),
    (1, 'SKU004', 20, 240000.0, 16.0, datetime('now', '-30 minutes'));
  `);

  console.log('✅ Dati di test inseriti con successo!');
  console.log('');
  console.log('📋 Riassunto dati creati:');
  console.log('   • 3 operatori magazzino');
  console.log('   • 20+ movimenti ottimizzati (oggi e ieri)');
  console.log('   • Giacenze ownership aggiornate');
  console.log('   • Giacenze logiche per 4 SKU');
  console.log('   • Giacenze fisiche in 6 ubicazioni');
  console.log('   • 2 movimenti attualmente in corso');
  console.log('');
  console.log('🚀 Sistema pronto per test a:');
  console.log('   https://connect.microlops.it:3304/movimenti');

} catch (error) {
  console.error('❌ Errore durante inserimento dati:', error);
  process.exit(1);
} finally {
  db.close();
}