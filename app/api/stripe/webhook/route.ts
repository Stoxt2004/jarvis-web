// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { prisma } from "@/lib/auth/prisma-adapter";
import Stripe from "stripe";

// Rimuovi questa riga
// export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";
    
    let event: Stripe.Event;
    
    try {
      // Usa constructEvent invece di constructEventAsync
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (error) {
      console.error("Errore nella verifica della firma webhook:", error);
      return NextResponse.json(
        { message: "Errore nella verifica webhook" },
        { status: 400 }
      );
    }
    
    // Gestione degli eventi Stripe
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        
        // Verifica che si tratti di un abbonamento
        if (checkoutSession.mode !== "subscription") {
          break;
        }
        
        // Ottieni il customerId e il subscriptionId
        const { customer: customerId, subscription: subscriptionId } = checkoutSession;
        
        if (typeof customerId !== "string" || typeof subscriptionId !== "string") {
          console.error("customerId o subscriptionId mancanti nella sessione di checkout");
          break;
        }
        
        // Ottieni i dettagli dell'abbonamento
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        
        // Determina il piano in base al priceId
        let plan: 'FREE' | 'PREMIUM' | 'TEAM' = 'FREE';
        
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
          plan = 'PREMIUM';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID) {
          plan = 'TEAM';
        }
        
        // Aggiorna l'abbonamento nel database
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            plan,
            status: 'ACTIVE',
          },
        });
        
        // Aggiorna il piano dell'utente
        await prisma.user.updateMany({
          where: { 
            id: {
              in: (await prisma.subscription.findMany({
                where: { stripeCustomerId: customerId },
                select: { userId: true }
              })).map(sub => sub.userId)
            }
          },
          data: { plan },
        });
        
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Verifica che si tratti di un abbonamento
        if (!invoice.subscription) {
          break;
        }
        
        // Ottieni il customerId e il subscriptionId
        const { customer: customerId, subscription: subscriptionId } = invoice;
        
        if (typeof customerId !== "string" || typeof subscriptionId !== "string") {
          console.error("customerId o subscriptionId mancanti nell'invoice");
          break;
        }
        
        // Ottieni i dettagli dell'abbonamento
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Aggiorna la data di fine periodo nel database
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: 'ACTIVE',
          },
        });
        
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Ottieni il customerId e il subscriptionId
        const { customer: customerId, id: subscriptionId } = subscription;
        
        if (typeof customerId !== "string") {
          console.error("customerId mancante nell'evento subscription.updated");
          break;
        }
        
        // Determina il nuovo stato dell'abbonamento
        let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INACTIVE';
        
        switch (subscription.status) {
          case "active":
            status = 'ACTIVE';
            break;
          case "past_due":
            status = 'PAST_DUE';
            break;
          case "canceled":
            status = 'CANCELED';
            break;
          case "trialing":
            status = 'TRIALING';
            break;
          default:
            status = 'INACTIVE';
        }
        
        // Ottieni il priceId
        const priceId = subscription.items.data[0].price.id;
        
        // Determina il piano in base al priceId
        let plan: 'FREE' | 'PREMIUM' | 'TEAM' = 'FREE';
        
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
          plan = 'PREMIUM';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID) {
          plan = 'TEAM';
        }
        
        // Aggiorna l'abbonamento nel database
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: typeof customerId === "string" ? customerId : undefined },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status,
            plan,
          },
        });
        
        // Aggiorna il piano dell'utente
        await prisma.user.updateMany({
          where: { 
            id: {
              in: (await prisma.subscription.findMany({
                where: { stripeCustomerId: typeof customerId === "string" ? customerId : undefined },
                select: { userId: true }
              })).map(sub => sub.userId)
            }
          },
          data: { plan },
        });
        
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Ottieni il customerId
        const { customer: customerId } = subscription;
        
        if (typeof customerId !== "string") {
          console.error("customerId mancante nell'evento subscription.deleted");
          break;
        }
        
        // Aggiorna l'abbonamento nel database
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            status: 'CANCELED',
            plan: 'FREE',
          },
        });
        
        // Aggiorna il piano dell'utente
        await prisma.user.updateMany({
          where: { 
            id: {
              in: (await prisma.subscription.findMany({
                where: { stripeCustomerId: customerId },
                select: { userId: true }
              })).map(sub => sub.userId)
            }
          },
          data: { plan: 'FREE' },
        });
        
        break;
      }
    }
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Errore nel webhook Stripe:", error);
    return NextResponse.json(
      { message: "Errore interno del server" },
      { status: 500 }
    );
  }
}