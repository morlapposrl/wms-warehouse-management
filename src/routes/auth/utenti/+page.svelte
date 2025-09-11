<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  
  export let data;
  export let form;
  
  let showCreateModal = false;
  let showEditModal = false;
  let showPasswordModal = false;
  let selectedUser = null;
  let isLoading = false;
  
  // Filtri
  let searchTerm = data.filtri.search || '';
  let selectedRuolo = data.filtri.ruolo_filter || '';
  let selectedCommittente = data.filtri.committente_filter || '';
  let selectedAttivo = data.filtri.attivo_filter || '';

  // Form data
  let createForm = {
    email: '',
    password: '',
    nome: '',
    cognome: '',
    ruolo: 'utente_committente',
    specializzazione: '',
    committente_id: ''
  };

  let editForm = {};
  let passwordForm = {
    user_id: '',
    new_password: '',
    confirm_password: ''
  };

  // Ruoli disponibili
  const ruoli = [
    { value: 'super_admin', label: '🔧 Super Admin', description: 'Accesso completo al sistema' },
    { value: 'admin_committente', label: '👨‍💼 Admin Committente', description: 'Gestione committente specifico' },
    { value: 'operatore_magazzino', label: '📦 Operatore Magazzino', description: 'Operazioni cross-committente' },
    { value: 'team_leader', label: '👥 Team Leader', description: 'Supervisione operativa' },
    { value: 'utente_committente', label: '👤 Utente Committente', description: 'Solo lettura committente' },
    { value: 'ospite', label: '👁️ Ospite', description: 'Accesso limitato' }
  ];

  function openCreateModal() {
    createForm = {
      email: '',
      password: '',
      nome: '',
      cognome: '',
      ruolo: 'utente_committente',
      specializzazione: '',
      committente_id: ''
    };
    showCreateModal = true;
  }

  function openEditModal(user) {
    selectedUser = user;
    editForm = {
      user_id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      ruolo: user.ruolo,
      specializzazione: user.specializzazione || '',
      committente_id: user.committente_id || '',
      attivo: user.attivo
    };
    showEditModal = true;
  }

  function openPasswordModal(user) {
    selectedUser = user;
    passwordForm = {
      user_id: user.id,
      new_password: '',
      confirm_password: ''
    };
    showPasswordModal = true;
  }

  function closeModals() {
    showCreateModal = false;
    showEditModal = false;
    showPasswordModal = false;
    selectedUser = null;
  }

  function applyFilters() {
    const url = new URL($page.url);
    if (searchTerm) url.searchParams.set('search', searchTerm);
    else url.searchParams.delete('search');
    
    if (selectedRuolo) url.searchParams.set('ruolo', selectedRuolo);
    else url.searchParams.delete('ruolo');
    
    if (selectedCommittente) url.searchParams.set('committente', selectedCommittente);
    else url.searchParams.delete('committente');
    
    if (selectedAttivo) url.searchParams.set('attivo', selectedAttivo);
    else url.searchParams.delete('attivo');
    
    window.location.href = url.toString();
  }

  function clearFilters() {
    searchTerm = '';
    selectedRuolo = '';
    selectedCommittente = '';
    selectedAttivo = '';
    applyFilters();
  }

  function getRuoloInfo(ruolo) {
    return ruoli.find(r => r.value === ruolo) || { label: ruolo, description: '' };
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('it-IT');
  }
</script>

<svelte:head>
  <title>👥 Gestione Utenti - Gestionale Magazzino</title>
</svelte:head>

