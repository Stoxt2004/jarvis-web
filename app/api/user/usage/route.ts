// src/app/api/user/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";
import { getPlanLimits } from "@/lib/stripe/config";

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Calcola lo spazio di archiviazione utilizzato dall'utente
    const files = await prisma.file.findMany({
      where: { 
        userId: session.user.id,
        type: { not: 'folder' } // Escludiamo le cartelle dal calcolo
      },
      select: { size: true }
    });
    
    // Calcola la dimensione totale in bytes
    const totalSizeInBytes = files.reduce((total, file) => total + (file.size || 0), 0);
    // Converti in GB
    const storageUsedGB = totalSizeInBytes / (1024 * 1024 * 1024);
    
    // Conta i workspace dell'utente
    const workspaces = await prisma.workspace.count({
      where: { userId: session.user.id }
    });
    
    // Ottieni il conteggio delle richieste AI dalle statistiche
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const aiRequestsCount = await prisma.aIRequestLog.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today
        }
      }
    });
    
    // Ottieni i limiti del piano - FIX: assicurati che il piano sia in maiuscolo
    let userPlan = session.user.plan as string || 'FREE';
    
    // Assicurati che userPlan sia in maiuscolo per evitare problemi di case sensitivity
    userPlan = userPlan.toUpperCase();
    
    // Aggiunta debugging per verificare che il piano sia corretto
    console.log(`Piano dell'utente (session): ${session.user.plan}`);
    console.log(`Piano dell'utente (normalizzato): ${userPlan}`);
    
    // Verifica che userPlan sia uno dei piani validi
    if (!['FREE', 'PREMIUM', 'TEAM'].includes(userPlan)) {
      console.warn(`Piano non valido: ${userPlan}, usando FREE come fallback`);
      userPlan = 'FREE';
    }
    
    const planLimits = getPlanLimits(userPlan as 'FREE' | 'PREMIUM' | 'TEAM');
    
    // Aggiungi i limiti ottenuti al log per debugging
    console.log('Limiti del piano:', planLimits);
    
    return NextResponse.json({
      // Valori correnti di utilizzo
      storage: parseFloat(storageUsedGB.toFixed(2)),
      aiRequests: aiRequestsCount,
      workspaces: workspaces,
      
      // Limiti del piano
      storageLimit: planLimits.storage,
      aiRequestsLimit: planLimits.aiRequests,
      workspacesLimit: planLimits.workspaces,
      
      // Piano corrente (per debugging)
      currentPlan: userPlan,
      
      // Percentuali di utilizzo
      storagePercentage: Math.min(100, (storageUsedGB / planLimits.storage) * 100),
      aiRequestsPercentage: Math.min(100, (aiRequestsCount / planLimits.aiRequests) * 100),
      workspacesPercentage: planLimits.workspaces > 0 
        ? Math.min(100, (workspaces / planLimits.workspaces) * 100)
        : 0
    });
  } catch (error) {
    console.error('Errore nel calcolo dell\'utilizzo:', error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}