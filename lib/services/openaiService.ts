// src/lib/services/openaiService.ts
import OpenAI from 'openai';
import { PanelType, useWorkspaceStore } from '@/lib/store/workspaceStore';
import { toast } from 'sonner';
import { FileStorageService } from './fileStorage';
import { prisma } from '../auth/prisma-adapter';
import { incrementAndCheckAIRequests } from '@/app/api/ai/request-limiter';
// Definisce la tipologia di comandi che l'AI può eseguire
type CommandType = 
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

interface ParsedCommand {
  type: CommandType;
  params: Record<string, any>;
  originalText: string;
}

// Inizializza il client OpenAI con la chiave API
// Utilizza un lazy singleton per inizializzare solo quando necessario
let openaiInstance: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openaiInstance) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    openaiInstance = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Necessario per client-side
    });
  }
  
  return openaiInstance;
};

async function logAIRequest(userId: string, type: string, tokenCount: number, successful: boolean) {
  try {
    await fetch('/api/ai/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        type,
        tokenCount,
        successful
      }),
    });
  } catch (error) {
    console.error("Errore nel logging della richiesta AI:", error);
  }
}


/**
 * Analizza il comando dell'utente e determina l'azione da eseguire
 */
export async function parseUserCommand(userInput: string, userId: string): Promise<ParsedCommand> {
  try {

    const limitCheck = await incrementAndCheckAIRequests(userId);
    
    // Se il limite è stato superato, restituisci un comando di risposta con errore
    if (!limitCheck.success) {
      return {
        type: "ANSWER_QUESTION",
        params: {
          question: userInput,
          limitExceeded: true,
          limitMessage: limitCheck.message
        },
        originalText: userInput
      };
    }

    const openai = getOpenAIClient();
    
    // Definisce il prompt per analizzare il comando dell'utente
    const systemPrompt = `
You are an AI assistant integrated into a web operating system called Jarvis.  
Your task is to analyze the user's textual commands and convert them into structured actions.

Here are the commands you can recognize:  
1. OPEN_APP – Open an application (params: appType: "browser", "editor", "fileManager", "terminal", "notes", "dashboard")  
2. CLOSE_APP – Close an application (params: appId or appType)  
3. CREATE_FILE – Create a new file (params: fileName, content, type, path)  
4. DELETE_FILE – Delete a file (params: fileName or filePath)  
5. READ_FILE – Read the contents of a file (params: fileName or filePath)  
6. SEARCH_FILES – Search for files (params: query, type)  
7. ANSWER_QUESTION – Answer a general question (params: question)  
8. EXECUTE_CODE – Execute code (params: code, language)  
9. SYSTEM_INFO – Provide system information (params: infoType)

Return JSON in the following format:

{
  "type": "COMMAND_TYPE",
  "params": {
    // Specific command parameters
  },
  "originalText": "the original command text"
}

    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput }
      ],
      temperature: 0.2,
    });

    await logAIRequest(
      userId, 
      "chat_completion", 
      completion.usage?.total_tokens || 0, 
      true
    );
    
    const responseText = completion.choices[0].message.content || '{"type": "UNKNOWN", "params": {}, "originalText": "' + userInput + '"}';
    
    try {
      const parsedResponse = JSON.parse(responseText) as ParsedCommand;
      return {
        ...parsedResponse,
        originalText: userInput // Assicuriamoci che il testo originale sia sempre quello dell'utente
      };
    } catch (error) {
      console.error("Errore nel parsing JSON della risposta OpenAI:", error);
      return {
        type: "UNKNOWN",
        params: {},
        originalText: userInput
      };
    }
  } catch (error) {
    console.error("Errore nella chiamata all'API OpenAI:", error);
    await logAIRequest(userId, "chat_completion", 0, false);
    return {
      type: "UNKNOWN",
      params: {},
      originalText: userInput
    };
  }
}

/**
 * Esegue il comando analizzato e restituisce una risposta
 */
export async function executeCommand(command: ParsedCommand, userId: string): Promise<string> {
  try {
    if (command.type === "ANSWER_QUESTION" && command.params.limitExceeded) {
      return command.params.limitMessage || 
             `Mi dispiace, hai raggiunto il limite giornaliero di richieste AI per il tuo piano.`;
    }
    
    switch (command.type) {
      case "OPEN_APP":
        return await openApplication(command.params.appType);
      
      case "CLOSE_APP":
        return await closeApplication(command.params.appId || command.params.appType);
      
      case "CREATE_FILE":
        return await createFile(command.params, userId);
      
      case "DELETE_FILE":
        return await deleteFile(command.params, userId);
      
      case "READ_FILE":
        return await readFile(command.params, userId);
      
      case "SEARCH_FILES":
        return await searchFiles(command.params, userId);
      
      case "EXECUTE_CODE":
        return await executeCode(command.params);
      
      case "SYSTEM_INFO":
        return await getSystemInfo(command.params.infoType);
      
      case "ANSWER_QUESTION":
        return await answerQuestion(command.originalText, userId);
      
      case "UNKNOWN":
      default:
        return await answerQuestion(command.originalText, userId);
    }
  } catch (error: any) {
    console.error("Errore nell'esecuzione del comando:", error);
    return `Mi dispiace, si è verificato un errore durante l'esecuzione del comando: ${error.message || 'Errore sconosciuto'}`;
  }
}

