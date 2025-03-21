// src/app/dashboard/subscription/page.tsx
"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { FiArrowLeft, FiCreditCard, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import Link from 'next/link'
import EnhancedPlanComparison from '@/components/subscription/EnhancedPlanComparision'
import UsageLimitsNotifier from '@/components/premium/UsageLimitsNotifier'
import { redirectToCustomerPortal } from '@/lib/stripe/client';

// All'interno del tuo componente
const handleManageSubscription = async () => {
  try {
    await redirectToCustomerPortal();
  } catch (error) {
    console.error('Errore durante il reindirizzamento al portale clienti:', error);
    toast.error('Si è verificato un errore. Riprova più tardi.');
  }
};

// Nel JSX
<button 
  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
  onClick={handleManageSubscription}
>
  Gestisci abbonamento
</button>
export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  // Colori moderni 2025 (stessi di HomeClient)
  const colors = {
    primary: "#A47864", // Mocha Mousse (Pantone 2025)
    secondary: "#A78BFA", // Digital Lavender
    accent: "#4CAF50", // Verdant Green
    navy: "#101585", // Navy Blue
    rose: "#D58D8D", // Muted Rose
    background: "#0F0F1A", // Dark background
    surface: "#1A1A2E", // Slightly lighter surface
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/dashboard/subscription')
    }
  }, [status, router])

  // Mostra toast di successo/errore basati sui parametri URL
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      toast.success('Abbonamento attivato con successo!')
    }
    if (searchParams?.get('canceled') === 'true') {
      toast.info('Il processo di abbonamento è stato annullato')
    }
    if (searchParams?.get('error')) {
      toast.error(`Si è verificato un errore: ${searchParams.get('error')}`)
    }
  }, [searchParams])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: colors.background, color: colors.text }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Intestazione */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <FiArrowLeft className="w-5 h-5" style={{ color: colors.textMuted }} />
            </Link>
            <h1 className="text-2xl font-bold">Abbonamento</h1>
          </div>
          
          <Link
            href="#"
            onClick={handleManageSubscription}
            className="flex items-center space-x-1 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <FiCreditCard className="w-4 h-4" />
            <span>Gestione fatturazione</span>
          </Link>
        </div>
        
        {/* Notifica limiti di utilizzo */}
        <div className="mb-8 rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <UsageLimitsNotifier />
        </div>
        
        {/* Status abbonamento */}
        <div className="mb-8 rounded-xl p-6" 
          style={{ 
            background: `linear-gradient(to right, ${colors.navy}, ${colors.primary})` 
          }}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Il tuo piano attuale</h2>
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-green-400" />
                <span className="font-semibold text-lg">Piano Free</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                Stai utilizzando il piano gratuito con funzionalità limitate.
              </p>
            </div>
            
            <button
              className="mt-4 md:mt-0 px-6 py-3 rounded-lg font-medium"
              style={{ background: colors.accent }}
            >
              Passa a Premium
            </button>
          </div>
        </div>
        
        {/* Confronto piani */}
        <div className="rounded-xl p-6" style={{ background: colors.surface }}>
          <h2 className="text-xl font-semibold mb-6">Confronto piani</h2>
          <EnhancedPlanComparison />
        </div>
        
        {/* FAQ */}
        <div className="mt-8 rounded-xl p-6" style={{ background: colors.surface }}>
          <h2 className="text-xl font-semibold mb-6">Domande frequenti</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Come posso passare a un piano superiore?</h3>
              <p style={{ color: colors.textMuted }}>
                Puoi effettuare l'upgrade in qualsiasi momento cliccando sul pulsante "Passa a Premium" e seguendo le istruzioni di pagamento.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Posso annullare il mio abbonamento?</h3>
              <p style={{ color: colors.textMuted }}>
                Sì, puoi annullare il tuo abbonamento in qualsiasi momento dalla sezione Fatturazione. L'abbonamento rimarrà attivo fino alla fine del periodo di fatturazione.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Quali metodi di pagamento accettate?</h3>
              <p style={{ color: colors.textMuted }}>
                Accettiamo tutte le principali carte di credito (Visa, Mastercard, American Express) e PayPal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
