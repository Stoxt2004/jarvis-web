// src/app/api/ai/parse-command/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";
import { getPlanLimits } from "@/lib/stripe/config";
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

    // Ottieni i dati dalla richiesta
    const { userInput } = await request.json();
    
    if (!userInput) {
      return NextResponse.json({ error: "Input utente mancante" }, { status: 400 });
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

    // Analizza il comando dell'utente
    const openai = getOpenAIClient();
    
    // Definisce il prompt per analizzare il comando dell'utente
    const systemPrompt = `
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
      
      Se non riesci a identificare un comando valido, usa "UNKNOWN".
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

    // Registra la richiesta AI
    await prisma.aIRequestLog.create({
      data: {
        userId: session.user.id,
        type: "command_analysis",
        tokenCount: completion.usage?.total_tokens || 0,
        successful: true
      }
    });

    const responseText = completion.choices[0].message.content || '{"type": "UNKNOWN", "params": {}, "originalText": "' + userInput + '"}';
    
    let parsedCommand: ParsedCommand;
    
    try {
      parsedCommand = JSON.parse(responseText) as ParsedCommand;
      parsedCommand.originalText = userInput; // Assicuriamoci che il testo originale sia sempre quello dell'utente
    } catch (error) {
      console.error("Errore nel parsing JSON della risposta OpenAI:", error);
      parsedCommand = {
        type: "UNKNOWN",
        params: {},
        originalText: userInput
      };
    }

    // Ottieni il conteggio aggiornato delle richieste
    const updatedRequestCount = await prisma.aIRequestLog.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today
        }
      }
    });

    // Restituisci il comando analizzato e le statistiche di utilizzo
    return NextResponse.json({ 
      command: parsedCommand,
      requestStats: {
        currentCount: updatedRequestCount,
        limit: planLimits.aiRequests,
        remaining: Math.max(0, planLimits.aiRequests - updatedRequestCount)
      }
    });
  } catch (error: any) {
    console.error("Errore nell'analisi del comando:", error);
    return NextResponse.json(
      { error: error.message || "Errore sconosciuto" },
      { status: 500 }
    );
  }
}