import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUp, FiX, FiPlay, FiLock, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';

// Tipo di feature che può essere visualizzata in anteprima
export type PreviewableFeature = 
  | 'advanced-ai'    // AI avanzata con generazione di codice
  | 'multi-workspace' // Workspace multipli
  | 'code-analysis'   // Analisi del codice avanzata
  | 'real-time-collab' // Collaborazione in tempo reale
  | 'cloud-sync'      // Sincronizzazione cloud avanzata
  | 'themes';         // Temi avanzati

// Proprietà per il componente principale
interface PremiumFeaturePreviewerProps {
  feature: PreviewableFeature;
  onClose: () => void;
  children?: React.ReactNode; // Contenuto da mostrare come anteprima (mockup della feature)
}

/**
 * Componente che mostra un'anteprima di una funzionalità premium con CTA per l'upgrade
 */
export default function PremiumFeaturePreviewer({ feature, onClose, children }: PremiumFeaturePreviewerProps) {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [showTrialInfo, setShowTrialInfo] = useState(false);
  
  // Se l'utente ha già un abbonamento premium, non mostrare il previewer
  if (subscription.isPremium) {
    return <>{children}</>;
  }
  
  // Ottiene i dettagli della feature in base al tipo
  const getFeatureDetails = () => {
    switch (feature) {
      case 'advanced-ai':
        return {
          title: 'Assistente AI Avanzato',
          description: 'Genera codice complesso, ottiene risposte contestuali e riceve suggerimenti intelligenti in base al tuo progetto.',
          demoVideo: '/videos/ai-assistant-demo.mp4',
          benefits: [
            'Generazione di codice completo con spiegazioni',
            'Consapevolezza del contesto del progetto',
            'Ottimizzazione automatica del codice',
            'Risoluzione dei bug con suggerimenti intelligenti'
          ]
        };
      case 'multi-workspace':
        return {
          title: 'Workspace Illimitati',
          description: 'Organizza il tuo lavoro in workspace separati per mantenere i tuoi progetti in ordine e facilmente accessibili.',
          demoVideo: '/videos/multi-workspace-demo.mp4',
          benefits: [
            'Crea workspace illimitati per diversi progetti',
            'Condividi workspace con il tuo team',
            'Accedi rapidamente ai tuoi progetti recenti',
            'Personalizza ogni workspace in base alle tue esigenze'
          ]
        };
      case 'code-analysis':
        return {
          title: 'Analisi Avanzata del Codice',
          description: 'Identifica bug, vulnerabilità e problemi di prestazioni nel tuo codice con strumenti di analisi avanzati.',
          demoVideo: '/videos/code-analysis-demo.mp4',
          benefits: [
            'Analisi statica e dinamica del codice',
            'Rilevamento di bug e vulnerabilità di sicurezza',
            'Suggerimenti per ottimizzare le prestazioni',
            'Monitoraggio della qualità del codice nel tempo'
          ]
        };
      case 'real-time-collab':
        return {
          title: 'Collaborazione in Tempo Reale',
          description: 'Lavora insieme al tuo team sugli stessi file contemporaneamente, con modifiche sincronizzate istantaneamente.',
          demoVideo: '/videos/collab-demo.mp4',
          benefits: [
            'Modifica in tempo reale con più collaboratori',
            'Cursori con nomi degli utenti per vedere chi sta lavorando',
            'Chat integrata per discussioni contestuali',
            'Cronologia delle modifiche con autori'
          ]
        };
      case 'cloud-sync':
        return {
          title: 'Sincronizzazione Cloud Avanzata',
          description: 'Accedi ai tuoi file da qualsiasi dispositivo con sincronizzazione automatica e backup incrementali.',
          demoVideo: '/videos/cloud-sync-demo.mp4',
          benefits: [
            'Sincronizzazione automatica su tutti i dispositivi',
            'Backup incrementali ogni ora',
            'Cronologia versioni per 90 giorni',
            'Accesso offline con sincronizzazione al riconnessione'
          ]
        };
      case 'themes':
        return {
          title: 'Temi Premium',
          description: 'Personalizza l\'aspetto di Jarvis con temi esclusivi progettati per migliorare la leggibilità e ridurre l\'affaticamento degli occhi.',
          demoVideo: '/videos/themes-demo.mp4',
          benefits: [
            'Oltre 20 temi premium esclusivi',
            'Personalizzazione completa dei colori e dei font',
            'Temi ottimizzati per sessioni prolungate',
            'Modalità dark avanzata con filtro luce blu'
          ]
        };
      default:
        return {
          title: 'Funzionalità Premium',
          description: 'Sblocca tutte le funzionalità avanzate con un abbonamento Premium.',
          demoVideo: '/videos/premium-demo.mp4',
          benefits: [
            'Accesso a tutte le funzionalità avanzate',
            'Nessuna limitazione di risorse',
            'Supporto prioritario',
            'Aggiornamenti esclusivi'
          ]
        };
    }
  };
  
  const featureDetails = getFeatureDetails();
  
  // Avvia l'upgrade al piano premium
  const handleUpgrade = () => {
    router.push('/dashboard/subscription');
  };
  
  return (
    <div className="h-full w-full flex flex-col">
      {/* Header con info sulla feature */}
      <div className="p-4 border-b border-white/10 bg-surface-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <FiLock />
          </div>
          <div>
            <h2 className="font-medium">{featureDetails.title}</h2>
            <p className="text-xs text-white/50">Anteprima funzionalità Premium</p>
          </div>
        </div>
        
        <button 
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
          onClick={onClose}
        >
          <FiX size={18} />
        </button>
      </div>
      
      {/* Contenuto principale */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Area di anteprima (mockup) */}
        <div className="flex-1 relative overflow-hidden bg-surface-light">
          {/* Layer semitrasparente sopra il mockup */}
          <div className="absolute inset-0 backdrop-blur-sm bg-surface-dark/80 z-10 flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-lg">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-full bg-primary/30 mx-auto flex items-center justify-center mb-4">
                  <FiLock size={32} className="text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{featureDetails.title}</h3>
                <p className="text-white/70 mb-6">{featureDetails.description}</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {['14 giorni gratis', 'Cancella in qualsiasi momento', 'Supporto prioritario'].map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-center gap-3">
                  <button 
                    className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-md flex items-center gap-2"
                    onClick={handleUpgrade}
                  >
                    <FiArrowUp size={16} />
                    <span>Sblocca ora</span>
                  </button>
                  
                  <button 
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2"
                    onClick={() => setShowTrialInfo(!showTrialInfo)}
                  >
                    <FiPlay size={16} />
                    <span>Vedi come funziona</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Contenuto mockup (visibile ma sfocato) */}
          <div className="w-full h-full">
            {children || (
              <div className="h-full flex items-center justify-center p-4">
                <p className="text-white/50">Anteprima di {featureDetails.title}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Pannello laterale con info aggiuntive */}
        <AnimatePresence>
          {showTrialInfo && (
            <motion.div 
              className="w-full md:w-80 border-t md:border-l md:border-t-0 border-white/10 bg-surface-dark overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FiClock size={18} className="text-primary" />
                  <span>Prova Premium per 14 giorni</span>
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="p-3 rounded-lg bg-surface">
                    <h4 className="font-medium mb-2">Cosa ottieni con Premium:</h4>
                    <ul className="space-y-2">
                      {featureDetails.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-sm text-white/70">
                    <p className="mb-2">Inizia oggi la tua prova gratuita di 14 giorni senza impegno.</p>
                    <p>Se non sei soddisfatto, puoi annullare in qualsiasi momento prima della fine del periodo di prova.</p>
                  </div>
                </div>
                
                <button 
                  className="w-full py-2 px-4 bg-primary hover:bg-primary-dark rounded-md flex items-center justify-center gap-2"
                  onClick={handleUpgrade}
                >
                  <FiArrowUp size={16} />
                  <span>Sblocca tutte le funzionalità</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}