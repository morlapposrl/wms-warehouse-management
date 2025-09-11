<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  let loading = false;
  let error = '';
  let success = '';
  
  // Form data
  let formData = {
    codice: data.committente.codice || '',
    ragione_sociale: data.committente.ragione_sociale || '',
    partita_iva: data.committente.partita_iva || '',
    codice_fiscale: data.committente.codice_fiscale || '',
    indirizzo: data.committente.indirizzo || '',
    citta: data.committente.citta || '',
    cap: data.committente.cap || '',
    provincia: data.committente.provincia || '',
    telefono: data.committente.telefono || '',
    email: data.committente.email || '',
    pec: data.committente.pec || '',
    referente_principale: data.committente.referente_principale || '',
    tipo_contratto: data.committente.tipo_contratto || 'deposito',
    attivo: data.committente.attivo ?? true,
    note: data.committente.note || ''
  };
  
  // Validazione form
  let errors: { [key: string]: string[] } = {};
  
  function validateForm() {
    errors = {};
    
    if (!formData.codice.trim()) {
      errors.codice = ['Codice committente obbligatorio'];
    }
    
    if (!formData.ragione_sociale.trim()) {
      errors.ragione_sociale = ['Ragione sociale obbligatoria'];
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = ['Formato email non valido'];
    }
    
    if (formData.pec && !isValidEmail(formData.pec)) {
      errors.pec = ['Formato PEC non valido'];
    }
    
    return Object.keys(errors).length === 0;
  }
  
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  async function handleSubmit() {
    if (!validateForm()) {
      error = 'Correggi gli errori nel form';
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      const response = await fetch(`/api/admin/committenti/${data.committente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        success = 'Committente aggiornato con successo!';
        setTimeout(() => {
          goto('/auth/admin/committenti');
        }, 1500);
      } else {
        error = result.error || 'Errore nell\'aggiornamento del committente';
        if (result.errors) {
          errors = result.errors;
        }
      }
    } catch (err) {
      error = 'Errore di connessione';
      console.error('Errore:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleCancel() {
    goto('/auth/admin/committenti');
  }
</script>

<svelte:head>
  <title>Modifica Committente - {data.committente.ragione_sociale}</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-4">
      <button 
        on:click={handleCancel}
        class="btn btn-ghost btn-sm"
        title="Torna alla lista"
      >
        ← Indietro
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          ✏️ Modifica Committente
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {data.committente.ragione_sociale} ({data.committente.codice})
        </p>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <span class="badge {data.committente.attivo ? 'badge-success' : 'badge-warning'}">
        {data.committente.attivo ? 'Attivo' : 'Inattivo'}
      </span>
    </div>
  </div>
  
  <!-- Messaggi di stato -->
  {#if error}
    <div class="alert alert-error mb-4">
      {error}
    </div>
  {/if}
  
  {#if success}
    <div class="alert alert-success mb-4">
      {success}
    </div>
  {/if}
  
  <!-- Form compatta -->
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <!-- Card principale -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📋 Dati Identificativi</h3>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Codice e Ragione Sociale -->
          <div class="md:col-span-1">
            <label class="form-label" for="codice">
              Codice Committente <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="codice"
              bind:value={formData.codice}
              class="form-input {errors.codice ? 'border-red-500' : ''}"
              placeholder="es. CLI001"
              required
            />
            {#if errors.codice}
              <p class="text-red-500 text-xs mt-1">{errors.codice[0]}</p>
            {/if}
          </div>
          
          <div class="md:col-span-1">
            <label class="form-label" for="ragione_sociale">
              Ragione Sociale <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="ragione_sociale"
              bind:value={formData.ragione_sociale}
              class="form-input {errors.ragione_sociale ? 'border-red-500' : ''}"
              placeholder="Nome azienda"
              required
            />
            {#if errors.ragione_sociale}
              <p class="text-red-500 text-xs mt-1">{errors.ragione_sociale[0]}</p>
            {/if}
          </div>
          
          <!-- Dati fiscali -->
          <div>
            <label class="form-label" for="partita_iva">P.IVA</label>
            <input 
              type="text" 
              id="partita_iva"
              bind:value={formData.partita_iva}
              class="form-input"
              placeholder="12345678901"
            />
          </div>
          
          <div>
            <label class="form-label" for="codice_fiscale">Codice Fiscale</label>
            <input 
              type="text" 
              id="codice_fiscale"
              bind:value={formData.codice_fiscale}
              class="form-input"
              placeholder="Se diverso da P.IVA"
            />
          </div>
          
          <!-- Tipo contratto e stato -->
          <div>
            <label class="form-label" for="tipo_contratto">Tipo Contratto</label>
            <select 
              id="tipo_contratto"
              bind:value={formData.tipo_contratto}
              class="form-input"
            >
              <option value="deposito">Deposito</option>
              <option value="logistica">Logistica Completa</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          
          <div>
            <label class="form-label">Stato</label>
            <div class="flex items-center gap-4 mt-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  bind:group={formData.attivo} 
                  value={true}
                  class="radio radio-success"
                />
                <span class="text-sm">✅ Attivo</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  bind:group={formData.attivo} 
                  value={false}
                  class="radio radio-warning"
                />
                <span class="text-sm">⚠️ Inattivo</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Card indirizzo -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📍 Indirizzo</h3>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="md:col-span-2">
            <label class="form-label" for="indirizzo">Via/Indirizzo</label>
            <input 
              type="text" 
              id="indirizzo"
              bind:value={formData.indirizzo}
              class="form-input"
              placeholder="Via Roma, 123"
            />
          </div>
          
          <div>
            <label class="form-label" for="citta">Città</label>
            <input 
              type="text" 
              id="citta"
              bind:value={formData.citta}
              class="form-input"
              placeholder="Milano"
            />
          </div>
          
          <div>
            <label class="form-label" for="cap">CAP</label>
            <input 
              type="text" 
              id="cap"
              bind:value={formData.cap}
              class="form-input"
              placeholder="20100"
            />
          </div>
          
          <div class="md:col-span-1">
            <label class="form-label" for="provincia">Provincia</label>
            <input 
              type="text" 
              id="provincia"
              bind:value={formData.provincia}
              class="form-input"
              placeholder="MI"
              maxlength="2"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Card contatti -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📞 Contatti</h3>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="form-label" for="telefono">Telefono</label>
            <input 
              type="tel" 
              id="telefono"
              bind:value={formData.telefono}
              class="form-input"
              placeholder="+39 02 1234567"
            />
          </div>
          
          <div>
            <label class="form-label" for="referente_principale">Referente Principale</label>
            <input 
              type="text" 
              id="referente_principale"
              bind:value={formData.referente_principale}
              class="form-input"
              placeholder="Mario Rossi"
            />
          </div>
          
          <div>
            <label class="form-label" for="email">
              Email {#if errors.email}<span class="text-red-500 text-xs">({errors.email[0]})</span>{/if}
            </label>
            <input 
              type="email" 
              id="email"
              bind:value={formData.email}
              class="form-input {errors.email ? 'border-red-500' : ''}"
              placeholder="info@azienda.it"
            />
          </div>
          
          <div>
            <label class="form-label" for="pec">
              PEC {#if errors.pec}<span class="text-red-500 text-xs">({errors.pec[0]})</span>{/if}
            </label>
            <input 
              type="email" 
              id="pec"
              bind:value={formData.pec}
              class="form-input {errors.pec ? 'border-red-500' : ''}"
              placeholder="pec@azienda.it"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Card note -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📝 Note</h3>
      </div>
      <div class="card-body">
        <label class="form-label" for="note">Note Aggiuntive</label>
        <textarea 
          id="note"
          bind:value={formData.note}
          class="form-input"
          rows="3"
          placeholder="Inserisci eventuali note o informazioni aggiuntive..."
        ></textarea>
      </div>
    </div>
    
    <!-- Azioni -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      <button 
        type="button"
        on:click={handleCancel}
        class="btn btn-ghost"
        disabled={loading}
      >
        Annulla
      </button>
      
      <div class="flex items-center gap-3">
        <button 
          type="submit"
          class="btn btn-primary"
          disabled={loading}
        >
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Salvataggio...
          {:else}
            💾 Salva Modifiche
          {/if}
        </button>
      </div>
    </div>
  </form>
</div>

<style>
  .form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
  }
  
  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors;
  }
  
  .radio {
    @apply w-4 h-4;
  }
  
  .radio-success:checked {
    @apply bg-green-500 border-green-500;
  }
  
  .radio-warning:checked {
    @apply bg-yellow-500 border-yellow-500;
  }
</style>