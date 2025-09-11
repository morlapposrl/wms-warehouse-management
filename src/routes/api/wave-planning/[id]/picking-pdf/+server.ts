import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { wavePlanningRepository } from '$lib/server/repositories/wavePlanningRepository';
import PDFDocument from 'pdfkit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const waveId = parseInt(params.id);
    
    if (!waveId) {
      return new Response('Wave ID non valido', { status: 400 });
    }

    // Carica dati wave completi
    const wave = wavePlanningRepository.getWaveById(waveId);
    if (!wave) {
      return new Response('Wave non trovata', { status: 404 });
    }

    const ordini = wavePlanningRepository.getWaveOrders(waveId);
    const pickTasks = wavePlanningRepository.getPickTasks(waveId);

    // Crea PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Buffer per raccogliere i dati del PDF
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Header documento
    doc.fontSize(20).font('Helvetica-Bold')
       .text('LISTA PICKING - ISTRUZIONI OPERATORE', { align: 'center' })
       .moveDown();
    
    // Info Wave
    doc.fontSize(12).font('Helvetica')
       .text(`Wave: ${wave.wave_number}`, 50, 100)
       .text(`Tipo: ${wave.tipo_wave}`, 250, 100)
       .text(`Data: ${new Date(wave.data_creazione).toLocaleDateString('it-IT')}`, 400, 100)
       .text(`Operatore: ${wave.operatore_nome || 'Non assegnato'}`, 50, 120)
       .text(`Stato: ${wave.stato}`, 250, 120)
       .text(`Committente: ${wave.committente_nome}`, 400, 120)
       .moveDown(2);

    // Statistiche
    doc.fontSize(10)
       .text(`Ordini totali: ${wave.totale_ordini}`, 50, 160)
       .text(`Righe totali: ${wave.totale_righe}`, 150, 160)
       .text(`Pick totali: ${wave.totale_picks}`, 250, 160)
       .text(`Tempo stimato: ${wave.tempo_stimato_minuti} min`, 350, 160)
       .text(`Distanza stimata: ${wave.distanza_stimata_metri} m`, 450, 160);

    // Linea separatrice
    doc.moveTo(50, 185).lineTo(550, 185).stroke();

    // Istruzioni generali
    let yPosition = 200;
    doc.fontSize(14).font('Helvetica-Bold')
       .text('ISTRUZIONI GENERALI:', 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(10).font('Helvetica')
       .text('• Seguire rigorosamente la sequenza di picking indicata', 50, yPosition)
       .text('• IMPORTANTE: Prelevare SOLO dall\'UDC con barcode indicato', 50, yPosition + 15)
       .text('• Verificare SEMPRE il barcode UDC prima di prelevare il prodotto', 50, yPosition + 30)
       .text('• Segnalare immediatamente discrepanze di quantità o UDC mancanti', 50, yPosition + 45)
       .text('• Utilizzare dispositivo mobile per aggiornare stato prelievi', 50, yPosition + 60);

    yPosition += 80;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    // Lista picking dettagliata
    yPosition += 20;
    doc.fontSize(14).font('Helvetica-Bold')
       .text('LISTA PICKING DETTAGLIATA:', 50, yPosition);

    yPosition += 30;

    // Header tabella
    doc.fontSize(8).font('Helvetica-Bold')
       .text('SEQ', 50, yPosition)
       .text('ZONA', 80, yPosition)
       .text('UBICAZIONE', 110, yPosition)
       .text('UDC BARCODE', 170, yPosition)
       .text('PRODOTTO', 230, yPosition)
       .text('DESCRIZIONE', 290, yPosition)
       .text('QTÀ', 380, yPosition)
       .text('ORDINE', 410, yPosition)
       .text('NOTE', 470, yPosition);

    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Raggruppa pick tasks per sequenza
    const sortedTasks = pickTasks.sort((a, b) => a.sequenza_pick - b.sequenza_pick);

    for (const task of sortedTasks) {
      // Controlla se serve nuova pagina
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      // Evidenzia UDC barcode in grassetto se presente
      doc.fontSize(8).font('Helvetica')
         .text(task.sequenza_pick.toString(), 50, yPosition)
         .text(task.ubicazione_zona || task.zona, 80, yPosition)
         .text(task.codice_ubicazione, 110, yPosition);
      
      // UDC Barcode in grassetto
      if (task.udc_barcode) {
        doc.font('Helvetica-Bold')
           .text(task.udc_barcode, 170, yPosition)
           .font('Helvetica');
      } else {
        doc.text('N/A', 170, yPosition);
      }
      
      doc.text(task.prodotto_codice, 230, yPosition)
         .text(task.prodotto_descrizione ? task.prodotto_descrizione.substring(0, 12) + '...' : '', 290, yPosition)
         .text(task.quantita_richiesta.toString(), 380, yPosition)
         .text(task.numero_ordine, 410, yPosition)
         .text(task.note_operatore || '', 470, yPosition);

      yPosition += 15;

      // Linea sottile tra i record
      if (task.sequenza_pick % 5 === 0) {
        doc.moveTo(50, yPosition).lineTo(550, yPosition).strokeOpacity(0.3).stroke().strokeOpacity(1);
        yPosition += 5;
      }
    }

    // Footer con informazioni aggiuntive
    yPosition += 30;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 15;

    doc.fontSize(8).font('Helvetica')
       .text('INFORMAZIONI ALGORITMO:', 50, yPosition);
    
    yPosition += 15;
    let algoInfo = '';
    switch (wave.tipo_wave) {
      case 'BATCH_PICKING':
        algoInfo = 'Batch Picking: Raggruppa prodotti identici per ridurre i movimenti. Ottimale per ordini con molti SKU comuni.';
        break;
      case 'ZONE_PICKING':
        algoInfo = 'Zone Picking: Organizza picking per zone di magazzino. Ogni operatore copre una zona specifica.';
        break;
      case 'DISCRETE_PICKING':
        algoInfo = 'Discrete Picking: Un ordine per volta con percorso ottimizzato. Ideale per ordini urgenti o complessi.';
        break;
      case 'WAVE_PICKING':
        algoInfo = 'Wave Picking: Picking coordinato di più ordini con sincronizzazione. Massima efficienza operativa.';
        break;
    }
    
    doc.text(algoInfo, 50, yPosition, { width: 500, align: 'justify' });

    // Firma operatore
    yPosition += 40;
    doc.text('Operatore: ________________________    Data/Ora inizio: ________________    Data/Ora fine: ________________', 50, yPosition);

    // Finalizza PDF
    doc.end();

    // Attendi che il PDF sia completato
    await new Promise<void>((resolve) => {
      doc.on('end', resolve);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="picking-list-${wave.wave_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Errore generazione PDF picking:', error);
    return new Response('Errore nella generazione del PDF', { status: 500 });
  }
};