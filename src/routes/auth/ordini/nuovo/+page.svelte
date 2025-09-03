<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;

  // Dati ordine principale
  let numero_ordine = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  let tipo_ordine: 'INBOUND' | 'OUTBOUND' = 'OUTBOUND';
  let cliente_fornitore = '';
  let data_richiesta = '';
  let indirizzo_destinazione = '';
  let contatti_destinazione = '';
  let note_spedizione = '';

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
    const prodotto = data.prodotti.find(p => p.id === prodotto_id);
    if (prodotto) {
      righe[index].prodotto_id = prodotto_id;
      righe[index].prezzo_unitario = prodotto.prezzo_vendita || 0;
      righe[index].prodotto_descrizione = prodotto.descrizione;
      ricalcolaRiga(index);
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

  let submitting = false;
</script>

<div class="container mx-auto px-6 py-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="h1">Nuovo Ordine</h1>
      <p class="text-neutral-600 mt-1">
        Committente: <strong>{data.committente.ragione_sociale}</strong>
      </p>
    </div>
    <a href="/auth/ordini?committente={data.committente.id}" class="btn btn-secondary">
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
  <form method="POST" use:enhance={({ submitting: s }) => {
    submitting = s;
    return async ({ result }) => {
      submitting = false;
      if (result.type === 'redirect') {
        // Il redirect è gestito automaticamente
      }
    };
  }}>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Colonna 1: Dati ordine -->
      <div class="card">
        <div class="card-header">
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
            <input 
              type="text" 
              name="cliente_fornitore" 
              bind:value={cliente_fornitore}
              class="form-input"
              placeholder={tipo_ordine === 'INBOUND' ? 'Nome fornitore' : 'Nome cliente'}
              required
            />
          </div>

          <!-- Data richiesta -->
          <div>
            <label class="form-label">Data Richiesta Consegna</label>
            <input 
              type="date" 
              name="data_richiesta" 
              bind:value={data_richiesta}
              class="form-input"
            />
          </div>

        </div>
      </div>

      <!-- Colonna 2: Dati spedizione -->
      <div class="card">
        <div class="card-header">
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
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold">Riepilogo</h2>
        </div>
        <div class="card-body space-y-4">
          
          <div class="stat-card text-center">
            <div class="text-2xl font-bold text-blue-600">{totale_colli}</div>
            <div class="text-sm text-neutral-600">Totale Colli</div>
          </div>

          <div class="stat-card text-center">
            <div class="text-2xl font-bold text-green-600">€ {totale_valore.toFixed(2)}</div>
            <div class="text-sm text-neutral-600">Totale Valore</div>
          </div>

          <div class="stat-card text-center">
            <div class="text-2xl font-bold text-purple-600">{righe.length}</div>
            <div class="text-sm text-neutral-600">Righe Ordine</div>
          </div>

        </div>
      </div>

    </div>

    <!-- Sezione righe ordine -->
    <div class="card mt-6">
      <div class="card-header">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Righe Ordine</h2>
          <button type="button" on:click={aggiungiRiga} class="btn btn-sm btn-success">
            + Aggiungi Riga
          </button>
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
            <table class="table">
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
                    <td>
                      <select 
                        bind:value={riga.prodotto_id}
                        name="riga_{i}_prodotto_id"
                        class="form-input w-full"
                        on:change={(e) => aggiornaProdotto(i, parseInt(e.target.value))}
                        required
                      >
                        <option value="">Seleziona prodotto...</option>
                        {#each data.prodotti as prodotto}
                          <option value={prodotto.id}>
                            {prodotto.codice} - {prodotto.descrizione}
                            {#if prodotto.categoria} ({prodotto.categoria}){/if}
                          </option>
                        {/each}
                      </select>
                    </td>
                    
                    <!-- Quantità -->
                    <td>
                      <input 
                        type="number" 
                        bind:value={riga.quantita}
                        name="riga_{i}_quantita"
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
                        name="riga_{i}_prezzo"
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
                        name="riga_{i}_note"
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
      <a href="/auth/ordini?committente={data.committente.id}" class="btn btn-secondary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Annulla
      </a>
      <button 
        type="submit" 
        class="btn btn-primary"
        disabled={submitting || data.prodotti.length === 0}
      >
        {submitting ? 'Creazione...' : 'Crea Ordine'}
      </button>
    </div>

  </form>
</div>