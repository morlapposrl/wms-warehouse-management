<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;

  // Dati ordine principale
  let committente_id = data.committente?.id || (data.committenti?.[0]?.id || 1);
  let numero_ordine = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  let tipo_ordine: 'INBOUND' | 'OUTBOUND' = 'OUTBOUND';
  let cliente_fornitore = '';
  let nuovo_cliente = '';
  let modalita_cliente: 'esistente' | 'nuovo' = 'esistente';
  let data_richiesta = '';
  let indirizzo_destinazione = '';
  let contatti_destinazione = '';
  let note_spedizione = '';

  // Clienti filtrati per committente
  let clienti_committente: string[] = [];
  
  // Fornitori filtrati per committente
  let fornitori_committente: any[] = [];
  
  // Aggiorna clienti e fornitori quando cambia committente
  $: {
    if (committente_id) {
      // Simula ricaricamento clienti - in realtà andrebbero ricaricati dal server
      clienti_committente = data.clienti || [];
      
      // Usa direttamente i fornitori già filtrati dal server
      // che include: fornitori specifici del committente + fornitori globali (senza committente)
      fornitori_committente = data.fornitori || [];
    }
  }

  // Sincronizza i campi cliente
  $: {
    if (modalita_cliente === 'nuovo') {
      cliente_fornitore = nuovo_cliente;
    }
  }

  // Gestione righe ordine
  interface RigaOrdine {
    prodotto_id: number | null;
    quantita: number;
    prezzo_unitario: number;
    note_riga: string;
    // Campi calcolati
    subtotale: number;
    prodotto_descrizione?: string;
  }

  let righe: RigaOrdine[] = [
    {
      prodotto_id: null,
      quantita: 1,
      prezzo_unitario: 0,
      note_riga: '',
      subtotale: 0
    }
  ];

  // Modal selezione prodotti
  let showProductModal = false;
  let currentRigaIndex = -1;
  let searchProdotti = '';
  $: prodottiFiltrati = (data.prodotti || []).filter(prodotto => {
    const searchTerm = searchProdotti.toLowerCase();
    const codice = (prodotto.codice || '').toLowerCase();
    const descrizione = (prodotto.descrizione || '').toLowerCase(); 
    const categoria = (prodotto.categoria || '').toLowerCase();
    return codice.includes(searchTerm) || descrizione.includes(searchTerm) || categoria.includes(searchTerm);
  });

  // Calcoli automatici
  $: totale_colli = righe.reduce((sum, r) => sum + r.quantita, 0);
  $: totale_valore = righe.reduce((sum, r) => sum + r.subtotale, 0);

  // Funzioni gestione righe
  function aggiungiRiga() {
    righe = [...righe, {
      prodotto_id: null,
      quantita: 1,
      prezzo_unitario: 0,
      note_riga: '',
      subtotale: 0
    }];
  }

  function rimuoviRiga(index: number) {
    if (righe.length > 1) {
      righe = righe.filter((_, i) => i !== index);
    }
  }

  function aggiornaProdotto(index: number, prodotto_id: number) {
    const prodotto = (data.prodotti || []).find(p => p.id === prodotto_id);
    if (prodotto) {
      righe[index].prodotto_id = prodotto_id;
      righe[index].prezzo_unitario = prodotto.prezzo_vendita || 0;
      righe[index].prodotto_descrizione = prodotto.descrizione;
      ricalcolaRiga(index);
    }
  }

  // Funzioni modal selezione prodotti
  function openProductModal(rigaIndex: number) {
    currentRigaIndex = rigaIndex;
    showProductModal = true;
    searchProdotti = '';
  }

  function closeProductModal() {
    showProductModal = false;
    currentRigaIndex = -1;
    searchProdotti = '';
  }

  function selectProduct(prodotto: any) {
    if (currentRigaIndex >= 0) {
      aggiornaProdotto(currentRigaIndex, prodotto.id);
      closeProductModal();
    }
  }

  function ricalcolaRiga(index: number) {
    righe[index].subtotale = righe[index].quantita * righe[index].prezzo_unitario;
    righe = [...righe]; // Trigger reactivity
  }

  function formatTipoOrdine(tipo: string): string {
    return tipo === 'INBOUND' ? 'In Entrata' : 'In Uscita';
  }

  // Genera numero ordine automatico
  function generaNuovoNumero() {
    const timestamp = Date.now();
    const prefix = tipo_ordine === 'INBOUND' ? 'IN' : 'ORD';
    numero_ordine = `${prefix}-${new Date().getFullYear()}-${String(timestamp).slice(-6)}`;
  }

  // Precompila dati magazzino per ordini INBOUND
  function precompilaRicevimento() {
    if (tipo_ordine === 'INBOUND' && data.magazzino) {
      indirizzo_destinazione = `${data.magazzino.indirizzo || ''}, ${data.magazzino.citta || ''} ${data.magazzino.cap || ''}`;
      contatti_destinazione = `${data.magazzino.nome || 'Magazzino'} - Ufficio Ricevimento`;
      note_spedizione = 'Consegnare negli orari: 8:00-12:00 / 14:00-17:00. Suonare citofono magazzino.';
    } else if (tipo_ordine === 'OUTBOUND') {
      // Reset per ordini in uscita
      indirizzo_destinazione = '';
      contatti_destinazione = '';
      note_spedizione = '';
    }
  }

  // Reattività: quando cambia tipo ordine, precompila automaticamente
  $: {
    if (tipo_ordine) {
      precompilaRicevimento();
    }
  }

  let submitting = false;
