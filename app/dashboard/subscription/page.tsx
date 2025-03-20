// src/app/dashboard/subscription/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSubscription } from '@/hooks/useSubscription'
import { PLANS } from '@/lib/stripe/config'
import { redirectToCheckout, redirectToCustomerPortal } from '@/lib/stripe/client'
import { FiCheck, FiX, FiArrowLeft, FiAlertCircle, FiCreditCard, FiLoader, FiExternalLink } from 'react-icons/fi'
import { toast } from 'sonner'

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { subscription, isLoading, hasAccess } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PREMIUM' | 'TEAM' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Controlla i parametri dell'URL per i messaggi di successo/errore
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      toast.success('Abbonamento attivato con successo!')
    }
    
    if (searchParams?.get('canceled') === 'true') {
      toast.info('Il processo di abbonamento è stato annullato')
    }
  }, [searchParams])
  
  // Aggiorna la selezione del piano in base all'abbonamento attuale
  useEffect(() => {
    if (!isLoading && subscription.plan) {
      // Assicurati che il piano sia di tipo corretto
      const planKey = subscription.plan as 'FREE' | 'PREMIUM' | 'TEAM'
      setSelectedPlan(planKey)
    }
  }, [isLoading, subscription])
  
  // Gestisce l'upgrade/downgrade dell'abbonamento
  const handleSubscribe = async (plan: 'FREE' | 'PREMIUM' | 'TEAM') => {
    // Se è già abbonato a questo piano, non fare nulla
    if (subscription.plan === plan && subscription.isActive) {
      toast.info(`Sei già abbonato al piano ${PLANS[plan].name}`)
      return
    }
    
    // Se sta passando al piano gratuito, indirizza al portale clienti
    if (plan === 'FREE' && subscription.plan !== 'FREE') {
      await handleManageSubscription()
      return
    }
    
    // Altrimenti, procedi con l'abbonamento
    setIsProcessing(true)
    
    try {
      const priceId = PLANS[plan].stripePriceId
      
      if (!priceId) {
        throw new Error(`ID prezzo non disponibile per il piano ${plan}`)
      }
      
      await redirectToCheckout(priceId)
    } catch (error) {
      console.error('Errore durante la sottoscrizione:', error)
      toast.error('Si è verificato un errore durante la sottoscrizione')
      setIsProcessing(false)
    }
  }
  
  // Gestisce l'accesso al portale clienti Stripe
  const handleManageSubscription = async () => {
    setIsProcessing(true)
    
    try {
      await redirectToCustomerPortal()
    } catch (error) {
      console.error('Errore durante l\'accesso al portale clienti:', error)
      toast.error('Si è verificato un errore durante l\'accesso al portale clienti')
      setIsProcessing(false)
    }
  }
  
  // Calcola la data di fine del periodo di fatturazione
  const getBillingEndDate = () => {
    if (!subscription.currentPeriodEnd) return null
    
    return new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Stato dell'abbonamento in formato leggibile
  const getStatusLabel = () => {
    switch (subscription.status) {
      case 'ACTIVE':
        return { label: 'Attivo', color: 'text-green-500' }
      case 'TRIALING':
        return { label: 'In prova', color: 'text-blue-500' }
      case 'PAST_DUE':
        return { label: 'Pagamento in ritardo', color: 'text-yellow-500' }
      case 'CANCELED':
        return { label: 'Cancellato', color: 'text-red-500' }
      default:
        return { label: 'Inattivo', color: 'text-white/50' }
    }
  }
  
  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Intestazione */}
        <div className="mb-6 flex items-center">
          <Link
            href="/dashboard"
            className="mr-4 p-2 rounded-full hover:bg-white/10"
          >
            <FiArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Gestione abbonamento</h1>
        </div>
        
        {/* Stato abbonamento corrente */}
        {!isLoading && (
          <div className="glass-panel p-6 rounded-lg mb-8">
            <h2 className="text-lg font-medium mb-4">Il tuo abbonamento</h2>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">
                    Piano {PLANS[subscription.plan].name}
                  </h3>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusLabel().color} bg-white/5`}>
                    {getStatusLabel().label}
                  </span>
                </div>
                
                {subscription.currentPeriodEnd && subscription.isActive && (
                  <p className="text-white/70 mt-1">
                    Il tuo abbonamento si rinnoverà il {getBillingEndDate()}
                  </p>
                )}
                
                {subscription.status === 'PAST_DUE' && (
                  <div className="mt-2 text-yellow-500 flex items-center gap-2">
                    <FiAlertCircle />
                    <span>Problema con il pagamento. Aggiorna il metodo di pagamento.</span>
                  </div>
                )}
              </div>
              
              {(subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE') && (
                <button
                  className="px-4 py-2 rounded-md bg-surface hover:bg-surface-light transition-colors flex items-center gap-2"
                  onClick={handleManageSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiCreditCard />
                  )}
                  <span>Gestisci fatturazione</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Piani disponibili */}
        <div>
          <h2 className="text-xl font-bold mb-6">Piani disponibili</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(PLANS).map(([planKey, plan]) => (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-panel p-6 rounded-lg flex flex-col ${
                  subscription.plan === planKey && subscription.isActive
                    ? 'border border-primary'
                    : ''
                }`}
              >
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                
                {plan.monthlyPrice ? (
                  <div className="text-2xl font-bold mb-4">
                    €{plan.monthlyPrice}
                    <span className="text-white/50 text-sm font-normal">/mese</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold mb-4">Gratuito</div>
                )}
                
                <p className="text-white/70 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-primary mr-2 mt-0.5">
                        <FiCheck />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`w-full py-2 rounded-md flex items-center justify-center gap-2 ${
                    subscription.plan === planKey && subscription.isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                  onClick={() => handleSubscribe(planKey as 'FREE' | 'PREMIUM' | 'TEAM')}
                  disabled={
                    isProcessing || 
                    (subscription.plan === planKey && subscription.isActive)
                  }
                >
                  {isProcessing && selectedPlan === planKey ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Elaborazione...</span>
                    </>
                  ) : subscription.plan === planKey && subscription.isActive ? (
                    <span>Piano attuale</span>
                  ) : (
                    <span>
                      {planKey === 'FREE' ? 'Scegli piano' : 'Abbonati ora'}
                    </span>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Informazioni di fatturazione */}
        <div className="mt-12 glass-panel p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Informazioni di fatturazione</h2>
          
          <p className="text-white/70 mb-4">
            Tutti gli abbonamenti vengono gestiti attraverso Stripe, un processore di pagamenti sicuro. 
            Puoi cambiare o cancellare il tuo abbonamento in qualsiasi momento.
          </p>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <button
              className="px-4 py-2 rounded-md bg-surface hover:bg-surface-light transition-colors flex items-center gap-2"
              onClick={handleManageSubscription}
              disabled={isProcessing || subscription.status === 'INACTIVE'}
            >
              <FiCreditCard />
              <span>Gestisci metodo di pagamento</span>
            </button>
            
            <a
              href="https://stripe.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <span>Informativa sulla privacy di Stripe</span>
              <FiExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}