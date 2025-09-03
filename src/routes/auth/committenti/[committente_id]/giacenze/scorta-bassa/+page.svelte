<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const committente_id = parseInt($page.params.committente_id);

  // Stati della scorta con colori
  const statiScorta = {
    'CRITICA': { desc: 'Scorta Critica', color: 'bg-red-100 text-red-800', icon: '🚨' },
    'BASSA': { desc: 'Scorta Bassa', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' }
  };

  // Stato componente
  let prodottiScortaBassa: any[] = [];
  let loading = true;
  let error = '';

  // Carica prodotti con scorta bassa
  async function loadProdottiScortaBassa() {
    try {
      loading = true;
      error = '';

      const response = await fetch(`/api/committenti/${committente_id}/giacenze/scorta-bassa`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento');
      }

      const data = await response.json();
      prodottiScortaBassa = data.prodotti || [];

    } catch (err) {
      error = err instanceof Error ? err.message : 'Errore sconosciuto';
    } finally {
      loading = false;
    }
  }

  // Formatta valuta
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  // Calcola priorità suggerita per riordino
  function calcolaPriorità(giacenza: any): { priorità: number, descrizione: string, colore: string } {
    if (giacenza.quantita <= 0) {
      return { priorità: 1, descrizione: 'URGENTE - Esaurito', colore: 'text-red-800' };
    } else if (giacenza.quantita <= giacenza.scorta_minima * 0.5) {
      return { priorità: 2, descrizione: 'Alta - Sotto 50% scorta minima', colore: 'text-red-600' };
    } else {
      return { priorità: 3, descrizione: 'Media - Sotto scorta minima', colore: 'text-yellow-600' };
    }
  }

  // Inizializzazione
  onMount(() => {
    loadProdottiScortaBassa();
  });

  // Raggruppa per priorità
  $: prodottiRaggruppati = prodottiScortaBassa.reduce((acc, prodotto) => {
    const priorità = calcolaPriorità(prodotto);
    if (!acc[priorità.priorità]) {
      acc[priorità.priorità] = {
        descrizione: priorità.descrizione,
        colore: priorità.colore,
        prodotti: []
      };
    }
    acc[priorità.priorità].prodotti.push(prodotto);
    return acc;
  }, {} as Record<number, any>);
</script>

<svelte:head>
  <title>Scorte Basse - Committente {committente_id}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">⚠️ Scorte Basse e Critiche</h1>
      <p class="text-gray-600 mt-2">Prodotti che necessitano riordino per il committente #{committente_id}</p>
    </div>
    <div class="flex gap-4">
      <a 
        href="/committenti/{committente_id}/giacenze"
        class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        ← Tutte le Giacenze
      </a>
      <button
        on:click={loadProdottiScortaBassa}
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        🔄 Aggiorna
      </button>
    </div>
  </div>

  <!-- Conteggio Totale -->
  <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
    <div class="flex items-center">
      <div class="text-red-800 text-4xl mr-4">🚨</div>
      <div>
        <div class="text-xl font-bold text-red-800">
          {prodottiScortaBassa.length} prodotti necessitano attenzione
        </div>
        <div class="text-red-600 mt-1">
          {prodottiScortaBassa.filter(p => p.quantita <= 0).length} esauriti, 
          {prodottiScortaBassa.filter(p => p.quantita > 0 && p.quantita <= p.scorta_minima).length} sotto scorta minima
        </div>
      </div>
    </div>
  </div>

  <!-- Contenuto principale -->
  {#if loading}
    <div class="p-12 text-center">
      <div class="text-gray-500">Caricamento prodotti con scorta bassa...</div>
    </div>
  {:else if error}
    <div class="p-6 text-center">
      <div class="text-red-600 mb-4">{error}</div>
      <button
        on:click={loadProdottiScortaBassa}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
      >
        Riprova
      </button>
    </div>
  {:else if prodottiScortaBassa.length === 0}
    <div class="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
      <div class="text-green-800 text-6xl mb-4">✅</div>
      <div class="text-xl font-bold text-green-800 mb-2">Tutte le scorte sono OK!</div>
      <div class="text-green-600">Nessun prodotto necessita riordino immediato.</div>
    </div>
  {:else}
    <!-- Lista raggruppata per priorità -->
    {#each Object.entries(prodottiRaggruppati).sort(([a], [b]) => parseInt(a) - parseInt(b)) as [priorità, gruppo]}
      <div class="mb-8">
        <div class="mb-4">
          <h2 class="text-xl font-bold {gruppo.colore} flex items-center">
            <span class="mr-2">
              {priorità === '1' ? '🚨' : priorità === '2' ? '⚠️' : '⚡'}
            </span>
            {gruppo.descrizione} ({gruppo.prodotti.length})
          </h2>
        </div>

        <div class="bg-white rounded-lg shadow border">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giacenza</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scorte Min/Max</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggerimento</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each gruppo.prodotti as prodotto}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">
                      <div class="font-medium">{prodotto.prodotto_codice}</div>
                      <div class="text-gray-500">{prodotto.prodotto_descrizione}</div>
                      <div class="text-xs text-gray-400">{prodotto.categoria_descrizione}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="text-lg font-bold {prodotto.quantita <= 0 ? 'text-red-600' : 'text-yellow-600'}">
                        {prodotto.quantita}
                      </div>
                      <div class="text-gray-500">{prodotto.unita_misura_codice}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      <div>Min: <span class="font-medium text-yellow-600">{prodotto.scorta_minima}</span></div>
                      <div>Max: <span class="font-medium text-green-600">{prodotto.scorta_massima}</span></div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {#if statiScorta[prodotto.stato_scorta]}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statiScorta[prodotto.stato_scorta].color}">
                          {statiScorta[prodotto.stato_scorta].icon} {statiScorta[prodotto.stato_scorta].desc}
                        </span>
                      {:else}
                        <span class="text-gray-500">{prodotto.stato_scorta}</span>
                      {/if}
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <div class="font-medium text-blue-600">
                        Riordina: {Math.max(prodotto.scorta_massima - prodotto.quantita, prodotto.scorta_minima * 2)}
                      </div>
                      <div class="text-gray-500">{prodotto.unita_misura_codice}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div class="font-medium">{formatCurrency(prodotto.valore_totale)}</div>
                      <div class="text-gray-500">({formatCurrency(prodotto.prezzo_acquisto)}/unità)</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href="/committenti/{committente_id}/movimenti?tipo_movimento=CARICO&prodotto_id={prodotto.prodotto_id}"
                        class="text-green-600 hover:text-green-900 mr-4"
                      >
                        + Carico
                      </a>
                      <a
                        href="/committenti/{committente_id}/movimenti?prodotto_id={prodotto.prodotto_id}"
                        class="text-blue-600 hover:text-blue-900"
                      >
                        Movimenti
                      </a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {/each}

    <!-- Riepilogo azioni suggerite -->
    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-blue-800 mb-4">💡 Azioni Suggerite</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded border">
          <div class="font-medium text-gray-900">Prodotti Esauriti</div>
          <div class="text-2xl font-bold text-red-600">{prodottiScortaBassa.filter(p => p.quantita <= 0).length}</div>
          <div class="text-sm text-gray-500">Riordino urgente</div>
        </div>
        
        <div class="bg-white p-4 rounded border">
          <div class="font-medium text-gray-900">Valore Riordino Stimato</div>
          <div class="text-2xl font-bold text-green-600">
            {formatCurrency(
              prodottiScortaBassa.reduce((sum, p) => 
                sum + (Math.max(p.scorta_massima - p.quantita, p.scorta_minima * 2) * p.prezzo_acquisto), 0)
            )}
          </div>
          <div class="text-sm text-gray-500">Investimento necessario</div>
        </div>
        
        <div class="bg-white p-4 rounded border">
          <div class="font-medium text-gray-900">Fornitori da Contattare</div>
          <div class="text-2xl font-bold text-blue-600">
            {new Set(prodottiScortaBassa.map(p => p.categoria_descrizione)).size}
          </div>
          <div class="text-sm text-gray-500">Categorie coinvolte</div>
        </div>
      </div>
    </div>
  {/if}
</div>