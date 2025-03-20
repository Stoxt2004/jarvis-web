// src/app/api/stripe/create-checkout-session/route.ts
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
    
    // Ottieni il priceId dal corpo della richiesta
    const { priceId } = await request.json();
    
    if (!priceId) {
      return NextResponse.json(
        { message: "ID prezzo mancante" },
        { status: 400 }
      );
    }
    
    // Cerca l'utente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "Utente non trovato" },
        { status: 404 }
      );
    }
    
    // Cerca direttamente la subscription (invece di usare include)
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    let customerId = subscription?.stripeCustomerId;
    
    // Se l'utente non ha un customerId Stripe, creane uno nuovo
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Crea o aggiorna la subscription
      if (subscription) {
        // Aggiorna existing subscription
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customerId },
        });
      } else {
        // Crea nuova subscription
        await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            plan: 'FREE',
            status: 'INACTIVE',
          },
        });
      }
    }
    
    // Crea una sessione checkout di Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });
    
    return NextResponse.json({ sessionId: checkoutSession.id }, { status: 200 });
  } catch (error) {
    console.error('Errore nella creazione della sessione checkout:', error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante la creazione della sessione di checkout" },
      { status: 500 }
    );
  }
}