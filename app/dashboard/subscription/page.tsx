// src/app/dashboard/subscription/page.tsx
"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import EnhancedPlanComparison from '@/components/subscription/EnhancedPlanComparision'
import UsageLimitsNotifier from '@/components/premium/UsageLimitsNotifier'

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-primary border-primary/20 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  // Sostituiamo la vecchia pagina di abbonamento con il componente migliorato
  return (
    <>
      <EnhancedPlanComparison />
      <UsageLimitsNotifier />
    </>
  )
}