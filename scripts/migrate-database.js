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

console.log('🚀 Iniziando migrazione database...');

try {
  // === TABELLE MODELLO MULTICOMMITTENTE AMAZON-STYLE ===
  
  console.log('📦 Creando tabella sku_master...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sku_master (
      sku_code TEXT PRIMARY KEY,
      descrizione TEXT NOT NULL,
      categoria_generale TEXT,
      ean_code TEXT UNIQUE,
      dimensioni_lunghezza REAL,
      dimensioni_larghezza REAL,
      dimensioni_altezza REAL,
      peso_kg REAL,
      volume_cm3 REAL,
      fragile INTEGER DEFAULT 0,
      pericoloso INTEGER DEFAULT 0,
      temperatura_minima REAL,
      temperatura_massima REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('🏢 Creando tabella prodotti_committente_v2...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS prodotti_committente_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      sku_code TEXT NOT NULL,
      codice_interno TEXT NOT NULL,
      descrizione_personalizzata TEXT,
      prezzo_acquisto REAL,
      prezzo_vendita REAL,
      scorta_minima INTEGER,
      scorta_massima INTEGER,
      categoria_id INTEGER,
      fornitore_preferito_id INTEGER,
      attivo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (sku_code) REFERENCES sku_master(sku_code),
      FOREIGN KEY (categoria_id) REFERENCES categorie(id),
      FOREIGN KEY (fornitore_preferito_id) REFERENCES fornitori(id),
      UNIQUE(committente_id, codice_interno),
      UNIQUE(committente_id, sku_code)
    )
  `);

  console.log('🏢 Creando tabella magazzini...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS magazzini (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codice TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      indirizzo TEXT,
      citta TEXT,
      cap TEXT,
      larghezza_metri REAL NOT NULL,
      lunghezza_metri REAL NOT NULL,
      altezza_metri REAL NOT NULL,
      superficie_mq REAL GENERATED ALWAYS AS (larghezza_metri * lunghezza_metri),
      volume_mc REAL GENERATED ALWAYS AS (larghezza_metri * lunghezza_metri * altezza_metri),
      temperatura_min REAL,
      temperatura_max REAL,
      umidita_max REAL,
      attivo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('📍 Creando tabella ubicazioni con coordinate fisiche...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ubicazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      magazzino_id INTEGER NOT NULL DEFAULT 1,
      codice_ubicazione TEXT UNIQUE NOT NULL,
      zona TEXT NOT NULL,
      corridoio TEXT,
      scaffale TEXT,
      ripiano INTEGER,
      posizione TEXT,
      tipo TEXT CHECK(tipo IN ('SCAFFALE', 'PALLET', 'FRIGO', 'CONGELATORE', 'QUARANTENA', 'UFFICIO', 'PASSAGGIO', 'ENTRATA', 'USCITA')) DEFAULT 'SCAFFALE',
      
      -- COORDINATE FISICHE PER DISEGNO MAGAZZINO
      coordinata_x REAL NOT NULL,
      coordinata_y REAL NOT NULL,
      coordinata_z REAL DEFAULT 0,
      larghezza_cm REAL DEFAULT 120,
      profondita_cm REAL DEFAULT 80,
      altezza_cm REAL DEFAULT 200,
      
      -- ORIENTAMENTO (0-360 gradi)
      orientamento INTEGER DEFAULT 0,
      
      -- COLORE PER VISUALIZZAZIONE
      colore_hex TEXT DEFAULT '#3B82F6',
      
      volume_max_cm3 REAL,
      peso_max_kg REAL,
      volume_occupato_cm3 REAL DEFAULT 0,
      peso_attuale_kg REAL DEFAULT 0,
      percentuale_occupazione REAL GENERATED ALWAYS AS (
        CASE 
          WHEN volume_max_cm3 > 0 THEN (volume_occupato_cm3 * 100.0 / volume_max_cm3)
          ELSE 0
        END
      ),
      
      accessibilita TEXT CHECK(accessibilita IN ('DIRETTA', 'SCALA', 'MULETTO', 'TRANS_PALLET')) DEFAULT 'DIRETTA',
      temperatura_controllata INTEGER DEFAULT 0,
      temperatura_attuale REAL,
      
      -- PICKING OPTIMIZATION
      attiva INTEGER DEFAULT 1,
      priorita_picking INTEGER DEFAULT 5,
      zona_velocita TEXT CHECK(zona_velocita IN ('HOT', 'WARM', 'COLD')) DEFAULT 'WARM',
      frequenza_prelievi INTEGER DEFAULT 0,
      
      -- SICUREZZA E ACCESSO
      accesso_limitato INTEGER DEFAULT 0,
      badge_richiesto TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (magazzino_id) REFERENCES magazzini(id)
    )
  `);

  console.log('🚪 Creando tabella corridoi...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS corridoi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      magazzino_id INTEGER NOT NULL,
      codice TEXT NOT NULL,
      nome TEXT,
      larghezza_cm REAL NOT NULL DEFAULT 150,
      altezza_libera_cm REAL DEFAULT 250,
      tipo_pavimento TEXT DEFAULT 'cemento',
      senso_marcia TEXT CHECK(senso_marcia IN ('DOPPIO', 'UNICO_SX', 'UNICO_DX')) DEFAULT 'DOPPIO',
      
      -- PERCORSO DEL CORRIDOIO (lista di punti)
      percorso_json TEXT, -- [{"x": 100, "y": 50}, {"x": 100, "y": 500}]
      
      -- STRUMENTAZIONE
      illuminazione TEXT DEFAULT 'led',
      video_sorveglianza INTEGER DEFAULT 0,
      sensori_movimento INTEGER DEFAULT 0,
      
      attivo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (magazzino_id) REFERENCES magazzini(id),
      UNIQUE(magazzino_id, codice)
    )
  `);

  console.log('🎯 Creando tabella zone logiche...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS zone_magazzino (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      magazzino_id INTEGER NOT NULL,
      codice TEXT NOT NULL,
      nome TEXT NOT NULL,
      descrizione TEXT,
      tipo TEXT CHECK(tipo IN ('RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'SHIPPING', 'RETURNS', 'QUARANTINE')) NOT NULL,
      
      -- AREA POLIGONALE (JSON con coordinate)
      poligono_json TEXT NOT NULL, -- [{"x": 0, "y": 0}, {"x": 100, "y": 0}, {"x": 100, "y": 100}, {"x": 0, "y": 100}]
      
      colore_hex TEXT DEFAULT '#10B981',
      priorita INTEGER DEFAULT 5,
      temperatura_controllata INTEGER DEFAULT 0,
      temperatura_target REAL,
      umidita_target REAL,
      
      responsabile_id INTEGER,
      attiva INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (magazzino_id) REFERENCES magazzini(id),
      FOREIGN KEY (responsabile_id) REFERENCES utenti(id),
      UNIQUE(magazzino_id, codice)
    )
  `);

  console.log('📦 Creando tabella giacenze_fisiche...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS giacenze_fisiche (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubicazione_id INTEGER NOT NULL,
      sku_code TEXT NOT NULL,
      quantita_totale INTEGER NOT NULL DEFAULT 0,
      volume_occupato_cm3 REAL DEFAULT 0,
      peso_totale_kg REAL DEFAULT 0,
      ultima_movimentazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ubicazione_id) REFERENCES ubicazioni(id),
      FOREIGN KEY (sku_code) REFERENCES sku_master(sku_code),
      UNIQUE(ubicazione_id, sku_code)
    )
  `);

  console.log('💰 Creando tabella giacenze_logiche...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS giacenze_logiche (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      sku_code TEXT NOT NULL,
      quantita_disponibile INTEGER NOT NULL DEFAULT 0,
      quantita_riservata INTEGER DEFAULT 0,
      quantita_in_transito INTEGER DEFAULT 0,
      quantita_quarantena INTEGER DEFAULT 0,
      costo_medio_ponderato REAL,
      valore_totale REAL,
      ultima_movimentazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (sku_code) REFERENCES sku_master(sku_code),
      UNIQUE(committente_id, sku_code)
    )
  `);

  console.log('🏷️ Creando tabella giacenze_ownership...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS giacenze_ownership (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubicazione_id INTEGER NOT NULL,
      sku_code TEXT NOT NULL,
      committente_id INTEGER NOT NULL,
      quantita INTEGER NOT NULL,
      lotto TEXT,
      data_carico DATETIME NOT NULL,
      data_scadenza DATE,
      costo_acquisto REAL,
      stato TEXT CHECK(stato IN ('DISPONIBILE', 'RISERVATO', 'QUARANTENA', 'DANNEGGIATO')) DEFAULT 'DISPONIBILE',
      ordine_id INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ubicazione_id) REFERENCES ubicazioni(id),
      FOREIGN KEY (sku_code) REFERENCES sku_master(sku_code),
      FOREIGN KEY (committente_id) REFERENCES committenti(id)
    )
  `);

  console.log('🚚 Creando tabella movimenti_ottimizzati...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS movimenti_ottimizzati (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      sku_code TEXT NOT NULL,
      tipo_movimento TEXT CHECK(tipo_movimento IN (
        'RECEIVE', 'CROSS_DOCK', 'PUT_AWAY', 'PICK', 'REPLENISH', 
        'TRANSFER', 'ADJUST_PLUS', 'ADJUST_MINUS', 'RETURN_RECEIVE', 'DISPOSE'
      )) NOT NULL,
      quantita INTEGER NOT NULL,
      from_ubicazione_id INTEGER,
      to_ubicazione_id INTEGER,
      operatore_id INTEGER,
      device_id TEXT,
      wave_id TEXT,
      ordine_id INTEGER,
      lotto TEXT,
      data_scadenza DATE,
      costo_unitario REAL,
      timestamp_inizio DATETIME DEFAULT CURRENT_TIMESTAMP,
      timestamp_fine DATETIME,
      durata_secondi INTEGER,
      distanza_metri REAL,
      note TEXT,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (sku_code) REFERENCES sku_master(sku_code),
      FOREIGN KEY (from_ubicazione_id) REFERENCES ubicazioni(id),
      FOREIGN KEY (to_ubicazione_id) REFERENCES ubicazioni(id),
      FOREIGN KEY (operatore_id) REFERENCES utenti(id)
    )
  `);

  console.log('🛒 Creando tabelle ordini...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ordini_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      customer_email TEXT,
      shipping_address_line1 TEXT,
      shipping_address_line2 TEXT,
      shipping_city TEXT,
      shipping_postal_code TEXT,
      shipping_country TEXT DEFAULT 'IT',
      service_level TEXT CHECK(service_level IN ('PRIME', 'STANDARD', 'ECONOMY')) DEFAULT 'STANDARD',
      promised_date DATETIME,
      total_amount REAL,
      status TEXT CHECK(status IN (
        'PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PENDING_PICKING', 'PICKING_IN_PROGRESS',
        'PICKED_COMPLETE', 'PENDING_PACKING', 'PACKED', 'LABELED', 'SHIPPED',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'CANCELLED'
      )) DEFAULT 'PENDING_PAYMENT',
      wave_id TEXT,
      carrier TEXT,
      tracking_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ordini_dettaglio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      line_id INTEGER NOT NULL,
      committente_id INTEGER NOT NULL,
      sku_code TEXT NOT NULL,
      quantita INTEGER NOT NULL,
      prezzo_unitario REAL,
      fulfillment_type TEXT CHECK(fulfillment_type IN ('FBW', 'FBM')) DEFAULT 'FBW',
      picked_quantity INTEGER DEFAULT 0,
      picked_by INTEGER,
      picked_at DATETIME,
      packed_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES ordini_master(id),
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (sku_code) REFERENCES sku_master(sku_code),
      FOREIGN KEY (picked_by) REFERENCES utenti(id)
    )
  `);

  console.log('📊 Creando indici per performance...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_giacenze_logiche_committente ON giacenze_logiche(committente_id);
    CREATE INDEX IF NOT EXISTS idx_giacenze_fisiche_ubicazione ON giacenze_fisiche(ubicazione_id);
    CREATE INDEX IF NOT EXISTS idx_giacenze_ownership_ubicazione ON giacenze_ownership(ubicazione_id);
    CREATE INDEX IF NOT EXISTS idx_giacenze_ownership_committente ON giacenze_ownership(committente_id);
    CREATE INDEX IF NOT EXISTS idx_movimenti_ottimizzati_committente ON movimenti_ottimizzati(committente_id);
    CREATE INDEX IF NOT EXISTS idx_movimenti_ottimizzati_timestamp ON movimenti_ottimizzati(timestamp_inizio);
    CREATE INDEX IF NOT EXISTS idx_prodotti_committente_v2_sku ON prodotti_committente_v2(committente_id, sku_code);
    CREATE INDEX IF NOT EXISTS idx_ordini_dettaglio_committente ON ordini_dettaglio(committente_id);
    CREATE INDEX IF NOT EXISTS idx_ubicazioni_zona ON ubicazioni(zona, attiva);
  `);

  console.log('🔄 Creando trigger timestamp...');
  const triggerTables = [
    ['sku_master', 'sku_code'],
    ['prodotti_committente_v2', 'id'],
    ['ubicazioni', 'id'],
    ['ordini_master', 'id']
  ];

  triggerTables.forEach(([table, idField]) => {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_${table}_timestamp 
      AFTER UPDATE ON ${table}
      BEGIN
        UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE ${idField} = NEW.${idField};
      END
    `);
  });

  console.log('🏗️ Inserendo dati di esempio...');
  
  // Magazzino principale
  db.exec(`
    INSERT OR IGNORE INTO magazzini (id, codice, nome, indirizzo, citta, cap, larghezza_metri, lunghezza_metri, altezza_metri, temperatura_min, temperatura_max) VALUES
    (1, 'MAG001', 'Magazzino Centrale Milano', 'Via Industriale 123', 'Milano', '20100', 60.0, 40.0, 8.0, 5.0, 35.0);
  `);

  // Zone logiche del magazzino
  db.exec(`
    INSERT OR IGNORE INTO zone_magazzino (magazzino_id, codice, nome, tipo, poligono_json, colore_hex) VALUES
    (1, 'RECV', 'Area Ricevimento', 'RECEIVING', '[{"x": 0, "y": 0}, {"x": 15, "y": 0}, {"x": 15, "y": 10}, {"x": 0, "y": 10}]', '#3B82F6'),
    (1, 'STOR-A', 'Stoccaggio Zona A', 'STORAGE', '[{"x": 15, "y": 0}, {"x": 35, "y": 0}, {"x": 35, "y": 25}, {"x": 15, "y": 25}]', '#10B981'),
    (1, 'STOR-B', 'Stoccaggio Zona B', 'STORAGE', '[{"x": 35, "y": 0}, {"x": 55, "y": 0}, {"x": 55, "y": 25}, {"x": 35, "y": 25}]', '#F59E0B'),
    (1, 'PICK', 'Area Picking', 'PICKING', '[{"x": 15, "y": 25}, {"x": 45, "y": 25}, {"x": 45, "y": 35}, {"x": 15, "y": 35}]', '#EF4444'),
    (1, 'PACK', 'Area Confezionamento', 'PACKING', '[{"x": 45, "y": 25}, {"x": 60, "y": 25}, {"x": 60, "y": 40}, {"x": 45, "y": 40}]', '#8B5CF6'),
    (1, 'SHIP', 'Area Spedizione', 'SHIPPING', '[{"x": 0, "y": 35}, {"x": 45, "y": 35}, {"x": 45, "y": 40}, {"x": 0, "y": 40}]', '#06B6D4'),
    (1, 'FRIGO', 'Cella Frigorifera', 'STORAGE', '[{"x": 55, "y": 0}, {"x": 60, "y": 0}, {"x": 60, "y": 25}, {"x": 55, "y": 25}]', '#14B8A6');
  `);

  // Corridoi principali
  db.exec(`
    INSERT OR IGNORE INTO corridoi (magazzino_id, codice, nome, larghezza_cm, percorso_json, tipo_pavimento) VALUES
    (1, 'CORR-MAIN', 'Corridoio Principale', 200, '[{"x": 15, "y": 12.5}, {"x": 45, "y": 12.5}]', 'cemento_industriale'),
    (1, 'CORR-A', 'Corridoio Zona A', 150, '[{"x": 25, "y": 0}, {"x": 25, "y": 25}]', 'cemento'),
    (1, 'CORR-B', 'Corridoio Zona B', 150, '[{"x": 45, "y": 0}, {"x": 45, "y": 25}]', 'cemento'),
    (1, 'CORR-PICK', 'Corridoio Picking', 180, '[{"x": 30, "y": 25}, {"x": 30, "y": 35}]', 'resina');
  `);
  
  // SKU Master di esempio  
  db.exec(`
    INSERT OR IGNORE INTO sku_master (sku_code, descrizione, categoria_generale, peso_kg, volume_cm3) VALUES
    ('SKU001', 'Smartphone Samsung Galaxy S23', 'Elettronica', 0.168, 65.5),
    ('SKU002', 'Notebook Lenovo ThinkPad', 'Informatica', 1.4, 2850.0),
    ('SKU003', 'Tavolo IKEA BEKANT', 'Arredo', 25.5, 125000.0),
    ('SKU004', 'Scarpe Nike Air Max', 'Abbigliamento', 0.8, 12000.0),
    ('SKU005', 'Libro "Il Nome della Rosa"', 'Libri', 0.6, 1800.0);
  `);

  // Ubicazioni con coordinate fisiche precise
  db.exec(`
    INSERT OR IGNORE INTO ubicazioni 
    (codice_ubicazione, zona, corridoio, scaffale, ripiano, tipo, coordinata_x, coordinata_y, larghezza_cm, profondita_cm, altezza_cm, 
     volume_max_cm3, peso_max_kg, colore_hex, zona_velocita, orientamento) VALUES
    
    -- Zona A - Scaffalature (HOT zone per articoli veloci)
    ('A-01-01-A', 'A', '01', '01', 1, 'SCAFFALE', 16.0, 2.0, 120, 80, 180, 100000, 50, '#10B981', 'HOT', 90),
    ('A-01-01-B', 'A', '01', '01', 2, 'SCAFFALE', 16.0, 3.2, 120, 80, 180, 100000, 50, '#10B981', 'HOT', 90),
    ('A-01-01-C', 'A', '01', '01', 3, 'SCAFFALE', 16.0, 4.4, 120, 80, 180, 100000, 50, '#10B981', 'HOT', 90),
    ('A-01-02-A', 'A', '01', '02', 1, 'SCAFFALE', 18.0, 2.0, 120, 80, 180, 100000, 50, '#10B981', 'HOT', 90),
    ('A-01-02-B', 'A', '01', '02', 2, 'SCAFFALE', 18.0, 3.2, 120, 80, 180, 100000, 50, '#10B981', 'HOT', 90),
    ('A-01-02-C', 'A', '01', '02', 3, 'SCAFFALE', 18.0, 4.4, 120, 80, 180, 100000, 50, '#10B981', 'HOT', 90),
    
    -- Zona B - Scaffalature (WARM zone per articoli medi)
    ('B-01-01-A', 'B', '01', '01', 1, 'SCAFFALE', 36.0, 2.0, 120, 80, 180, 150000, 75, '#F59E0B', 'WARM', 90),
    ('B-01-01-B', 'B', '01', '01', 2, 'SCAFFALE', 36.0, 3.2, 120, 80, 180, 150000, 75, '#F59E0B', 'WARM', 90),
    ('B-01-01-C', 'B', '01', '01', 3, 'SCAFFALE', 36.0, 4.4, 120, 80, 180, 150000, 75, '#F59E0B', 'WARM', 90),
    ('B-02-01-A', 'B', '02', '01', 1, 'SCAFFALE', 46.0, 2.0, 120, 80, 180, 150000, 75, '#F59E0B', 'WARM', 90),
    ('B-02-01-B', 'B', '02', '01', 2, 'SCAFFALE', 46.0, 3.2, 120, 80, 180, 150000, 75, '#F59E0B', 'WARM', 90),
    
    -- Zona Pallet (COLD zone per articoli lenti)
    ('C-PALLET-01', 'C', 'PALLET', '01', NULL, 'PALLET', 38.0, 10.0, 120, 80, 180, 1000000, 1000, '#6B7280', 'COLD', 0),
    ('C-PALLET-02', 'C', 'PALLET', '02', NULL, 'PALLET', 40.0, 10.0, 120, 80, 180, 1000000, 1000, '#6B7280', 'COLD', 0),
    ('C-PALLET-03', 'C', 'PALLET', '03', NULL, 'PALLET', 42.0, 10.0, 120, 80, 180, 1000000, 1000, '#6B7280', 'COLD', 0),
    
    -- Cella Frigorifera
    ('FRIGO-01-A', 'FRIGO', '01', '01', 1, 'FRIGO', 56.0, 5.0, 100, 60, 180, 80000, 40, '#14B8A6', 'WARM', 90),
    ('FRIGO-01-B', 'FRIGO', '01', '01', 2, 'FRIGO', 56.0, 6.0, 100, 60, 180, 80000, 40, '#14B8A6', 'WARM', 90),
    ('FRIGO-01-C', 'FRIGO', '01', '01', 3, 'FRIGO', 56.0, 7.0, 100, 60, 180, 80000, 40, '#14B8A6', 'WARM', 90),
    
    -- Aree di servizio
    ('RECV-DOCK-01', 'RECV', 'DOCK', '01', NULL, 'ENTRATA', 2.0, 5.0, 300, 200, 300, 0, 0, '#3B82F6', 'HOT', 0),
    ('RECV-DOCK-02', 'RECV', 'DOCK', '02', NULL, 'ENTRATA', 5.0, 5.0, 300, 200, 300, 0, 0, '#3B82F6', 'HOT', 0),
    ('SHIP-DOCK-01', 'SHIP', 'DOCK', '01', NULL, 'USCITA', 2.0, 37.0, 300, 200, 300, 0, 0, '#06B6D4', 'HOT', 180),
    ('SHIP-DOCK-02', 'SHIP', 'DOCK', '02', NULL, 'USCITA', 5.0, 37.0, 300, 200, 300, 0, 0, '#06B6D4', 'HOT', 180);
  `);

  // Prodotti committente di esempio per committente 1
  db.exec(`
    INSERT OR IGNORE INTO prodotti_committente_v2 
    (committente_id, sku_code, codice_interno, prezzo_acquisto, prezzo_vendita, scorta_minima, scorta_massima, attivo) 
    VALUES
    (1, 'SKU001', 'PHONE001', 450.00, 799.00, 10, 100, 1),
    (1, 'SKU002', 'LAPTOP001', 850.00, 1299.00, 5, 50, 1),
    (1, 'SKU003', 'TABLE001', 65.00, 129.00, 2, 20, 1);
  `);

  // Giacenze logiche di esempio
  db.exec(`
    INSERT OR IGNORE INTO giacenze_logiche 
    (committente_id, sku_code, quantita_disponibile, quantita_riservata, costo_medio_ponderato) 
    VALUES
    (1, 'SKU001', 45, 5, 450.00),
    (1, 'SKU002', 12, 2, 850.00),
    (1, 'SKU003', 8, 1, 65.00);
  `);

  // Giacenze fisiche di esempio
  db.exec(`
    INSERT OR IGNORE INTO giacenze_fisiche 
    (ubicazione_id, sku_code, quantita_totale, volume_occupato_cm3, peso_totale_kg) 
    VALUES
    (1, 'SKU001', 25, 1637.5, 4.2),
    (2, 'SKU001', 25, 1637.5, 4.2),
    (3, 'SKU002', 14, 39900.0, 19.6),
    (6, 'SKU003', 9, 1125000.0, 229.5);
  `);

  console.log('✅ Migrazione database completata!');
  console.log('');
  console.log('📋 Tabelle create:');
  console.log('   • sku_master - Prodotti univoci cross-committente');
  console.log('   • prodotti_committente_v2 - Mapping prodotti per committente');
  console.log('   • ubicazioni - Sistema chaotic storage');
  console.log('   • giacenze_fisiche - Giacenze fisiche per ubicazione');
  console.log('   • giacenze_logiche - Proprietà virtuale per committente');
  console.log('   • giacenze_ownership - Tracciabilità FIFO dettagliata');
  console.log('   • movimenti_ottimizzati - Movimenti Amazon-style');
  console.log('   • ordini_master/dettaglio - Sistema ordini multi-seller');
  console.log('');
  console.log('🚀 Il sistema è ora pronto per il modello multicommittente avanzato!');

} catch (error) {
  console.error('❌ Errore durante la migrazione:', error);
  process.exit(1);
} finally {
  db.close();
}