// src/app/api/ai/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from '@/lib/auth/prisma-adapter';

export async function POST(request: NextRequest) {
  try {
    // Ottieni la sessione per verificare l'utente autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    
    // Ottieni i dati dalla richiesta
    const body = await request.json();
    const { type, tokenCount, successful } = body;
    
    // Usa l'ID utente dalla sessione per maggiore sicurezza
    const userId = session.user.id;
    
    console.log(`Logging AI request: ${type}, tokens: ${tokenCount}, userId: ${userId}`);
    
    // Crea il log nel database
    const logEntry = await prisma.aIRequestLog.create({
      data: {
        userId,
        type: type || 'generic_request',
        tokenCount: tokenCount || 0,
        successful: successful !== undefined ? successful : true
      }
    });
    
    console.log(`Log creato con successo, ID: ${logEntry.id}`);
    
    return NextResponse.json({ 
      success: true,
      message: "Log della richiesta AI registrato con successo",
      logId: logEntry.id
    });
  } catch (error) {
    console.error("Errore nel logging della richiesta AI:", error);
    return NextResponse.json(
      { error: "Errore nel logging della richiesta", details: String(error) },
      { status: 500 }
    );
  }
}