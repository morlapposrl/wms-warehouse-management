import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { createAuditTracker } from '$lib/server/middleware/auditMiddleware';

export const GET: RequestHandler = async () => {
  try {
    const tipiUdc = db.prepare(`
      SELECT 
        id,
        codice,
        nome,
        descrizione,
        categoria,
        lunghezza_cm,
        larghezza_cm,
        altezza_max_cm,
        peso_max_kg,
        volume_max_cm3,
        impilabile,
        max_stack,
        riutilizzabile,
        costo_acquisto,
        costo_noleggio_giorno,
        attivo,
        created_at,
        updated_at
      FROM tipi_udc
      WHERE attivo = 1
      ORDER BY categoria, nome
    `).all();
    
    return json({ success: true, data: tipiUdc });
  } catch (error) {
    console.error('Errore API tipi UDC:', error);
    return json({ success: false, error: 'Errore interno server' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    
    // Validazione dati richiesti
    if (!data.nome || !data.codice || !data.categoria) {
      return json({
        success: false,
        error: 'Nome, codice e categoria sono obbligatori',
        errors: {
          nome: !data.nome ? ['Nome richiesto'] : [],
          codice: !data.codice ? ['Codice richiesto'] : [],
          categoria: !data.categoria ? ['Categoria richiesta'] : []
        }
      }, { status: 400 });
    }

    // Controllo esistenza codice
    const existing = db.prepare('SELECT id FROM tipi_udc WHERE codice = ?').get(data.codice);
    if (existing) {
      return json({
        success: false,
        error: 'Codice già esistente',
        errors: { codice: ['Codice già utilizzato'] }
      }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO tipi_udc (
        codice, nome, descrizione, categoria, lunghezza_cm, larghezza_cm,
        altezza_max_cm, peso_max_kg, impilabile, max_stack, riutilizzabile,
        costo_acquisto, costo_noleggio_giorno, attivo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.codice,
      data.nome,
      data.descrizione || null,
      data.categoria,
      parseInt(data.lunghezza_cm) || 120,
      parseInt(data.larghezza_cm) || 80,
      parseInt(data.altezza_max_cm) || 180,
      parseFloat(data.peso_max_kg) || 1000,
      data.impilabile ? 1 : 0,
      parseInt(data.max_stack) || 5,
      data.riutilizzabile ? 1 : 0,
      data.costo_acquisto ? parseFloat(data.costo_acquisto) : null,
      data.costo_noleggio_giorno ? parseFloat(data.costo_noleggio_giorno) : null,
      data.attivo ? 1 : 0
    );

    // Recupera il tipo UDC creato per audit
    const nuovoTipoUdc = db.prepare('SELECT * FROM tipi_udc WHERE id = ?').get(result.lastInsertRowid);
    
    // Log audit per creazione tipo UDC
    try {
      const tracker = createAuditTracker(request, cookies);
      if (tracker) {
        await tracker.logOperation({
          table: 'tipi_udc',
          operation: 'CREATE',
          description: `Creato tipo UDC "${nuovoTipoUdc.nome}" (${nuovoTipoUdc.codice})`,
          module: 'TIPI_UDC',
          functionality: 'create_tipo_udc',
          importance: 'MEDIA',
          entities_involved: { 
            tipo_udc_id: nuovoTipoUdc.id,
            codice: nuovoTipoUdc.codice,
            nome: nuovoTipoUdc.nome,
            categoria: nuovoTipoUdc.categoria
          },
          data_before: null,
          data_after: nuovoTipoUdc
        });
      }
    } catch (auditError) {
      console.error('Errore audit:', auditError);
      // Non bloccare l'operazione per errori di audit
    }

    return json({
      success: true,
      data: { id: result.lastInsertRowid, ...data }
    });

  } catch (error) {
    console.error('Errore creazione tipo UDC:', error);
    return json({
      success: false,
      error: 'Errore interno server'
    }, { status: 500 });
  }
};