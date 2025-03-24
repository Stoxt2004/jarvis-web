// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";
import { getPlanLimits } from "@/lib/stripe/config";
import { FileStorageService } from "@/lib/services/fileStorage";
import OpenAI from 'openai';

// Inizializza il client OpenAI
let openaiInstance: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openaiInstance) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    openaiInstance = new OpenAI({
      apiKey
    });
  }
  
  return openaiInstance;
};

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

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Ottieni il messaggio dalla richiesta
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "Messaggio mancante" }, { status: 400 });
    }

    // Verifica il limite di richieste AI giornaliere
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const requestCount = await prisma.aIRequestLog.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today
        }
      }
    });
    
    // Ottieni i limiti del piano
    const userPlan = (session.user.plan as string).toUpperCase();
    const planLimits = getPlanLimits(userPlan);
    
    // Verifica se è stato superato il limite
    if (requestCount >= planLimits.aiRequests) {
      return NextResponse.json({
        error: "Limite di richieste AI giornaliere raggiunto",
        isLimitExceeded: true,
        message: `Hai raggiunto il limite di ${planLimits.aiRequests} richieste AI giornaliere per il tuo piano.`,
        currentCount: requestCount,
        limit: planLimits.aiRequests
      }, { status: 429 });
    }

    // PRIMA PARTE: Analisi del messaggio per identificare comandi
    let parsedCommand: ParsedCommand;
    
    // Determina se il messaggio contiene un comando
    const openai = getOpenAIClient();
    
    // Prompt per analizzare il comando dell'utente
    const analysisPrompt = `
      Tu sei un assistente AI integrato in un sistema operativo web chiamato Jarvis.
      Il tuo compito è analizzare i comandi testuali dell'utente e convertirli in azioni strutturate.
      
      Ecco i comandi che puoi riconoscere:
      1. OPEN_APP - Aprire un'applicazione (params: appType: "browser", "editor", "fileManager", "terminal", "notes", "dashboard")
      2. CLOSE_APP - Chiudere un'applicazione (params: appId o appType)
      3. CREATE_FILE - Creare un nuovo file (params: fileName, content, type, path)
      4. DELETE_FILE - Eliminare un file (params: fileName o filePath)
      5. READ_FILE - Leggere il contenuto di un file (params: fileName o filePath)
      6. SEARCH_FILES - Cercare file (params: query, type)
      7. ANSWER_QUESTION - Rispondere a una domanda generica (params: question)
      8. EXECUTE_CODE - Eseguire del codice (params: code, language)
      9. SYSTEM_INFO - Fornire informazioni sul sistema (params: infoType)
      
      Restituisci JSON con questo formato:
      {
        "type": "COMMAND_TYPE",
        "params": {
          // Parametri specifici del comando
        },
        "originalText": "il testo originale del comando"
      }
      
      Se non riesci a identificare un comando valido, usa "ANSWER_QUESTION" con il parametro "question" contenente il testo originale.
    `;
    
    try {
      const analysisCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: analysisPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.2,
      });
      
      const responseText = analysisCompletion.choices[0].message.content || 
        `{"type": "ANSWER_QUESTION", "params": {"question": "${message}"}, "originalText": "${message}"}`;
      
      parsedCommand = JSON.parse(responseText) as ParsedCommand;
      parsedCommand.originalText = message; // Assicuriamoci che il testo originale sia sempre quello dell'utente
    } catch (error) {
      console.error("Errore nel parsing JSON della risposta OpenAI:", error);
      parsedCommand = {
        type: "ANSWER_QUESTION",
        params: { question: message },
        originalText: message
      };
    }

    // SECONDA PARTE: Esegui l'azione appropriata e genera una risposta
    let response: string;
    
    console.log("Comando rilevato:", parsedCommand.type);
    
    // Esegui il comando in base al tipo
    switch (parsedCommand.type) {
      case "OPEN_APP":
      case "CLOSE_APP":
        // Questi comandi vengono eseguiti sul client
        response = `Executing command ${parsedCommand.type}. `;
        if (parsedCommand.type === "OPEN_APP") {
          response += `Opening app ${parsedCommand.params.appType || "richiesta"}...`;
        } else {
          response += `Closing app ${parsedCommand.params.appType || "richiesta"}...`;
        }
        break;
        
      case "CREATE_FILE":
        response = await createFile(parsedCommand.params, session.user.id);
        break;
        
      case "DELETE_FILE":
        response = await deleteFile(parsedCommand.params, session.user.id);
        break;
        
      case "READ_FILE":
        response = await readFile(parsedCommand.params, session.user.id);
        break;
        
      case "SEARCH_FILES":
        response = await searchFiles(parsedCommand.params, session.user.id);
        break;
        
      case "SYSTEM_INFO":
        response = await getSystemInfo(parsedCommand.params.infoType);
        break;
        
      case "EXECUTE_CODE":
        // Simulazione dell'esecuzione del codice
        response = `Ho analizzato il codice. Questo è un ambiente simulato, l'esecuzione reale non è disponibile per motivi di sicurezza.`;
        break;
        
      case "ANSWER_QUESTION":
      case "UNKNOWN":
      default:
        // Genera una risposta alla domanda dell'utente
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { 
              role: "system", 
              content: `
                You are Jarvis, an AI assistant integrated into a web operating system.
                You are friendly, helpful, and concise. Answer the user's questions informatively.
                If you don't know the answer, honestly admit it.
                Try to keep responses under 150 words whenever possible.
              `
            },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 300
        });
        
        response = chatCompletion.choices[0].message.content || 
          "Mi dispiace, non sono riuscito a generare una risposta.";
        break;
    }

    // Crea un solo log nel database per l'intera interazione
    await prisma.aIRequestLog.create({
      data: {
        userId: session.user.id,
        type: "chat_completion",
        tokenCount: 0, // Qui potremmo sommare i token se necessario
        successful: true
      }
    });

    // Ottieni il conteggio aggiornato delle richieste
    const updatedRequestCount = await prisma.aIRequestLog.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today
        }
      }
    });

    // Restituisci la risposta, il comando rilevato e le statistiche di utilizzo
    return NextResponse.json({ 
      response,
      command: parsedCommand,
      requestStats: {
        currentCount: updatedRequestCount,
        limit: planLimits.aiRequests,
        remaining: Math.max(0, planLimits.aiRequests - updatedRequestCount)
      }
    });
  } catch (error: any) {
    console.error("Errore nella generazione della risposta:", error);
    return NextResponse.json(
      { error: error.message || "Errore sconosciuto" },
      { status: 500 }
    );
  }
}