/**
 * Genera una risposta generica a una domanda dell'utente
 */
export async function answerQuestion(question: string, userId: string): Promise<string> {
  try {
    const limitCheck = await incrementAndCheckAIRequests(userId);
    const openai = getOpenAIClient();
    
    if (!limitCheck.success) {
      return `Mi dispiace, hai raggiunto il limite giornaliero di ${limitCheck.limit} richieste AI per il tuo piano. 
              Questo limite si resetterà domani, oppure puoi passare a un piano superiore per 
              avere più richieste giornaliere.`;
    }

    const systemPrompt = `
      You are Jarvis, an AI assistant integrated into a web operating system.
You are friendly, helpful, and concise. Answer the user's questions informatively.
If you don’t know the answer, honestly admit it.
Try to keep responses under 150 words whenever possible.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    await logAIRequest(
      userId, 
      "chat_completion", 
      completion.usage?.total_tokens || 0, 
      true
    );
    
    return completion.choices[0].message.content || "Mi dispiace, non sono riuscito a generare una risposta.";
  } catch (error) {
    console.error("Errore nella chiamata all'API OpenAI:", error);
    await logAIRequest(userId, "chat_completion", 0, false);
    return "Si è verificato un errore durante l'elaborazione della tua domanda.";

  }
}

/**
 * Apre un'applicazione del tipo specificato
 */
async function openApplication(appType: PanelType): Promise<string> {
  // Questa funzione deve essere chiamata nel contesto di un componente React
  // che ha accesso allo store, quindi restituiamo solo le istruzioni
  
  const appNames: Record<string, string> = {
    'browser': 'Browser',
    'editor': 'Editor',
    'fileManager': 'File Manager',
    'terminal': 'Terminale',
    'notes': 'Note',
    'dashboard': 'Dashboard'
  };
  
  // La logica di apertura verrà implementata nel componente che utilizza questo servizio
  return `Sto aprendo ${appNames[appType] || appType}`;
}

/**
 * Chiude un'applicazione con l'ID o il tipo specificato
 */
async function closeApplication(appIdentifier: string): Promise<string> {
  // La logica di chiusura verrà implementata nel componente che utilizza questo servizio
  return `Sto chiudendo l'applicazione ${appIdentifier}`;
}

/**
 * Crea un nuovo file con i parametri specificati
 */
async function createFile(params: any, userId: string): Promise<string> {
    try {
      const { fileName, content = '', type, path = '/', parentId } = params;
      
      if (!fileName) {
        return "Mi serve un nome per il file da creare";
      }
      
      // Chiama l'API invece di usare direttamente Prisma
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'CREATE_FILE',
          params: {
            fileName,
            content,
            type,
            path,
            parentId
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore del server (${response.status})`);
      }
      
      const data = await response.json();
      return `Ho creato il file ${fileName} con successo`;
    } catch (error: any) {
      console.error("Errore nella creazione del file:", error);
      throw new Error(`Non sono riuscito a creare il file: ${error.message}`);
    }
  }
  
  /**
   * Elimina un file con il nome o il percorso specificato
   */
  async function deleteFile(params: any, userId: string): Promise<string> {
    try {
      // Chiama l'API invece di usare direttamente Prisma
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'DELETE_FILE',
          params
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore del server (${response.status})`);
      }
      
      // Ottieni i dettagli dal parametro utilizzato
      const fileIdentifier = params.fileId 
        ? `con ID ${params.fileId}`
        : params.filePath
          ? `al percorso ${params.filePath}`
          : params.fileName
            ? `${params.fileName}`
            : '';
            
      return `Ho eliminato il file ${fileIdentifier}`;
    } catch (error: any) {
      console.error("Errore nell'eliminazione del file:", error);
      throw new Error(`Non sono riuscito a eliminare il file: ${error.message}`);
    }
  }

