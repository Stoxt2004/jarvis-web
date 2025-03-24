// src/lib/services/aiClientService.ts
import OpenAI from 'openai';
import { aiEvents, AI_EVENTS } from '@/lib/events/aiEvents';
import { toast } from 'sonner';

// Tipo per i comandi che l'AI può riconoscere
export type CommandType = 
  | 'OPEN_APP' 
  | 'CLOSE_APP' 
  | 'CREATE_FILE' 
  | 'DELETE_FILE' 
  | 'READ_FILE'
  | 'SEARCH_FILES'
  | 'ANSWER_QUESTION'
  | 'EXECUTE_CODE'
  | 'SYSTEM_INFO'
  | 'UNKNOWN';

// Interfaccia per i comandi analizzati
export interface ParsedCommand {
  type: CommandType;
  params: Record<string, any>;
  originalText: string;
}

// Funzione migliorata per registrare i log delle richieste AI
async function logAIRequest(type: string, tokenCount: number, successful: boolean = true): Promise<boolean> {
  try {
    // Invia una richiesta POST all'endpoint di log
    const response = await fetch('/api/ai/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        tokenCount,
        successful
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Errore nel logging della richiesta AI:", errorData);
      return false;
    }

    const result = await response.json();
    console.log("Log AI registrato:", result);
    return true;
  } catch (error) {
    console.error("Errore durante la chiamata di log AI:", error);
    return false;
  }
}

/**
 * Analizza il comando dell'utente tramite chiamata API server-side
 */
export async function parseUserCommand(userInput: string, userId: string): Promise<ParsedCommand> {
  try {
    // Chiama l'API server-side per verificare i limiti e analizzare il comando
    const response = await fetch('/api/ai/parse-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput, userId }),
    });

    // Se la risposta non è ok, gestisci l'errore
    if (!response.ok) {
      const errorData = await response.json();
      
      // Se il limite è stato superato
      if (response.status === 429 && errorData.isLimitExceeded) {
        // Imposta il flag di limite superato in sessionStorage
        sessionStorage.setItem('ai_limit_exceeded', 'true');
        
        // Emetti l'evento di limite raggiunto
        aiEvents.emit(AI_EVENTS.LIMIT_REACHED);
        
        // Mostra un toast
        toast.error('Limite giornaliero di richieste AI raggiunto');
        
        // Restituisci un comando di risposta con messaggio di errore
        return {
          type: "ANSWER_QUESTION",
          params: {
            question: userInput,
            limitExceeded: true,
            limitMessage: errorData.message || "Hai raggiunto il limite giornaliero di richieste AI."
          },
          originalText: userInput
        };
      }
      
      throw new Error(errorData.error || 'Errore nel parsing del comando');
    }

    // Ottieni i dati dalla risposta
    const data = await response.json();
    
    // Log della richiesta client-side (questa è una doppia sicurezza se la registrazione server fallisce)
    await logAIRequest('command_parsing', data.requestStats?.tokenCount || 0);
    
    // Incrementa il contatore locale di richieste
    const localRequestCount = parseInt(sessionStorage.getItem('local_ai_request_count') || '0');
    sessionStorage.setItem('local_ai_request_count', (localRequestCount + 1).toString());
    
    // Emetti l'evento di richiesta inviata
    aiEvents.emit(AI_EVENTS.REQUEST_SENT);
    
    return data.command;
  } catch (error) {
    console.error("Errore nella chiamata all'API parse-command:", error);
    
    // Log dell'errore
    await logAIRequest('command_parsing_error', 0, false);
    
    // Fallback: restituisci un comando di risposta generica
    return {
      type: "ANSWER_QUESTION",
      params: {
        question: userInput,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      originalText: userInput
    };
  }
}

/**
 * Esegue il comando analizzato e restituisce una risposta tramite chiamata API
 */
export async function executeCommand(command: ParsedCommand, userId: string): Promise<string> {
  try {
    // Gestisci subito il caso di limite superato
    if (command.type === "ANSWER_QUESTION" && command.params.limitExceeded) {
      return command.params.limitMessage || 
             `Mi dispiace, hai raggiunto il limite giornaliero di richieste AI per il tuo piano.`;
    }
    
    // Chiama l'API server-side per eseguire il comando
    const response = await fetch('/api/ai/execute-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command, userId }),
    });

    // Se la risposta non è ok, gestisci l'errore
    if (!response.ok) {
      const errorData = await response.json();
      
      // Se il limite è stato superato
      if (response.status === 429 && errorData.isLimitExceeded) {
        // Imposta il flag di limite superato in sessionStorage
        sessionStorage.setItem('ai_limit_exceeded', 'true');
        
        // Emetti l'evento di limite raggiunto
        aiEvents.emit(AI_EVENTS.LIMIT_REACHED);
        
        return errorData.message || "Hai raggiunto il limite giornaliero di richieste AI per il tuo piano.";
      }
      
      throw new Error(errorData.error || 'Errore nell\'esecuzione del comando');
    }

    // Ottieni la risposta
    const data = await response.json();
    
    // Log della richiesta client-side
    await logAIRequest('command_execution', data.requestStats?.tokenCount || 0);
    
    return data.response;
  } catch (error) {
    console.error("Errore nella chiamata all'API execute-command:", error);
    
    // Log dell'errore
    await logAIRequest('command_execution_error', 0, false);
    
    return `Si è verificato un errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
  }
}

/**
 * Genera una risposta generica a una domanda dell'utente utilizzando l'API
 */
export async function answerQuestion(question: string, userId: string): Promise<string> {
  try {
    // Chiama l'API server-side per rispondere alla domanda
    const response = await fetch('/api/ai/answer-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, userId }),
    });

    // Se la risposta non è ok, gestisci l'errore
    if (!response.ok) {
      const errorData = await response.json();
      
      // Se il limite è stato superato
      if (response.status === 429 && errorData.isLimitExceeded) {
        // Imposta il flag di limite superato in sessionStorage
        sessionStorage.setItem('ai_limit_exceeded', 'true');
        
        // Emetti l'evento di limite raggiunto
        aiEvents.emit(AI_EVENTS.LIMIT_REACHED);
        
        return errorData.message || "Hai raggiunto il limite giornaliero di richieste AI per il tuo piano.";
      }
      
      throw new Error(errorData.error || 'Errore nella generazione della risposta');
    }

    // Ottieni la risposta
    const data = await response.json();
    
    // Log della richiesta client-side
    await logAIRequest('question_answering', data.requestStats?.tokenCount || 0);
    
    return data.response;
  } catch (error) {
    console.error("Errore nella chiamata all'API answer-question:", error);
    
    // Log dell'errore
    await logAIRequest('question_answering_error', 0, false);
    
    return `Si è verificato un errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
  }
}