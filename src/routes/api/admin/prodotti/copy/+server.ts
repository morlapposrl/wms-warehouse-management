import { json } from '@sveltejs/kit';
import { prodottiRepository } from '$lib/server/repositories/prodottiRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateCopyProdotti } from '$lib/validations/prodotto';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// POST - Copia prodotti da un committente ad un altro (solo per admin)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Valida i dati
    const validation = validateCopyProdotti(data);
    
    if (!validation.success) {
      return json<ApiResponse>({
        success: false,
        error: 'Dati non validi',
        errors: validation.errors
      }, { status: 400 });
    }
    
    const { source_committente_id, target_committente_id } = validation.data;
    
    // Verifica esistenza committenti
    const sourceCommittente = committentiRepository.findById(source_committente_id);
    const targetCommittente = committentiRepository.findById(target_committente_id);
    
    if (!sourceCommittente) {
      return json<ApiResponse>({
        success: false,
        error: 'Committente sorgente non trovato'
      }, { status: 404 });
    }
    
    if (!targetCommittente) {
      return json<ApiResponse>({
        success: false,
        error: 'Committente destinazione non trovato'
      }, { status: 404 });
    }

    // Conta prodotti esistenti
    const sourceCount = prodottiRepository.countByCommittente(source_committente_id);
    const targetCountBefore = prodottiRepository.countByCommittente(target_committente_id);
    
    if (sourceCount.totali === 0) {
      return json<ApiResponse>({
        success: false,
        error: 'Nessun prodotto da copiare nel committente sorgente'
      }, { status: 400 });
    }

    // Esegui la copia
    const copiedCount = prodottiRepository.copyFromTemplate(source_committente_id, target_committente_id);
    const targetCountAfter = prodottiRepository.countByCommittente(target_committente_id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        source_committente: {
          id: source_committente_id,
          ragione_sociale: sourceCommittente.ragione_sociale,
          prodotti_totali: sourceCount.totali
        },
        target_committente: {
          id: target_committente_id,
          ragione_sociale: targetCommittente.ragione_sociale,
          prodotti_prima: targetCountBefore.totali,
          prodotti_dopo: targetCountAfter.totali
        },
        prodotti_copiati: copiedCount,
        prodotti_saltati: sourceCount.totali - copiedCount,
        message: `Copiati ${copiedCount} prodotti da '${sourceCommittente.ragione_sociale}' a '${targetCommittente.ragione_sociale}'`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/admin/prodotti/copy:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella copia dei prodotti'
    }, { status: 500 });
  }
};