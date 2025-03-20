// src/lib/stripe/client.ts
import { loadStripe } from '@stripe/stripe-js';

// Singleton per l'istanza di Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

// Funzione per reindirizzare a Stripe Checkout
export async function redirectToCheckout(priceId: string) {
  try {
    const stripe = await getStripe();
    
    // Chiamata all'API per creare una sessione Checkout
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Errore nella richiesta di checkout');
    }
    
    const { sessionId } = await response.json();
    
    // Reindirizza a Stripe Checkout
    const result = await stripe?.redirectToCheckout({
      sessionId,
    });
    
    if (result?.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Errore durante il checkout:', error);
    throw error;
  }
}

// Funzione per reindirizzare a Stripe Customer Portal
export async function redirectToCustomerPortal() {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Errore nella richiesta portal');
    }
    
    const { url } = await response.json();
    
    // Reindirizza al Customer Portal di Stripe
    window.location.href = url;
  } catch (error) {
    console.error('Errore durante l\'accesso al portale:', error);
    throw error;
  }
}