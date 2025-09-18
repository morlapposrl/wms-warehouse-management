import Database from 'better-sqlite3';
import { json } from '@sveltejs/kit';
import { createAuditTrackerForAction } from '$lib/server/helpers/auditHelper';

const db = new Database('database/magazzino.db');

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, url, cookies }) {
    try {
        const discotecaId = url.searchParams.get('discoteca_id');
        
        if (!discotecaId) {
            return json({ error: 'Parametro discoteca_id mancante' }, { status: 400 });
        }

        // Query per recuperare il listino bottiglie per la discoteca
        const stmt = db.prepare(`
            SELECT 
                id,
                nome_bottiglia,
                marca,
                tipo,
                volume_ml,
                prezzo_base,
                prezzo_tavolo,
                prezzo_vip,
                disponibile,
                note,
                created_at,
                updated_at
            FROM ListinoBottiglie 
            WHERE discoteca_id = ? AND disponibile = 1
            ORDER BY tipo, marca, nome_bottiglia
        `);
        
        const listino = stmt.all(discotecaId);

        // Raggruppa per tipo per una migliore organizzazione
        const listinoRaggruppato = listino.reduce((acc, bottiglia) => {
            const tipo = bottiglia.tipo || 'Altro';
            if (!acc[tipo]) {
                acc[tipo] = [];
            }
            acc[tipo].push(bottiglia);
            return acc;
        }, {});

        // Log audit dell'operazione
        try {
            const tracker = createAuditTrackerForAction(request, cookies);
            if (tracker) {
                await tracker.logOperation({
                    table: 'ListinoBottiglie',
                    operation: 'READ',
                    description: `Consultazione listino bottiglie per discoteca ${discotecaId}`,
                    module: 'LISTINO',
                    functionality: 'visualizza_listino',
                    importance: 'MEDIA',
                    entities_involved: { discoteca_id: discotecaId, count: listino.length }
                });
            }
        } catch (auditError) {
            console.error('Errore audit:', auditError);
        }

        return json({ 
            success: true, 
            data: {
                listino: listinoRaggruppato,
                totale_bottiglie: listino.length,
                discoteca_id: discotecaId
            }
        });

    } catch (error) {
        console.error('Errore nel recupero listino bottiglie:', error);
        return json({ error: 'Errore interno del server' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    try {
        const data = await request.json();
        const { discoteca_id, nome_bottiglia, marca, tipo, volume_ml, prezzo_base, prezzo_tavolo, prezzo_vip, note } = data;

        if (!discoteca_id || !nome_bottiglia || !prezzo_base) {
            return json({ error: 'Parametri obbligatori mancanti' }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO ListinoBottiglie 
            (discoteca_id, nome_bottiglia, marca, tipo, volume_ml, prezzo_base, prezzo_tavolo, prezzo_vip, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            discoteca_id, 
            nome_bottiglia, 
            marca || null, 
            tipo || null, 
            volume_ml || null, 
            prezzo_base, 
            prezzo_tavolo || null, 
            prezzo_vip || null, 
            note || null
        );

        // Recupera il record appena inserito
        const nuovaBottiglia = db.prepare('SELECT * FROM ListinoBottiglie WHERE id = ?').get(result.lastInsertRowid);

        // Log audit
        try {
            const tracker = createAuditTrackerForAction(request, cookies);
            if (tracker) {
                await tracker.logOperation({
                    table: 'ListinoBottiglie',
                    operation: 'CREATE',
                    description: `Aggiunta nuova bottiglia al listino: ${nome_bottiglia}`,
                    module: 'LISTINO',
                    functionality: 'aggiungi_bottiglia',
                    importance: 'ALTA',
                    entities_involved: { id: result.lastInsertRowid, nome_bottiglia },
                    data_after: nuovaBottiglia
                });
            }
        } catch (auditError) {
            console.error('Errore audit:', auditError);
        }

        return json({ 
            success: true, 
            data: nuovaBottiglia,
            message: 'Bottiglia aggiunta al listino con successo'
        });

    } catch (error) {
        console.error('Errore nell\'aggiunta bottiglia:', error);
        return json({ error: 'Errore interno del server' }, { status: 500 });
    }
}