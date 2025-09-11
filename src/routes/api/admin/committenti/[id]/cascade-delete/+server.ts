import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { committentiRepository } from '$lib/server/repositories/committentiRepository';
import { userRepository } from '$lib/server/repositories/userRepository';
import bcrypt from 'bcryptjs';

/**
 * CASCADING DELETE ENDPOINT
 * 
 * ⚠️ ATTENZIONE: Questo endpoint elimina TUTTO il magazzino del committente
 * - Tutti i prodotti
 * - Tutti i movimenti 
 * - Tutte le giacenze
 * - Tutti gli ordini
 * - Tutte le categorie
 * - Unità di misura personalizzate
 * - Relazioni con fornitori
 * - Inventari
 * - Audit trail
 * - Il committente stesso
 * 
 * Richiede:
 * 1. Super Admin authentication
 * 2. Admin password confirmation
 * 3. Explicit confirmation flag
 */

export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Solo super admin possono effettuare cascading delete
    if (!locals.user || locals.user.ruolo !== 'super_admin') {
      return json({
        success: false,
        error: 'Accesso negato: solo super admin possono eseguire eliminazioni in cascata'
      }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({
        success: false,
        error: 'ID committente non valido'
      }, { status: 400 });
    }

    // Verifica esistenza committente
    const committente = committentiRepository.findById(id);
    if (!committente) {
      return json({
        success: false,
        error: 'Committente non trovato'
      }, { status: 404 });
    }

    const body = await request.json();
    const { adminPassword, confirmDeletion, reason } = body;

    // Validazioni di sicurezza
    if (!adminPassword) {
      return json({
        success: false,
        error: 'Password amministratore richiesta per eliminazione in cascata'
      }, { status: 400 });
    }

    if (!confirmDeletion) {
      return json({
        success: false,
        error: 'Conferma esplicita richiesta per eliminazione in cascata'
      }, { status: 400 });
    }

    // Verifica password amministratore
    const adminUser = userRepository.getUserById(locals.user.id!);
    if (!adminUser) {
      return json({
        success: false,
        error: 'Utente amministratore non trovato'
      }, { status: 500 });
    }

    const passwordValid = await bcrypt.compare(adminPassword, adminUser.password_hash);
    if (!passwordValid) {
      return json({
        success: false,
        error: 'Password amministratore non corretta'
      }, { status: 401 });
    }

    // Conta i record che verranno eliminati (per logging)
    const recordsBeforeDeletion = committentiRepository.getRelatedRecordsCount(id);

    // Log dell'operazione PRIMA dell'eliminazione (per audit)
    console.warn(`🚨 CASCADING DELETE INITIATED:`, {
      committente: {
        id: committente.id,
        codice: committente.codice,
        ragione_sociale: committente.ragione_sociale
      },
      admin: {
        id: locals.user.id,
        email: locals.user.email,
        nome: `${locals.user.nome} ${locals.user.cognome}`
      },
      recordsToDelete: recordsBeforeDeletion,
      reason: reason || 'Non specificato',
      timestamp: new Date().toISOString()
    });

    // Esegue l'eliminazione in cascata
    const result = committentiRepository.cascadeDelete(id);

    if (result.success) {
      // Log del successo
      console.warn(`✅ CASCADING DELETE COMPLETED:`, {
        committente_id: id,
        admin_id: locals.user.id,
        deletedRecords: result.deletedRecords,
        recordsBeforeDeletion,
        timestamp: new Date().toISOString()
      });

      return json({
        success: true,
        message: `Eliminazione in cascata completata con successo per ${committente.ragione_sociale}`,
        data: {
          committente: {
            id: committente.id,
            codice: committente.codice,
            ragione_sociale: committente.ragione_sociale
          },
          recordsBeforeDeletion,
          deletedRecords: result.deletedRecords,
          operation: {
            type: 'CASCADE_DELETE',
            admin: `${locals.user.nome} ${locals.user.cognome}`,
            timestamp: new Date().toISOString(),
            reason: reason || 'Non specificato'
          }
        }
      });

    } else {
      // Log dell'errore
      console.error(`❌ CASCADING DELETE FAILED:`, {
        committente_id: id,
        admin_id: locals.user.id,
        error: 'Transaction failed',
        timestamp: new Date().toISOString()
      });

      return json({
        success: false,
        error: 'Errore durante l\'eliminazione in cascata. Nessun dato è stato modificato.',
        data: {
          committente,
          recordsCount: recordsBeforeDeletion
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ CASCADING DELETE ERROR:', error);
    return json({
      success: false,
      error: 'Errore interno durante l\'eliminazione in cascata'
    }, { status: 500 });
  }
};

// GET - Mostra anteprima di cosa verrà eliminato
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Solo super admin possono vedere l'anteprima
    if (!locals.user || locals.user.ruolo !== 'super_admin') {
      return json({
        success: false,
        error: 'Accesso negato'
      }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({
        success: false,
        error: 'ID committente non valido'
      }, { status: 400 });
    }

    const committente = committentiRepository.findById(id);
    if (!committente) {
      return json({
        success: false,
        error: 'Committente non trovato'
      }, { status: 404 });
    }

    const relatedRecords = committentiRepository.getRelatedRecordsCount(id);

    return json({
      success: true,
      data: {
        committente: {
          id: committente.id,
          codice: committente.codice,
          ragione_sociale: committente.ragione_sociale,
          stato: committente.stato
        },
        recordsToDelete: relatedRecords,
        warning: {
          message: 'ATTENZIONE: L\'eliminazione in cascata eliminerà DEFINITIVAMENTE tutti questi dati',
          canBeUndone: false,
          affectedTables: [
            'prodotti', 'movimenti', 'giacenze', 'categorie', 
            'unita_misura', 'ordini', 'inventari', 'audit_trail',
            'giacenze_logiche', 'giacenze_ownership', 'utenti (disassociati)'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Errore GET cascade-delete preview:', error);
    return json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
};