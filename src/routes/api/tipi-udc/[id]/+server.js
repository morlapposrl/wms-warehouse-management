import { json } from '@sveltejs/kit';
import { udcRepository } from '$lib/server/repositories/udcRepository';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

export async function PUT({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    if (!data.codice || !data.nome || !data.categoria) {
      return json({
        success: false,
        error: 'Codice, nome e categoria sono obbligatori',
        errors: {
          codice: !data.codice ? ['Inserisci un codice'] : [],
          nome: !data.nome ? ['Inserisci un nome'] : [],
          categoria: !data.categoria ? ['Seleziona una categoria'] : []
        }
      }, { status: 400 });
    }

    if (!data.lunghezza_cm || !data.larghezza_cm || !data.altezza_max_cm || !data.peso_max_kg) {
      return json({
        success: false,
        error: 'Dimensioni e peso sono obbligatori',
        errors: {
          lunghezza_cm: !data.lunghezza_cm ? ['Inserisci la lunghezza'] : [],
          larghezza_cm: !data.larghezza_cm ? ['Inserisci la larghezza'] : [],
          altezza_max_cm: !data.altezza_max_cm ? ['Inserisci l\'altezza massima'] : [],
          peso_max_kg: !data.peso_max_kg ? ['Inserisci il peso massimo'] : []
        }
      }, { status: 400 });
    }
    
    // Recupera i dati esistenti per audit
    const dataEsistente = udcRepository.getTipoUDCById(id);
    if (!dataEsistente) {
      return json({
        success: false,
        error: 'Tipo UDC non trovato'
      }, { status: 404 });
    }
    
    // Controllo se esiste già (escluso se stesso)
    const existing = udcRepository.getTipoUDCByCode(data.codice);
    if (existing && existing.id !== id) {
      return json({
        success: false,
        error: 'Codice tipo UDC già esistente',
        errors: { codice: ['Codice già esistente'] }
      }, { status: 400 });
    }
    
    const success = udcRepository.updateTipoUDC(id, {
      codice: data.codice,
      nome: data.nome,
      descrizione: data.descrizione || null,
      categoria: data.categoria,
      lunghezza_cm: parseInt(data.lunghezza_cm),
      larghezza_cm: parseInt(data.larghezza_cm),
      altezza_max_cm: parseInt(data.altezza_max_cm),
      peso_max_kg: parseFloat(data.peso_max_kg),
      impilabile: Boolean(data.impilabile),
      max_stack: parseInt(data.max_stack || 5),
      riutilizzabile: Boolean(data.riutilizzabile),
      costo_acquisto: data.costo_acquisto ? parseFloat(data.costo_acquisto) : null,
      costo_noleggio_giorno: data.costo_noleggio_giorno ? parseFloat(data.costo_noleggio_giorno) : null,
      attivo: Boolean(data.attivo)
    });
    
    if (!success) {
      return json({ success: false, error: 'Tipo UDC non trovato' }, { status: 404 });
    }
    
    // Recupera i dati aggiornati per audit
    const dataAggiornata = udcRepository.getTipoUDCById(id);
    
    // Log audit per aggiornamento tipo UDC
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'tipi_udc',
          operation: 'UPDATE',
          description: `Aggiornato tipo UDC "${dataAggiornata.nome}" (${dataAggiornata.codice})`,
          module: 'TIPI_UDC',
          functionality: 'update_tipo_udc',
          importance: 'MEDIA',
          entities_involved: { 
            tipo_udc_id: dataAggiornata.id,
            codice: dataAggiornata.codice,
            nome: dataAggiornata.nome,
            categoria: dataAggiornata.categoria
          },
          data_before: dataEsistente,
          data_after: dataAggiornata
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({ success: true, data: { id } });
  } catch (error) {
    console.error('Errore nell\'aggiornamento tipo UDC:', error);
    return json({ success: false, error: 'Errore nell\'aggiornamento del tipo UDC' }, { status: 500 });
  }
}

export async function DELETE({ params, request, cookies }) {
  try {
    const id = parseInt(params.id);
    
    // Recupera i dati esistenti per audit
    const dataEsistente = udcRepository.getTipoUDCById(id);
    if (!dataEsistente) {
      return json({
        success: false,
        error: 'Tipo UDC non trovato'
      }, { status: 404 });
    }
    
    const success = udcRepository.deleteTipoUDC(id);
    
    if (!success) {
      return json({ success: false, error: 'Tipo UDC non trovato' }, { status: 404 });
    }
    
    // Log audit per eliminazione tipo UDC
    try {
      const tracker = createAuditTrackerForAction(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'tipi_udc',
          operation: 'DELETE',
          description: `Eliminato tipo UDC "${dataEsistente.nome}" (${dataEsistente.codice})`,
          module: 'TIPI_UDC',
          functionality: 'delete_tipo_udc',
          importance: 'ALTA',
          entities_involved: { 
            tipo_udc_id: dataEsistente.id,
            codice: dataEsistente.codice,
            nome: dataEsistente.nome,
            categoria: dataEsistente.categoria
          },
          data_before: dataEsistente,
          data_after: null
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }
    
    return json({ success: true, data: { id } });
  } catch (error) {
    console.error('Errore nell\'eliminazione tipo UDC:', error);
    
    if (error.message.includes('tipo UDC utilizzato')) {
      return json({ 
        success: false, 
        error: error.message 
      }, { status: 400 });
    }
    
    return json({ success: false, error: 'Errore nell\'eliminazione del tipo UDC' }, { status: 500 });
  }
}