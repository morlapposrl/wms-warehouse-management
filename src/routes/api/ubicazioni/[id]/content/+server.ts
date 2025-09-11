import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ubicazioniRepository } from '$lib/server/repositories/ubicazioniRepository.js';
import db from '$lib/server/database.js';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const ubicazioneId = parseInt(params.id);
    
    if (isNaN(ubicazioneId)) {
      return json({ error: 'Invalid ubicazione ID' }, { status: 400 });
    }

    // Ricostruisce contenuto da UDC reali nel nostro sistema
    const contentDetails = db.prepare(`
      SELECT 
        -- Dati prodotto/SKU
        p.codice as sku_code,
        p.descrizione as prodotto_nome,
        
        -- Dati UDC
        u.barcode as udc_barcode,
        tu.nome as tipo_udc,
        u.stato as udc_stato,
        uc.quantita as quantita_udc,
        uc.lotto,
        uc.posizione_in_udc,
        uc.data_inserimento as data_posizionamento,
        
        -- Dati committente (proprietario UDC)
        u.committente_proprietario_id as committente_id,
        c.ragione_sociale as committente_nome,
        c.codice as committente_codice,
        
        -- Calcoli
        julianday('now') - julianday(uc.data_inserimento) as giorni_stoccaggio,
        (uc.quantita * 1000.0) as volume_stimato_cm3,
        (uc.quantita * 0.5) as peso_stimato_kg
        
      FROM udc u
      JOIN udc_contenuto uc ON u.id = uc.udc_id
      JOIN prodotti p ON uc.prodotto_id = p.id
      JOIN committenti c ON u.committente_proprietario_id = c.id
      LEFT JOIN tipi_udc tu ON u.tipo_udc_id = tu.id
      
      WHERE u.ubicazione_attuale_id = ? 
        AND uc.quantita > 0
        AND u.stato IN ('PARZIALE', 'PIENO')
      
      ORDER BY 
        p.codice,
        c.ragione_sociale,
        u.barcode
    `).all(ubicazioneId);

    // Raggruppa per SKU → Committente → UDC
    const contenutoRaggruppato = contentDetails.reduce((acc: any, item: any) => {
      const skuKey = item.sku_code;
      
      if (!acc[skuKey]) {
        acc[skuKey] = {
          sku_code: item.sku_code,
          prodotto_nome: item.prodotto_nome,
          quantita_fisica_totale: 0,
          volume_occupato_cm3: 0,
          peso_totale_kg: 0,
          udc_list: [],
          proprietari: {}
        };
      }
      
      // Accumula totali per SKU
      acc[skuKey].quantita_fisica_totale += item.quantita_udc;
      acc[skuKey].volume_occupato_cm3 += item.volume_stimato_cm3;
      acc[skuKey].peso_totale_kg += item.peso_stimato_kg;
      
      // Aggiungi UDC alla lista
      acc[skuKey].udc_list.push({
        udc_barcode: item.udc_barcode,
        tipo_udc: item.tipo_udc,
        udc_stato: item.udc_stato,
        quantita: item.quantita_udc,
        lotto: item.lotto,
        posizione: item.posizione_in_udc,
        committente: item.committente_nome
      });
      
      // Raggruppa per committente
      const committente = item.committente_id;
      if (!acc[skuKey].proprietari[committente]) {
        acc[skuKey].proprietari[committente] = {
          committente_id: item.committente_id,
          committente_nome: item.committente_nome,
          committente_codice: item.committente_codice,
          quantita: 0, // Campo che la UI si aspetta
          quantita_totale: 0,
          udc_count: 0,
          giorni_stoccaggio: Math.floor(item.giorni_stoccaggio || 0),
          data_posizionamento: null, // Prenderemo la prima data
          stato: 'DISPONIBILE',
          lotto: null,
          costo_acquisto: 25.0, // Prezzo fisso per ora
          udc_details: []
        };
      }
      
      acc[skuKey].proprietari[committente].quantita += item.quantita_udc;
      acc[skuKey].proprietari[committente].quantita_totale += item.quantita_udc;
      acc[skuKey].proprietari[committente].udc_count++;
      
      // Imposta la data della prima UDC come data posizionamento
      if (!acc[skuKey].proprietari[committente].data_posizionamento) {
        acc[skuKey].proprietari[committente].data_posizionamento = item.data_posizionamento;
      }
      
      // Imposta lotto se presente
      if (item.lotto && !acc[skuKey].proprietari[committente].lotto) {
        acc[skuKey].proprietari[committente].lotto = item.lotto;
      }
      
      acc[skuKey].proprietari[committente].udc_details.push({
        udc_barcode: item.udc_barcode,
        tipo_udc: item.tipo_udc,
        udc_stato: item.udc_stato,
        quantita: item.quantita_udc,
        lotto: item.lotto,
        posizione: item.posizione_in_udc
      });
      
      return acc;
    }, {});
    
    // Converti proprietari da oggetto ad array
    const content = Object.values(contenutoRaggruppato).map((sku: any) => ({
      ...sku,
      proprietari: Object.values(sku.proprietari)
    }));

    // Get ubicazione info
    const ubicazione = ubicazioniRepository.findById(ubicazioneId);

    if (!ubicazione) {
      return json({ error: 'Ubicazione not found' }, { status: 404 });
    }

    // Calculate summary stats from grouped content
    const totalItems = content.reduce((sum: number, sku: any) => sum + sku.quantita_fisica_totale, 0);
    const totalVolume = content.reduce((sum: number, sku: any) => sum + (sku.volume_occupato_cm3 || 0), 0);
    const totalWeight = content.reduce((sum: number, sku: any) => sum + (sku.peso_totale_kg || 0), 0);
    const uniqueSkus = content.length;
    const uniqueCommittenti = new Set(content.flatMap((sku: any) => sku.proprietari.map((p: any) => p.committente_id))).size;
    const totalLotti = new Set(content.flatMap((sku: any) => sku.proprietari.filter((p: any) => p.lotto).map((p: any) => p.lotto))).size;

    return json({
      content,
      ubicazione,
      summary: {
        total_items: totalItems,
        total_volume_cm3: Math.round(totalVolume),
        total_weight_kg: Math.round(totalWeight * 100) / 100,
        unique_skus: uniqueSkus,
        unique_committenti: uniqueCommittenti,
        unique_lotti: totalLotti,
        occupation_percentage: ubicazione.percentuale_occupazione
      }
    });

  } catch (error) {
    console.error('Error loading ubicazione content:', error);
    return json({ error: 'Failed to load content' }, { status: 500 });
  }
};