</script>

<div class="w-full px-6 py-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="h1">Nuovo Ordine</h1>
    </div>
    <a href="/auth/ordini?committente={data.committente?.id || committente_id}" class="btn btn-secondary">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
      </svg>
      Torna alla lista
    </a>
  </div>

  <!-- Alert errori -->
  {#if form?.error}
    <div class="alert alert-error mb-6">
      <strong>Errore:</strong> {form.error}
    </div>
  {/if}

  <!-- Form principale -->
  <form method="POST" use:enhance={({ submitting: s, formData }) => {
    console.log('🚀 Form submit iniziato!');
    console.log('📋 Dati form:', Object.fromEntries(formData.entries()));
    console.log('📦 Righe ordine:', righe);
    submitting = s;
    return async ({ result }) => {
      submitting = false;
      console.log('📨 Risultato server:', result);
      if (result.type === 'redirect') {
        console.log('✅ Ordine creato con successo! Redirect verso:', result.location);
        // Popup di conferma decente e redirect manuale
        if (confirm('✅ Ordine creato con successo!\n\nVuoi andare alla lista degli ordini?')) {
          window.location.href = result.location;
        }
      } else if (result.type === 'failure') {
        console.error('❌ Errore form:', result.data);
      } else if (result.type === 'error') {
        console.error('❌ Errore server:', result.error);
      } else {
        console.log('ℹ️ Risultato non gestito:', result);
      }
    };
  }}>
    
    <!-- Hidden fields -->
    <input type="hidden" name="modalita_cliente" value={modalita_cliente} />
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Colonna 1: Dati ordine -->
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold">Dati Ordine</h2>
        </div>
        <div class="card-body space-y-4">
          
          <!-- Numero ordine -->
          <div>
            <label class="form-label">Numero Ordine</label>
            <div class="flex gap-2">
              <input 
                type="text" 
                name="numero_ordine" 
                bind:value={numero_ordine}
                class="form-input"
                required
              />
              <button type="button" on:click={generaNuovoNumero} class="btn btn-sm btn-secondary">
                🔄
              </button>
            </div>
          </div>

          <!-- Committente -->
          <div>
            <label class="form-label">Committente</label>
            <select bind:value={committente_id} name="committente_id" class="form-input" required disabled={righe.some(r => r.prodotto_id !== null)}>
              {#each data.committenti || [] as committente}
                <option value={committente.id}>{committente.codice} - {committente.ragione_sociale}</option>
              {/each}
            </select>
            {#if righe.some(r => r.prodotto_id !== null)}
              <p class="text-sm text-orange-600 dark:text-orange-400 mt-1">
                ⚠️ Committente bloccato: rimuovi tutti i prodotti per cambiarlo
              </p>
            {/if}
          </div>

          <!-- Tipo ordine -->
          <div>
            <label class="form-label">Tipo Ordine</label>
            <select bind:value={tipo_ordine} name="tipo_ordine" class="form-input" on:change={generaNuovoNumero}>
              <option value="OUTBOUND">In Uscita (spedizione)</option>
              <option value="INBOUND">In Entrata (ricevimento)</option>
            </select>
          </div>

          <!-- Cliente/Fornitore -->
          <div>
            <label class="form-label">
              {tipo_ordine === 'INBOUND' ? 'Fornitore' : 'Cliente'}
            </label>
            
            <!-- Selezione modalità cliente/fornitore -->
            <div class="mb-2">
              <label class="inline-flex items-center mr-4">
                <input type="radio" bind:group={modalita_cliente} value="esistente" class="form-radio" />
                <span class="ml-2">{tipo_ordine === 'INBOUND' ? 'Fornitore' : 'Cliente'} esistente</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" bind:group={modalita_cliente} value="nuovo" class="form-radio" />
                <span class="ml-2">Nuovo {tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'}</span>
              </label>
            </div>

            {#if modalita_cliente === 'esistente'}
              <!-- Select clienti/fornitori esistenti -->
              <select bind:value={cliente_fornitore} name="cliente_fornitore" class="form-input" required>
                <option value="">-- Seleziona {tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'} --</option>
                
                {#if tipo_ordine === 'INBOUND'}
                  <!-- Mostra fornitori per ordini in entrata -->
                  {#each fornitori_committente as fornitore}
                    <option value={fornitore.ragione_sociale}>
                      {fornitore.ragione_sociale}
                      {#if fornitore.tipo_fornitore === 'specifico'} 🏢{:else if fornitore.tipo_fornitore === 'globale'} 🌐{/if}
                    </option>
                  {/each}
                {:else}
                  <!-- Mostra clienti per ordini in uscita -->
                  {#each clienti_committente as cliente}
                    <option value={cliente}>{cliente}</option>
                  {/each}
                {/if}
              </select>
              
              {#if tipo_ordine === 'INBOUND' && fornitori_committente.length > 0}
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  🏢 = Fornitore specifico del committente • 🌐 = Fornitore globale
                </div>
              {/if}
            {:else}
              <!-- Input nuovo cliente -->
              <input 
                type="text" 
                name="cliente_fornitore" 
                bind:value={nuovo_cliente}
                class="form-input"
                placeholder="Nome nuovo {tipo_ordine === 'INBOUND' ? 'fornitore' : 'cliente'}"
                required
              />
            {/if}
          </div>

          <!-- Data richiesta -->
          <div>
            <label class="form-label">Data Richiesta Consegna *</label>
            <input 
              type="date" 
              name="data_richiesta" 
              bind:value={data_richiesta}
              class="form-input"
              required
            />
          </div>

        </div>
      </div>

      <!-- Colonna 2: Dati spedizione -->
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold">
            {tipo_ordine === 'INBOUND' ? 'Dati Ricevimento' : 'Dati Spedizione'}
          </h2>
        </div>
        <div class="card-body space-y-4">
          
          <!-- Indirizzo -->
          <div>
            <label class="form-label">Indirizzo</label>
            <textarea 
              name="indirizzo_destinazione" 
              bind:value={indirizzo_destinazione}
              class="form-input"
              rows="3"
              placeholder="Via, città, CAP..."
            ></textarea>
          </div>

          <!-- Contatti -->
          <div>
            <label class="form-label">Contatti</label>
            <input 
              type="text" 
              name="contatti_destinazione" 
              bind:value={contatti_destinazione}
              class="form-input"
              placeholder="Nome referente, telefono, email..."
            />
          </div>

          <!-- Note spedizione -->
          <div>
            <label class="form-label">Note</label>
            <textarea 
              name="note_spedizione" 
              bind:value={note_spedizione}
              class="form-input"
              rows="3"
              placeholder="Istruzioni speciali..."
            ></textarea>
          </div>

        </div>
      </div>

      <!-- Colonna 3: Riepilogo -->
      <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="card-header border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold">Riepilogo</h2>
        </div>
        <div class="card-body space-y-4">
          
          <div class="stat-card text-center">
            <div class="text-2xl font-bold text-blue-600">{totale_colli}</div>
            <div class="text-sm text-neutral-600 dark:text-gray-400">Totale Colli</div>
          </div>

          <div class="stat-card text-center">
            <div class="text-2xl font-bold text-green-600">€ {totale_valore.toFixed(2)}</div>
            <div class="text-sm text-neutral-600 dark:text-gray-400">Totale Valore</div>
          </div>

          <div class="stat-card text-center">
            <div class="text-2xl font-bold text-purple-600">{righe.length}</div>
            <div class="text-sm text-neutral-600 dark:text-gray-400">Righe Ordine</div>
          </div>

        </div>
      </div>

    </div>

    <!-- Sezione righe ordine -->
    <div class="card mt-6">
      <div class="card-header border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold">Righe Ordine</h2>
            <button 
              type="button" 
              on:click={aggiungiRiga} 
              class="btn btn-sm btn-success"
              disabled={!committente_id}
            >
              + Aggiungi Riga
            </button>
          </div>
        </div>
      </div>
      <div class="card-body">
        
        {#if data.prodotti.length === 0}
          <div class="alert alert-warning">
            <strong>Attenzione:</strong> Nessun prodotto disponibile per questo committente. 
            <a href="/auth/prodotti" class="underline">Aggiungi prodotti</a> prima di creare ordini.
          </div>
        {:else}
        
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Prodotto</th>
                  <th>Quantità</th>
                  <th>Prezzo Unit.</th>
                  <th>Subtotale</th>
                  <th>Note</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {#each righe as riga, i}
                  <tr>
                    <!-- Prodotto -->
                    <td class="w-64">
                      <div class="space-y-1">
                        {#if riga.prodotto_id && riga.prodotto_descrizione}
                          <!-- Prodotto selezionato -->
                          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-2">
                            <div class="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {data.prodotti.find(p => p.id === riga.prodotto_id)?.codice || ''}
                            </div>
                            <div class="text-xs text-blue-700 dark:text-blue-300">
                              {riga.prodotto_descrizione}
                            </div>
                          </div>
                          <button
                            type="button" 
                            on:click={() => openProductModal(i)}
                            class="btn btn-sm btn-secondary w-full"
                          >
                            🔄 Cambia Prodotto
                          </button>
                        {:else}
                          <!-- Nessun prodotto selezionato -->
                          <button
                            type="button" 
                            on:click={() => openProductModal(i)}
                            class="btn btn-primary w-full"
                            disabled={data.prodotti.length === 0}
                          >
                            🔍 Seleziona Prodotto
                          </button>
                        {/if}
                        
                        <!-- Hidden input per form submission -->
                        <input 
                          type="hidden" 
                          name={`riga_${i}_prodotto_id`}
                          value={riga.prodotto_id || ''}
                        />
                      </div>
                    </td>
                    
                    <!-- Quantità -->
                    <td>
                      <input 
                        type="number" 
                        bind:value={riga.quantita}
                        name={`riga_${i}_quantita`}
                        class="form-input w-20"
                        min="1"
                        on:input={() => ricalcolaRiga(i)}
                        required
                      />
                    </td>
                    
                    <!-- Prezzo unitario -->
                    <td>
                      <input 
                        type="number" 
                        bind:value={riga.prezzo_unitario}
                        name={`riga_${i}_prezzo`}
                        class="form-input w-24"
                        min="0"
                        step="0.01"
                        on:input={() => ricalcolaRiga(i)}
                        required
                      />
                    </td>
                    
                    <!-- Subtotale -->
                    <td class="font-mono font-medium">
                      € {riga.subtotale.toFixed(2)}
                    </td>
                    
                    <!-- Note -->
                    <td>
                      <input 
                        type="text" 
                        bind:value={riga.note_riga}
                        name={`riga_${i}_note`}
                        class="form-input w-32"
                        placeholder="Note..."
                      />
                    </td>
                    
                    <!-- Azioni -->
                    <td>
                      <button 
                        type="button" 
                        on:click={() => rimuoviRiga(i)}
                        class="btn btn-sm btn-danger"
                        disabled={righe.length === 1}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>

    <!-- Pulsanti azioni -->
    <div class="flex justify-end gap-4 mt-6">
      <a href="/auth/ordini?committente={data.committente?.id || committente_id}" class="btn btn-secondary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Annulla
      </a>
      <button 
        type="submit" 
        class="btn btn-primary"
        disabled={submitting || data.prodotti.length === 0}
        on:click={() => {
          console.log('🔘 Pulsante Crea Ordine cliccato!');
          console.log('📊 Stato form:', {
            submitting,
            prodottiDisponibili: data.prodotti.length,
            righeOrdine: righe.length,
            righeValide: righe.filter(r => r.prodotto_id && r.quantita > 0).length
          });
        }}
      >
        {submitting ? 'Creazione...' : 'Crea Ordine'}
      </button>
    </div>

  </form>
</div>

<!-- Modal Selezione Prodotti -->
{#if showProductModal}
  <div class="modal-backdrop" on:click={closeProductModal}>
    <div class="modal-content-large" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          🔍 Seleziona Prodotto - Riga {currentRigaIndex + 1}
        </h2>
        <button on:click={closeProductModal} class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400 dark:hover:text-gray-200">✖️</button>
      </div>
      
      <div class="p-6">
        <!-- Barra di ricerca -->
        <div class="mb-4">
          <div class="relative">
            <input
              type="text"
              bind:value={searchProdotti}
              placeholder="Cerca per codice, descrizione o categoria..."
              class="form-input w-full pl-10"
              autofocus
            />
            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          {#if searchProdotti}
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {prodottiFiltrati.length} di {data.prodotti.length} prodotti
            </div>
          {/if}
        </div>

        <!-- Tabella Prodotti -->
        {#if prodottiFiltrati.length > 0}
          <div class="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table class="table table-zebra">
              <thead class="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th>Codice</th>
                  <th>Descrizione</th>
                  <th>Categoria</th>
                  <th>U.M.</th>
                  <th>Prezzo</th>
                  <th>Azione</th>
                </tr>
              </thead>
              <tbody>
                {#each prodottiFiltrati as prodotto}
                  <tr class="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <td class="font-mono font-medium text-blue-600 dark:text-blue-400">
                      {prodotto.codice}
                    </td>
                    <td class="font-medium">
                      {prodotto.descrizione}
                    </td>
                    <td class="text-sm text-gray-600 dark:text-gray-300">
                      {prodotto.categoria || '-'}
                    </td>
                    <td class="text-sm">
                      {prodotto.unita_misura || '-'}
                    </td>
                    <td class="font-mono">
                      € {(prodotto.prezzo_vendita || 0).toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        on:click={() => selectProduct(prodotto)}
                        class="btn btn-sm btn-success"
                        title="Seleziona questo prodotto"
                      >
                        ✓ Seleziona
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-center py-12">
            <div class="text-4xl mb-4">📦</div>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {searchProdotti ? 'Nessun prodotto trovato' : 'Nessun prodotto disponibile'}
            </h3>
            <p class="text-gray-500 dark:text-gray-400">
              {searchProdotti ? 'Prova con un termine di ricerca diverso' : 'Aggiungi prodotti per questo committente'}
            </p>
          </div>
        {/if}

        <!-- Footer Modal -->
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            💡 Suggerimento: Usa la ricerca per trovare rapidamente i prodotti
          </div>
          <button 
            type="button" 
            on:click={closeProductModal} 
            class="btn btn-secondary"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
  }
  
  .modal-content-large {
    background-color: white;
    @apply rounded-lg shadow-xl max-w-5xl w-full max-h-screen overflow-hidden;
  }

  :global(.dark) .modal-content-large {
    background-color: rgb(31, 41, 55); /* gray-800 */
  }

  .modal-content-large .modal-header {
    @apply flex justify-between items-center p-6 border-b border-gray-200;
    background: inherit;
  }

  :global(.dark) .modal-content-large .modal-header {
    border-color: rgb(55, 65, 81); /* gray-700 */
  }

  /* Header tabella sticky */
  .table thead th {
    @apply sticky top-0 z-10;
  }
</style>