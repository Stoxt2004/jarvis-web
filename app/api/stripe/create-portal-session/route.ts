// src/app/api/stripe/create-portal-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { stripe } from "@/lib/stripe/config";
import { prisma } from "@/lib/auth/prisma-adapter";

export async function POST(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }
    
    // Ottieni l'abbonamento dell'utente
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { message: "Nessun abbonamento trovato" },
        { status: 404 }
      );
    }
    
    // Crea una sessione del portale Stripe
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
    });
    
    return NextResponse.json({ url: portalSession.url }, { status: 200 });
  } catch (error) {
    console.error('Errore nella creazione della sessione del portale:', error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante la creazione della sessione del portale" },
      { status: 500 }
    );
  }
}