<div class="w-full">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-gray-100 mb-2">
          👥 Gestione Utenti
        </h1>
        <p class="text-neutral-600 dark:text-gray-400">
          Amministrazione utenti, ruoli e accessi al sistema
        </p>
      </div>
      
      <div class="flex space-x-2">
        <button 
          on:click={openCreateModal}
          class="btn btn-primary"
        >
          ➕ Nuovo Utente
        </button>
      </div>
    </div>
  </div>

  <!-- Messaggi -->
  {#if form?.success}
    <div class="alert alert-success mb-6">
      <span class="text-lg">✅</span>
      <span>{form.success}</span>
    </div>
  {/if}

  {#if form?.error}
    <div class="alert alert-error mb-6">
      <span class="text-lg">⚠️</span>
      <span>{form.error}</span>
    </div>
  {/if}

  <!-- Statistiche -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <div class="stat-card">
      <div class="stat-figure">
        <span class="text-3xl text-blue-600">👥</span>
      </div>
      <div class="stat-title dark:text-gray-300">Utenti Totali</div>
      <div class="stat-value text-blue-600">{data.statistiche.totale_utenti}</div>
      <div class="stat-desc dark:text-gray-400">Nel sistema</div>
    </div>

    <div class="stat-card">
      <div class="stat-figure">
        <span class="text-3xl text-green-600">✅</span>
      </div>
      <div class="stat-title dark:text-gray-300">Utenti Attivi</div>
      <div class="stat-value text-green-600">{data.statistiche.utenti_attivi}</div>
      <div class="stat-desc dark:text-gray-400">Abilitati</div>
    </div>

    <div class="stat-card">
      <div class="stat-figure">
        <span class="text-3xl text-purple-600">👨‍💼</span>
      </div>
      <div class="stat-title dark:text-gray-300">Operatori</div>
      <div class="stat-value text-purple-600">{data.statistiche.operatori}</div>
      <div class="stat-desc dark:text-gray-400">Magazzino</div>
    </div>

    <div class="stat-card">
      <div class="stat-figure">
        <span class="text-3xl text-orange-600">🔄</span>
      </div>
      <div class="stat-title dark:text-gray-300">Accessi Recenti</div>
      <div class="stat-value text-orange-600">{data.statistiche.accessi_ultima_settimana}</div>
      <div class="stat-desc dark:text-gray-400">Ultima settimana</div>
    </div>
  </div>

  <!-- Filtri -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-neutral-200 dark:border-gray-700 mb-6">
    <div class="px-6 py-4 border-b border-neutral-200">
      <h3 class="text-lg font-semibold">🔍 Filtri di Ricerca</h3>
    </div>
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
            Cerca per nome/email
          </label>
          <input 
            type="text" 
            bind:value={searchTerm}
            placeholder="Nome, cognome o email..."
            class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
            Ruolo
          </label>
          <select bind:value={selectedRuolo} class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Tutti i ruoli</option>
            {#each ruoli as ruolo}
              <option value={ruolo.value}>{ruolo.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
            Committente
          </label>
          <select bind:value={selectedCommittente} class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Tutti i committenti</option>
            <option value="null">Sistema (nessun committente)</option>
            {#each data.committenti as committente}
              <option value={committente.id}>{committente.ragione_sociale}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
            Stato
          </label>
          <select bind:value={selectedAttivo} class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Tutti</option>
            <option value="true">Solo Attivi</option>
            <option value="false">Solo Disattivati</option>
          </select>
        </div>

        <div class="flex items-end gap-2">
          <button on:click={applyFilters} class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
            🔍 Cerca
          </button>
          <button on:click={clearFilters} class="px-4 py-2 bg-neutral-100 text-neutral-700 dark:text-gray-300 rounded-md hover:bg-neutral-200 transition-colors flex items-center gap-2">
            🗑️ Reset
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabella Utenti -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-neutral-200 dark:border-gray-700 mb-6">
    <div class="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
      <h3 class="text-lg font-semibold">
        👥 Utenti ({data.utenti.length})
      </h3>
      <button 
        on:click={openCreateModal}
        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        ➕ Nuovo Utente
      </button>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-neutral-200 dark:divide-gray-700">
        <thead class="bg-neutral-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">👤 Utente</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">🎭 Ruolo</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">🏢 Committente</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">📧 Contatti</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">🔄 Ultimo Accesso</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">⚡ Stato</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">🔧 Azioni</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-neutral-200 dark:divide-gray-700">
          {#each data.utenti as utente}
            <tr class="hover:bg-neutral-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="font-semibold text-neutral-900 dark:text-gray-100 dark:text-gray-100">
                    {utente.nome} {utente.cognome}
                  </div>
                  {#if utente.specializzazione}
                    <div class="text-sm text-neutral-600 dark:text-gray-400">
                      📋 {utente.specializzazione}
                    </div>
                  {/if}
                </div>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {utente.ruolo === 'super_admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                    utente.ruolo === 'admin_committente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    utente.ruolo === 'operatore_magazzino' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    utente.ruolo === 'team_leader' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-neutral-100 text-neutral-800 dark:bg-gray-700 dark:text-gray-200'}">
                  {getRuoloInfo(utente.ruolo).label}
                </span>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                {#if utente.committente_nome}
                  <div class="text-sm">
                    <div class="font-semibold text-neutral-900 dark:text-gray-100 dark:text-gray-100">{utente.committente_nome}</div>
                    <div class="text-neutral-600 dark:text-gray-400">{utente.committente_codice}</div>
                  </div>
                {:else}
                  <span class="text-gray-500">Sistema</span>
                {/if}
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-neutral-900 dark:text-gray-100 dark:text-gray-100">
                  <div>📧 {utente.email}</div>
                </div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-neutral-600 dark:text-gray-400">
                  {formatDate(utente.ultimo_accesso)}
                </div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {utente.attivo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
                  {utente.attivo ? '✅ Attivo' : '❌ Disattivato'}
                </span>
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-center">
                <div class="flex justify-center space-x-1">
                  <button 
                    on:click={() => openEditModal(utente)}
                    class="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Modifica utente"
                  >
                    ✏️
                  </button>
                  
                  <button 
                    on:click={() => openPasswordModal(utente)}
                    class="p-2 text-neutral-600 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                    title="Cambia password"
                  >
                    🔑
                  </button>

                  <form method="POST" action="?/toggleUserStatus" use:enhance class="inline">
                    <input type="hidden" name="user_id" value={utente.id} />
                    <input type="hidden" name="attivo" value={!utente.attivo} />
                    <button 
                      type="submit"
                      class="p-2 rounded transition-colors {utente.attivo ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}"
                      title={utente.attivo ? 'Disattiva utente' : 'Attiva utente'}
                    >
                      {utente.attivo ? '🚫' : '✅'}
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if data.utenti.length === 0}
        <div class="text-center py-8">
          <div class="text-4xl mb-4">👥</div>
          <h3 class="text-lg font-semibold text-neutral-700 dark:text-gray-300 mb-2">Nessun utente trovato</h3>
          <p class="text-neutral-600 dark:text-gray-400">Prova a modificare i filtri di ricerca</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Sessioni Attive -->
  <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
    <div class="card-header border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold">
        🔄 Sessioni Attive ({data.sessioniAttive.length})
      </h3>
    </div>
    
    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>👤 Utente</th>
            <th>🖥️ Device</th>
            <th>⏰ Login</th>
            <th>🔄 Ultimo Accesso</th>
            <th>🏢 Committente</th>
          </tr>
        </thead>
        <tbody>
          {#each data.sessioniAttive as sessione}
            <tr class="hover">
              <td>
                <div>
                  <div class="font-semibold">
                    {sessione.nome} {sessione.cognome}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    📧 {sessione.email}
                  </div>
                </div>
              </td>
              
              <td>
                <div class="badge badge-outline">
                  {#if sessione.device_type === 'mobile'}
                    📱 Mobile
                  {:else if sessione.device_type === 'tablet'}
                    📱 Tablet  
                  {:else}
                    🖥️ Desktop
                  {/if}
                </div>
              </td>

              <td>
                <div class="text-sm">
                  {formatDate(sessione.data_login)}
                </div>
              </td>

              <td>
                <div class="text-sm">
                  {formatDate(sessione.ultimo_accesso)}
                </div>
              </td>

              <td>
                {#if sessione.committente_nome}
                  <div class="text-sm font-semibold">{sessione.committente_nome}</div>
                {:else}
                  <span class="text-gray-500">Sistema</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if data.sessioniAttive.length === 0}
        <div class="text-center py-8">
          <div class="text-4xl mb-4">💤</div>
          <h3 class="text-lg font-semibold text-neutral-700 dark:text-gray-300 mb-2">Nessuna sessione attiva</h3>
          <p class="text-neutral-600 dark:text-gray-400">Tutti gli utenti sono attualmente offline</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal Creazione Utente -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">➕ Crea Nuovo Utente</h3>
          <button
            type="button"
            on:click={closeModals}
            class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400"
          >
            ✕
          </button>
        </div>
        
        <form method="POST" action="?/createUser" use:enhance={() => {
          isLoading = true;
          return async ({ update, result }) => {
            await update();
            isLoading = false;
            if (result.type === 'success') {
              closeModals();
              invalidateAll();
            }
          };
        }}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                📧 Email *
              </label>
              <input 
                type="email" 
                name="email"
                bind:value={createForm.email}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                🔑 Password *
              </label>
              <input 
                type="password" 
                name="password"
                bind:value={createForm.password}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minlength="8"
                disabled={isLoading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                👤 Nome *
              </label>
              <input 
                type="text" 
                name="nome"
                bind:value={createForm.nome}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                👤 Cognome *
              </label>
              <input 
                type="text" 
                name="cognome"
                bind:value={createForm.cognome}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                🎭 Ruolo *
              </label>
              <select 
                name="ruolo"
                bind:value={createForm.ruolo}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {#each ruoli as ruolo}
                  <option value={ruolo.value}>{ruolo.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                🏢 Committente
              </label>
              <select 
                name="committente_id"
                bind:value={createForm.committente_id}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">Nessun committente (Sistema)</option>
              {#each data.committenti as committente}
                <option value={committente.id}>{committente.ragione_sociale}</option>
              {/each}
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
              📋 Specializzazione
            </label>
            <input 
              type="text" 
              name="specializzazione"
              bind:value={createForm.specializzazione}
              class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Es: Responsabile Logistica, Capo Turno..."
              disabled={isLoading}
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <button 
            type="button" 
            class="px-4 py-2 text-neutral-700 dark:text-gray-300 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors"
            on:click={closeModals}
            disabled={isLoading}
          >
            Annulla
          </button>
          <button 
            type="submit" 
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Creazione...' : '➕ Crea Utente'}
          </button>
        </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Modifica Utente -->
{#if showEditModal && selectedUser}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">✏️ Modifica Utente</h3>
          <button
            type="button"
            on:click={closeModals}
            class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400"
          >
            ✕
          </button>
        </div>
        
        <form method="POST" action="?/updateUser" use:enhance={() => {
          isLoading = true;
          return async ({ update, result }) => {
            await update();
            isLoading = false;
            if (result.type === 'success') {
              closeModals();
              invalidateAll();
            }
          };
        }}>
          <input type="hidden" name="user_id" value={selectedUser.id} />
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                📧 Email *
              </label>
              <input 
                type="email" 
                name="email"
                bind:value={editForm.email}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                👤 Nome *
              </label>
              <input 
                type="text" 
                name="nome"
                bind:value={editForm.nome}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                👤 Cognome *
              </label>
              <input 
                type="text" 
                name="cognome"
                bind:value={editForm.cognome}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                🎭 Ruolo *
              </label>
              <select 
                name="ruolo"
                bind:value={editForm.ruolo}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {#each ruoli as ruolo}
                  <option value={ruolo.value}>{ruolo.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                🏢 Committente
              </label>
              <select 
                name="committente_id"
                bind:value={editForm.committente_id}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Nessun committente (Sistema)</option>
                {#each data.committenti as committente}
                  <option value={committente.id}>{committente.ragione_sociale}</option>
                {/each}
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                📋 Specializzazione
              </label>
              <input 
                type="text" 
                name="specializzazione"
                bind:value={editForm.specializzazione}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Es: Responsabile Logistica, Capo Turno..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              class="px-4 py-2 text-neutral-700 dark:text-gray-300 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors"
              on:click={closeModals}
              disabled={isLoading}
            >
              Annulla
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : '💾 Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Cambio Password -->
{#if showPasswordModal && selectedUser}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">🔑 Cambia Password</h3>
          <button
            type="button"
            on:click={closeModals}
            class="text-neutral-400 hover:text-neutral-600 dark:text-gray-400"
          >
            ✕
          </button>
        </div>
        
        <form method="POST" action="?/changePassword" use:enhance={() => {
          isLoading = true;
          return async ({ update, result }) => {
            await update();
            isLoading = false;
            if (result.type === 'success') {
              closeModals();
              passwordForm.password = '';
              passwordForm.confirm_password = '';
            }
          };
        }}>
          <input type="hidden" name="user_id" value={selectedUser.id} />
          
          <div class="mb-4">
            <p class="text-sm text-neutral-600 mb-4">
              Cambio password per: <strong>{selectedUser.nome} {selectedUser.cognome}</strong>
            </p>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                🔑 Nuova Password *
              </label>
              <input 
                type="password" 
                name="password"
                bind:value={passwordForm.password}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minlength="8"
                disabled={isLoading}
              />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                🔑 Conferma Password *
              </label>
              <input 
                type="password" 
                name="confirm_password"
                bind:value={passwordForm.confirm_password}
                class="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minlength="8"
                disabled={isLoading}
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              class="px-4 py-2 text-neutral-700 dark:text-gray-300 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors"
              on:click={closeModals}
              disabled={isLoading}
            >
              Annulla
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Cambiando...' : '🔑 Cambia Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}