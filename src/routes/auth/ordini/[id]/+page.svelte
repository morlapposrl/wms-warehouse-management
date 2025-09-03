<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  let statusSubmitting = false;
  let quantitiesSubmitting = false;

  // Funzione per ottenere classe badge basata sullo stato
  function getBadgeClass(stato: string): string {
    switch (stato) {
      case 'NUOVO': return 'badge-info';
      case 'CONFERMATO': return 'badge-warning';
      case 'IN_PREPARAZIONE': return 'badge-warning';
      case 'PRONTO': return 'badge-success';
      case 'SPEDITO': return 'badge-success';
      case 'CONSEGNATO': return 'badge-success';
      case 'ANNULLATO': return 'badge-danger';
      case 'RESO': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  // Funzione per formattare il tipo ordine
  function formatTipoOrdine(tipo: string): string {
    return tipo === 'INBOUND' ? 'In Entrata' : 'In Uscita';
  }

  // Funzione per formattare data
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  }

  // Funzione per formattare datetime
  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('it-IT');
  }

  // Calcola totale ordinato ed evaso
  $: totaleOrdinato = data.righe.reduce((sum, r) => sum + r.quantita_ordinata, 0);
  $: totaleEvaso = data.righe.reduce((sum, r) => sum + (r.quantita_evasa || 0), 0);

  // Funzione per ottenere classe badge basata sul tipo movimento
  function getMovementBadgeClass(tipo: string): string {
    switch (tipo) {
      case 'CARICO': return 'badge-success';
      case 'SCARICO': return 'badge-warning';
      case 'RETTIFICA_POS': return 'badge-info';
      case 'RETTIFICA_NEG': return 'badge-danger';
      case 'RESO_CLIENTE':
      case 'RESO_FORNITORE': return 'badge-warning';
      case 'TRASFERIMENTO_INTERNO':
      case 'TRASFERIMENTO_INTER_COMMITTENTE': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  function formatMovementType(tipo: string): string {
    const types = {
      'CARICO': 'Carico',
      'SCARICO': 'Scarico', 
      'RETTIFICA_POS': 'Rettifica +',
      'RETTIFICA_NEG': 'Rettifica -',
      'RESO_CLIENTE': 'Reso Cliente',
      'RESO_FORNITORE': 'Reso Fornitore',
      'TRASFERIMENTO_INTERNO': 'Trasf. Interno',
      'TRASFERIMENTO_INTER_COMMITTENTE': 'Trasf. Inter-Comm.'
    };
    return types[tipo] || tipo;
  }

  // Stato per campi dinamici
  let selectedStatus = data.ordine.stato;
  let showShippingFields = false;
  
  $: showShippingFields = selectedStatus === 'SPEDITO';
  
  // Gestione dati movimenti con fallback sicuro
  $: movimenti = data.movimenti || [];
  $: movimenti_stats = data.movimenti_stats || {
    totale_movimenti: 0,
    movimenti_collegati: 0,
    carichi: 0,
    scarichi: 0,
    rettifiche: 0
  };
</script>

<div class="container mx-auto px-6 py-8">
  
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="h1">Dettaglio Ordine #{data.ordine.numero_ordine}</h1>
      <p class="text-neutral-600 mt-1">
        Committente: <strong>{data.ordine.committente_nome}</strong>
        | Creato il {formatDateTime(data.ordine.created_at)}
      </p>
    </div>
    <div class="flex gap-2">
      <a href="/auth/ordini?committente={data.ordine.committente_id}" class="btn btn-secondary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Torna alla lista
      </a>
    </div>
  </div>

  <!-- Alert successo/errore -->
  {#if form?.success}
    <div class="alert alert-success mb-6">
      <strong>Successo:</strong> {form.success}
    </div>
  {/if}
  
  {#if form?.error}
    <div class="alert alert-error mb-6">
      <strong>Errore:</strong> {form.error}
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <!-- Colonna 1: Dati Ordine -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold">Informazioni Ordine</h2>
      </div>
      <div class="card-body space-y-4">
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Numero Ordine</label>
            <div class="font-mono font-medium">{data.ordine.numero_ordine}</div>
          </div>
          
          <div>
            <label class="form-label">Tipo</label>
            <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {data.ordine.tipo_ordine === 'INBOUND' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
              {formatTipoOrdine(data.ordine.tipo_ordine)}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Stato Attuale</label>
            <span class="badge {getBadgeClass(data.ordine.stato)}">{data.ordine.stato}</span>
          </div>
          
          <div>
            <label class="form-label">Data Ordine</label>
            <div>{formatDate(data.ordine.data_ordine)}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Data Richiesta</label>
            <div>{formatDate(data.ordine.data_richiesta)}</div>
          </div>
          
          <div>
            <label class="form-label">Data Spedizione</label>
            <div>{formatDate(data.ordine.data_spedizione)}</div>
          </div>
        </div>

        <div>
          <label class="form-label">Cliente/Fornitore</label>
          <div class="font-medium">{data.ordine.cliente_fornitore}</div>
        </div>

        {#if data.ordine.corriere || data.ordine.tracking_number}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Corriere</label>
              <div>{data.ordine.corriere || '-'}</div>
            </div>
            
            <div>
              <label class="form-label">Tracking</label>
              {#if data.ordine.tracking_number}
                <div class="font-mono text-sm">{data.ordine.tracking_number}</div>
              {:else}
                <div>-</div>
              {/if}
            </div>
          </div>
        {/if}

      </div>
    </div>

    <!-- Colonna 2: Indirizzi e Note -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold">
          {data.ordine.tipo_ordine === 'INBOUND' ? 'Dati Ricevimento' : 'Dati Spedizione'}
        </h2>
      </div>
      <div class="card-body space-y-4">
        
        {#if data.ordine.indirizzo_destinazione}
          <div>
            <label class="form-label">Indirizzo</label>
            <div class="whitespace-pre-line text-sm">{data.ordine.indirizzo_destinazione}</div>
          </div>
        {/if}

        {#if data.ordine.contatti_destinazione}
          <div>
            <label class="form-label">Contatti</label>
            <div class="text-sm">{data.ordine.contatti_destinazione}</div>
          </div>
        {/if}

        {#if data.ordine.note_spedizione}
          <div>
            <label class="form-label">Note</label>
            <div class="whitespace-pre-line text-sm">{data.ordine.note_spedizione}</div>
          </div>
        {/if}

      </div>
    </div>

    <!-- Colonna 3: Riepilogo Quantità -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-semibold">Riepilogo</h2>
      </div>
      <div class="card-body space-y-4">
        
        <div class="stat-card text-center">
          <div class="text-2xl font-bold text-blue-600">{totaleOrdinato}</div>
          <div class="text-sm text-neutral-600">Colli Ordinati</div>
        </div>

        <div class="stat-card text-center">
          <div class="text-2xl font-bold text-green-600">{totaleEvaso}</div>
          <div class="text-sm text-neutral-600">
            {data.ordine.tipo_ordine === 'INBOUND' ? 'Colli Ricevuti' : 'Colli Spediti'}
          </div>
        </div>

        <div class="stat-card text-center">
          <div class="text-2xl font-bold text-purple-600">€ {(data.ordine.totale_valore || 0).toFixed(2)}</div>
          <div class="text-sm text-neutral-600">Valore Totale</div>
        </div>

      </div>
    </div>
    
  </div>

  <!-- Sezione Cambio Stato -->
  <div class="card mt-6">
    <div class="card-header">
      <h2 class="text-lg font-semibold">Aggiorna Stato Ordine</h2>
    </div>
    <div class="card-body">
      
      <form method="POST" action="?/updateStatus" use:enhance={({ submitting }) => {
        statusSubmitting = submitting;
        return async ({ result }) => {
          statusSubmitting = false;
          if (result.type === 'success') {
            // Ricarica la pagina per mostrare lo stato aggiornato
            goto(`/auth/ordini/${data.ordine.id}?committente=${data.ordine.committente_id}`, {
              invalidateAll: true
            });
          }
        };
      }}>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <!-- Nuovo stato -->
          <div>
            <label class="form-label">Nuovo Stato</label>
            <select bind:value={selectedStatus} name="stato" class="form-input" required>
              {#each data.stati_disponibili as stato}
                <option value={stato} selected={stato === data.ordine.stato}>
                  {stato}
                </option>
              {/each}
            </select>
          </div>

          <!-- Corriere (solo se spedito) -->
          {#if showShippingFields}
            <div>
              <label class="form-label">Corriere</label>
              <select name="corriere" class="form-input">
                <option value="">Seleziona corriere...</option>
                {#each data.corrieri_disponibili as corriere}
                  <option value={corriere}>{corriere}</option>
                {/each}
              </select>
            </div>

            <!-- Tracking number -->
            <div>
              <label class="form-label">Tracking Number</label>
              <input type="text" name="tracking_number" class="form-input" placeholder="Codice tracciamento..."/>
            </div>
          {/if}

          <!-- Note -->
          <div class={showShippingFields ? 'md:col-span-1' : 'md:col-span-3'}>
            <label class="form-label">Note (opzionale)</label>
            <input type="text" name="note" class="form-input" placeholder="Note aggiornamento stato..."/>
          </div>

        </div>

        <div class="flex justify-end mt-4">
          <button type="submit" class="btn btn-primary" disabled={statusSubmitting || selectedStatus === data.ordine.stato}>
            {statusSubmitting ? 'Aggiornamento...' : 'Aggiorna Stato'}
          </button>
        </div>

      </form>
      
    </div>
  </div>

  <!-- Sezione Righe Ordine -->
  <div class="card mt-6">
    <div class="card-header">
      <h2 class="text-lg font-semibold">Righe Ordine ({data.righe.length})</h2>
    </div>
    <div class="card-body">
      
      <!-- Tabella righe -->
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Prodotto</th>
              <th>Quantità Ordinata</th>
              <th>Quantità Evasa</th>
              <th>Prezzo Unit.</th>
              <th>Subtotale</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {#each data.righe as riga}
              <tr>
                <!-- Prodotto -->
                <td>
                  <div>
                    <div class="font-medium">{riga.prodotto_codice}</div>
                    <div class="text-sm text-neutral-600">{riga.prodotto_descrizione}</div>
                    {#if riga.categoria}
                      <div class="text-xs text-neutral-500">({riga.categoria})</div>
                    {/if}
                  </div>
                </td>
                
                <!-- Quantità ordinata -->
                <td class="text-center font-medium">
                  {riga.quantita_ordinata}
                  {#if riga.unita_misura}
                    <span class="text-xs text-neutral-500">{riga.unita_misura}</span>
                  {/if}
                </td>
                
                <!-- Quantità evasa -->
                <td class="text-center">
                  <span class="font-medium" class:text-green-600={riga.quantita_evasa && riga.quantita_evasa >= riga.quantita_ordinata}>
                    {riga.quantita_evasa || 0}
                  </span>
                </td>
                
                <!-- Prezzo unitario -->
                <td class="text-right font-mono">
                  € {riga.prezzo_unitario.toFixed(2)}
                </td>
                
                <!-- Subtotale -->
                <td class="text-right font-mono font-medium">
                  € {riga.subtotale.toFixed(2)}
                </td>
                
                <!-- Note -->
                <td class="text-sm text-neutral-600">
                  {riga.note_riga || '-'}
                </td>
              </tr>
            {/each}
          </tbody>
          
          <!-- Totale -->
          <tfoot>
            <tr class="bg-neutral-50 font-medium">
              <td colspan="4" class="text-right">TOTALE:</td>
              <td class="text-right font-mono">€ {(data.ordine.totale_valore || 0).toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  </div>

  <!-- Sezione Movimenti di Magazzino -->
  <div class="card mt-6">
    <div class="card-header">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Movimenti di Magazzino</h2>
        <div class="flex gap-4 text-sm text-neutral-600">
          <span>Totale: <strong>{movimenti_stats.totale_movimenti}</strong></span>
          <span>Collegati: <strong>{movimenti_stats.movimenti_collegati}</strong></span>
        </div>
      </div>
    </div>
    <div class="card-body">
      
      <!-- Statistiche rapide -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card text-center bg-green-50">
          <div class="text-xl font-bold text-green-600">{movimenti_stats.carichi}</div>
          <div class="text-xs text-green-700">Carichi</div>
        </div>
        <div class="stat-card text-center bg-yellow-50">
          <div class="text-xl font-bold text-yellow-600">{movimenti_stats.scarichi}</div>
          <div class="text-xs text-yellow-700">Scarichi</div>
        </div>
        <div class="stat-card text-center bg-blue-50">
          <div class="text-xl font-bold text-blue-600">{movimenti_stats.rettifiche}</div>
          <div class="text-xs text-blue-700">Rettifiche</div>
        </div>
        <div class="stat-card text-center bg-purple-50">
          <div class="text-xl font-bold text-purple-600">{movimenti_stats.movimenti_collegati}</div>
          <div class="text-xs text-purple-700">Collegati Ordine</div>
        </div>
      </div>

      {#if movimenti.length > 0}
        <!-- Tabella movimenti -->
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Data/Ora</th>
                <th>Tipo</th>
                <th>Prodotto</th>
                <th>Quantità</th>
                <th>Prezzo</th>
                <th>Documento</th>
                <th>Operatore</th>
                <th>Collegamento</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {#each movimenti as movimento}
                <tr class={movimento.collegato_ordine ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}>
                  <!-- Data/Ora -->
                  <td>
                    <div class="text-sm font-medium">{formatDateTime(movimento.data_movimento)}</div>
                    {#if movimento.data_documento && movimento.data_documento !== movimento.data_movimento}
                      <div class="text-xs text-neutral-500">Doc: {formatDate(movimento.data_documento)}</div>
                    {/if}
                  </td>
                  
                  <!-- Tipo movimento -->
                  <td>
                    <span class="badge {getMovementBadgeClass(movimento.tipo_movimento)}">
                      {formatMovementType(movimento.tipo_movimento)}
                    </span>
                  </td>
                  
                  <!-- Prodotto -->
                  <td>
                    <div class="font-medium">{movimento.prodotto_codice}</div>
                    <div class="text-sm text-neutral-600 max-w-xs truncate">{movimento.prodotto_descrizione}</div>
                  </td>
                  
                  <!-- Quantità -->
                  <td class="text-center">
                    <span class="font-mono font-medium" 
                          class:text-green-600={movimento.tipo_movimento === 'CARICO' || movimento.tipo_movimento === 'RETTIFICA_POS'}
                          class:text-red-600={movimento.tipo_movimento === 'SCARICO' || movimento.tipo_movimento === 'RETTIFICA_NEG'}
                    >
                      {movimento.tipo_movimento === 'SCARICO' || movimento.tipo_movimento === 'RETTIFICA_NEG' ? '-' : '+'}{movimento.quantita}
                    </span>
                  </td>
                  
                  <!-- Prezzo -->
                  <td class="text-right font-mono">
                    {#if movimento.prezzo > 0}
                      € {movimento.prezzo.toFixed(2)}
                    {:else}
                      -
                    {/if}
                  </td>
                  
                  <!-- Documento -->
                  <td>
                    {#if movimento.numero_documento}
                      <div class="text-sm font-medium">{movimento.numero_documento}</div>
                      {#if movimento.fornitore_nome}
                        <div class="text-xs text-neutral-500">{movimento.fornitore_nome}</div>
                      {/if}
                    {:else}
                      -
                    {/if}
                  </td>
                  
                  <!-- Operatore -->
                  <td class="text-sm">
                    {movimento.operatore || '-'}
                  </td>
                  
                  <!-- Collegamento ordine -->
                  <td class="text-center">
                    {#if movimento.collegato_ordine}
                      <div class="inline-flex items-center gap-1 text-blue-600">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        <span class="text-xs">Collegato</span>
                      </div>
                    {:else}
                      <span class="text-xs text-neutral-400">Correlato</span>
                    {/if}
                  </td>
                  
                  <!-- Note -->
                  <td class="text-sm text-neutral-600 max-w-xs">
                    <div class="truncate">
                      {movimento.note || movimento.causale || '-'}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-8 text-neutral-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="font-medium">Nessun movimento di magazzino trovato</p>
          <p class="text-sm">I movimenti dei prodotti di questo ordine appariranno qui</p>
        </div>
      {/if}

    </div>
  </div>

  <!-- Sezione Storico Stati -->
  {#if data.tracking.length > 0}
    <div class="card mt-6">
      <div class="card-header">
        <h2 class="text-lg font-semibold">Storico Cambi Stato</h2>
      </div>
      <div class="card-body">
        
        <div class="space-y-3">
          {#each data.tracking as track}
            <div class="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
              <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div class="flex-grow">
                <div class="flex items-center gap-2">
                  {#if track.stato_precedente}
                    <span class="badge badge-secondary">{track.stato_precedente}</span>
                    <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  {/if}
                  <span class="badge {getBadgeClass(track.stato_nuovo)}">{track.stato_nuovo}</span>
                </div>
                <div class="text-sm text-neutral-600 mt-1">
                  {track.note}
                </div>
                <div class="text-xs text-neutral-500 mt-1">
                  {formatDateTime(track.data_cambio)}
                </div>
              </div>
            </div>
          {/each}
        </div>

      </div>
    </div>
  {/if}

</div>