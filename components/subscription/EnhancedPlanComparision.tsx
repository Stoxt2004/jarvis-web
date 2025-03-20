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
  
  // Calcola il periodo di fatturazione e i relativi prezzi
  const billingPeriod = isYearly ? 'anno' : 'mese';
  const discount = 20; // Sconto del 20% per pagamento annuale
  
  // Calcola i prezzi con sconto per pagamento annuale
  const getPlanPrice = (basePrice: number, isYearly: boolean): number => {
    if (!basePrice) return 0;
    if (!isYearly) return basePrice;
    
    const yearlyPrice = (basePrice * 12) * (1 - discount / 100);
    return parseFloat((yearlyPrice / 12).toFixed(2));
  };
  
  // Configura feature avanzate di confronto
  const featureGroups = [
    {
      name: 'Funzionalità di base',
      features: [
        { 
          id: 'editor', 
          name: 'Editor di codice',
          free: 'Base',
          premium: 'Avanzato con IntelliSense',
          team: 'Completamente Esteso',
          info: 'L\'editor premium include completamento del codice, refactoring, debugging e altre funzionalità avanzate'
        },
        { 
          id: 'workspace', 
          name: 'Workspace',
          free: '1 workspace',
          premium: 'Illimitati',
          team: 'Illimitati',
          info: 'I workspace ti permettono di separare e organizzare i tuoi progetti'
        },
        { 
          id: 'storage', 
          name: 'Spazio di archiviazione',
          free: '5 GB',
          premium: '50 GB',
          team: '100 GB',
          info: 'Spazio cloud per archiviare i tuoi file, progetti e risorse'
        },
        { 
          id: 'ai-usage', 
          name: 'Richieste AI',
          free: '50/giorno',
          premium: '500/giorno',
          team: '2000/giorno',
          info: 'Numero di richieste AI per generazione di codice, assistenza e altre funzionalità'
        }
      ]
    },
    {
      name: 'Assistente AI',
      features: [
        { 
          id: 'ai-basic', 
          name: 'Assistenza di base',
          free: true,
          premium: true,
          team: true,
          info: 'Risposte a domande, supporto per la ricerca di file e funzionalità di base'
        },
        { 
          id: 'ai-code', 
          name: 'Generazione di codice',
          free: 'Limitata',
          premium: 'Avanzata',
          team: 'Avanzata',
          info: 'Genera snippet di codice, funzioni complete e aiuta a risolvere problemi complessi'
        },
        { 
          id: 'ai-custom', 
          name: 'Personalizzazione AI',
          free: false,
          premium: true,
          team: true,
          info: 'Personalizza il comportamento dell\'assistente AI in base alle tue preferenze'
        },
        { 
          id: 'ai-context', 
          name: 'Consapevolezza del contesto',
          free: false,
          premium: true,
          team: true,
          info: 'L\'AI comprende il contesto del tuo progetto e fornisce assistenza mirata'
        }
      ]
    },
    {
      name: 'Collaborazione',
      features: [
        { 
          id: 'share-readonly', 
          name: 'Condivisione in sola lettura',
          free: true,
          premium: true,
          team: true,
          info: 'Condividi file e risorse in modalità di sola lettura con altri utenti'
        },
        { 
          id: 'real-time', 
          name: 'Modifica in tempo reale',
          free: false,
          premium: false,
          team: true,
          info: 'Collabora in tempo reale con altri membri del team sullo stesso documento'
        },
        { 
          id: 'comments', 
          name: 'Commenti e revisioni',
          free: false,
          premium: true,
          team: true,
          info: 'Aggiungi commenti, suggerimenti e revisioni ai documenti condivisi'
        },
        { 
          id: 'team-management', 
          name: 'Gestione team',
          free: false,
          premium: false,
          team: true,
          info: 'Gestisci i membri del team, assegna ruoli e permessi'
        }
      ]
    },
    {
      name: 'Supporto e sicurezza',
      features: [
        { 
          id: 'support', 
          name: 'Supporto clienti',
          free: 'Community',
          premium: 'Prioritario',
          team: '24/7 Dedicato',
          info: 'Accesso a diversi livelli di supporto tecnico in base al tuo piano'
        },
        { 
          id: 'backup', 
          name: 'Backup automatici',
          free: 'Giornalieri',
          premium: 'Ogni 6 ore',
          team: 'Ogni ora',
          info: 'Frequenza dei backup automatici dei tuoi dati e progetti'
        },
        { 
          id: 'version-history', 
          name: 'Cronologia versioni',
          free: '7 giorni',
          premium: '90 giorni',
          team: 'Illimitata',
          info: 'Periodo di conservazione della cronologia versioni dei tuoi file'
        },
        { 
          id: 'advanced-security', 
          name: 'Sicurezza avanzata',
          free: false,
          premium: true,
          team: true,
          info: 'Funzionalità di sicurezza avanzate come autenticazione a due fattori e controlli di accesso'
        }
      ]
    }
  ];
  
  // Gestisce l'avvio del processo di abbonamento
  const handleSubscribe = async (plan: string) => {
    if (subscription.plan === plan && subscription.isActive) {
      return; // Già abbonato a questo piano
    }
    
    setIsLoading(true);
    
    try {
      const priceId = PLANS[plan].stripePriceId;
      if (!priceId) {
        throw new Error(`ID prezzo non disponibile per il piano ${plan}`);
      }
      
      await redirectToCheckout(priceId);
    } catch (error) {
      console.error('Errore durante la sottoscrizione:', error);
      setIsLoading(false);
    }
  };
  
  // Renderizza il valore di una feature in base al tipo
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? 
        <FiCheck className="text-green-500" size={18} /> : 
        <FiX className="text-red-400" size={18} />;
    }
    
    return <span>{value}</span>;
  };
  
  // Animazioni per feature hover
  const featureInfoAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.2 }
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Toggle per fatturazione annuale/mensile */}
      <div className="mb-8 flex justify-center">
        <div className="bg-surface-dark rounded-lg p-1 flex items-center">
          <button
            className={`px-4 py-2 rounded-md ${!isYearly ? 'bg-primary text-white' : 'text-white/70'}`}
            onClick={() => setIsYearly(false)}
          >
            Mensile
          </button>
          <button
            className={`px-4 py-2 rounded-md ${isYearly ? 'bg-primary text-white' : 'text-white/70'}`}
            onClick={() => setIsYearly(true)}
          >
            Annuale <span className="text-xs ml-1 text-green-400">-{discount}%</span>
          </button>
        </div>
      </div>
      
      {/* Cards dei piani */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {Object.entries(PLANS).map(([planKey, plan]) => {
          const price = getPlanPrice(plan.monthlyPrice || 0, isYearly);
          const isCurrentPlan = subscription.plan === planKey && subscription.isActive;
          const isPopular = planKey === 'PREMIUM';
          
          return (
            <motion.div
              key={planKey}
              className={`glass-panel p-6 rounded-lg flex flex-col relative ${
                isPopular ? 'border-2 border-primary ring-1 ring-primary/30' : ''
              }`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: planKey === 'FREE' ? 0 : planKey === 'PREMIUM' ? 0.1 : 0.2 }}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-medium">
                  Più popolare
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              
              {price > 0 ? (
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold">€{price}</span>
                  <span className="text-white/50 ml-1 text-sm">/{billingPeriod}</span>
                </div>
              ) : (
                <div className="text-3xl font-bold mb-4">Gratuito</div>
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
                }`}
                onClick={() => isPopular ? handleSubscribe(planKey) : router.push('/dashboard/subscription')}
                disabled={isLoading || isCurrentPlan}
              >
                {isLoading && planKey === 'PREMIUM' ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Elaborazione...</span>
                  </span>
                ) : isCurrentPlan ? (
                  <span>Piano attuale</span>
                ) : planKey === 'FREE' ? (
                  <span>Piano base</span>
                ) : (
                  <span className="flex items-center gap-1">
                    {isPopular ? 'Inizia subito' : 'Scopri di più'}
                    <FiArrowRight size={16} />
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
      
      {/* Tabella di confronto dettagliata */}
      <div className="glass-panel p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-6 text-center">Confronto dettagliato dei piani</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 text-left w-1/4">Funzionalità</th>
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
        <h2 className="text-xl font-bold mb-6 text-center">Domande frequenti</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">Posso cambiare piano in qualsiasi momento?</h3>
            <p className="text-white/70">
              Sì, puoi passare a un piano superiore in qualsiasi momento. Il passaggio a un piano inferiore è possibile alla fine del periodo di fatturazione.
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">Come funziona la prova gratuita?</h3>
            <p className="text-white/70">
              Offriamo una prova gratuita di 14 giorni per i piani Premium e Team. Non è richiesta alcuna carta di credito per iniziare.
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">Cosa succede ai miei dati se cancello l'abbonamento?</h3>
            <p className="text-white/70">
              I tuoi dati verranno conservati per 30 giorni dopo la cancellazione. Puoi sempre esportarli prima di chiudere l'account.
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-lg">
            <h3 className="font-bold mb-2">Quali metodi di pagamento accettate?</h3>
            <p className="text-white/70">
              Accettiamo tutte le principali carte di credito, PayPal e, per i clienti aziendali, bonifici bancari.
            </p>
          </div>
        </div>
      </div>
      
      {/* Call to action */}
      <div className="mt-12 glass-panel p-8 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 text-center">
        <h2 className="text-2xl font-bold mb-3">Pronto a potenziare il tuo ambiente di lavoro?</h2>
        <p className="text-white/70 mb-6 max-w-2xl mx-auto">
          Sblocca tutte le funzionalità e porta la tua produttività al livello successivo con Jarvis Web OS Premium.
        </p>
        <button 
          className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium"
          onClick={() => handleSubscribe('PREMIUM')}
        >
          Prova gratis per 14 giorni
        </button>
        <p className="mt-3 text-sm text-white/50">Nessuna carta di credito richiesta. Cancella in qualsiasi momento.</p>
      </div>
    </div>
  );
}