import Database from 'better-sqlite3';
import path from 'path';
// import { DB_PATH } from '$env/static/private';

// Inizializza il database con percorso assoluto
const dbPath = path.resolve(process.cwd(), 'database/magazzino.db');
console.log('Initializing database at:', dbPath);

let db: Database.Database;
try {
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  console.log('Database initialized successfully. Methods:', Object.getOwnPropertyNames(db));
  console.log('Database prepare method available:', typeof db.prepare);
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

// Creazione tabelle per sistema MULTICOMMITTENTE
export function initializeDatabase() {
  // Tabella COMMITTENTI (priorità assoluta)
  db.exec(`
    CREATE TABLE IF NOT EXISTS committenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codice TEXT UNIQUE NOT NULL,
      ragione_sociale TEXT NOT NULL,
      partita_iva TEXT,
      codice_fiscale TEXT,
      indirizzo_sede TEXT,
      indirizzo_fatturazione TEXT,
      cap TEXT,
      citta TEXT,
      provincia TEXT,
      telefono TEXT,
      email TEXT,
      pec TEXT,
      referente_principale TEXT,
      tipo_contratto TEXT CHECK(tipo_contratto IN ('deposito', 'logistica', 'misto')) DEFAULT 'deposito',
      data_inizio_rapporto DATE,
      data_fine_rapporto DATE,
      stato TEXT CHECK(stato IN ('attivo', 'sospeso', 'cessato')) DEFAULT 'attivo',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella UTENTI (per gestione accessi multilivello)
  db.exec(`
    CREATE TABLE IF NOT EXISTS utenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      ruolo TEXT CHECK(ruolo IN ('super_admin', 'admin_committente', 'operatore_magazzino', 'team_leader', 'utente_committente', 'ospite')) NOT NULL,
      specializzazione TEXT,
      committente_id INTEGER,
      attivo INTEGER DEFAULT 1,
      ultimo_accesso DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id)
    )
  `);

  // Tabella CATEGORIE (per committente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorie (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      codice TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      attiva INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      UNIQUE(committente_id, codice)
    )
  `);

  // Tabella UNITÀ DI MISURA (globali o per committente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS unita_misura (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER,
      codice TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('sistema', 'personalizzata')) DEFAULT 'personalizzata',
      attiva INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id)
    )
  `);

  // Tabella FORNITORI
  db.exec(`
    CREATE TABLE IF NOT EXISTS fornitori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codice TEXT NOT NULL,
      ragione_sociale TEXT NOT NULL,
      partita_iva TEXT,
      codice_fiscale TEXT,
      indirizzo TEXT,
      cap TEXT,
      citta TEXT,
      provincia TEXT,
      telefono TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella di collegamento FORNITORI-COMMITTENTI (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS committenti_fornitori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      fornitore_id INTEGER NOT NULL,
      attivo INTEGER DEFAULT 1,
      condizioni_specifiche TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (fornitore_id) REFERENCES fornitori(id),
      UNIQUE(committente_id, fornitore_id)
    )
  `);

  // Tabella PRODOTTI (sempre legati a un committente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS prodotti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      codice TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      categoria_id INTEGER NOT NULL,
      unita_misura_id INTEGER NOT NULL,
      prezzo_acquisto REAL DEFAULT 0,
      prezzo_vendita REAL DEFAULT 0,
      scorta_minima INTEGER DEFAULT 0,
      scorta_massima INTEGER DEFAULT 0,
      ubicazione TEXT,
      lotto_partita TEXT,
      note TEXT,
      attivo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (categoria_id) REFERENCES categorie(id),
      FOREIGN KEY (unita_misura_id) REFERENCES unita_misura(id),
      UNIQUE(committente_id, codice)
    )
  `);

  // Tabella MOVIMENTI (sempre per committente) - CON ORDER TRACKING
  db.exec(`
    CREATE TABLE IF NOT EXISTS movimenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id_origine INTEGER NOT NULL,
      committente_id_destinazione INTEGER,
      tipo_movimento TEXT NOT NULL CHECK(tipo_movimento IN (
        'CARICO', 'SCARICO', 'TRASFERIMENTO_INTERNO', 
        'TRASFERIMENTO_INTER_COMMITTENTE', 'RETTIFICA_POS', 
        'RETTIFICA_NEG', 'RESO_CLIENTE', 'RESO_FORNITORE'
      )),
      prodotto_id INTEGER NOT NULL,
      quantita INTEGER NOT NULL,
      prezzo REAL DEFAULT 0,
      fornitore_id INTEGER,
      ordine_id INTEGER,
      numero_documento TEXT,
      data_documento DATE,
      causale TEXT,
      operatore TEXT,
      note TEXT,
      data_movimento DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id_origine) REFERENCES committenti(id),
      FOREIGN KEY (committente_id_destinazione) REFERENCES committenti(id),
      FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
      FOREIGN KEY (fornitore_id) REFERENCES fornitori(id),
      FOREIGN KEY (ordine_id) REFERENCES ordini(id)
    )
  `);

  // Tabella GIACENZE (per committente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS giacenze (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      prodotto_id INTEGER NOT NULL,
      quantita INTEGER DEFAULT 0,
      valore_medio REAL DEFAULT 0,
      ultima_modifica DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
      UNIQUE(committente_id, prodotto_id)
    )
  `);

  // Tabella INVENTARI (per committente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventari (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      codice_inventario TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('TOTALE', 'PARZIALE', 'CICLICO')) NOT NULL,
      stato TEXT CHECK(stato IN ('PIANIFICATO', 'IN_CORSO', 'COMPLETATO', 'ANNULLATO')) DEFAULT 'PIANIFICATO',
      data_pianificazione DATE NOT NULL,
      data_inizio DATETIME,
      data_fine DATETIME,
      operatore_responsabile TEXT,
      categoria_id INTEGER,
      ubicazione_filtro TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (categoria_id) REFERENCES categorie(id),
      UNIQUE(committente_id, codice_inventario)
    )
  `);

  // Tabella CONTEGGI_PRODOTTI (dettaglio inventari)
  db.exec(`
    CREATE TABLE IF NOT EXISTS conteggi_prodotti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventario_id INTEGER NOT NULL,
      prodotto_id INTEGER NOT NULL,
      giacenza_sistema INTEGER NOT NULL,
      quantita_contata INTEGER,
      differenza INTEGER GENERATED ALWAYS AS (quantita_contata - giacenza_sistema) STORED,
      operatore_conteggio TEXT,
      timestamp_conteggio DATETIME,
      note_conteggio TEXT,
      verificato INTEGER DEFAULT 0,
      FOREIGN KEY (inventario_id) REFERENCES inventari(id) ON DELETE CASCADE,
      FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
      UNIQUE(inventario_id, prodotto_id)
    )
  `);

  // INDICI per performance (CRITICI per multicommittente)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_categorie_committente ON categorie(committente_id);
    CREATE INDEX IF NOT EXISTS idx_prodotti_committente ON prodotti(committente_id);
    CREATE INDEX IF NOT EXISTS idx_movimenti_committente_origine ON movimenti(committente_id_origine);
    CREATE INDEX IF NOT EXISTS idx_movimenti_ordine ON movimenti(ordine_id);
    CREATE INDEX IF NOT EXISTS idx_giacenze_committente ON giacenze(committente_id);
    CREATE INDEX IF NOT EXISTS idx_utenti_committente ON utenti(committente_id);
    CREATE INDEX IF NOT EXISTS idx_committenti_fornitori_committente ON committenti_fornitori(committente_id);
    CREATE INDEX IF NOT EXISTS idx_inventari_committente ON inventari(committente_id);
    CREATE INDEX IF NOT EXISTS idx_inventari_stato ON inventari(stato);
    CREATE INDEX IF NOT EXISTS idx_conteggi_inventario ON conteggi_prodotti(inventario_id);
    CREATE INDEX IF NOT EXISTS idx_conteggi_prodotto ON conteggi_prodotti(prodotto_id);
  `);

  // TRIGGER per aggiornare updated_at
  const tables = ['committenti', 'utenti', 'categorie', 'unita_misura', 'fornitori', 'prodotti', 'movimenti', 'inventari'];
  tables.forEach(table => {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_${table}_timestamp 
      AFTER UPDATE ON ${table}
      BEGIN
        UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);
  });

  // === SISTEMA ORDINI SEMPLIFICATO ===
  
  // Tabella ORDINI (sistema semplificato per committenti)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ordini (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      numero_ordine TEXT NOT NULL,
      tipo_ordine TEXT NOT NULL CHECK (tipo_ordine IN ('INBOUND', 'OUTBOUND')),
      stato TEXT NOT NULL DEFAULT 'NUOVO' CHECK (stato IN ('BOZZA', 'NUOVO', 'CONFERMATO', 'IN_PREPARAZIONE', 'PRONTO', 'SPEDITO', 'CONSEGNATO', 'ANNULLATO', 'RESO')),
      data_ordine DATE NOT NULL DEFAULT (date('now')),
      data_richiesta DATE,
      data_spedizione DATE,
      cliente_fornitore TEXT,
      indirizzo_destinazione TEXT,
      contatti_destinazione TEXT,
      corriere TEXT,
      tracking_number TEXT,
      note_spedizione TEXT,
      totale_colli INTEGER DEFAULT 0,
      totale_peso_kg REAL,
      totale_valore REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      UNIQUE(committente_id, numero_ordine)
    )
  `);

  // Tabella DETTAGLIO ORDINI
  db.exec(`
    CREATE TABLE IF NOT EXISTS ordini_dettaglio_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordine_id INTEGER NOT NULL,
      prodotto_id INTEGER NOT NULL,
      quantita_ordinata INTEGER NOT NULL,
      quantita_evasa INTEGER DEFAULT 0,
      prezzo_unitario REAL,
      note_riga TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ordine_id) REFERENCES ordini(id) ON DELETE CASCADE,
      FOREIGN KEY (prodotto_id) REFERENCES prodotti(id)
    )
  `);

  // Tabella TRACKING ORDINI (storico cambi stato)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ordini_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordine_id INTEGER NOT NULL,
      stato_precedente TEXT,
      stato_nuovo TEXT NOT NULL,
      note TEXT,
      data_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ordine_id) REFERENCES ordini(id) ON DELETE CASCADE
    )
  `);

  // === TABELLE MODELLO MULTICOMMITTENTE AMAZON-STYLE ===
  
  // SKU Master (prodotto univoco cross-committente)
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

  // Prodotti committente (mapping a SKU master) - AGGIORNATO
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

  // Ubicazioni (Chaotic Storage)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ubicazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codice_ubicazione TEXT UNIQUE NOT NULL,
      zona TEXT NOT NULL,
      corridoio TEXT,
      scaffale TEXT,
      ripiano INTEGER,
      posizione TEXT,
      tipo TEXT CHECK(tipo IN ('SCAFFALE', 'PALLET', 'FRIGO', 'CONGELATORE', 'QUARANTENA')) DEFAULT 'SCAFFALE',
      volume_max_cm3 REAL,
      peso_max_kg REAL,
      volume_occupato_cm3 REAL DEFAULT 0,
      peso_attuale_kg REAL DEFAULT 0,
      accessibilita TEXT CHECK(accessibilita IN ('DIRETTA', 'SCALA', 'MULETTO')) DEFAULT 'DIRETTA',
      temperatura_controllata INTEGER DEFAULT 0,
      temperatura_attuale REAL,
      attiva INTEGER DEFAULT 1,
      priorita_picking INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Giacenze fisiche (dove è fisicamente la merce)
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

  // Giacenze logiche (proprietà virtuale per committente)
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

  // Dettaglio proprietà (quale pezzo è di chi - tracciabilità FIFO)
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

  // Movimenti ottimizzati (tracking dettagliato)
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

  // Ordini multi-seller
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

  // Dettaglio ordini per committente
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

  // Indici per performance (aggiornati per sistema ordini)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ordini_committente ON ordini(committente_id);
    CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
    CREATE INDEX IF NOT EXISTS idx_ordini_data ON ordini(data_ordine);
    CREATE INDEX IF NOT EXISTS idx_ordini_numero ON ordini(numero_ordine);
    CREATE INDEX IF NOT EXISTS idx_ordini_dettaglio_ordine ON ordini_dettaglio_new(ordine_id);
    CREATE INDEX IF NOT EXISTS idx_ordini_tracking_ordine ON ordini_tracking(ordine_id);
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

  // Trigger per aggiornare timestamp delle nuove tabelle
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_sku_master_timestamp 
    AFTER UPDATE ON sku_master
    BEGIN
      UPDATE sku_master SET updated_at = CURRENT_TIMESTAMP WHERE sku_code = NEW.sku_code;
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_prodotti_committente_v2_timestamp 
    AFTER UPDATE ON prodotti_committente_v2
    BEGIN
      UPDATE prodotti_committente_v2 SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_ubicazioni_timestamp 
    AFTER UPDATE ON ubicazioni
    BEGIN
      UPDATE ubicazioni SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_ordini_master_timestamp 
    AFTER UPDATE ON ordini_master
    BEGIN
      UPDATE ordini_master SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);

  // TRIGGER per aggiornare giacenze dopo movimento (CRITICO)
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS aggiorna_giacenza_dopo_movimento
    AFTER INSERT ON movimenti
    BEGIN
      -- Inserisci o aggiorna giacenza per committente origine
      INSERT INTO giacenze (committente_id, prodotto_id, quantita)
      VALUES (NEW.committente_id_origine, NEW.prodotto_id, 
        CASE 
          WHEN NEW.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE') THEN NEW.quantita
          WHEN NEW.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE') THEN -NEW.quantita
          ELSE 0
        END
      )
      ON CONFLICT(committente_id, prodotto_id) DO UPDATE SET
        quantita = quantita + 
          CASE 
            WHEN NEW.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE') THEN NEW.quantita
            WHEN NEW.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE') THEN -NEW.quantita
            ELSE 0
          END,
        ultima_modifica = CURRENT_TIMESTAMP;
        
      -- Per trasferimenti inter-committente, aggiorna anche destinazione
      INSERT INTO giacenze (committente_id, prodotto_id, quantita)
      SELECT NEW.committente_id_destinazione, NEW.prodotto_id, NEW.quantita
      WHERE NEW.tipo_movimento = 'TRASFERIMENTO_INTER_COMMITTENTE' 
        AND NEW.committente_id_destinazione IS NOT NULL
      ON CONFLICT(committente_id, prodotto_id) DO UPDATE SET
        quantita = quantita + NEW.quantita,
        ultima_modifica = CURRENT_TIMESTAMP;
    END;
  `);

  // === SISTEMA AUDIT TRAIL ===
  
  // Tabella AUDIT_TRAIL (tracking completo tutte le operazioni)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_trail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- IDENTIFICAZIONE OPERAZIONE
      operazione_id TEXT NOT NULL, -- UUID o ID univoco operazione
      tabella_principale TEXT NOT NULL, -- Tabella interessata
      tipo_operazione TEXT NOT NULL CHECK(tipo_operazione IN (
        'CREATE', 'READ', 'UPDATE', 'DELETE', 
        'LOGIN', 'LOGOUT', 'MOVIMENTO', 'ORDINE',
        'CARICO', 'SCARICO', 'INVENTARIO', 'TRASFERIMENTO'
      )),
      
      -- DETTAGLI OPERAZIONE
      descrizione_operazione TEXT NOT NULL, -- es: "Carico prodotto XYZ"
      entita_coinvolte TEXT, -- JSON con ID delle entità coinvolte
      dati_precedenti TEXT, -- JSON con dati before (per UPDATE/DELETE)
      dati_nuovi TEXT, -- JSON con dati after (per CREATE/UPDATE)
      
      -- UTENTE E CONTESTO
      utente_id INTEGER NOT NULL,
      utente_nome TEXT NOT NULL,
      utente_email TEXT NOT NULL,
      committente_id INTEGER, -- Se operazione è legata a committente specifico
      committente_nome TEXT,
      
      -- METADATA TECNICA
      indirizzo_ip TEXT,
      user_agent TEXT,
      device_info TEXT,
      sessione_id TEXT,
      
      -- BUSINESS CONTEXT
      modulo TEXT NOT NULL, -- es: "MOVIMENTI", "ORDINI", "GIACENZE"
      funzionalita TEXT, -- es: "carico_magazzino", "crea_ordine"
      importanza TEXT CHECK(importanza IN ('BASSA', 'MEDIA', 'ALTA', 'CRITICA')) DEFAULT 'MEDIA',
      
      -- RISULTATO OPERAZIONE
      esito TEXT CHECK(esito IN ('SUCCESSO', 'ERRORE', 'WARNING')) DEFAULT 'SUCCESSO',
      messaggio_errore TEXT, -- Se esito = ERRORE
      durata_ms INTEGER, -- Tempo di esecuzione
      
      -- TIMESTAMP
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_operazione DATE DEFAULT (date('now')),
      ora_operazione TIME DEFAULT (time('now')),
      
      FOREIGN KEY (utente_id) REFERENCES utenti(id),
      FOREIGN KEY (committente_id) REFERENCES committenti(id)
    )
  `);

  // Tabella SESSIONI_UTENTI (tracking sessioni e accessi)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessioni_utenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL,
      sessione_id TEXT UNIQUE NOT NULL,
      
      -- ACCESSO
      data_login DATETIME DEFAULT CURRENT_TIMESTAMP,
      indirizzo_ip TEXT,
      user_agent TEXT,
      device_type TEXT, -- desktop, mobile, tablet
      browser TEXT,
      os TEXT,
      
      -- ATTIVITA' SESSIONE
      ultimo_accesso DATETIME DEFAULT CURRENT_TIMESTAMP,
      pagine_visitate INTEGER DEFAULT 0,
      operazioni_eseguite INTEGER DEFAULT 0,
      committente_corrente_id INTEGER, -- Ultimo committente selezionato
      
      -- CHIUSURA
      data_logout DATETIME,
      durata_sessione_minuti INTEGER,
      motivo_chiusura TEXT, -- logout, timeout, forced_logout
      
      -- STATO
      attiva BOOLEAN DEFAULT 1,
      
      FOREIGN KEY (utente_id) REFERENCES utenti(id),
      FOREIGN KEY (committente_corrente_id) REFERENCES committenti(id)
    )
  `);

  // Tabella PREFERENZE_UTENTE (configurazioni personali)
  db.exec(`
    CREATE TABLE IF NOT EXISTS preferenze_utente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL,
      
      -- INTERFACCIA
      tema TEXT DEFAULT 'light', -- light, dark, auto
      lingua TEXT DEFAULT 'it',
      fuso_orario TEXT DEFAULT 'Europe/Rome',
      formato_data TEXT DEFAULT 'DD/MM/YYYY',
      formato_ora TEXT DEFAULT '24h',
      
      -- DASHBOARD
      dashboard_layout TEXT, -- JSON con layout personalizzato
      widget_preferiti TEXT, -- JSON con widget abilitati
      
      -- FILTRI DEFAULT
      committente_default_id INTEGER,
      categoria_default_id INTEGER,
      
      -- NOTIFICHE
      notifiche_email BOOLEAN DEFAULT 1,
      notifiche_browser BOOLEAN DEFAULT 1,
      notifiche_mobile BOOLEAN DEFAULT 0,
      
      -- MENU E NAVIGAZIONE  
      menu_compatto BOOLEAN DEFAULT 0,
      ricordi_ultima_pagina BOOLEAN DEFAULT 1,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (utente_id) REFERENCES utenti(id),
      FOREIGN KEY (committente_default_id) REFERENCES committenti(id),
      UNIQUE(utente_id)
    )
  `);

  // Tabella NOTIFICHE_SISTEMA (alert e comunicazioni)
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifiche_sistema (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- DESTINATARIO
      utente_destinatario_id INTEGER, -- Se NULL = broadcast
      committente_destinatario_id INTEGER, -- Se NULL = tutti
      ruolo_destinatario TEXT, -- Se valorizzato = per ruolo
      
      -- CONTENUTO
      titolo TEXT NOT NULL,
      messaggio TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS')) DEFAULT 'INFO',
      priorita TEXT CHECK(priorita IN ('BASSA', 'MEDIA', 'ALTA', 'URGENTE')) DEFAULT 'MEDIA',
      
      -- AZIONE COLLEGATA
      azione_url TEXT, -- URL per azione correlata
      azione_label TEXT, -- Testo pulsante azione
      
      -- METADATA
      modulo_origine TEXT, -- Da quale modulo viene la notifica
      evento_scatenante TEXT, -- Evento che ha generato notifica
      dati_aggiuntivi TEXT, -- JSON con dati extra
      
      -- STATO
      letta BOOLEAN DEFAULT 0,
      data_lettura DATETIME,
      archiviata BOOLEAN DEFAULT 0,
      
      -- SCADENZA
      data_scadenza DATETIME, -- Dopo questa data non mostrare
      
      -- TIMESTAMP
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (utente_destinatario_id) REFERENCES utenti(id),
      FOREIGN KEY (committente_destinatario_id) REFERENCES committenti(id)
    )
  `);

  // Indici per performance audit system
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_trail_utente ON audit_trail(utente_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_committente ON audit_trail(committente_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_operazione ON audit_trail(tipo_operazione, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_tabella ON audit_trail(tabella_principale, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_data ON audit_trail(data_operazione, ora_operazione);
    CREATE INDEX IF NOT EXISTS idx_sessioni_utente ON sessioni_utenti(utente_id, attiva);
    CREATE INDEX IF NOT EXISTS idx_sessioni_sessione_id ON sessioni_utenti(sessione_id);
    CREATE INDEX IF NOT EXISTS idx_notifiche_destinatario ON notifiche_sistema(utente_destinatario_id, letta);
    CREATE INDEX IF NOT EXISTS idx_notifiche_committente ON notifiche_sistema(committente_destinatario_id, letta);
  `);

  // Trigger per audit trail automatico su tabelle critiche
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS audit_movimenti_insert
    AFTER INSERT ON movimenti
    BEGIN
      INSERT INTO audit_trail (
        operazione_id, tabella_principale, tipo_operazione, descrizione_operazione,
        entita_coinvolte, dati_nuovi, utente_id, utente_nome, utente_email, 
        committente_id, modulo, funzionalita, importanza
      ) VALUES (
        'MOV_' || NEW.id || '_' || strftime('%Y%m%d%H%M%S', 'now'),
        'movimenti',
        'MOVIMENTO',
        'Nuovo movimento: ' || NEW.tipo_movimento || ' - Qta: ' || NEW.quantita,
        json_object(
          'movimento_id', NEW.id,
          'prodotto_id', NEW.prodotto_id,
          'ordine_id', NEW.ordine_id
        ),
        json_object(
          'tipo_movimento', NEW.tipo_movimento,
          'quantita', NEW.quantita,
          'prezzo', NEW.prezzo,
          'note', NEW.note
        ),
        COALESCE((SELECT id FROM utenti WHERE nome = NEW.operatore LIMIT 1), 1),
        COALESCE(NEW.operatore, 'Sistema'),
        COALESCE((SELECT email FROM utenti WHERE nome = NEW.operatore LIMIT 1), 'system@magazzino.it'),
        NEW.committente_id_origine,
        'MOVIMENTI',
        'registrazione_movimento',
        'ALTA'
      );
    END
  `);

  // Inserisci dati di esempio SOLO se tabella committenti è vuota
  const count = db.prepare('SELECT COUNT(*) as count FROM committenti').get() as { count: number };
  
  if (count.count === 0) {
    console.log('Inserimento dati di esempio...');
    
    // Committenti di esempio
    db.exec(`
      INSERT INTO committenti (codice, ragione_sociale, partita_iva, email, stato) VALUES
      ('COMM001', 'Azienda Alpha S.r.l.', '12345678901', 'admin@alpha.it', 'attivo'),
      ('COMM002', 'Beta Industries', '98765432109', 'contatti@beta.com', 'attivo'),
      ('COMM003', 'Gamma Logistics', '11223344556', 'info@gamma.it', 'attivo');
    `);

    // Unità di misura globali di sistema
    db.exec(`
      INSERT INTO unita_misura (committente_id, codice, descrizione, tipo) VALUES
      (NULL, 'PZ', 'Pezzo', 'sistema'),
      (NULL, 'KG', 'Chilogrammo', 'sistema'),
      (NULL, 'LT', 'Litro', 'sistema'),
      (NULL, 'MT', 'Metro', 'sistema'),
      (NULL, 'MQ', 'Metro Quadrato', 'sistema'),
      (NULL, 'SCATOLA', 'Scatola', 'sistema'),
      (NULL, 'PALLET', 'Pallet', 'sistema');
    `);

    // Utente super admin
    db.exec(`
      INSERT INTO utenti (email, password_hash, nome, cognome, ruolo, attivo) VALUES
      ('admin@magazzino.it', '$2a$10$example.hash.here', 'Super', 'Admin', 'super_admin', 1);
    `);

    console.log('Database inizializzato con dati di esempio!');
  }
}

// Initialize database on import
initializeDatabase();

export { db };
export default db;