// src/app/api/files/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";
import { getPlanLimits } from "@/lib/stripe/config";

/**
 * GET: Recupera l'utilizzo dello storage dell'utente
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }

    // Calcola lo spazio totale utilizzato (in bytes)
    const usageInBytes = await FileStorageService.getUserStorageUsage(session.user.id);
    
    // Converti in GB per maggiore leggibilità
    const usageInGB = usageInBytes / (1024 * 1024 * 1024);
    
    // Ottieni il limite del piano corrente
    const planLimits = getPlanLimits(session.user.plan as any);
    const storageLimit = planLimits.storage; // in GB
    
    // Calcola la percentuale di utilizzo
    const usagePercentage = (usageInGB / storageLimit) * 100;
    
    return NextResponse.json({
      usage: usageInBytes,
      usageInGB: parseFloat(usageInGB.toFixed(2)),
      limit: storageLimit * 1024 * 1024 * 1024, // limite in bytes
      limitInGB: storageLimit,
      percentage: parseFloat(usagePercentage.toFixed(2)),
    });
  } catch (error) {
    console.error("Errore durante il recupero dell'utilizzo dello storage:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero dell'utilizzo dello storage" },
      { status: 500 }
    );
  }
}