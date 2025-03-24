// src/app/dashboard/subscription/page.tsx
"use client"

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { FiArrowLeft, FiCreditCard, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'
import Link from 'next/link'
import EnhancedPlanComparison from '@/components/subscription/EnhancedPlanComparision'
import UsageLimitsNotifier from '@/components/premium/UsageLimitsNotifier'
import { redirectToCustomerPortal } from '@/lib/stripe/client';
import { useSubscription } from '@/hooks/useSubscription'; 
// Inside your component
const handleManageSubscription = async () => {
  try {
    await redirectToCustomerPortal();
  } catch (error) {
    console.error('Error during redirection to customer portal:', error);
    toast.error('An error occurred. Please try again later.');
  }
};

// In JSX
<button 
  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
  onClick={handleManageSubscription}
>
  Manage subscription
</button>
function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const { subscription } = useSubscription();

  // Modern 2025 colors (same as HomeClient)
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

  // Show success/error toast based on URL parameters
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      toast.success('Subscription successfully activated!')
    }
    if (searchParams?.get('canceled') === 'true') {
      toast.info('The subscription process has been canceled')
    }
    if (searchParams?.get('error')) {
      toast.error(`An error occurred: ${searchParams.get('error')}`)
    }
  }, [searchParams])

  // Loading state
  if (status === 'loading') {
    return (
      <Suspense fallback={<div>Loading form...</div>}>
      <div className="flex items-center justify-center h-screen" style={{ background: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<div>Loading form...</div>}>
    <div className="min-h-screen" style={{ background: colors.background, color: colors.text }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <FiArrowLeft className="w-5 h-5" style={{ color: colors.textMuted }} />
            </Link>
            <h1 className="text-2xl font-bold">Subscription</h1>
          </div>
          
          <Link
            href="#"
            onClick={handleManageSubscription}
            className="flex items-center space-x-1 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <FiCreditCard className="w-4 h-4" />
            <span>Billing management</span>
          </Link>
        </div>
        
        {/* Usage limits notification */}
        <div className="mb-8 rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <UsageLimitsNotifier />
        </div>
        
        {/* Subscription status */}
        <div className="mb-8 rounded-xl p-6" 
          style={{ 
            background: `linear-gradient(to right, ${colors.navy}, ${colors.primary})` 
          }}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Your current plan</h2>
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-green-400" />
                <span className="font-semibold text-lg">
                  {/* Dynamically use subscription type */}
                  {subscription.plan === 'PREMIUM' ? 'Premium' : 
                        subscription.plan === 'TEAM' ? 'Team' : 'Free'} Plan
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                {/* Conditional text based on plan */}
                {subscription.isActive && (subscription.plan === 'PREMIUM' || subscription.plan === 'TEAM') ?
                  `You are using the ${subscription.plan.toLowerCase()} plan with all features.` :
                  'You are using the free plan with limited features.'}
              </p>
            </div>
            
            {/* Show button only if not an active premium plan */}
            {(!subscription.isActive || subscription.plan === 'FREE') && (
              <button
                className="mt-4 md:mt-0 px-6 py-3 rounded-lg font-medium"
                style={{ background: colors.accent }}
                onClick={() => router.push('#pricing')}
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>
        
        {/* Plan comparison */}
        <div className="rounded-xl p-6" style={{ background: colors.surface }}>
          <h2 className="text-xl font-semibold mb-6">Plan Comparison</h2>
          <EnhancedPlanComparison />
        </div>
        
        {/* FAQ */}
        <div className="mt-8 rounded-xl p-6" style={{ background: colors.surface }}>
          <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">How can I upgrade to a higher plan?</h3>
              <p style={{ color: colors.textMuted }}>
                You can upgrade at any time by clicking the "Upgrade to Premium" button and following the payment instructions.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Can I cancel my subscription?</h3>
              <p style={{ color: colors.textMuted }}>
                Yes, you can cancel your subscription at any time from the Billing section. The subscription will remain active until the end of the billing period.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p style={{ color: colors.textMuted }}>
                We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Suspense>
  )
}

export default function SubscriptionPage() {
  return (
    <div className="min-h-full flex flex-col">
      <Suspense fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <FiLoader className="w-10 h-10 mx-auto animate-spin text-primary" />
            <p className="mt-4">Loading subscription page...</p>
          </div>
        </div>
      }>
        <SubscriptionContent />
      </Suspense>
    </div>
  );
}