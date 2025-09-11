# 🏭 WMS Gestionale Magazzino - Morlappo Srl

## Sistema WMS (Warehouse Management System) con Intelligenza Artificiale

Sistema di gestione magazzino avanzato con supporto multicommittente, UDC (Unità Di Carico) e trasferimenti intelligenti, sviluppato da **Morlappo Srl** - *Innovazione attraverso l'Intelligenza Artificiale*.

---

## 🚀 Caratteristiche Principali

### ✅ **Sistema Multicommittente**
- **Segregazione totale dei dati** tra committenti
- Dashboard dedicate per ogni cliente
- Gestione separata di prodotti, movimenti e giacenze
- Fatturazione servizi logistici personalizzata

### 🏗️ **Sistema UDC (Unità Di Carico)**
- **Multi-referenze**: Più UDC per ubicazione
- **Multi-prodotto**: Prodotti diversi nello stesso UDC  
- **Barcode tracking** completo per picking ottimizzato
- **Chaotic storage** per massimizzare l'efficienza

### 🔄 **Sistema Trasferimenti Avanzato**
- **Trasferimenti per quantità** con controlli giacenza
- **Trasferimenti UDC intero** mantenendo il contenuto
- **Causali configurabili** con workflow autorizzazioni
- **Stati avanzati**: CONFERMATO, IN_ATTESA_AUTORIZZAZIONE

### 📊 **Giacenze Intelligenti**
- **Modello Amazon FBA**: giacenze fisiche vs logiche
- **Stoccaggio condiviso** ottimizzato per spazio
- **Vista espandibile UDC** con dettagli completi
- **Alert automatici** per scorte minime

---

## 🛠️ Stack Tecnologico

- **Frontend**: SvelteKit + TypeScript + Tailwind CSS
- **Backend**: Node.js con SvelteKit API routes
- **Database**: SQLite + better-sqlite3 (query native SQL)
- **Validazione**: Zod per sicurezza dati
- **UI/UX**: Componenti responsive ottimizzati per tablet

---

## 🏗️ Architettura Sistema

### Moduli Implementati

1. **🏢 Gestione Committenti**
   - Anagrafica completa con dati fiscali
   - Segregazione dati totale
   - Dashboard personalizzate

2. **📦 Gestione Prodotti**
   - Prodotti per committente
   - Categorie personalizzabili
   - Scorte min/max configurabili

3. **🏗️ Sistema UDC**
   - Tracking barcode completo
   - Multi-referenze per ubicazione
   - Ottimizzazione chaotic storage

4. **📊 Movimentazioni**
   - Tracciabilità completa per committente
   - Aggiornamento giacenze automatico
   - Report dettagliati multicommittente

5. **🔄 Trasferimenti**
   - Sistema causali configurabili
   - Workflow autorizzazioni
   - Trasferimenti quantità/UDC

---

## 🌐 Accesso Sistema

### URL Principali

- **Sistema Status**: `/auth/sistema` (accessibile dal menu operatore)
- **Dashboard Globale**: `/auth/dashboard`
- **Giacenze Globali**: `/auth/giacenze` 
- **Movimenti Globali**: `/auth/movimenti`
- **Gestione Committenti**: `/auth/committenti`

### Pagine Committente

- **Dashboard**: `/auth/committenti/[id]/dashboard`
- **Prodotti**: `/auth/committenti/[id]/prodotti`
- **Giacenze**: `/auth/committenti/[id]/giacenze`
- **Movimenti**: `/auth/committenti/[id]/movimenti`

---

## 📋 API Endpoints

### Core APIs
- `GET /api/committenti` - Lista committenti
- `GET/POST /api/prodotti` - Gestione prodotti
- `GET/POST /api/movimenti` - Gestione movimenti
- `GET /api/giacenze` - Vista giacenze

### UDC APIs
- `GET/POST /api/udc` - Gestione UDC
- `GET /api/ubicazioni` - Gestione ubicazioni
- `PUT /api/udc/[id]` - Aggiornamento UDC

### Transfer APIs (NUOVO!)
- `POST /api/trasferimenti` - Crea trasferimento
- `GET /api/causali-trasferimento` - Lista causali
- `PUT /api/trasferimenti/[id]` - Aggiorna stato
- `POST /api/trasferimenti/approve` - Approva trasferimento

---

## 🔧 Setup & Sviluppo

### Prerequisiti
- Node.js 18+ 
- npm/yarn

### Installazione
```bash
# Clona repository
git clone [url]
cd gestionale-magazzino

# Installa dipendenze
npm install

# Avvia sviluppo
npm run dev

# Accedi a http://localhost:3002
```

### Build Produzione
```bash
npm run build
npm run preview
```

---

## 📊 Metriche Sistema

- **⚡ Performance**: Tempo risposta < 2s
- **🏢 Committenti**: Supporto fino a 100 clienti
- **📦 Prodotti**: Fino a 10.000 per committente
- **📊 Movimenti**: Fino a 1.000/giorno
- **🔒 Uptime**: 99.5% disponibilità

---

## 🗺️ Roadmap

### 🚧 In Sviluppo
- [ ] Sistema Ordini Multicommittente B2B
- [ ] Workflow Autorizzazioni Avanzato  
- [ ] Inventari Fisici per Committente

### 🎯 Pianificato (Q1 2025)
- [ ] Fatturazione Servizi Logistici
- [ ] Dashboard Analytics Avanzata
- [ ] Integrazione Barcode/RFID

### 💫 Visione Futura
- [ ] AI-powered Demand Forecasting
- [ ] Robotic Process Automation
- [ ] Multi-cloud Architecture
- [ ] Voice Picking System

---

## 🛡️ Sicurezza & Compliance

- **🔒 Data Segregation**: Isolamento totale dati committente
- **🔐 Role-based Access**: Controllo accessi granulare
- **📝 Audit Logging**: Tracciabilità operazioni critiche
- **⚖️ GDPR Compliance**: Gestione privacy dati

---

## 📞 Supporto & Contatti

### 🏢 Morlappo Srl
- **🌐 Sito Web**: [morlappo.com](https://morlappo.com)
- **📧 Email**: info@morlappo.com
- **📱 Telefono**: +39 395 348 147 95 95
- **📍 Sede**: L.go Alvaro De Mendoza 4, Sant'Omero (TE), Italia
- **🏛️ P.IVA**: 02174570677

### 🔧 Sistema & Supporto Tecnico
- **📧 Sistema Status**: Accessibile da `/auth/sistema`
- **🔧 Documentazione**: In preparazione
- **💬 Supporto Tecnico**: Tramite canali ufficiali Morlappo

---

## 📄 Licenza

**Sistema proprietario** - Tutti i diritti riservati  
© 2025 **Morlappo Srl** - Innovazione attraverso l'Intelligenza Artificiale

---

**Versione**: v1.3.0 - Build 2025.01  
**Ultima modifica**: Gennaio 2025  
**Status**: ✅ Sistema Operativo e Funzionante