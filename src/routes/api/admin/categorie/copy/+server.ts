import { json } from '@sveltejs/kit';
import { categorieRepository } from '$lib/server/repositories/categorieRepository';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { validateCopyCategoriePlan } from '$lib/validations/categoria';
import type { RequestHandler } from './$types';
import type { ApiResponse } from '$lib/types';

// POST - Copia categorie da un committente ad un altro (solo per admin)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Valida i dati
    const validation = validateCopyCategoriePlan(data);
    
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

    // Conta categorie esistenti
    const sourceCount = categorieRepository.countByCommittente(source_committente_id);
    const targetCountBefore = categorieRepository.countByCommittente(target_committente_id);
    
    if (sourceCount.totali === 0) {
      return json<ApiResponse>({
        success: false,
        error: 'Nessuna categoria da copiare nel committente sorgente'
      }, { status: 400 });
    }

    // Esegui la copia
    const copiedCount = categorieRepository.copyFromTemplate(source_committente_id, target_committente_id);
    const targetCountAfter = categorieRepository.countByCommittente(target_committente_id);
    
    return json<ApiResponse>({
      success: true,
      data: {
        source_committente: {
          id: source_committente_id,
          ragione_sociale: sourceCommittente.ragione_sociale,
          categorie_totali: sourceCount.totali
        },
        target_committente: {
          id: target_committente_id,
          ragione_sociale: targetCommittente.ragione_sociale,
          categorie_prima: targetCountBefore.totali,
          categorie_dopo: targetCountAfter.totali
        },
        categorie_copiate: copiedCount,
        categorie_saltate: sourceCount.totali - copiedCount,
        message: `Copiate ${copiedCount} categorie da '${sourceCommittente.ragione_sociale}' a '${targetCommittente.ragione_sociale}'`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore POST /api/admin/categorie/copy:', error);
    return json<ApiResponse>({
      success: false,
      error: 'Errore nella copia delle categorie'
    }, { status: 500 });
  }
};