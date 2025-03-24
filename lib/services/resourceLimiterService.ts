// src/lib/services/resourceLimiterService.ts
import { PlanType, getPlanLimits } from '@/lib/stripe/config';
import { prisma } from '@/lib/auth/prisma-adapter';

/**
 * Servizio per controllare e limitare l'utilizzo delle risorse in base al piano dell'utente
 */
export class ResourceLimiterService {
  /**
   * Verifica se l'utente ha raggiunto il limite di storage
   * @param userId ID dell'utente
   * @param additionalBytes Byte aggiuntivi da considerare nell'operazione corrente
   * @returns {Promise<boolean>} true se l'utente può utilizzare lo storage richiesto, false altrimenti
   */
  static async canUseStorage(userId: string, additionalBytes: number = 0): Promise<boolean> {
    try {
      // Recupera il piano dell'utente dal database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });
      
      if (!user) {
        throw new Error('Utente non trovato');
      }
      
      // Ottiene i limiti del piano
      const planLimits = getPlanLimits(user.plan as PlanType);
      
      // Se workspaces è -1, significa che è illimitato
      if (planLimits.storage === -1) {
        return true;
      }
      
      // Calcola lo spazio totale utilizzato in bytes
      const totalUsedBytes = await prisma.file.aggregate({
        where: {
          userId: userId,
          type: { not: 'folder' } // Escludiamo le cartelle dal calcolo
        },
        _sum: {
          size: true
        }
      });
      
      const usedBytes = totalUsedBytes._sum.size || 0;
      
      // Converti il limite in bytes (GB -> bytes)
      const limitBytes = planLimits.storage * 1024 * 1024 * 1024;
      
      // Verifica se l'utilizzo corrente più l'aggiunta supera il limite
      return (usedBytes + additionalBytes) <= limitBytes;
    } catch (error) {
      console.error('Errore nella verifica del limite di storage:', error);
      // In caso di errore, per sicurezza rifiuta l'operazione
      return false;
    }
  }

  /**
   * Verifica se l'utente ha raggiunto il limite di richieste AI
   * @param userId ID dell'utente
   * @returns {Promise<boolean>} true se l'utente può effettuare un'altra richiesta AI, false altrimenti
   */
  static async canMakeAIRequest(userId: string): Promise<boolean> {
    try {
      // Recupera il piano dell'utente dal database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });
      
      if (!user) {
        throw new Error('Utente non trovato');
      }
      
      // Ottiene i limiti del piano
      const planLimits = getPlanLimits(user.plan as PlanType);
      
      // Se aiRequests è -1, significa che è illimitato
      if (planLimits.aiRequests === -1) {
        return true;
      }
      
      // Ottiene la data di inizio del giorno corrente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Conta le richieste AI fatte oggi
      const requestsCount = await prisma.aIRequestLog.count({
        where: {
          userId: userId,
          createdAt: {
            gte: today
          }
        }
      });
      
      // Verifica se il numero di richieste è inferiore al limite
      return requestsCount < planLimits.aiRequests;
    } catch (error) {
      console.error('Errore nella verifica del limite di richieste AI:', error);
      // In caso di errore, per sicurezza rifiuta l'operazione
      return false;
    }
  }

  /**
   * Verifica se l'utente può creare un nuovo workspace
   * @param userId ID dell'utente
   * @returns {Promise<boolean>} true se l'utente può creare un nuovo workspace, false altrimenti
   */
  static async canCreateWorkspace(userId: string): Promise<boolean> {
    try {
      // Recupera il piano dell'utente dal database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });
      
      if (!user) {
        throw new Error('Utente non trovato');
      }
      
      // Ottiene i limiti del piano
      const planLimits = getPlanLimits(user.plan as PlanType);
      
      // Se workspaces è -1, significa che è illimitato
      if (planLimits.workspaces === -1) {
        return true;
      }
      
      // Conta i workspace dell'utente
      const workspaceCount = await prisma.workspace.count({
        where: {
          userId: userId
        }
      });
      
      // Verifica se il numero di workspace è inferiore al limite
      return workspaceCount < planLimits.workspaces;
    } catch (error) {
      console.error('Errore nella verifica del limite di workspace:', error);
      // In caso di errore, per sicurezza rifiuta l'operazione
      return false;
    }
  }

  /**
   * Verifica se l'utente può creare un nuovo pannello
   * @param userId ID dell'utente
   * @param currentPanelCount Numero attuale di pannelli
   * @returns {Promise<boolean>} true se l'utente può creare un nuovo pannello, false altrimenti
   */
  static async canCreatePanel(userId: string, currentPanelCount: number): Promise<boolean> {
    try {
      // Recupera il piano dell'utente dal database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });
      
      if (!user) {
        throw new Error('Utente non trovato');
      }
      
      // Il piano FREE è limitato a 3 pannelli
      if (user.plan === 'FREE') {
        return currentPanelCount < 3;
      }
      
      // Gli altri piani non hanno limiti sui pannelli
      return true;
    } catch (error) {
      console.error('Errore nella verifica del limite di pannelli:', error);
      // In caso di errore, per sicurezza rifiuta l'operazione
      return false;
    }
  }
}