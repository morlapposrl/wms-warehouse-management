<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types.js';

  export let data: PageData;

  $: committente = data.committente;
  $: stats = data.stats;
  $: topProdotti = data.topProdotti;
  $: ultimiMovimenti = data.ultimiMovimenti;

  // Formatters
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatNumber(num: number) {
    return new Intl.NumberFormat('it-IT').format(num);
  }

  function getTipoMovimentoIcon(tipo: string) {
    switch (tipo) {
      case 'RECEIVE': return '📥';
      case 'PUT_AWAY': return '📦';
      case 'PICK': return '🔍';
      case 'REPLENISH': return '🔄';
      case 'TRANSFER': return '↔️';
      case 'CROSS_DOCK': return '⚡';
      case 'ADJUST_PLUS': return '➕';
      case 'ADJUST_MINUS': return '➖';
      case 'RETURN_RECEIVE': return '🔙';
      case 'DISPOSE': return '🗑️';
      // Backwards compatibility
      case 'CARICO': return '📥';
      case 'SCARICO': return '📤';
      case 'RETTIFICA_POSITIVA': return '➕';
      case 'RETTIFICA_NEGATIVA': return '➖';
      default: return '📦';
    }
  }

  function getTipoMovimentoClass(tipo: string) {
    switch (tipo) {
      case 'RECEIVE':
      case 'PUT_AWAY':
      case 'ADJUST_PLUS':
      case 'RETURN_RECEIVE':
      case 'CARICO':
      case 'RETTIFICA_POSITIVA':
        return 'badge-success';
      case 'PICK':
      case 'DISPOSE':
      case 'ADJUST_MINUS':
      case 'SCARICO':
      case 'RETTIFICA_NEGATIVA':
        return 'badge-danger';
      case 'TRANSFER':
      case 'REPLENISH':
      case 'CROSS_DOCK':
        return 'badge-info';
      default: 
        return 'badge-info';
    }
  }
</script>

<svelte:head>
  <title>Dashboard - {committente?.ragione_sociale} | Gestionale Magazzino</title>
</svelte:head>

