# PROCEDURA DI SVUOTAMENTO DATABASE - RESET COMPLETO

## OBIETTIVO
Reset completo del database per test puliti del flusso automatico di carico magazzino.

## ⚠️ ATTENZIONE
Questa procedura **CANCELLA TUTTI I DATI** di giacenze, movimenti e ordini. 
**NON** eseguire in produzione senza backup completo.

## TABELLE INTERESSATE
- `giacenze` - Giacenze logiche per committente
- `giacenze_fisiche` - Giacenze fisiche per ubicazione (CRITICA per occupazione magazzino)
- `movimenti` - Movimenti contabili
- `movimenti_ottimizzati` - Movimenti WMS ottimizzati
- `ordini` - Ordini principali
- `ordini_dettaglio_new` - Righe ordini
- `ordini_tracking` - Tracking stati ordini
- `ordini_documenti` - Documenti collegati
- `udc_contenuto` - Contenuto UDC/pallet
- `ubicazioni` - Reset volumi occupati
- `udc` - Reset stati UDC

## QUERY DI SVUOTAMENTO

```sql
-- ================================================
-- SVUOTAMENTO COMPLETO DATABASE MAGAZZINO
-- ================================================

-- 1. SVUOTA GIACENZE (logiche e fisiche)
DELETE FROM giacenze;
DELETE FROM giacenze_fisiche;

-- 2. SVUOTA MOVIMENTI (entrambe le tabelle)
DELETE FROM movimenti;
DELETE FROM movimenti_ottimizzati;

-- 3. SVUOTA ORDINI (cascata su dettagli)
DELETE FROM ordini_dettaglio_new;
DELETE FROM ordini_tracking;
DELETE FROM ordini_documenti;
DELETE FROM ordini;

-- 4. RESET UBICAZIONI (azzera volume occupato)
-- NOTA: percentuale_occupazione è colonna generata, non aggiornare
UPDATE ubicazioni SET 
  volume_occupato_cm3 = 0,
  updated_at = datetime('now');

-- 5. RESET UDC/PALLET (ripristina stato VUOTO)
UPDATE udc SET 
  volume_occupato_cm3 = 0,
  peso_attuale_kg = 0.0,
  numero_sku_diversi = 0,
  ubicazione_attuale_id = NULL,
  ultimo_movimento = NULL,
  stato = 'VUOTO';

-- 6. SVUOTA CONTENUTO UDC
DELETE FROM udc_contenuto;

-- 7. VERIFICA SVUOTAMENTO
SELECT 'GIACENZE:', COUNT(*) FROM giacenze;
SELECT 'GIACENZE_FISICHE:', COUNT(*) FROM giacenze_fisiche;
SELECT 'MOVIMENTI:', COUNT(*) FROM movimenti;
SELECT 'MOVIMENTI_OTT:', COUNT(*) FROM movimenti_ottimizzati;
SELECT 'ORDINI:', COUNT(*) FROM ordini;
SELECT 'UDC_CONTENUTO:', COUNT(*) FROM udc_contenuto;
SELECT 'UBICAZIONI_RESET:', COUNT(*) FROM ubicazioni WHERE volume_occupato_cm3 = 0;
SELECT 'UDC_VUOTI:', COUNT(*) FROM udc WHERE stato = 'VUOTO';
```

## COMANDO BASH VELOCE

```bash
sqlite3 /root/warehouse/gestionale-magazzino/database/magazzino.db "
DELETE FROM giacenze;
DELETE FROM giacenze_fisiche;
DELETE FROM movimenti;
DELETE FROM movimenti_ottimizzati;
DELETE FROM ordini_dettaglio_new;
DELETE FROM ordini_tracking;
DELETE FROM ordini_documenti;
DELETE FROM ordini;
UPDATE ubicazioni SET volume_occupato_cm3 = 0, updated_at = datetime('now');
UPDATE udc SET volume_occupato_cm3 = 0, peso_attuale_kg = 0.0, numero_sku_diversi = 0, ubicazione_attuale_id = NULL, ultimo_movimento = NULL, stato = 'VUOTO';
DELETE FROM udc_contenuto;
SELECT 'SVUOTAMENTO COMPLETATO' as status;
"
```

## RISULTATI ATTESI

### Dopo lo svuotamento, le pagine web dovranno mostrare:

**Giacenze Globali** (`/auth/giacenze`):
- Giacenze Totali: 0
- Committenti: 0  
- Prodotti: 0
- Valore Totale: 0,00 €
- Tabella vuota: "Nessuna giacenza trovata"

**Layout Magazzino** (`/auth/magazzino`):
- Ubicazioni: 26 totali, 0 occupate
- Occupazione: 0% (0m³)
- SKU Totali: 0
- Pezzi Totali: 0
- Oltre 90%: 0 ubicazioni piene
- Tutte ubicazioni: 0% occupazione, "🔵 Vuota"

**Movimenti Globali** (`/auth/movimenti`):
- Nessun movimento visualizzato
- Contatori a zero

## TABELLE NON TOCCATE

Le seguenti tabelle rimangono intatte (configurazione sistema):
- `committenti` - Anagrafiche committenti
- `prodotti` - Catalogo prodotti
- `categorie` - Categorie merceologiche  
- `fornitori` - Anagrafiche fornitori
- `unita_misura` - Unità di misura
- `ubicazioni` - Struttura fisica (solo reset volumi)
- `udc` - Anagrafiche UDC (solo reset contenuto)
- `tipi_udc` - Tipologie UDC
- `utenti` - Utenti sistema

## NOTE TECNICHE

1. **giacenze_fisiche**: Tabella critica per calcolo occupazione magazzino
2. **Colonne generate**: Non aggiornare `percentuale_occupazione` (auto-calcolata)
3. **Cascata FK**: Alcuni DELETE cascadono automaticamente
4. **Performance**: Lo svuotamento è immediato su database piccoli
5. **Backup**: Sempre fare backup prima dello svuotamento in produzione

## QUANDO USARE

- **Test flusso carico automatico**: Per test puliti da zero
- **Demo sistema**: Per presentazioni con dati puliti  
- **Sviluppo**: Dopo modifiche strutturali che richiedono reset
- **Debug**: Per isolare problemi con dati puliti

## RIPRISTINO DATI TEST

Dopo lo svuotamento, per test funzionali:

1. **Creare ordine di ingresso** nella pagina ordini
2. **Testare carico automatico** dalla pagina nuovo movimento
3. **Verificare aggiornamenti** in giacenze, magazzino, movimenti

---
*File generato automaticamente il 2025-09-09*
*Versione: 1.0*