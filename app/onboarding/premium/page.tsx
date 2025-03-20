// src/app/onboarding/premium/page.tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSubscription } from '@/hooks/useSubscription'
import PremiumOnboarding from '@/components/onboarding/PremiumOnboarding'

export default function PremiumOnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { subscription, isLoading } = useSubscription()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/onboarding/premium')
    }
  }, [status, router])
  
  // Redirect to dashboard if already premium
  useEffect(() => {
    if (!isLoading && subscription.isPremium) {
      router.push('/dashboard')
    }
  }, [subscription.isPremium, isLoading, router])
  
  // Loading state
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-primary border-primary/20 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return <PremiumOnboarding />
}