// app/api/ai/request-limiter.ts
// Versione aggiornata compatibile con useSubscription

import { prisma } from '@/lib/auth/prisma-adapter';
import { getPlanLimits, PlanType } from '@/lib/stripe/config';

/**
 * Risultato del controllo dei limiti di richieste AI
 */
interface RequestLimitCheck {
  currentCount: number;
  limit: number;
  isLimitExceeded: boolean;
  remaining: number;
}

/**
 * Risultato dell'incremento e controllo dei limiti di richieste AI
 */
interface RequestLimitCheckResult {
  success: boolean;
  message: string;
  currentCount?: number;
  limit?: number;
  error?: string;
}

/**
 * Verifica se esiste la funzionalità multi-file nel piano
 * Questa funzione utilizza advancedFeatures come segnalatore per le funzionalità avanzate
 */
export function hasMultiFileAnalysisFeature(plan: PlanType): boolean {
  // Nel tuo sistema, le funzionalità avanzate sono disponibili per i piani PREMIUM e TEAM
  // Verifichiamo in base alle limitazioni del piano
  const limits = getPlanLimits(plan);
  return limits.advancedFeatures === true;
}

/**
 * Verifica se l'utente ha superato il limite di richieste AI giornaliere
 * @param userId ID dell'utente
 * @returns Un oggetto con informazioni sui limiti e se sono stati superati
 */
export async function checkAIRequestLimits(userId: string): Promise<RequestLimitCheck> {
  try {
    // Recupera il piano dell'utente e lo stato dell'abbonamento
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        plan: true,
        subscription: {
          select: {
            status: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    // Determina i limiti in base al piano
    const plan = (user.plan as PlanType) || 'FREE';
    
    // Se l'abbonamento non è attivo e il piano non è FREE, usiamo i limiti del FREE
    const isSubscriptionActive = user.subscription?.status === 'ACTIVE' || user.subscription?.status === 'TRIALING';
    const effectivePlan = (plan !== 'FREE' && !isSubscriptionActive) ? 'FREE' : plan;
    
    const limits = getPlanLimits(effectivePlan);
    
    // Calcola l'inizio della giornata corrente
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Conta le richieste AI effettuate oggi
    const requestsCount = await prisma.aIRequestLog.count({
      where: {
        userId: userId,
        createdAt: {
          gte: today
        }
      }
    });
    
    // Verifica se il limite è stato superato
    const isLimitExceeded = requestsCount >= limits.aiRequests;
    
    return {
      currentCount: requestsCount,
      limit: limits.aiRequests,
      isLimitExceeded,
      remaining: Math.max(0, limits.aiRequests - requestsCount)
    };
  } catch (error) {
    console.error('Errore nella verifica dei limiti AI:', error);
    // In caso di errore, restituisci un valore di default che non blocca l'utente
    return {
      currentCount: 0,
      limit: 50, // Valore predefinito per il piano Free
      isLimitExceeded: false,
      remaining: 50
    };
  }
}

/**
 * Incrementa il contatore delle richieste AI e verifica se il limite è stato superato
 * @param userId ID dell'utente
 * @returns Risultato del controllo con informazioni sulla richiesta
 */
export async function incrementAndCheckAIRequests(userId: string): Promise<RequestLimitCheckResult> {
  try {
    // Verifica prima i limiti attuali
    const limits = await checkAIRequestLimits(userId);
    
    // Se il limite è già stato superato, impedisci ulteriori richieste
    if (limits.isLimitExceeded) {
      return {
        success: false,
        message: `Hai raggiunto il limite giornaliero di ${limits.limit} richieste AI per il tuo piano.`,
        currentCount: limits.currentCount,
        limit: limits.limit
      };
    }
    
    // Registra la nuova richiesta (questo incrementerà il conteggio)
    await prisma.aIRequestLog.create({
      data: {
        userId,
        type: 'request_check',
        tokenCount: 0,
        successful: true
      }
    });
    
    // L'incremento è avvenuto con successo, la richiesta può procedere
    return {
      success: true,
      message: `Richiesta approvata. Hai utilizzato ${limits.currentCount + 1} di ${limits.limit} richieste AI oggi.`,
      currentCount: limits.currentCount + 1,
      limit: limits.limit
    };
  } catch (error) {
    console.error('Errore nell\'incremento e verifica delle richieste AI:', error);
    
    // In caso di errore, consentiamo comunque la richiesta ma registriamo il problema
    return {
      success: true,
      message: 'Errore nella verifica dei limiti, richiesta consentita.',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}