// src/app/api/ai/execute-command/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";
import { getPlanLimits } from "@/lib/stripe/config";
import { FileStorageService } from "@/lib/services/fileStorage";
import OpenAI from 'openai';

// Inizializza il client OpenAI con la chiave API
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

// Tipologia di comandi
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

    // Ottieni i dati dalla richiesta
    const { command } = await request.json();
    
    if (!command) {
      return NextResponse.json({ error: "Comando mancante" }, { status: 400 });
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

    // Esegui il comando in base al tipo
    let response: string;
    
    switch (command.type) {
      case "ANSWER_QUESTION":
        response = await generateAnswer(command.originalText, session.user.id);
        break;
        
      case "CREATE_FILE":
        response = await createFile(command.params, session.user.id);
        break;
        
      case "DELETE_FILE":
        response = await deleteFile(command.params, session.user.id);
        break;
        
      case "READ_FILE":
        response = await readFile(command.params, session.user.id);
        break;
        
      case "SEARCH_FILES":
        response = await searchFiles(command.params, session.user.id);
        break;
        
      case "SYSTEM_INFO":
        response = await getSystemInfo(command.params.infoType);
        break;
        
      case "OPEN_APP":
      case "CLOSE_APP":
      case "EXECUTE_CODE":
        // Questi comandi vengono eseguiti sul client, quindi restituisci solo una conferma
        response = `Sto eseguendo il comando ${command.type}`;
        break;
        
      case "UNKNOWN":
      default:
        // Se il comando è sconosciuto, genera una risposta alla domanda originale
        response = await generateAnswer(command.originalText, session.user.id);
        break;
    }

    // Registra la richiesta AI
    const logEntry = await prisma.aIRequestLog.create({
      data: {
        userId: session.user.id,
        type: "command_execution",
        tokenCount: 0, // Verrà aggiornato in base alla risposta
        successful: true
      }
    });
    
    console.log(`Log AI creato con successo, ID: ${logEntry.id}, type: command_execution`);

    // Ottieni il conteggio aggiornato delle richieste
    const updatedRequestCount = await prisma.aIRequestLog.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today
        }
      }
    });

    // Restituisci la risposta e le statistiche di utilizzo
    return NextResponse.json({ 
      response,
      requestStats: {
        currentCount: updatedRequestCount,
        limit: planLimits.aiRequests,
        remaining: Math.max(0, planLimits.aiRequests - updatedRequestCount)
      }
    });
  } catch (error: any) {
    console.error("Errore nell'esecuzione del comando:", error);
    return NextResponse.json(
      { error: error.message || "Errore sconosciuto" },
      { status: 500 }
    );
  }
}

/**
 * Genera una risposta ad una domanda dell'utente
 */
async function generateAnswer(question: string, userId: string): Promise<string> {
  const openai = getOpenAIClient();
  
  const systemPrompt = `
    You are Jarvis, an AI assistant integrated into a web operating system.
You are friendly, helpful, and concise. Answer the user's questions informatively.
If you don’t know the answer, honestly admit it.
Try to keep responses under 150 words whenever possible.

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

  // Invece di aggiornare il record esistente, creiamo un nuovo record
  // con il conteggio dei token corretti
  await prisma.aIRequestLog.create({
    data: {
      userId,
      type: "chat_completion",
      tokenCount: completion.usage?.total_tokens || 0,
      successful: true
    }
  });
  
  return completion.choices[0].message.content || "Mi dispiace, non sono riuscito a generare una risposta.";
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

    return `Ho creato il file ${fileName} con successo`;
  } catch (error: any) {
    console.error("Errore nella creazione del file:", error);
    throw new Error(`Non sono riuscito a creare il file: ${error.message}`);
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
      return `Ho eliminato il file con ID ${fileId}`;
    }
    
    // Altrimenti, dobbiamo cercarlo prima per nome o percorso
    if (filePath) {
      const file = await FileStorageService.getFileByPath(filePath, userId);
      if (!file) {
        return `Non ho trovato nessun file al percorso ${filePath}`;
      }
      
      await FileStorageService.deleteFile(file.id, userId);
      return `Ho eliminato il file ${file.name}`;
    }
    
    if (fileName) {
      // Cerca i file nella root
      const rootFiles = await FileStorageService.getRootFiles(userId);
      const file = rootFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      
      if (!file) {
        return `Non ho trovato nessun file con nome ${fileName}`;
      }
      
      await FileStorageService.deleteFile(file.id, userId);
      return `Ho eliminato il file ${file.name}`;
    }
    
    return "Non ho potuto eliminare il file: mi serve un ID, un percorso o un nome file";
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
    throw new Error(`Non sono riuscito a cercare i file: ${error.message}`);
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