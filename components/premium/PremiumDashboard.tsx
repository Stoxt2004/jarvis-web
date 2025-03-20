import React, { useState, useEffect } from 'react';
import { FiArrowUp, FiBarChart2, FiCpu, FiGift, FiLock, FiMaximize, FiPieChart, FiPlus, FiTrendingUp, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';


interface PremiumFeature {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    locked: boolean;
  }

export default function PremiumDashboard() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');
  
  // Chiudi la modale se l'utente ha un abbonamento premium
  useEffect(() => {
    if (subscription.isPremium) {
      setShowUpgradeModal(false);
    }
  }, [subscription.isPremium]);
  
  // Simula dati per il grafico di utilizzo
  const usageData = [
    { day: 'Lun', resources: 30, limit: 80 },
    { day: 'Mar', resources: 45, limit: 80 },
    { day: 'Mer', resources: 75, limit: 80 },
    { day: 'Gio', resources: 80, limit: 80 },
    { day: 'Ven', resources: 65, limit: 80 },
    { day: 'Sab', resources: 40, limit: 80 },
    { day: 'Dom', resources: 30, limit: 80 },
  ];
  
  const premiumFeatures = [
    {
      id: 'ai-assistant',
      title: 'Assistente AI Avanzato',
      description: 'Utilizza l\'AI con funzionalità avanzate come il riconoscimento del contesto e la memoria delle conversazioni.',
      icon: <FiCpu />,
      locked: !subscription.isPremium
    },
    {
      id: 'multi-workspace',
      title: 'Workspace Illimitati',
      description: 'Crea e gestisci tutti i workspace di cui hai bisogno per organizzare al meglio i tuoi progetti.',
      icon: <FiMaximize />,
      locked: !subscription.isPremium
    },
    {
      id: 'real-time-collab',
      title: 'Collaborazione in Tempo Reale',
      description: 'Condividi e modifica documenti con il tuo team simultaneamente.',
      icon: <FiZap />,
      locked: !subscription.isPremium && subscription.plan !== 'TEAM'
    },
    {
      id: 'data-analytics',
      title: 'Analisi Dati e Report',
      description: 'Dashboard avanzate con report dettagliati e visualizzazioni interattive.',
      icon: <FiBarChart2 />,
      locked: !subscription.isPremium
    }
  ];
  
  const handleFeatureClick = (featureId: string) => {
  if (!subscription.isPremium) {
    setSelectedFeature(featureId);
    setShowUpgradeModal(true);
  }
};
  
  // Simula la creazione di un report
  const PerformanceCard = () => (
    <div className="glass-panel p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Utilizzo Settimanale</h3>
        {!subscription.isPremium && (
          <span className="text-xs text-white/50">I dati dettagliati sono disponibili con Premium</span>
        )}
      </div>
      
      <div className="h-36 flex items-end justify-between gap-1">
        {usageData.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="w-full relative">
              <div 
                className={`w-full rounded-t-sm ${item.resources >= item.limit ? 'bg-red-500' : 'bg-primary'}`}
                style={{ height: `${(item.resources / 100) * 100}px` }}
              ></div>
              {!subscription.isPremium && item.resources >= 75 && (
                <div className="absolute inset-0 bg-surface-dark/50 flex items-center justify-center">
                  <FiLock className="text-white/70" />
                </div>
              )}
            </div>
            <div className="text-xs mt-1 text-white/70">{item.day}</div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-4 text-sm text-white/70">
        <div>Utilizzo totale: 65%</div>
        <div>Limite Free: 80%</div>
      </div>
    </div>
  );
  
  // Modale per l'upgrade
  const UpgradeModal = () => {
    if (!showUpgradeModal) return null;
    
    const feature = premiumFeatures.find(f => f.id === selectedFeature);
    
    return (
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-surface-dark rounded-lg w-full max-w-md p-6 relative"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
        >
          <button 
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10"
            onClick={() => setShowUpgradeModal(false)}
          >
            <FiPlus className="transform rotate-45" />
          </button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-4">
              {feature?.icon}
            </div>
            <h2 className="text-xl font-semibold mb-2">{feature?.title || 'Funzionalità Premium'}</h2>
            <p className="text-white/70">{feature?.description || 'Questa funzionalità è disponibile solo nei piani premium.'}</p>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface">
              <div className="text-green-500"><FiArrowUp /></div>
              <div>
                <h4 className="font-medium">Potenza di elaborazione aumentata</h4>
                <p className="text-sm text-white/70">5 volte più potenza per tutte le tue attività</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface">
              <div className="text-amber-500"><FiGift /></div>
              <div>
                <h4 className="font-medium">14 giorni di prova gratuita</h4>
                <p className="text-sm text-white/70">Prova tutte le funzionalità senza impegno</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface">
              <div className="text-blue-500"><FiTrendingUp /></div>
              <div>
                <h4 className="font-medium">Produttività aumentata</h4>
                <p className="text-sm text-white/70">I nostri utenti premium risparmiano in media 7 ore alla settimana</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark rounded-lg font-medium"
              onClick={() => router.push('/dashboard/subscription')}
            >
              Passa a Premium
            </button>
            <button 
              className="w-full py-2 px-4 bg-transparent hover:bg-white/5 border border-white/20 rounded-lg"
              onClick={() => setShowUpgradeModal(false)}
            >
              Non ora
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  return (
    <div className="space-y-6">
      {!subscription.isPremium && (
        <div className="glass-panel p-6 mb-6 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Sblocca il pieno potenziale di Jarvis</h2>
              <p className="text-white/70 mb-4">
                Stai utilizzando la versione gratuita. Passa a Premium per accedere a tutte le funzionalità avanzate e rimuovere i limiti.
              </p>
              <div className="flex items-center gap-2">
                <button 
                  className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg flex items-center gap-2"
                  onClick={() => router.push('/dashboard/subscription')}
                >
                  <FiArrowUp size={16} />
                  <span>Passa a Premium</span>
                </button>
                <button 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  onClick={() => router.push('/dashboard/subscription')}
                >
                  Confronta i piani
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50GB</div>
                <div className="text-xs text-white/70">Spazio cloud</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">∞</div>
                <div className="text-xs text-white/70">Workspace</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500</div>
                <div className="text-xs text-white/70">Richieste AI/giorno</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Dashboard Personale</h2>
          {subscription.isPremium && (
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">Premium</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PerformanceCard />
          
          <div className="glass-panel p-4">
            <h3 className="font-medium mb-4">Attività Recenti</h3>
            <div className="space-y-3">
              {[
                { name: 'Progetto Marketing Q1', time: '2 ore fa', type: 'file' },
                { name: 'Budget 2024', time: 'ieri', type: 'spreadsheet' },
                { name: 'Presentazione Cliente', time: '2 giorni fa', type: 'presentation' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center">
                      {i === 0 ? <FiPieChart /> : i === 1 ? <FiBarChart2 /> : <FiZap />}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-xs text-white/50">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <h3 className="font-medium mb-4">Funzionalità Premium</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {premiumFeatures.map((feature) => (
            <div 
              key={feature.id}
              className={`p-4 rounded-lg ${feature.locked ? 'bg-surface cursor-pointer' : 'bg-primary/10'} relative overflow-hidden group`}
              onClick={() => feature.locked && handleFeatureClick(feature.id)}
            >
              <div className="mb-3 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                {feature.icon}
              </div>
              <h4 className="font-medium mb-1">{feature.title}</h4>
              <p className="text-sm text-white/70">{feature.description}</p>
              
              {feature.locked && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-surface-dark/80 flex items-center justify-center transition-opacity">
                  <div className="flex flex-col items-center">
                    <FiLock className="text-primary mb-2" size={24} />
                    <span>Sblocca con Premium</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <UpgradeModal />
    </div>
  );
}