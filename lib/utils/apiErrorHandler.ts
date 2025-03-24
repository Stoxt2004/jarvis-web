// src/lib/utils/apiErrorHandler.ts
import { toast } from 'sonner';

/**
 * Tipi di errori API per limiti di risorse
 */
export type ResourceLimitErrorType = 
  | 'AI_LIMIT_EXCEEDED' 
  | 'STORAGE_LIMIT_EXCEEDED' 
  | 'PANEL_LIMIT_EXCEEDED';

/**
 * Interfaccia per gli errori API
 */
interface APIError {
  message: string;
  code?: string;
  type?: string;
}

/**
 * Gestisce gli errori API e mostra notifiche appropriate
 * Restituisce true se l'errore è stato gestito, false altrimenti
 */
export function handleAPIError(error: any, showLimitBanner?: (type: ResourceLimitErrorType) => void): boolean {
  console.error('API Error:', error);
  
  // Estrai i dettagli dell'errore
  let errorDetails: APIError = {
    message: 'Si è verificato un errore durante la richiesta.'
  };
  
  try {
    // Se l'errore è già un oggetto con un campo response (axios-like)
    if (error.response && error.response.data) {
      errorDetails = error.response.data;
    } 
    // Se l'errore è un oggetto con un campo message
    else if (error.message) {
      errorDetails.message = error.message;
    }
    // Se l'errore è una stringa JSON
    else if (typeof error === 'string' && error.startsWith('{')) {
      errorDetails = JSON.parse(error);
    }
    // Se l'errore è solo una stringa
    else if (typeof error === 'string') {
      errorDetails.message = error;
    }
  } catch (e) {
    console.error('Errore durante il parsing dell\'errore:', e);
  }
  
  // Gestisci errori specifici
  if (errorDetails.code === 'AI_LIMIT_EXCEEDED' && errorDetails.type === 'UPGRADE_REQUIRED') {
    toast.error('Limite richieste AI raggiunto', {
      description: 'Hai raggiunto il limite giornaliero di richieste AI per il tuo piano.'
    });
    
    // Se è disponibile la funzione per mostrare il banner, usala
    if (showLimitBanner) {
      showLimitBanner('AI_LIMIT_EXCEEDED');
    }
    
    return true;
  }
  
  if (errorDetails.code === 'STORAGE_LIMIT_EXCEEDED' && errorDetails.type === 'UPGRADE_REQUIRED') {
    toast.error('Limite storage raggiunto', {
      description: 'Hai raggiunto il limite di spazio di archiviazione per il tuo piano.'
    });
    
    // Se è disponibile la funzione per mostrare il banner, usala
    if (showLimitBanner) {
      showLimitBanner('STORAGE_LIMIT_EXCEEDED');
    }
    
    return true;
  }
  
  if (errorDetails.code === 'PANEL_LIMIT_EXCEEDED' && errorDetails.type === 'UPGRADE_REQUIRED') {
    toast.error('Limite pannelli raggiunto', {
      description: 'Hai raggiunto il limite di pannelli contemporanei per il tuo piano.'
    });
    
    // Se è disponibile la funzione per mostrare il banner, usala
    if (showLimitBanner) {
      showLimitBanner('PANEL_LIMIT_EXCEEDED');
    }
    
    return true;
  }
  
  // Per altri errori, mostra un messaggio generico
  toast.error('Errore', {
    description: errorDetails.message
  });
  
  return false;
}