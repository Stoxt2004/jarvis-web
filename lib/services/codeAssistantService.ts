// src/lib/services/codeAssistantService.ts

import OpenAI from 'openai';
import { toast } from 'sonner';

// Definizione dei tipi per le richieste di codice
export type CodeRequestType = 
  | 'GENERATE'
  | 'MODIFY'
  | 'EXPLAIN'
  | 'DEBUG'
  | 'OPTIMIZE'
  | 'DOCUMENT';

export interface CodeRequest {
  type: CodeRequestType;
  language: string;
  currentCode: string;
  prompt: string;
  fileName?: string;
}

export interface CodeResponse {
  code: string;
  explanation: string;
  suggestions?: string[];
}

// Singleton per il client OpenAI
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

/**
 * Genera o modifica codice in base alla richiesta dell'utente
 */
export async function processCodeRequest(request: CodeRequest): Promise<CodeResponse> {
  
  try {
    const openai = getOpenAIClient();
    
    // Costruisci un prompt specifico per la generazione di codice
    const systemPrompt = getSystemPromptForCodeRequest(request);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `${request.prompt}\n\nFile corrente (${request.fileName || 'untitled'}):\n\`\`\`${request.language}\n${request.currentCode}\n\`\`\`` 
        }
      ],
      temperature: 0.3,
    });
    
    const userId = sessionStorage.getItem('userId') || 'anonymous-user';
    await logAIRequest(
      userId,
      'code_completion',
      completion.usage?.total_tokens || 0,
      true
    );
    const responseText = completion.choices[0].message.content || '';
    
    // Estrai il codice e la spiegazione dalla risposta
    return parseCodeResponse(responseText, request.language);
    
  } catch (error: any) {
    console.error("Errore nella chiamata all'API OpenAI:", error);
    throw new Error(`Errore nella generazione del codice: ${error.message || 'Errore sconosciuto'}`);
  }
}

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
 * Genera un prompt di sistema specifico in base al tipo di richiesta
 */
function getSystemPromptForCodeRequest(request: CodeRequest): string {
  const basePrompt = `
    Sei un assistente di programmazione esperto specializzato in ${request.language}.
    Stai aiutando a scrivere codice per un file chiamato ${request.fileName || 'untitled'}.
    
    Rispondi in italiano. Quando fornisci esempi di codice, usa i blocchi di codice con la sintassi markdown \`\`\`${request.language} ... \`\`\`.
    
    La tua risposta deve avere questo formato:
    1. Una breve spiegazione di cosa fa il codice che hai generato
    2. Il blocco di codice completo racchiuso tra \`\`\`${request.language} e \`\`\`
    3. Eventuali suggerimenti o note aggiuntive
  `;
  
  // Aggiungi istruzioni specifiche in base al tipo di richiesta
  switch (request.type) {
    case 'GENERATE':
      return `${basePrompt}\n\nDevi generare nuovo codice in base alla richiesta dell'utente. Assicurati che il codice sia completo, funzionante e ben documentato.`;
    
    case 'MODIFY':
      return `${basePrompt}\n\nDevi modificare il codice esistente in base alla richiesta dell'utente. Mantieni la struttura generale e lo stile del codice originale, a meno che non sia specificamente richiesto di cambiarli.`;
    
    case 'EXPLAIN':
      return `${basePrompt}\n\nDevi spiegare in dettaglio come funziona il codice esistente. Poi fornisci il codice originale con commenti aggiuntivi che spiegano le parti più importanti.`;
    
    case 'DEBUG':
      return `${basePrompt}\n\nDevi identificare e correggere eventuali bug o problemi nel codice. Spiega quali sono i problemi e come li hai risolti.`;
    
    case 'OPTIMIZE':
      return `${basePrompt}\n\nDevi ottimizzare il codice esistente per migliorarne le prestazioni, la leggibilità o la manutenibilità. Spiega quali ottimizzazioni hai apportato e perché.`;
    
    case 'DOCUMENT':
      return `${basePrompt}\n\nDevi aggiungere documentazione completa al codice esistente, inclusi commenti, JSDoc/TSDoc dove appropriato, e migliorare i nomi delle variabili se necessario.`;
    
    default:
      return basePrompt;
  }
}

