import Database from 'better-sqlite3';

const DB_PATH = "./database/magazzino.db";
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
function initializeDatabase() {
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS utenti (
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (committente_id) REFERENCES committenti(id)
    )
  `);
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
      FOREIGN KEY (fornitore_id) REFERENCES fornitori(id)
    )
  `);
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
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_categorie_committente ON categorie(committente_id);
    CREATE INDEX IF NOT EXISTS idx_prodotti_committente ON prodotti(committente_id);
    CREATE INDEX IF NOT EXISTS idx_movimenti_committente_origine ON movimenti(committente_id_origine);
    CREATE INDEX IF NOT EXISTS idx_giacenze_committente ON giacenze(committente_id);
    CREATE INDEX IF NOT EXISTS idx_utenti_committente ON utenti(committente_id);
    CREATE INDEX IF NOT EXISTS idx_committenti_fornitori_committente ON committenti_fornitori(committente_id);
  `);
  const tables = ["committenti", "utenti", "categorie", "unita_misura", "fornitori", "prodotti", "movimenti"];
  tables.forEach((table) => {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_${table}_timestamp 
      AFTER UPDATE ON ${table}
      BEGIN
        UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);
  });
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
  const count = db.prepare("SELECT COUNT(*) as count FROM committenti").get();
  if (count.count === 0) {
    console.log("Inserimento dati di esempio...");
    db.exec(`
      INSERT INTO committenti (codice, ragione_sociale, partita_iva, email, stato) VALUES
      ('COMM001', 'Azienda Alpha S.r.l.', '12345678901', 'admin@alpha.it', 'attivo'),
      ('COMM002', 'Beta Industries', '98765432109', 'contatti@beta.com', 'attivo'),
      ('COMM003', 'Gamma Logistics', '11223344556', 'info@gamma.it', 'attivo');
    `);
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
    db.exec(`
      INSERT INTO utenti (email, password_hash, nome, cognome, ruolo, attivo) VALUES
      ('admin@magazzino.it', '$2a$10$example.hash.here', 'Super', 'Admin', 'super_admin', 1);
    `);
    console.log("Database inizializzato con dati di esempio!");
  }
}
initializeDatabase();
//# sourceMappingURL=hooks.server-2aGkGsfZ.js.map