/**
 * Crea un nuovo file
 */
async function createFile(params: any, userId: string): Promise<string> {
  try {
    const { fileName, content = '', type, path = '/', parentId } = params;
    
    if (!fileName) {
      return "Mi serve un nome per il file da creare";
    }
    
    // Determina il tipo di file dall'estensione se non specificato
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const fileType = type || fileExtension || 'txt';
    
    // Crea il percorso completo
    const filePath = path.endsWith('/') ? `${path}${fileName}` : `${path}/${fileName}`;
    
    // Calcola la dimensione approssimativa del contenuto in byte
    const size = content ? new TextEncoder().encode(content).length : 0;
    
    // Salva il file utilizzando il servizio di storage
    const file = await FileStorageService.saveFile({
      name: fileName,
      type: fileType,
      size,
      content,
      userId,
      path: filePath,
      parentId
    });

    return `File ${fileName} created succesfuly`;
  } catch (error: any) {
    console.error("Errore nella creazione del file:", error);
    return `Error creating file: ${error.message}`;
  }
}

/**
 * Elimina un file
 */
async function deleteFile(params: any, userId: string): Promise<string> {
  try {
    const { fileId, fileName, filePath } = params;
    
    // Se abbiamo l'ID del file, possiamo eliminarlo direttamente
    if (fileId) {
      await FileStorageService.deleteFile(fileId, userId);
      return `File deleted ${fileId}`;
    }
    
    // Altrimenti, dobbiamo cercarlo prima per nome o percorso
    if (filePath) {
      const file = await FileStorageService.getFileByPath(filePath, userId);
      if (!file) {
        return `Didn't find file ${filePath}`;
      }
      
      await FileStorageService.deleteFile(file.id, userId);
      return `Deleted ${file.name}`;
    }
    
    if (fileName) {
      // Cerca i file nella root
      const rootFiles = await FileStorageService.getRootFiles(userId);
      const file = rootFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      
      if (!file) {
        return `Didn't find file with name ${fileName}`;
      }
      
      await FileStorageService.deleteFile(file.id, userId);
      return `Deleted ${file.name}`;
    }
    
    return "Non ho potuto eliminare il file: mi serve un ID, un percorso o un nome file";
  } catch (error: any) {
    console.error("Errore nell'eliminazione del file:", error);
    return `Non sono riuscito a eliminare il file: ${error.message}`;
  }
}

/**
 * Legge il contenuto di un file
 */
async function readFile(params: any, userId: string): Promise<string> {
  try {
    const { fileId, fileName, filePath } = params;
    let file;
    
    // Cerca il file per ID, percorso o nome
    if (fileId) {
      file = await FileStorageService.getFile(fileId, userId);
    } else if (filePath) {
      file = await FileStorageService.getFileByPath(filePath, userId);
    } else if (fileName) {
      // Cerca i file nella root
      const rootFiles = await FileStorageService.getRootFiles(userId);
      file = rootFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
    }
    
    if (!file) {
      return "Non ho trovato il file richiesto";
    }
    
    if (file.type === 'folder') {
      return `${file.name} è una cartella, non un file`;
    }
    
    return `Contenuto di ${file.name}:\n\n${file.content || '[File vuoto o binario]'}`;
  } catch (error: any) {
    console.error("Errore nella lettura del file:", error);
    return `Non sono riuscito a leggere il file: ${error.message}`;
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
    
    // Recupera tutti i file dell'utente
    const rootFiles = await FileStorageService.getRootFiles(userId);
    
    // Filtra i file in base alla query e al tipo
    const filteredFiles = rootFiles.filter(file => {
      const nameMatch = file.name.toLowerCase().includes(query.toLowerCase());
      const typeMatch = type ? file.type === type : true;
      return nameMatch && typeMatch;
    });
    
    if (filteredFiles.length === 0) {
      return `Non ho trovato file che corrispondono a "${query}"`;
    }
    
    // Formatta i risultati
    const results = filteredFiles.map(file => {
      const fileType = file.type === 'folder' ? 'Cartella' : `File ${file.type}`;
      const fileSize = file.type === 'folder' ? '' : ` (${formatFileSize(file.size)})`;
      return `- ${file.name}: ${fileType}${fileSize}`;
    });
    
    return `Ho trovato ${filteredFiles.length} file corrispondenti a "${query}":\n\n${results.join('\n')}`;
  } catch (error: any) {
    console.error("Errore nella ricerca dei file:", error);
    return `Non sono riuscito a cercare i file: ${error.message}`;
  }
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
    'browser': 'Browser: Server-side (non disponibile)',
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