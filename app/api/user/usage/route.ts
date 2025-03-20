// src/app/api/user/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";

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
    
    // In una implementazione reale, questi dati verrebbero calcolati in base all'uso effettivo
    // Qui simuliamo i dati di utilizzo
    
    // Ottieni il conteggio effettivo dei workspace
    const workspaces = await prisma.workspace.count({
      where: { userId: session.user.id },
    });
    
    // Calcola la dimensione totale dei file (in una implementazione reale)
    const files = await prisma.file.findMany({
      where: { userId: session.user.id },
      select: { size: true },
    });
    
    const storageUsed = files.reduce((total, file) => total + file.size, 0) / (1024 * 1024 * 1024); // Converti da bytes a GB
    
    // Per le richieste AI, in un'implementazione reale terremmo traccia di queste nel database
    // Qui simuliamo alcuni dati casuali
    const aiRequests = Math.floor(Math.random() * 30) + 5;
    
    return NextResponse.json(
      {
        storage: parseFloat(storageUsed.toFixed(1)),
        aiRequests,
        workspaces,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nel recupero dei dati di utilizzo:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero dei dati di utilizzo" },
      { status: 500 }
    );
  }
}