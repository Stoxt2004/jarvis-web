// src/app/api/user/subscription/route.ts
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
      
      // Verifica che l'utente esista nel database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (!user) {
        return NextResponse.json(
          { message: "Utente non trovato nel database" },
          { status: 404 }
        );
      }
      
      // Ottieni l'abbonamento dell'utente
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });
      
      // Se l'utente non ha un abbonamento, restituisci un abbonamento predefinito
      if (!subscription) {
        // Invece di creare un record nel database, restituisci solo i dati
        return NextResponse.json({ 
          subscription: {
            plan: 'FREE',
            status: 'INACTIVE',
            userId: session.user.id
          } 
        }, { status: 200 });
      }
    
    // Verifica se l'abbonamento è scaduto
    if (
      subscription.status === 'ACTIVE' &&
      subscription.stripeCurrentPeriodEnd &&
      new Date(subscription.stripeCurrentPeriodEnd) < new Date()
    ) {
      // L'abbonamento è scaduto, ma Stripe non ha ancora inviato l'evento di aggiornamento
      // Questo è un controllo di sicurezza lato server
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
        },
      });
      
      subscription.status = 'PAST_DUE';
    }
    
    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error) {
    console.error("Errore nel recupero dell'abbonamento:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero dell'abbonamento" },
      { status: 500 }
    );
  }
}