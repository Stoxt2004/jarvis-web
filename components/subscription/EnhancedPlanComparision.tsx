import React, { useState } from 'react';
import { FiArrowRight, FiCheck, FiInfo, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/stripe/config';
import { redirectToCheckout } from '@/lib/stripe/client';

export default function EnhancedPlanComparison() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState('');
  
  // Calculate the billing period and related prices
  const billingPeriod = isYearly ? 'year' : 'month';
  const discount = 20; // 20% discount for annual payment
  
  // Calculate discounted prices for annual payment
  const getPlanPrice = (basePrice: number, isYearly: boolean): number => {
    if (!basePrice) return 0;
    if (!isYearly) return basePrice;
    
    const yearlyPrice = (basePrice * 12) * (1 - discount / 100);
    return parseFloat((yearlyPrice / 12).toFixed(2));
  };
  
  // Configure advanced comparison features
  const featureGroups = [
    {
      name: 'Basic Features',
      features: [
        { 
          id: 'editor', 
          name: 'Code Editor',
          free: 'Basic',
          premium: 'Advanced with IntelliSense',
          team: 'Fully Extended',
          info: 'The premium editor includes code completion, refactoring, debugging, and other advanced features'
        },
        { 
          id: 'workspace', 
          name: 'Workspace',
          free: '1 workspace',
          premium: 'Unlimited',
          team: 'Unlimited',
          info: 'Workspaces allow you to separate and organize your projects'
        },
        { 
          id: 'storage', 
          name: 'Storage Space',
          free: '1 GB',
          premium: '10 GB',
          team: '25 GB',
          info: 'Cloud space to store your files, projects, and resources'
        },
        { 
          id: 'ai-usage', 
          name: 'AI Requests',
          free: '50/day',
          premium: '500/day',
          team: '2000/day',
          info: 'Number of AI requests for code generation, assistance, and other features'
        }
      ]
    },
    {
      name: 'AI Assistant',
      features: [
        { 
          id: 'ai-basic', 
          name: 'Basic Assistance',
          free: true,
          premium: true,
          team: true,
          info: 'Answers to questions, support for file search, and basic features'
        },
        { 
          id: 'ai-code', 
          name: 'Code Generation',
          free: 'Limited',
          premium: 'Advanced',
          team: 'Advanced',
          info: 'Generates code snippets, complete functions, and helps solve complex problems'
        },
        { 
          id: 'ai-custom', 
          name: 'AI Customization',
          free: false,
          premium: true,
          team: true,
          info: 'Customize the AI assistant behavior based on your preferences'
        },
        { 
          id: 'ai-context', 
          name: 'Context Awareness',
          free: false,
          premium: true,
          team: true,
          info: 'The AI understands the context of your project and provides targeted assistance'
        }
      ]
    },
    {
      name: 'Collaboration',
      features: [
        { 
          id: 'share-readonly', 
          name: 'Read-only Sharing',
          free: true,
          premium: true,
          team: true,
          info: 'Share files and resources in read-only mode with other users'
        },
        { 
          id: 'real-time', 
          name: 'Real-time Editing',
          free: false,
          premium: false,
          team: true,
          info: 'Collaborate in real-time with other team members on the same document'
        },
        { 
          id: 'comments', 
          name: 'Comments and Reviews',
          free: false,
          premium: true,
          team: true,
          info: 'Add comments, suggestions, and reviews to shared documents'
        },
        { 
          id: 'team-management', 
          name: 'Team Management',
          free: false,
          premium: false,
          team: true,
          info: 'Manage team members, assign roles and permissions'
        }
      ]
    },
    {
      name: 'Support and Security',
      features: [
        { 
          id: 'support', 
          name: 'Customer Support',
          free: 'Community',
          premium: 'Priority',
          team: '24/7 Dedicated',
          info: 'Access to different levels of technical support based on your plan'
        },
        { 
          id: 'backup', 
          name: 'Automatic Backups',
          free: 'Daily',
          premium: 'Every 6 hours',
          team: 'Hourly',
          info: 'Frequency of automatic backups of your data and projects'
        },
        { 
          id: 'version-history', 
          name: 'Version History',
          free: '7 days',
          premium: '90 days',
          team: 'Unlimited',
          info: 'Retention period for version history of your files'
        },
        { 
          id: 'advanced-security', 
          name: 'Advanced Security',
          free: false,
          premium: true,
          team: true,
          info: 'Advanced security features such as two-factor authentication and access controls'
        }
      ]
    }
  ];
  
  // Handles the subscription process
  const handleSubscribe = async (plan: string) => {
    if (subscription.plan === plan && subscription.isActive) {
      return; // Already subscribed to this plan
    }
    
    setIsLoading(true);
    
    try {
      const priceId = PLANS[plan].stripePriceId;
      if (!priceId) {
        throw new Error(`Price ID not available for plan ${plan}`);
      }
      
      await redirectToCheckout(priceId);
    } catch (error) {
      console.error('Error during subscription:', error);
      setIsLoading(false);
    }
  };
  
  // Renders the value of a feature based on type
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? 
        <FiCheck className="text-green-500" size={18} /> : 
        <FiX className="text-red-400" size={18} />;
    }
    
    return <span>{value}</span>;
  };
  
  // Animations for feature hover
  const featureInfoAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.2 }
  };
  
  // Function to check if a plan is disabled (Premium and Team are disabled)
  const isPlanDisabled = (planKey: string) => {
    return planKey === 'PREMIUM' || planKey === 'TEAM';
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Toggle for annual/monthly billing */}
      <div className="mb-8 flex justify-center">
        <div className="bg-surface-dark rounded-lg p-1 flex items-center">
          <button
            className={`px-4 py-2 rounded-md ${!isYearly ? 'bg-primary text-white' : 'text-white/70'}`}
            onClick={() => setIsYearly(false)}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md ${isYearly ? 'bg-primary text-white' : 'text-white/70'}`}
            onClick={() => setIsYearly(true)}
          >
            Annual <span className="text-xs ml-1 text-green-400">-{discount}%</span>
          </button>
        </div>
      </div>
      
      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {Object.entries(PLANS).map(([planKey, plan]) => {
          const price = getPlanPrice(plan.monthlyPrice || 0, isYearly);
          const isCurrentPlan = subscription.plan === planKey && subscription.isActive;
          const isPopular = planKey === 'PREMIUM';
          const planDisabled = isPlanDisabled(planKey);
          
          return (
            <motion.div
              key={planKey}
              className={`glass-panel p-6 rounded-lg flex flex-col relative ${
                isPopular ? 'border-2 border-primary ring-1 ring-primary/30' : ''
              } ${planDisabled ? 'opacity-80' : ''}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: planKey === 'FREE' ? 0 : planKey === 'PREMIUM' ? 0.1 : 0.2 }}
            >
              {/* Add red X for disabled plans */}
              {planDisabled && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <FiX className="text-red-500" size={48} />
                </div>
              )}
              
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-medium">
                  Most popular
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              
              {price > 0 ? (
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold">€{price}</span>
                  <span className="text-white/50 ml-1 text-sm">/{billingPeriod}</span>
                </div>
              ) : (
                <div className="text-3xl font-bold mb-4">Free</div>
              )}
              
              <p className="text-white/70 mb-6">{plan.description}</p>
              
              <div className="flex-1">
                <div className="space-y-4 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <span className="text-primary mr-2 mt-0.5"><FiCheck /></span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-primary/20 text-primary'
                    : isPopular
                      ? 'bg-primary hover:bg-primary-dark text-white'
                      : planKey === 'FREE'
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-primary/20 hover:bg-primary/30 text-primary'
                } ${planDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (!planDisabled) {
                    isPopular ? handleSubscribe(planKey) : router.push('/dashboard/subscription');
                  }
                }}
                disabled={isLoading || isCurrentPlan || planDisabled}
              >
                {isLoading && planKey === 'PREMIUM' && !planDisabled ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </span>
                ) : isCurrentPlan ? (
                  <span>Current plan</span>
                ) : planKey === 'FREE' ? (
                  <span>Basic plan</span>
                ) : planDisabled ? (
                  <span>Currently unavailable</span>
                ) : (
                  <span className="flex items-center gap-1">
                    {isPopular ? 'Get started' : 'Learn more'}
                    <FiArrowRight size={16} />
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
      
      {/* Detailed comparison table */}
      <div className="glass-panel p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-6 text-center">Detailed Plan Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 text-left w-1/4">Feature</th>
                <th className="py-4 px-4 text-center">Free</th>
                <th className="py-4 px-4 text-center bg-primary/5">Premium</th>
                <th className="py-4 px-4 text-center">Team</th>
              </tr>
            </thead>
            <tbody>
              {featureGroups.map((group, groupIndex) => (
                <React.Fragment key={`group-${groupIndex}`}>
                  <tr className="bg-surface-light">
                    <td colSpan={4} className="py-3 px-4 font-medium">{group.name}</td>
                  </tr>
                  
                  {group.features.map((feature, featureIndex) => (
                    <tr 
                      key={`feature-${feature.id}`} 
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <td className="py-3 px-4 relative">
                        <div className="flex items-center">
                          <span>{feature.name}</span>
                          <button
                            className="ml-1 text-white/50 hover:text-white/80 focus:outline-none"
                            onMouseEnter={() => setHoveredFeature(feature.id)}
                            onMouseLeave={() => setHoveredFeature('')}
                          >
                            <FiInfo size={14} />
                          </button>
                          
                          {hoveredFeature === feature.id && (
                            <motion.div 
                              className="absolute left-4 top-12 z-10 bg-surface-dark border border-white/10 rounded-lg p-3 shadow-xl w-64"
                              {...featureInfoAnimation}
                            >
                              <p className="text-sm">{feature.info}</p>
                            </motion.div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderFeatureValue(feature.free)}
                      </td>
                      <td className="py-3 px-4 text-center bg-primary/5">
                        {renderFeatureValue(feature.premium)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderFeatureValue(feature.team)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* FAQ section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">Can I change plans at any time?</h3>
            <p className="text-white/70">
              Yes, you can upgrade to a higher plan at any time. Downgrading to a lower plan is possible at the end of the billing period.
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">How does the free trial work?</h3>
            <p className="text-white/70">
              We offer a 14-day free trial for Premium and Team plans. No credit card is required to start.
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">What happens to my data if I cancel my subscription?</h3>
            <p className="text-white/70">
              Your data will be retained for 30 days after cancellation. You can always export it before closing your account.
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
            <p className="text-white/70">
              We accept all major credit cards, PayPal, and, for business customers, bank transfers.
            </p>
          </div>
        </div>
      </div>
      
      {/* Call to action */}
      <div className="mt-12 glass-panel p-8 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to boost your work environment?</h2>
        <p className="text-white/70 mb-6 max-w-2xl mx-auto">
          Unlock all features and take your productivity to the next level with Jarvis Web OS Premium.
        </p>
        <button 
          className="px-6 py-3 bg-primary/50 rounded-lg font-medium cursor-not-allowed opacity-60"
          disabled={true}
        >
          Premium plans coming soon
        </button>
        <p className="mt-3 text-sm text-white/50">Currently only the Free plan is available.</p>
      </div>
    </div>
  );
}