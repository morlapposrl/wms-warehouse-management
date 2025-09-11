import type { PageServerLoad } from './$types';
import { auditRepository } from '$lib/server/repositories/auditRepository';
import { userRepository } from '$lib/server/repositories/userRepository';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw error(401, 'Non autorizzato');
  }

  // Solo super admin e admin committente possono vedere audit
  if (!['super_admin', 'admin_committente'].includes(locals.user.ruolo)) {
    throw error(403, 'Accesso negato');
  }

  // Parametri filtro dalla query string
  const filters = {
    utente_id: url.searchParams.get('utente_id') ? parseInt(url.searchParams.get('utente_id')!) : undefined,
    committente_id: locals.user.ruolo === 'admin_committente' ? locals.user.committente_id : 
                   url.searchParams.get('committente_id') ? parseInt(url.searchParams.get('committente_id')!) : undefined,
    tipo_operazione: url.searchParams.get('tipo_operazione') || undefined,
    modulo: url.searchParams.get('modulo') || undefined,
    data_da: url.searchParams.get('data_da') || undefined,
    data_a: url.searchParams.get('data_a') || undefined,
    limit: 100,
    offset: url.searchParams.get('page') ? (parseInt(url.searchParams.get('page')!) - 1) * 100 : 0
  };

  try {
    // Recupera audit trail con filtri
    const auditTrail = auditRepository.getAuditTrail(filters);
    
    // Recupera statistiche
    const stats = auditRepository.getAuditStats(filters);
    
    // Lista utenti per filtro (solo del committente se admin committente)
    const utenti = locals.user.ruolo === 'admin_committente' 
      ? userRepository.getUsersByCommittente(locals.user.committente_id!)
      : userRepository.getAllUsers();

    // Lista tipi operazione disponibili
    const tipiOperazione = [
      'CREATE', 'READ', 'UPDATE', 'DELETE', 
      'LOGIN', 'LOGOUT', 'MOVIMENTO', 'ORDINE', 
      'CARICO', 'SCARICO', 'INVENTARIO', 'TRASFERIMENTO'
    ];

    // Lista moduli disponibili  
    const moduli = [
      'AUTH', 'UTENTI', 'PRODOTTI', 'CATEGORIE', 
      'FORNITORI', 'MOVIMENTI', 'GIACENZE', 'ORDINI', 
      'COMMITTENTI', 'SISTEMA', 'NAVIGATION'
    ];

    return {
      auditTrail,
      stats,
      utenti,
      tipiOperazione,
      moduli,
      filters,
      currentPage: Math.floor((filters.offset || 0) / 100) + 1,
      canViewAllCommittenti: locals.user.ruolo === 'super_admin'
    };
    
  } catch (err) {
    console.error('Errore caricamento audit trail:', err);
    throw error(500, 'Errore interno del server');
  }
};