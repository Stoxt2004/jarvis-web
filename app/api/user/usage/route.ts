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
      select: { size: true, name: true } // Aggiungi name per il debug
    });
    
    // Calcola la dimensione totale in bytes
    const totalSizeInBytes = files.reduce((total, file) => total + (file.size || 0), 0);
    console.log('Dimensione totale in bytes:', totalSizeInBytes);
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
    
    console.log('Files trovati:', files.length);
    console.log('Files con dimensione:', files.filter(f => f.size && f.size > 0).length);
    // Ottieni i limiti del piano
    const userPlan = session.user.plan as 'FREE' | 'PREMIUM' | 'TEAM';
    const planLimits = getPlanLimits(userPlan);
    
    
    return NextResponse.json({
      storage: parseFloat(storageUsedGB.toFixed(2)),
      aiRequests: aiRequestsCount,
      workspaces: workspaces,
      
      storageLimit: planLimits.storage,
      aiRequestsLimit: planLimits.aiRequests,
      workspacesLimit: planLimits.workspaces,
      
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