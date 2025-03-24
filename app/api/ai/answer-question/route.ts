// src/app/api/ai/answer-question/route.ts
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

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Ottieni i dati dalla richiesta
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: "Domanda mancante" }, { status: 400 });
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

    // Inizializza OpenAI
    const openai = getOpenAIClient();
    
    // Prepara il prompt di sistema
    const systemPrompt = `
      You are Jarvis, an AI assistant integrated into a web operating system.
You are friendly, helpful, and concise. Answer the user's questions informatively.
If you don’t know the answer, honestly admit it.
Try to keep responses under 150 words whenever possible.
    `;
    
    // Crea la richiesta a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    // Registra la richiesta AI
    await prisma.aIRequestLog.create({
      data: {
        userId: session.user.id,
        type: "chat_completion",
        tokenCount: completion.usage?.total_tokens || 0,
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

    // Restituisci la risposta
    return NextResponse.json({ 
      response: completion.choices[0].message.content || "Mi dispiace, non sono riuscito a generare una risposta.",
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