CREATE TABLE committenti (
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
    );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE utenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      ruolo TEXT CHECK(ruolo IN ('super_admin', 'admin_committente', 'operatore_magazzino', 'utente_committente', 'ospite')) NOT NULL,
      committente_id INTEGER,
      attivo INTEGER DEFAULT 1,
      ultimo_accesso DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, specializzazione TEXT,
      FOREIGN KEY (committente_id) REFERENCES committenti(id)
    );
CREATE TABLE categorie (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      codice TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      attiva INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      UNIQUE(committente_id, codice)
    );
CREATE TABLE unita_misura (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER,
      codice TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('sistema', 'personalizzata')) DEFAULT 'personalizzata',
      attiva INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id)
    );
CREATE TABLE fornitori (
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
    );
CREATE TABLE committenti_fornitori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      fornitore_id INTEGER NOT NULL,
      attivo INTEGER DEFAULT 1,
      condizioni_specifiche TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (fornitore_id) REFERENCES fornitori(id),
      UNIQUE(committente_id, fornitore_id)
    );
CREATE TABLE prodotti (
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
    );
CREATE TABLE giacenze (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      committente_id INTEGER NOT NULL,
      prodotto_id INTEGER NOT NULL,
      quantita INTEGER DEFAULT 0,
      valore_medio REAL DEFAULT 0,
      ultima_modifica DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id),
      FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
      UNIQUE(committente_id, prodotto_id)
    );
CREATE INDEX idx_categorie_committente ON categorie(committente_id);
CREATE INDEX idx_prodotti_committente ON prodotti(committente_id);
CREATE INDEX idx_giacenze_committente ON giacenze(committente_id);
CREATE INDEX idx_utenti_committente ON utenti(committente_id);
CREATE INDEX idx_committenti_fornitori_committente ON committenti_fornitori(committente_id);
CREATE TRIGGER update_committenti_timestamp 
      AFTER UPDATE ON committenti
      BEGIN
        UPDATE committenti SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TRIGGER update_utenti_timestamp 
      AFTER UPDATE ON utenti
      BEGIN
        UPDATE utenti SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TRIGGER update_categorie_timestamp 
      AFTER UPDATE ON categorie
      BEGIN
        UPDATE categorie SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TRIGGER update_unita_misura_timestamp 
      AFTER UPDATE ON unita_misura
      BEGIN
        UPDATE unita_misura SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TRIGGER update_fornitori_timestamp 
      AFTER UPDATE ON fornitori
      BEGIN
        UPDATE fornitori SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TRIGGER update_prodotti_timestamp 
      AFTER UPDATE ON prodotti
      BEGIN
        UPDATE prodotti SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TABLE inventari (
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
    );
CREATE TABLE conteggi_prodotti (
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
    );
CREATE INDEX idx_inventari_committente ON inventari(committente_id);
CREATE INDEX idx_inventari_stato ON inventari(stato);
CREATE INDEX idx_conteggi_inventario ON conteggi_prodotti(inventario_id);
CREATE INDEX idx_conteggi_prodotto ON conteggi_prodotti(prodotto_id);
CREATE TRIGGER update_inventari_timestamp 
      AFTER UPDATE ON inventari
      BEGIN
        UPDATE inventari SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TABLE sku_master (
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
    );
CREATE TABLE prodotti_committente_v2 (
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
    );
CREATE TABLE magazzini (
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
    );
CREATE TABLE ubicazioni (
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
    );
CREATE TABLE corridoi (
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
    );
CREATE TABLE zone_magazzino (
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
    );
CREATE TABLE giacenze_fisiche (
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
    );
CREATE TABLE giacenze_logiche (
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
    );
CREATE TABLE giacenze_ownership (
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
    );
CREATE TABLE movimenti_ottimizzati (
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
    );
CREATE TABLE ordini_master (
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
    );
CREATE TABLE ordini_dettaglio (
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
    );
