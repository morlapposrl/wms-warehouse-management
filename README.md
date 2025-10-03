# 🏭 WMS Gestionale Magazzino - Morlappo Srl

<!-- Language Selection -->
**🌍 Read in other languages:** 
[🇬🇧 English](README.en.md) | 
[🇫🇷 Français](README.fr.md) | 
[🇩🇪 Deutsch](README.de.md) | 
[🇪🇸 Español](README.es.md) | 
[🇨🇳 中文](README.zh.md)

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

### 🎨 **UI/UX Moderna con Gradienti**
- **Design System Colorato**: Ogni sezione con gradienti specifici
- **Modal Avanzate**: Layout compatti a 2 colonne ottimizzati
- **Dark Mode Nativo**: Supporto completo tema scuro
- **Animazioni Fluide**: Transizioni e micro-interazioni moderne

### 📊 **Giacenze Intelligenti**
- **Modello Amazon FBA**: giacenze fisiche vs logiche
- **Stoccaggio condiviso** ottimizzato per spazio
- **Vista espandibile UDC** con dettagli completi
- **Alert automatici** per scorte minime

### 🌍 **Sistema Multilingua Completo**
- **6 Lingue Supportate**: 🇮🇹 Italiano, 🇬🇧 Inglese, 🇫🇷 Francese, 🇩🇪 Tedesco, 🇪🇸 Spagnolo, 🇨🇳 Cinese
- **Cambio Lingua Real-time**: Switch istantaneo senza ricarica
- **Localizzazione Completa**: Date, numeri, valute localizzate
- **Traduzioni Dinamiche**: Parametri e pluralizzazioni gestite

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

4. **🗺️ Gestione Magazzino Avanzata**
   - **Layout Interattivo**: Mappa magazzino con zoom/pan
   - **Modal Crea Ubicazione**: Design moderno a gradienti con 2 colonne
   - **Modal Contenuto Ubicazione**: Vista dettagliata con cards colorate
   - **Dual View**: Visualizzazione mappa + tabella con switch animato

5. **📊 Movimentazioni**
   - Tracciabilità completa per committente
   - Aggiornamento giacenze automatico
   - Report dettagliati multicommittente

6. **🔄 Trasferimenti**
   - Sistema causali configurabili
   - Workflow autorizzazioni
   - Trasferimenti quantità/UDC

## 🆕 Aggiornamenti Recenti

### ✨ Gennaio 2025 - UI/UX Modernization
- **🎨 Design System Rinnovato**: Gradienti colorati per ogni sezione
- **📦 Modal Contenuto Ubicazione**: Completamente ridisegnata con cards moderne
- **🏗️ Modal Crea Ubicazione**: Layout ottimizzato a 2 colonne 
- **🌍 Sistema i18n Completo**: 6 lingue con traduzioni dinamiche
- **🌙 Dark Mode Enhanced**: Supporto gradienti in tema scuro
- **🎯 UX Compatta**: Design responsive ottimizzato per tablet

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

© 2025 **Morlappo Srl** - Innovazione attraverso l'Intelligenza Artificiale

---

## 📸 Screenshots

### 🏠 Homepage Multilingua
La pagina di presentazione professionale è disponibile su: **https://connect.microlops.it:3304/**

**Caratteristiche principali:**
- 🌍 **6 lingue supportate**: Italiano, English, Français, Deutsch, Español, 中文
- 🎨 **Sfondi accattivanti** con animazioni CSS
- 📱 **Design responsive** ottimizzato per tutti i dispositivi
- 🚀 **GitHub integration** con link diretti al repository
- 🏢 **Branding Morlappo** con logo aziendale

**Sezioni incluse:**
- **Hero Section**: Logo, titolo, descrizione, CTA buttons
- **Features**: 6 caratteristiche principali del WMS
- **Performance Stats**: Metriche del sistema
- **Technology Stack**: SvelteKit, TypeScript, SQLite, Tailwind
- **Open Source**: Links GitHub repository, fork, download
- **Footer**: Informazioni aziendali complete

### 🏭 Sistema WMS
Accesso completo al sistema: **https://connect.microlops.it:3304/login**

**Screenshots disponibili in:** `./screenshots/`
- Homepage multilingua completa
- Dashboard operativo
- Modal moderne con gradienti
- Gestione magazzino interattiva
- Dark mode support

---

## 🚀 Setup Nuovo Repository GitHub

Per configurare un nuovo repository GitHub per questo progetto:

```bash
# Esegui lo script di setup automatico
./setup_github_repo.sh
```

Oppure manualmente:
1. Crea nuovo repository su GitHub: `wms-warehouse-management`
2. Configura remote: `git remote add origin https://github.com/[USERNAME]/wms-warehouse-management.git`
3. Push: `git push -u origin main`

### 📊 Repository Info Suggerite
- **Nome**: `wms-warehouse-management`
- **Descrizione**: 🏭 Sistema WMS professionale multicommittente - Warehouse Management System
- **Topics**: `wms`, `warehouse-management`, `sveltekit`, `typescript`, `logistics`, `multitenancy`, `i18n`

---

**Versione**: v1.4.0 - Build 2025.01  
**Ultima modifica**: Settembre 2025  
**Status**: ✅ Sistema Operativo e Funzionante