/**
 * Estrae il codice e la spiegazione dalla risposta dell'AI
 */
function parseCodeResponse(responseText: string, language: string): CodeResponse {
  // Regex per estrarre il blocco di codice
  const codeRegex = new RegExp(`\`\`\`(?:${language})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'i');
  const codeMatch = responseText.match(codeRegex);
  
  let code = '';
  let explanation = responseText;
  
  if (codeMatch && codeMatch[1]) {
    code = codeMatch[1].trim();
    
    // Rimuovi il blocco di codice dalla spiegazione
    explanation = responseText.replace(codeRegex, '').trim();
  }
  
  // Estrai eventuali suggerimenti (dopo il blocco di codice)
  const parts = explanation.split(/Suggerimenti:|Note aggiuntive:|Consigli:/i);
  const mainExplanation = parts[0].trim();
  const suggestions = parts.length > 1 ? 
    parts[1].trim().split('\n').filter(line => line.trim().length > 0) : 
    [];
  
  return {
    code,
    explanation: mainExplanation,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

/**
 * Analizza il codice esistente per fornire suggerimenti
 */
export async function analyzeCode(code: string, language: string): Promise<string[]> {
  try {
    const openai = getOpenAIClient();
    
    const systemPrompt = `
      Sei un esperto revisore di codice specializzato in ${language}.
      Analizza il codice fornito e identifica possibili miglioramenti, bug o problemi di sicurezza.
      Fornisci una lista di suggerimenti specifici e concreti.
      Sii conciso e diretto.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `\`\`\`${language}\n${code}\n\`\`\`` }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    const userId = sessionStorage.getItem('userId') || 'anonymous-user';
  await logAIRequest(
    userId,
    'code_completion',
    completion.usage?.total_tokens || 0,
    true
  );

    const responseText = completion.choices[0].message.content || '';
    
    // Estrai i suggerimenti come array
    return responseText
      .split(/\d+\.\s+/)
      .slice(1)
      .map(suggestion => suggestion.trim())
      .filter(suggestion => suggestion.length > 0);
    
  } catch (error) {
    console.error("Errore nell'analisi del codice:", error);
    return ["Non è stato possibile analizzare il codice a causa di un errore."];
  }
}

/**
 * Completa il codice mentre l'utente sta digitando
 */
export async function getCodeCompletion(
  code: string, 
  cursorPosition: number, 
  language: string
): Promise<string> {
  try {
    const openai = getOpenAIClient();
    
    // Dividi il codice in base alla posizione del cursore
    const beforeCursor = code.substring(0, cursorPosition);
    const afterCursor = code.substring(cursorPosition);
    
    const systemPrompt = `
      Sei un assistente di completamento del codice per ${language}.
      L'utente sta digitando del codice e il cursore è posizionato dove indicato da [CURSOR].
      Completa la linea o il blocco di codice corrente in modo naturale e utile.
      Fornisci solo il completamento, non ripetere il codice esistente.
      Mantieni lo stile e l'indentazione del codice esistente.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `\`\`\`${language}\n${beforeCursor}[CURSOR]${afterCursor}\n\`\`\`` 
        }
      ],
      temperature: 0.2,
      max_tokens: 100
    });

    const userId = sessionStorage.getItem('userId') || 'anonymous-user';
  await logAIRequest(
    userId,
    'code_completion',
    completion.usage?.total_tokens || 0,
    true
  );
    
    return completion.choices[0].message.content || '';
    
  } catch (error) {
    console.error("Errore nel completamento del codice:", error);
    return "";
  }
}

export default {
  processCodeRequest,
  analyzeCode,
  getCodeCompletion
};