CREATE INDEX idx_giacenze_logiche_committente ON giacenze_logiche(committente_id);
CREATE INDEX idx_giacenze_fisiche_ubicazione ON giacenze_fisiche(ubicazione_id);
CREATE INDEX idx_giacenze_ownership_ubicazione ON giacenze_ownership(ubicazione_id);
CREATE INDEX idx_giacenze_ownership_committente ON giacenze_ownership(committente_id);
CREATE INDEX idx_movimenti_ottimizzati_committente ON movimenti_ottimizzati(committente_id);
CREATE INDEX idx_movimenti_ottimizzati_timestamp ON movimenti_ottimizzati(timestamp_inizio);
CREATE INDEX idx_prodotti_committente_v2_sku ON prodotti_committente_v2(committente_id, sku_code);
CREATE INDEX idx_ordini_dettaglio_committente ON ordini_dettaglio(committente_id);
CREATE INDEX idx_ubicazioni_zona ON ubicazioni(zona, attiva);
CREATE TRIGGER update_sku_master_timestamp 
      AFTER UPDATE ON sku_master
      BEGIN
        UPDATE sku_master SET updated_at = CURRENT_TIMESTAMP WHERE sku_code = NEW.sku_code;
      END;
CREATE TRIGGER update_prodotti_committente_v2_timestamp 
      AFTER UPDATE ON prodotti_committente_v2
      BEGIN
        UPDATE prodotti_committente_v2 SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TRIGGER update_ubicazioni_timestamp 
      AFTER UPDATE ON ubicazioni
      BEGIN
        UPDATE ubicazioni SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TRIGGER update_ordini_master_timestamp 
      AFTER UPDATE ON ordini_master
      BEGIN
        UPDATE ordini_master SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE TABLE IF NOT EXISTS "ordini_old" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  committente_id INTEGER NOT NULL,
  numero_ordine VARCHAR(50) NOT NULL,
  tipo_ordine VARCHAR(20) NOT NULL CHECK (tipo_ordine IN ('INBOUND', 'OUTBOUND')),
  stato VARCHAR(30) NOT NULL DEFAULT 'NUOVO' CHECK (stato IN ('BOZZA', 'NUOVO', 'CONFERMATO', 'IN_PREPARAZIONE', 'PRONTO', 'SPEDITO', 'CONSEGNATO', 'ANNULLATO', 'RESO')),
  data_ordine DATE NOT NULL DEFAULT (date('now')),
  data_richiesta DATE,
  data_spedizione DATE,
  
  -- Soggetti coinvolti
  cliente_fornitore VARCHAR(200),
  indirizzo_destinazione TEXT,
  contatti_destinazione VARCHAR(200),
  
  -- Logistica
  corriere VARCHAR(100),
  tracking_number VARCHAR(100),
  note_spedizione TEXT,
  
  -- Totali
  totale_colli INTEGER DEFAULT 0,
  totale_peso_kg DECIMAL(10,3),
  totale_valore DECIMAL(12,2),
  
  -- Metadati
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (committente_id) REFERENCES committenti(id),
  UNIQUE(committente_id, numero_ordine)
);
CREATE TABLE ordini_dettaglio_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordine_id INTEGER NOT NULL,
  prodotto_id INTEGER NOT NULL,
  quantita_ordinata INTEGER NOT NULL,
  quantita_evasa INTEGER DEFAULT 0,
  prezzo_unitario DECIMAL(10,2),
  note_riga TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ordine_id) REFERENCES "ordini_old"(id) ON DELETE CASCADE,
  FOREIGN KEY (prodotto_id) REFERENCES prodotti(id)
);
CREATE TABLE ordini_documenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordine_id INTEGER NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('DDT', 'FATTURA', 'BOLLA', 'CONFERMA')),
  numero_documento VARCHAR(50),
  data_documento DATE,
  file_path VARCHAR(500),
  
  FOREIGN KEY (ordine_id) REFERENCES "ordini_old"(id) ON DELETE CASCADE
);
CREATE INDEX idx_ordini_dettaglio_ordine ON ordini_dettaglio_new(ordine_id);
CREATE TABLE IF NOT EXISTS "ordini" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  committente_id INTEGER NOT NULL,
  numero_ordine VARCHAR(50) NOT NULL,
  tipo_ordine VARCHAR(20) NOT NULL CHECK (tipo_ordine IN ('INBOUND', 'OUTBOUND')),
  stato VARCHAR(30) NOT NULL DEFAULT 'NUOVO',
  data_ordine DATE NOT NULL DEFAULT (date('now')),
  data_richiesta DATE,
  data_spedizione DATE,
  
  -- Soggetti coinvolti
  cliente_fornitore VARCHAR(200),
  indirizzo_destinazione TEXT,
  contatti_destinazione VARCHAR(200),
  
  -- Logistica
  corriere VARCHAR(100),
  tracking_number VARCHAR(100),
  note_spedizione TEXT,
  
  -- Totali
  totale_colli INTEGER DEFAULT 0,
  totale_peso_kg DECIMAL(10,3),
  totale_valore DECIMAL(12,2),
  
  -- Metadati
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (committente_id) REFERENCES committenti(id),
  UNIQUE(committente_id, numero_ordine),
  
  -- Constraint per stati specifici per tipo ordine
  CHECK (
    (tipo_ordine = 'INBOUND' AND stato IN ('NUOVO', 'IN_PREPARAZIONE', 'CONSEGNATO', 'ANNULLATO')) OR
    (tipo_ordine = 'OUTBOUND' AND stato IN ('BOZZA', 'NUOVO', 'CONFERMATO', 'IN_PREPARAZIONE', 'PRONTO', 'SPEDITO', 'CONSEGNATO', 'ANNULLATO', 'RESO'))
  )
);
CREATE INDEX idx_ordini_committente ON ordini(committente_id);
CREATE INDEX idx_ordini_stato ON ordini(stato);
CREATE INDEX idx_ordini_data ON ordini(data_ordine);
CREATE INDEX idx_ordini_numero ON ordini(numero_ordine);
CREATE TABLE wave_planning (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wave_number TEXT UNIQUE NOT NULL,
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  stato TEXT CHECK(stato IN ('PIANIFICATA', 'IN_CORSO', 'COMPLETATA', 'ANNULLATA')) DEFAULT 'PIANIFICATA',
  tipo_wave TEXT CHECK(tipo_wave IN ('BATCH_PICKING', 'ZONE_PICKING', 'DISCRETE_PICKING', 'WAVE_PICKING')) DEFAULT 'BATCH_PICKING',
  
  -- Filtri per selezione ordini
  committente_id INTEGER, -- Se NULL = multi-committente
  priorita_minima INTEGER DEFAULT 1,
  data_da DATE,
  data_a DATE,
  
  -- Metriche di performance
  totale_ordini INTEGER DEFAULT 0,
  totale_righe INTEGER DEFAULT 0,
  totale_picks INTEGER DEFAULT 0,
  distanza_stimata_metri REAL DEFAULT 0,
  tempo_stimato_minuti INTEGER DEFAULT 0,
  
  -- Assegnazione operatori
  operatore_principale_id INTEGER,
  numero_operatori INTEGER DEFAULT 1,
  
  -- Timestamp
  data_inizio DATETIME,
  data_fine DATETIME,
  durata_effettiva_minuti INTEGER,
  
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (committente_id) REFERENCES committenti(id),
  FOREIGN KEY (operatore_principale_id) REFERENCES utenti(id)
);
CREATE TABLE wave_ordini (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wave_id INTEGER NOT NULL,
  ordine_id INTEGER NOT NULL,
  sequenza INTEGER NOT NULL, -- Ordine di processamento
  stato TEXT CHECK(stato IN ('IN_CODA', 'IN_PREPARAZIONE', 'COMPLETATO', 'ERRORE')) DEFAULT 'IN_CODA',
  
  -- Performance tracking
  data_inizio DATETIME,
  data_fine DATETIME,
  durata_minuti INTEGER,
  picks_completati INTEGER DEFAULT 0,
  picks_totali INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (wave_id) REFERENCES wave_planning(id) ON DELETE CASCADE,
  FOREIGN KEY (ordine_id) REFERENCES ordini(id),
  UNIQUE(wave_id, ordine_id)
);
CREATE TABLE wave_pick_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wave_id INTEGER NOT NULL,
  ordine_id INTEGER NOT NULL,
  prodotto_id INTEGER NOT NULL,
  ubicazione_id INTEGER NOT NULL,
  
  quantita_richiesta INTEGER NOT NULL,
  quantita_prelevata INTEGER DEFAULT 0,
  
  -- Ottimizzazione percorso
  sequenza_pick INTEGER NOT NULL,
  zona TEXT NOT NULL,
  distanza_dal_precedente REAL DEFAULT 0,
  tempo_stimato_secondi INTEGER DEFAULT 30,
  
  -- Stati e tracking
  stato TEXT CHECK(stato IN ('IN_CODA', 'IN_CORSO', 'COMPLETATO', 'SKIP', 'ERRORE')) DEFAULT 'IN_CODA',
  operatore_id INTEGER,
  timestamp_inizio DATETIME,
  timestamp_fine DATETIME,
  
  -- Controllo qualità
  controllo_barcode INTEGER DEFAULT 0,
  barcode_scansionato TEXT,
  note_operatore TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, udc_id INTEGER REFERENCES "udc_backup"(id),
  
  FOREIGN KEY (wave_id) REFERENCES wave_planning(id) ON DELETE CASCADE,
  FOREIGN KEY (ordine_id) REFERENCES ordini(id),
  FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
  FOREIGN KEY (ubicazione_id) REFERENCES ubicazioni(id),
  FOREIGN KEY (operatore_id) REFERENCES utenti(id)
);
CREATE INDEX idx_wave_planning_stato ON wave_planning(stato, data_creazione);
CREATE INDEX idx_wave_ordini_wave ON wave_ordini(wave_id, sequenza);
CREATE INDEX idx_wave_pick_tasks_wave ON wave_pick_tasks(wave_id, sequenza_pick);
CREATE INDEX idx_wave_pick_tasks_zona ON wave_pick_tasks(zona, sequenza_pick);
CREATE INDEX idx_wave_pick_tasks_operatore ON wave_pick_tasks(operatore_id, stato);
CREATE TRIGGER update_wave_planning_timestamp 
AFTER UPDATE ON wave_planning
BEGIN
  UPDATE wave_planning SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TABLE IF NOT EXISTS "udc_backup" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT NOT NULL UNIQUE,
  tipo_udc TEXT NOT NULL CHECK(tipo_udc IN ('PALLET_EPAL', 'PALLET_EUR', 'ROLL_CONTAINER', 'BOX_STANDARD', 'CONTAINER_20', 'CONTAINER_40', 'CASSA_PLASTICA', 'CUSTOM')),
  stato TEXT NOT NULL DEFAULT 'VUOTO' CHECK(stato IN ('VUOTO', 'PARZIALE', 'PIENO', 'IN_MOVIMENTO', 'BLOCCATO', 'DANNEGGIATO')),
  committente_proprietario_id INTEGER,
  ubicazione_attuale_id INTEGER,
  
  -- Specifiche fisiche
  lunghezza_cm INTEGER NOT NULL DEFAULT 120,
  larghezza_cm INTEGER NOT NULL DEFAULT 80,
  altezza_max_cm INTEGER NOT NULL DEFAULT 180,
  peso_max_kg DECIMAL(8,2) NOT NULL DEFAULT 1000.0,
  volume_max_cm3 INTEGER GENERATED ALWAYS AS (lunghezza_cm * larghezza_cm * altezza_max_cm) VIRTUAL,
  
  -- Tracking corrente
  peso_attuale_kg DECIMAL(8,2) DEFAULT 0.0,
  altezza_attuale_cm INTEGER DEFAULT 0,
  volume_occupato_cm3 INTEGER DEFAULT 0,
  numero_sku_diversi INTEGER DEFAULT 0,
  percentuale_riempimento DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN volume_max_cm3 > 0 
    THEN ROUND((volume_occupato_cm3 * 100.0) / volume_max_cm3, 2) 
    ELSE 0 END
  ) VIRTUAL,
  
  -- Metadati
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_movimento DATETIME DEFAULT CURRENT_TIMESTAMP,
  operatore_ultimo_movimento INTEGER,
  note TEXT,
  qr_code TEXT, -- Per stampa etichette QR
  
  FOREIGN KEY (committente_proprietario_id) REFERENCES committenti(id),
  FOREIGN KEY (ubicazione_attuale_id) REFERENCES ubicazioni(id),
  FOREIGN KEY (operatore_ultimo_movimento) REFERENCES utenti(id)
);
CREATE TABLE udc_movimenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  udc_id INTEGER NOT NULL,
  tipo_movimento TEXT NOT NULL CHECK(tipo_movimento IN (
    'CREAZIONE', 'CARICO', 'SCARICO', 'TRASFERIMENTO', 'SPLIT', 'MERGE', 
    'INVENTARIO', 'BLOCCO', 'SBLOCCO', 'DANNEGGIAMENTO', 'RIPARAZIONE', 'ELIMINAZIONE'
  )),
  ubicazione_da_id INTEGER,
  ubicazione_a_id INTEGER,
  operatore_id INTEGER NOT NULL,
  wave_id INTEGER, -- Collegamento a wave planning
  ordine_id INTEGER, -- Collegamento a ordine specifico
  
  -- Dettagli movimento
  quantita_movimentata INTEGER, -- Per movimenti parziali
  prodotti_coinvolti TEXT, -- JSON array con prodotti movimentati
  peso_prima_kg DECIMAL(8,2),
  peso_dopo_kg DECIMAL(8,2),
  
  -- Timing e performance
  data_inizio DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_fine DATETIME,
  durata_secondi INTEGER,
  distanza_metri DECIMAL(8,2),
  device_id TEXT, -- Scanner/tablet usato
  
  note_movimento TEXT,
  costo_movimento DECIMAL(8,2), -- Per calcolo costi logistici
  
  FOREIGN KEY (udc_id) REFERENCES "udc_backup"(id) ON DELETE CASCADE,
  FOREIGN KEY (ubicazione_da_id) REFERENCES ubicazioni(id),
  FOREIGN KEY (ubicazione_a_id) REFERENCES ubicazioni(id),
  FOREIGN KEY (operatore_id) REFERENCES utenti(id),
  FOREIGN KEY (ordine_id) REFERENCES ordini(id)
);
CREATE INDEX idx_udc_barcode ON "udc_backup"(barcode);
CREATE INDEX idx_udc_stato ON "udc_backup"(stato);
CREATE INDEX idx_udc_ubicazione ON "udc_backup"(ubicazione_attuale_id);
CREATE INDEX idx_udc_committente ON "udc_backup"(committente_proprietario_id);
CREATE INDEX idx_udc_movimenti_udc ON udc_movimenti(udc_id);
CREATE INDEX idx_udc_movimenti_data ON udc_movimenti(data_inizio);
CREATE INDEX idx_wave_pick_tasks_udc ON wave_pick_tasks(udc_id);
CREATE TABLE causali_trasferimento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codice TEXT NOT NULL UNIQUE,
  descrizione TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('INTERNO', 'ESTERNO', 'CORREZIONE', 'OTTIMIZZAZIONE')),
  richiede_autorizzazione BOOLEAN DEFAULT 0,
  attiva BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tipi_udc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codice TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descrizione TEXT,
  categoria TEXT NOT NULL CHECK(categoria IN ('PALLET', 'CONTAINER', 'BOX', 'ROLL', 'CUSTOM')),
  
  -- Dimensioni standard per questo tipo
  lunghezza_cm INTEGER NOT NULL DEFAULT 120,
  larghezza_cm INTEGER NOT NULL DEFAULT 80,
  altezza_max_cm INTEGER NOT NULL DEFAULT 180,
  peso_max_kg DECIMAL(8,2) NOT NULL DEFAULT 1000.0,
  volume_max_cm3 INTEGER GENERATED ALWAYS AS (lunghezza_cm * larghezza_cm * altezza_max_cm) VIRTUAL,
  
  -- Proprietà
  impilabile BOOLEAN DEFAULT 1,
  max_stack INTEGER DEFAULT 5,
  riutilizzabile BOOLEAN DEFAULT 1,
  
  -- Costi (opzionale)
  costo_acquisto DECIMAL(10,2),
  costo_noleggio_giorno DECIMAL(10,2),
  
  attivo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE udc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT NOT NULL UNIQUE,
  tipo_udc_id INTEGER NOT NULL,
  stato TEXT NOT NULL DEFAULT 'VUOTO' CHECK(stato IN ('VUOTO', 'PARZIALE', 'PIENO', 'IN_MOVIMENTO', 'BLOCCATO', 'DANNEGGIATO')),
  committente_proprietario_id INTEGER,
  ubicazione_attuale_id INTEGER,
  
  -- Dimensioni specifiche (override rispetto al tipo)
  lunghezza_cm INTEGER,
  larghezza_cm INTEGER, 
  altezza_max_cm INTEGER,
  peso_max_kg DECIMAL(8,2),
  volume_max_cm3 INTEGER GENERATED ALWAYS AS (
    COALESCE(lunghezza_cm, 0) * COALESCE(larghezza_cm, 0) * COALESCE(altezza_max_cm, 0)
  ) VIRTUAL,
  
  -- Tracking corrente
  peso_attuale_kg DECIMAL(8,2) DEFAULT 0.0,
  altezza_attuale_cm INTEGER DEFAULT 0,
  volume_occupato_cm3 INTEGER DEFAULT 0,
  numero_sku_diversi INTEGER DEFAULT 0,
  percentuale_riempimento DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN volume_max_cm3 > 0 
    THEN ROUND((volume_occupato_cm3 * 100.0) / volume_max_cm3, 2) 
    ELSE 0 END
  ) VIRTUAL,
  
  -- Metadati
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_movimento DATETIME DEFAULT CURRENT_TIMESTAMP,
  operatore_ultimo_movimento INTEGER,
  note TEXT,
  qr_code TEXT,
  
  FOREIGN KEY (tipo_udc_id) REFERENCES tipi_udc(id),
  FOREIGN KEY (committente_proprietario_id) REFERENCES committenti(id),
  FOREIGN KEY (ubicazione_attuale_id) REFERENCES ubicazioni(id),
  FOREIGN KEY (operatore_ultimo_movimento) REFERENCES utenti(id)
);
CREATE TABLE movimenti (
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
  numero_documento TEXT,
  data_documento DATE,
  causale TEXT,
  operatore TEXT,
  note TEXT,
  data_movimento DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  ordine_id INTEGER REFERENCES ordini(id),
  ubicazione_id INTEGER REFERENCES ubicazioni(id), 
  udc_id INTEGER REFERENCES udc(id),
  FOREIGN KEY (committente_id_origine) REFERENCES committenti(id),
  FOREIGN KEY (committente_id_destinazione) REFERENCES committenti(id),
  FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
  FOREIGN KEY (fornitore_id) REFERENCES fornitori(id)
);
CREATE INDEX idx_movimenti_committente_origine ON movimenti(committente_id_origine);
CREATE INDEX idx_movimenti_ordine ON movimenti(ordine_id);
CREATE TRIGGER update_movimenti_timestamp 
AFTER UPDATE ON movimenti
BEGIN
  UPDATE movimenti SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TABLE ordini_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordine_id INTEGER NOT NULL,
  stato_precedente VARCHAR(30),
  stato_nuovo VARCHAR(30) NOT NULL,
  data_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
  operatore_id INTEGER,
  note TEXT,
  
  FOREIGN KEY (ordine_id) REFERENCES ordini(id) ON DELETE CASCADE,
  FOREIGN KEY (operatore_id) REFERENCES utenti(id)
);
CREATE INDEX idx_ordini_tracking_ordine ON ordini_tracking(ordine_id);
CREATE TABLE IF NOT EXISTS "udc_contenuto" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  udc_id INTEGER NOT NULL,
  prodotto_id INTEGER NOT NULL,
  quantita INTEGER NOT NULL CHECK(quantita > 0),
  lotto TEXT,
  scadenza DATE,
  posizione_in_udc TEXT,
  peso_kg DECIMAL(8,2),
  volume_cm3 INTEGER,
  data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
  operatore_inserimento INTEGER,
  note_contenuto TEXT,
  
  FOREIGN KEY (udc_id) REFERENCES udc(id) ON DELETE CASCADE,
  FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
  UNIQUE(udc_id, prodotto_id, lotto)
);
CREATE INDEX idx_udc_contenuto_udc ON udc_contenuto(udc_id);
CREATE INDEX idx_udc_contenuto_prodotto ON udc_contenuto(prodotto_id);
CREATE TRIGGER aggiorna_giacenza_dopo_movimento
    AFTER INSERT ON movimenti
    BEGIN
      -- Inserisci o aggiorna giacenza con valore medio ponderato
      INSERT INTO giacenze (committente_id, prodotto_id, quantita, valore_medio)
      VALUES (NEW.committente_id_origine, NEW.prodotto_id, 
        CASE 
          WHEN NEW.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE') THEN NEW.quantita
          WHEN NEW.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE') THEN -NEW.quantita
          ELSE 0
        END,
        COALESCE(NEW.prezzo, 0)
      )
      ON CONFLICT(committente_id, prodotto_id) DO UPDATE SET
        quantita = quantita + 
          CASE 
            WHEN NEW.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE') THEN NEW.quantita
            WHEN NEW.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE') THEN -NEW.quantita
            ELSE 0
          END,
        -- Calcola media ponderata: (vecchio_valore * vecchia_qta + nuovo_valore * nuova_qta) / totale_qta
        valore_medio = CASE 
          WHEN (quantita + CASE 
            WHEN NEW.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE') THEN NEW.quantita
            WHEN NEW.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE') THEN -NEW.quantita
            ELSE 0
          END) > 0 THEN
            (COALESCE(valore_medio, 0) * quantita + COALESCE(NEW.prezzo, 0) * ABS(NEW.quantita)) / 
            (quantita + CASE 
              WHEN NEW.tipo_movimento IN ('CARICO', 'RETTIFICA_POS', 'RESO_CLIENTE') THEN NEW.quantita
              WHEN NEW.tipo_movimento IN ('SCARICO', 'RETTIFICA_NEG', 'RESO_FORNITORE', 'TRASFERIMENTO_INTERNO', 'TRASFERIMENTO_INTER_COMMITTENTE') THEN -NEW.quantita
              ELSE 0
            END)
          ELSE valore_medio
        END,
        ultima_modifica = CURRENT_TIMESTAMP;
    END;
