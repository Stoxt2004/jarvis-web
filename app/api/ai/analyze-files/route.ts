// app/api/ai/analyze-files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { answerQuestion } from "@/lib/services/openaiService";
import { PlanType } from "@/lib/stripe/config";
import { incrementAndCheckAIRequests } from "@/app/api/ai/request-limiter";

// Funzione helper per verificare se il piano e lo stato consentono funzionalità avanzate
function hasAdvancedFeaturesAccess(plan: PlanType, subscriptionStatus?: string): boolean {
  if (plan === 'FREE') return false;
  
  // Verifica che l'abbonamento sia attivo se il piano è PREMIUM o TEAM
  const isActive = subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIALING';
  return (plan === 'PREMIUM' || plan === 'TEAM') && isActive;
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Estrai i dati dalla richiesta
    const data = await request.json();
    const { prompt } = data;
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt mancante" }, { status: 400 });
    }
    
    // Recupera lo stato dell'abbonamento dell'utente
    const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/subscription`, {
      headers: {
        Cookie: request.headers.get('cookie') || ''
      }
    });
    
    let hasAdvancedAccess = false;
    
    if (subscriptionResponse.ok) {
      const subData = await subscriptionResponse.json();
      const subscriptionStatus = subData.subscription?.status;
      const plan = (session.user.plan as PlanType) || 'FREE';
      
      // Verifica se l'utente ha accesso alle funzionalità avanzate
      hasAdvancedAccess = hasAdvancedFeaturesAccess(plan, subscriptionStatus);
    } else {
      // Fallback: usa solo il piano dalla sessione
      const plan = (session.user.plan as PlanType) || 'FREE';
      hasAdvancedAccess = plan === 'PREMIUM' || plan === 'TEAM';
    }
    
    // Se l'utente non ha accesso alle funzionalità avanzate, restituisci un errore
    if (!hasAdvancedAccess) {
      return NextResponse.json({ 
        error: "Funzionalità disponibile solo per abbonati Premium e Team",
        isPremiumFeature: true
      }, { status: 403 });
    }
    
    // Verifica e incrementa il contatore delle richieste AI
    const limitCheck = await incrementAndCheckAIRequests(session.user.id);
    
    // Se il limite è stato superato, non procedere con la richiesta
    if (!limitCheck.success) {
      return NextResponse.json({ 
        error: limitCheck.message,
        isLimitExceeded: true,
        currentCount: limitCheck.currentCount || 0,
        limit: limitCheck.limit || 0
      }, { status: 429 }); // 429 Too Many Requests
    }
    
    // Chiama OpenAI per l'analisi solo se tutti i controlli sono passati
    const result = await answerQuestion(prompt, session.user.id);
    
    return NextResponse.json({ 
      result,
      requestStats: {
        currentCount: limitCheck.currentCount || 0,
        limit: limitCheck.limit || 0,
        remaining: (limitCheck.limit || 0) - (limitCheck.currentCount || 0)
      }
    });
  } catch (error: any) {
    console.error("Errore nell'API analyze-files:", error);
    return NextResponse.json(
      { error: error.message || "Errore sconosciuto" },
      { status: 500 }
    );
  }
}