<div class="container mx-auto max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-3">
          <Icon name="chart-bar" class="w-8 h-8 text-primary-600" />
          Dashboard {committente?.ragione_sociale}
        </h1>
        <p class="text-neutral-600 mt-2">
          Panoramica generale dell'attività di magazzino
        </p>
      </div>
      <div class="text-right text-sm text-neutral-500">
        Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  </div>

  <!-- Statistics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Prodotti -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Prodotti</p>
          <p class="text-2xl font-bold text-neutral-900">
            {formatNumber(stats.prodotti?.totali || 0)}
          </p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">
              {stats.prodotti?.attivi || 0} attivi
            </span>
            <span class="text-xs text-neutral-500">
              {stats.prodotti?.inattivi || 0} inattivi
            </span>
          </div>
        </div>
        <div class="stat-icon bg-primary-100">
          <Icon name="cube" class="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>

    <!-- Giacenze -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Giacenze</p>
          <p class="text-2xl font-bold text-neutral-900">
            {formatNumber(stats.giacenze?.totale_pezzi || 0)}
          </p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">
              {stats.giacenze?.prodotti_con_giacenza || 0} prodotti
            </span>
            {#if (stats.giacenze?.totale_riservato || 0) > 0}
              <span class="text-xs text-yellow-600">
                {formatNumber(stats.giacenze.totale_riservato)} riservati
              </span>
            {/if}
            {#if (stats.giacenze?.totale_in_transito || 0) > 0}
              <span class="text-xs text-blue-600">
                {formatNumber(stats.giacenze.totale_in_transito)} in transito
              </span>
            {/if}
            {#if (stats.giacenze?.sotto_scorta || 0) > 0}
              <span class="text-xs text-red-600">
                {stats.giacenze.sotto_scorta} sotto scorta
              </span>
            {/if}
          </div>
        </div>
        <div class="stat-icon bg-secondary-100">
          <Icon name="archive-box" class="w-6 h-6 text-secondary-600" />
        </div>
      </div>
    </div>

    <!-- Movimenti (ultimi 7 giorni) -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Movimenti (7gg)</p>
          <p class="text-2xl font-bold text-neutral-900">
            {formatNumber(stats.movimenti?.totali || 0)}
          </p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">
              {stats.movimenti?.carichi || 0} entrate
            </span>
            <span class="text-xs text-red-600">
              {stats.movimenti?.scarichi || 0} uscite
            </span>
            <span class="text-xs text-blue-600">
              {stats.movimenti?.trasferimenti || 0} trasferimenti
            </span>
          </div>
        </div>
        <div class="stat-icon bg-blue-100">
          <Icon name="arrows-right-left" class="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>

    <!-- Categorie -->
    <div class="stat-card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-600">Categorie</p>
          <p class="text-2xl font-bold text-neutral-900">
            {formatNumber(stats.categorie?.totali || 0)}
          </p>
          <div class="flex gap-2 mt-1">
            <span class="text-xs text-green-600">
              {stats.categorie?.attive || 0} attive
            </span>
            <span class="text-xs text-neutral-500">
              {stats.categorie?.inattive || 0} inattive
            </span>
          </div>
        </div>
        <div class="stat-icon bg-purple-100">
          <Icon name="tag" class="w-6 h-6 text-purple-600" />
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="card mb-8">
    <div class="card-header">
      <h2 class="flex items-center gap-2">
        <Icon name="bolt" class="w-5 h-5" />
        Azioni Rapide
      </h2>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/auth/committenti/{committente?.id}/prodotti" class="btn btn-primary">
          <Icon name="plus" class="w-4 h-4 mr-2" />
          Nuovo Prodotto
        </a>
        <a href="/auth/committenti/{committente?.id}/movimenti" class="btn btn-secondary">
          <Icon name="arrows-right-left" class="w-4 h-4 mr-2" />
          Nuovo Movimento
        </a>
        <a href="/auth/committenti/{committente?.id}/giacenze" class="btn btn-secondary">
          <Icon name="archive-box" class="w-4 h-4 mr-2" />
          Vedi Giacenze
        </a>
        <a href="/auth/committenti/{committente?.id}/inventari" class="btn btn-secondary">
          <Icon name="clipboard-document-list" class="w-4 h-4 mr-2" />
          Inventario
        </a>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Top Prodotti per Giacenza -->
    <div class="card">
      <div class="card-header">
        <h3 class="flex items-center gap-2">
          <Icon name="trophy" class="w-5 h-5" />
          Top Prodotti per Giacenza
        </h3>
      </div>
      <div class="card-body">
        {#if topProdotti && topProdotti.length > 0}
          <div class="space-y-4">
            {#each topProdotti as prodotto, index}
              <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p class="font-medium text-neutral-900">{prodotto.descrizione}</p>
                    <p class="text-sm text-neutral-600">
                      {prodotto.codice_interno || prodotto.sku_code}
                      {#if prodotto.quantita_riservata > 0}
                        • {formatNumber(prodotto.quantita_riservata)} riservati
                      {/if}
                    </p>
                    {#if prodotto.valore_totale}
                      <p class="text-xs text-green-600">€ {formatNumber(prodotto.valore_totale)}</p>
                    {/if}
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-lg">{formatNumber(prodotto.quantita)}</p>
                  <p class="text-sm text-neutral-600">{prodotto.unita_misura || 'PZ'}</p>
                </div>
              </div>
            {/each}
          </div>
          <div class="mt-4 pt-4 border-t">
            <a href="/auth/committenti/{committente?.id}/giacenze" class="btn btn-secondary btn-sm w-full">
              <Icon name="eye" class="w-4 h-4 mr-2" />
              Vedi Tutte le Giacenze
            </a>
          </div>
        {:else}
          <div class="text-center py-8">
            <Icon name="archive-box" class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p class="text-neutral-500">Nessun prodotto con giacenza</p>
            <a href="/auth/committenti/{committente?.id}/prodotti" class="btn btn-primary btn-sm mt-3">
              <Icon name="plus" class="w-4 h-4 mr-2" />
              Aggiungi Primo Prodotto
            </a>
          </div>
        {/if}
      </div>
    </div>

    <!-- Ultimi Movimenti -->
    <div class="card">
      <div class="card-header">
        <h3 class="flex items-center gap-2">
          <Icon name="clock" class="w-5 h-5" />
          Ultimi Movimenti
        </h3>
      </div>
      <div class="card-body">
        {#if ultimiMovimenti && ultimiMovimenti.length > 0}
          <div class="space-y-3">
            {#each ultimiMovimenti as movimento}
              <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <span class="text-lg">{getTipoMovimentoIcon(movimento.tipo_movimento)}</span>
                  <div>
                    <p class="font-medium text-neutral-900">{movimento.prodotto_descrizione}</p>
                    <p class="text-sm text-neutral-600">
                      {movimento.prodotto_codice} • {formatDate(movimento.data_movimento)}
                    </p>
                    {#if movimento.from_ubicazione && movimento.to_ubicazione}
                      <p class="text-xs text-neutral-500">{movimento.from_ubicazione} → {movimento.to_ubicazione}</p>
                    {:else if movimento.from_ubicazione}
                      <p class="text-xs text-neutral-500">Da: {movimento.from_ubicazione}</p>
                    {:else if movimento.to_ubicazione}
                      <p class="text-xs text-neutral-500">A: {movimento.to_ubicazione}</p>
                    {/if}
                    {#if movimento.operatore_nome}
                      <p class="text-xs text-blue-500">Op: {movimento.operatore_nome}</p>
                    {/if}
                    {#if movimento.note}
                      <p class="text-xs text-neutral-500 mt-1">{movimento.note}</p>
                    {/if}
                  </div>
                </div>
                <div class="text-right">
                  <span class="badge {getTipoMovimentoClass(movimento.tipo_movimento)}">
                    {movimento.tipo_movimento.replace('_', ' ')}
                  </span>
                  <p class="font-semibold mt-1">
                    {movimento.tipo_movimento.includes('PICK') || movimento.tipo_movimento.includes('DISPOSE') || movimento.tipo_movimento.includes('MINUS') || movimento.tipo_movimento.includes('SCARICO') || movimento.tipo_movimento.includes('NEGATIVA') ? '-' : '+'}{formatNumber(movimento.quantita)}
                  </p>
                  {#if movimento.durata_secondi}
                    <p class="text-xs text-neutral-500">{movimento.durata_secondi}s</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
          <div class="mt-4 pt-4 border-t">
            <a href="/auth/committenti/{committente?.id}/movimenti" class="btn btn-secondary btn-sm w-full">
              <Icon name="eye" class="w-4 h-4 mr-2" />
              Vedi Tutti i Movimenti
            </a>
          </div>
        {:else}
          <div class="text-center py-8">
            <Icon name="arrows-right-left" class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p class="text-neutral-500">Nessun movimento registrato</p>
            <a href="/auth/committenti/{committente?.id}/movimenti" class="btn btn-primary btn-sm mt-3">
              <Icon name="plus" class="w-4 h-4 mr-2" />
              Registra Primo Movimento
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Alert Scorte Basse -->
  {#if (stats.giacenze?.sotto_scorta || 0) > 0}
    <div class="mt-8">
      <div class="alert alert-error">
        <div class="flex items-center gap-2">
          <Icon name="exclamation-triangle" class="w-5 h-5" />
          <strong>Attenzione!</strong>
          {stats.giacenze.sotto_scorta} prodotti hanno giacenza sotto la scorta minima.
          <a href="/auth/committenti/{committente?.id}/giacenze/scorta-bassa" class="underline font-medium ml-2">
            Visualizza prodotti
          </a>
        </div>
      </div>
    </div>
  {/if}
</div>