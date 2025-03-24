// src/lib/middleware/aiRateLimiterMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { ResourceLimiterService } from "@/lib/services/resourceLimiterService";

/**
 * Middleware che verifica se l'utente ha superato il limite giornaliero di richieste AI
 * Da utilizzare nelle API route che gestiscono richieste AI
 */
export async function aiRateLimiterMiddleware(req: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }

    // Verifica se l'utente può effettuare un'altra richiesta AI
    const canMakeRequest = await ResourceLimiterService.canMakeAIRequest(session.user.id);
    
    if (!canMakeRequest) {
      return NextResponse.json(
        { 
          message: "Hai raggiunto il limite giornaliero di richieste AI per il tuo piano.",
          code: "AI_LIMIT_EXCEEDED",
          type: "UPGRADE_REQUIRED"
        },
        { status: 429 } // 429 Too Many Requests
      );
    }
    
    // Se tutto è ok, il middleware non blocca la richiesta
    return null;
  } catch (error) {
    console.error("Errore nel middleware AI rate limiter:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore nel controllo dei limiti" },
      { status: 500 }
    );
  }
}