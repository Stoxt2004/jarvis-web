// src/lib/middleware/storageLimiterMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { ResourceLimiterService } from "@/lib/services/resourceLimiterService";

/**
 * Middleware che verifica se l'utente ha spazio disponibile per l'operazione richiesta
 * Da utilizzare nelle API route che gestiscono operazioni di storage
 */
export async function storageLimiterMiddleware(
  req: NextRequest, 
  additionalBytes: number = 0
) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }

    // Verifica se l'utente ha spazio disponibile
    const hasStorage = await ResourceLimiterService.canUseStorage(session.user.id, additionalBytes);
    
    if (!hasStorage) {
      return NextResponse.json(
        { 
          message: "Hai raggiunto il limite di storage per il tuo piano.",
          code: "STORAGE_LIMIT_EXCEEDED",
          type: "UPGRADE_REQUIRED"
        },
        { status: 507 } // 507 Insufficient Storage
      );
    }
    
    // Se tutto è ok, il middleware non blocca la richiesta
    return null;
  } catch (error) {
    console.error("Errore nel middleware storage limiter:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore nel controllo dei limiti di storage" },
      { status: 500 }
    );
  }
}