/**
 * Legge il contenuto di un file
 */
async function readFile(params: any, userId: string): Promise<string> {
    try {
      // Chiama l'API invece di usare direttamente Prisma
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'READ_FILE',
          params
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore del server (${response.status})`);
      }
      
      const data = await response.json();
      const file = data.file;
      
      if (file.type === 'folder') {
        return `${file.name} è una cartella, non un file`;
      }
      
      return `Contenuto di ${file.name}:\n\n${file.content || '[File vuoto o binario]'}`;
    } catch (error: any) {
      console.error("Errore nella lettura del file:", error);
      throw new Error(`Non sono riuscito a leggere il file: ${error.message}`);
    }
  }
  
  /**
   * Cerca file in base ai criteri specificati
   */
  async function searchFiles(params: any, userId: string): Promise<string> {
    try {
      const { query, type } = params;
      
      if (!query) {
        return "Mi serve un termine di ricerca per trovare i file";
      }
      
      // Chiama l'API invece di usare direttamente Prisma
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'SEARCH_FILES',
          params: {
            query,
            type
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore del server (${response.status})`);
      }
      
      const data = await response.json();
      const files = data.files;
      
      if (files.length === 0) {
        return `Non ho trovato file che corrispondono a "${query}"`;
      }
      
      // Formatta i risultati
      const results = files.map((file: any) => {
        const fileType = file.type === 'folder' ? 'Cartella' : `File ${file.type}`;
        const fileSize = file.type === 'folder' ? '' : ` (${formatFileSize(file.size)})`;
        return `- ${file.name}: ${fileType}${fileSize}`;
      });
      
      return `Ho trovato ${files.length} file corrispondenti a "${query}":\n\n${results.join('\n')}`;
    } catch (error: any) {
      console.error("Errore nella ricerca dei file:", error);
      throw new Error(`Non sono riuscito a cercare i file: ${error.message}`);
    }
  }

/**
 * Esegue il codice specificato (simulato)
 */
async function executeCode(params: any): Promise<string> {
  const { code, language = 'javascript' } = params;
  
  if (!code) {
    return "Mi serve del codice da eseguire";
  }
  
  // Nota: in una vera implementazione, dovresti usare un ambiente sicuro
  // per l'esecuzione del codice. Qui simuliamo solo la risposta.
  return `Ho eseguito il codice ${language}. Questo è un ambiente simulato, l'esecuzione reale non è disponibile per motivi di sicurezza.`;
}

/**
 * Restituisce informazioni sul sistema
 */
async function getSystemInfo(infoType: string): Promise<string> {
  const info: Record<string, string> = {
    'general': 'Jarvis Web OS v0.1.0 - Un sistema operativo web avanzato',
    'memory': 'Memoria disponibile: 3.5 GB di 5 GB',
    'storage': 'Spazio di archiviazione: 2.3 GB di 5 GB utilizzati',
    'version': 'Versione: 0.1.0 (Beta)',
    'browser': `Browser: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'}`,
    'date': `Data e ora correnti: ${new Date().toLocaleString()}`
  };
  
  return info[infoType?.toLowerCase()] || 
         `Jarvis Web OS v0.1.0\nData: ${new Date().toLocaleString()}\nUtilizzo memoria: 60%\nUtilizzo storage: 45%`;
}

/**
 * Utility per formattare la dimensione dei file
 */
function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return '';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export type { CommandType, ParsedCommand };