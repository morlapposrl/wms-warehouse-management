import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ubicazioniRepository } from '$lib/server/repositories/ubicazioniRepository.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const mode = url.searchParams.get('mode') || 'to'; // 'from' | 'to'
    const committente_id = parseInt(url.searchParams.get('committente_id') || '0');
    const sku_code = url.searchParams.get('sku_code') || '';
    const required_volume = parseFloat(url.searchParams.get('required_volume') || '0');
    const required_weight = parseFloat(url.searchParams.get('required_weight') || '0');
    const search = url.searchParams.get('search') || '';
    
    if (!committente_id) {
      return json({ error: 'Committente richiesto' }, { status: 400 });
    }
    
    let locations: any[] = [];
    let suggested: any[] = [];
    
    if (mode === 'from') {
      // Modalità FROM: cerca ubicazioni che contengono il prodotto
      locations = ubicazioniRepository.findLocationsWithProduct(sku_code, committente_id, search);
      
      // Suggerimenti: ubicazioni con più quantità disponibile di questo SKU
      suggested = ubicazioniRepository.findBestSourceLocations(sku_code, committente_id);
      
    } else {
      // Modalità TO: cerca ubicazioni ottimali per stoccaggio
      locations = ubicazioniRepository.findAvailableForStorage(required_volume, required_weight, search);
      
      // Suggerimenti: ubicazioni ottimali per questo SKU
      if (sku_code) {
        suggested = ubicazioniRepository.findOptimalStorageLocations(sku_code, required_volume, required_weight);
      } else {
        suggested = ubicazioniRepository.findBestAvailableLocations(required_volume, required_weight);
      }
    }
    
    return json({
      success: true,
      locations: locations.map(enrichLocationData),
      suggested: suggested.map(enrichLocationData).slice(0, 5) // Max 5 suggerimenti
    });
    
  } catch (error) {
    console.error('Errore LocationPicker API:', error);
    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};

// Arricchisce i dati dell'ubicazione con informazioni utili
function enrichLocationData(location: any) {
  const volume_totale = location.volume_max_cm3 || 0;
  const volume_occupato = location.volume_occupato_cm3 || 0;
  const volume_disponibile = Math.max(0, volume_totale - volume_occupato);
  
  const peso_totale = location.peso_max_kg || 0;
  const peso_occupato = location.peso_attuale_kg || 0;
  const peso_disponibile = Math.max(0, peso_totale - peso_occupato);
  
  const percentuale_occupazione = volume_totale > 0 
    ? Math.round((volume_occupato / volume_totale) * 100) 
    : 0;
  
  // Descrizione contenuto attuale (se presente)
  let contenuto_attuale = '';
  if (location.sku_codes && location.quantita_totale) {
    if (location.sku_codes.split(',').length === 1) {
      contenuto_attuale = `${location.quantita_totale}x ${location.sku_codes}`;
    } else {
      contenuto_attuale = `${location.sku_codes.split(',').length} prodotti diversi`;
    }
  }
  
  // Motivo del suggerimento
  let reason = '';
  if (location.same_sku_quantity > 0) {
    reason = `${location.same_sku_quantity} già presenti`;
  } else if (location.zone_optimization) {
    reason = `Zona ${location.zona_velocita} ottimale`;
  } else if (volume_disponibile > 0) {
    reason = `${Math.round(volume_disponibile/1000)}L disponibili`;
  }
  
  return {
    ...location,
    volume_disponibile: Math.round(volume_disponibile),
    peso_disponibile: Math.round(peso_disponibile * 100) / 100,
    percentuale_occupazione,
    contenuto_attuale,
    reason
  };
}