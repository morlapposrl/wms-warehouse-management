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

    // Header tabella (UDC BARCODE espanso)
    doc.fontSize(7).font('Helvetica-Bold')
       .text('SEQ', 50, yPosition)
       .text('ZONA', 80, yPosition)
       .text('UBICAZIONE', 105, yPosition)
       .text('UDC BARCODE', 150, yPosition)
       .text('PRODOTTO', 250, yPosition)
       .text('QTÀ', 290, yPosition)
       .text('LOTTO', 315, yPosition)
       .text('SCADENZA', 355, yPosition)
       .text('PRIORITÀ', 405, yPosition)
       .text('ORDINE', 450, yPosition)
       .text('NOTE', 500, yPosition);

    yPosition += 15;
    
    // Linea orizzontale e separatori verticali per tabella
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    
    // Linee verticali per separare colonne (aggiornate per UDC espanso)
    const columnPositions = [78, 103, 148, 248, 288, 313, 353, 403, 448, 498];
    columnPositions.forEach(x => {
      doc.moveTo(x, yPosition).lineTo(x, yPosition + 5).stroke();
    });
    
    yPosition += 10;

    // Raggruppa pick tasks per sequenza
    const sortedTasks = pickTasks.sort((a, b) => a.sequenza_pick - b.sequenza_pick);

    for (const task of sortedTasks) {
      // Controlla se serve nuova pagina
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      // Layout ottimizzato con UDC BARCODE completo
      doc.fontSize(7).font('Helvetica')
         .text(task.sequenza_pick.toString(), 50, yPosition)
         .text(task.ubicazione_zona || task.zona, 80, yPosition)
         .text(task.codice_ubicazione, 105, yPosition);
      
      // UDC Barcode COMPLETO in grassetto (ora ha più spazio)
      if (task.udc_barcode) {
        doc.font('Helvetica-Bold')
           .text(task.udc_barcode, 150, yPosition)
           .font('Helvetica');
      } else {
        doc.text('N/A', 150, yPosition);
      }
      
      doc.text(task.prodotto_codice, 250, yPosition)
         .text(task.quantita_richiesta.toString(), 290, yPosition);
      
      // LOTTO (con evidenziazione se obbligatorio)
      if (task.lotto_partita) {
        if (task.tracking_lotto_obbligatorio) {
          doc.font('Helvetica-Bold')
             .text(task.lotto_partita.substring(0, 8), 315, yPosition)
             .font('Helvetica');
        } else {
          doc.text(task.lotto_partita.substring(0, 8), 315, yPosition);
        }
      } else {
        doc.text('N/A', 315, yPosition);
      }
      
      // SCADENZA (con warning se vicina)
      if (task.data_scadenza_stimata) {
        const scadenza = new Date(task.data_scadenza_stimata);
        const oggi = new Date();
        const giorni = Math.floor((scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
        
        if (giorni <= 7) {
          doc.font('Helvetica-Bold')
             .text(scadenza.toLocaleDateString('it-IT'), 355, yPosition)
             .font('Helvetica');
        } else {
          doc.text(scadenza.toLocaleDateString('it-IT'), 355, yPosition);
        }
      } else {
        doc.text('N/A', 355, yPosition);
      }
      
      // PRIORITÀ FIFO/FEFO
      doc.text(task.tipo_priorita || 'FIFO', 405, yPosition)
         .text(task.numero_ordine, 450, yPosition)
         .text(task.note_operatore || '', 500, yPosition);

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