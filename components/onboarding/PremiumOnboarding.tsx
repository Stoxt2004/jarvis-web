import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiChevronRight, FiCheckCircle, FiCreditCard, FiArrowRight, FiStar, 
         FiZap, FiCpu, FiHeart, FiMoon, FiServer, FiCloud, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSubscription } from '@/hooks/useSubscription';
import { redirectToCheckout } from '@/lib/stripe/client';
import { toast } from 'sonner';

export default function PremiumOnboarding() {
  const router = useRouter();
  const { data: session } = useSession();
  const { subscription } = useSubscription();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  // Se l'utente ha già un abbonamento premium, reindirizzalo alla dashboard
  useEffect(() => {
    if (subscription.isPremium) {
      router.push('/dashboard');
    }
  }, [subscription.isPremium, router]);
  
  // Avvia il checkout per l'abbonamento premium
  const handleStartPremium = async () => {
    setIsLoading(true);
    
    try {
      const planType = isYearly ? 'PREMIUM_YEARLY' : 'PREMIUM';
      const priceId = isYearly ? process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
      
      if (!priceId) {
        throw new Error('ID prezzo non disponibile');
      }
      
      await redirectToCheckout(priceId);
    } catch (error) {
      console.error('Errore durante la sottoscrizione:', error);
      toast.error('Si è verificato un errore durante il processo di abbonamento');
      setIsLoading(false);
    }
  };
  
  // Reindirizza alla dashboard (piano gratuito)
  const handleContinueFree = () => {
    router.push('/dashboard');
  };
  
  // Video demo modale
  const VideoModal = () => {
    if (!showVideo) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowVideo(false)}
      >
        <div 
          className="w-full max-w-4xl h-auto aspect-video bg-black relative rounded-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* In un'implementazione reale, qui andrebbe un player video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/70">Video dimostrativo Premium</p>
          </div>
          
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white"
            onClick={() => setShowVideo(false)}
          >
            <FiPlay className="transform rotate-90" />
          </button>
        </div>
      </div>
    );
  };
  
  // Dati delle testimonianze
  const testimonials = [
    {
      name: "Marco R.",
      role: "Sviluppatore Full-Stack",
      avatar: "/api/placeholder/48/48",
      quote: "Da quando sono passato al piano Premium, la mia produttività è aumentata del 30%. L'assistente AI avanzato mi aiuta a risolvere problemi complessi in pochi secondi.",
      stars: 5
    },
    {
      name: "Giulia T.",
      role: "UX Designer",
      avatar: "/api/placeholder/48/48",
      quote: "Gli strumenti premium mi permettono di organizzare meglio i miei progetti creativi. Vale ogni centesimo speso!",
      stars: 5
    },
    {
      name: "Alessandro M.",
      role: "Project Manager",
      avatar: "/api/placeholder/48/48",
      quote: "La collaborazione in tempo reale ha rivoluzionato il modo in cui il nostro team lavora. Ora completiamo i progetti in metà tempo.",
      stars: 4
    }
  ];
  
  // Funzionalità premium in evidenza
  const premiumFeatures = [
    {
      icon: <FiCpu />,
      title: "AI Avanzata",
      description: "Assistente potenziato con modelli AI più avanzati e risposte contestuali"
    },
    {
      icon: <FiCloud />,
      title: "50GB di Spazio",
      description: "10x più spazio rispetto al piano gratuito per tutti i tuoi progetti"
    },
    {
      icon: <FiZap />,
      title: "Potenza Illimitata",
      description: "Nessun limite di calcolo o rallentamento durante le ore di punta"
    },
    {
      icon: <FiUsers />,
      title: "Workspace Illimitati",
      description: "Crea tutti i workspace che vuoi senza restrizioni"
    },
    {
      icon: <FiMoon />,
      title: "Tema Dark Pro",
      description: "Temi esclusivi ottimizzati per sessioni di lavoro prolungate"
    },
    {
      icon: <FiServer />,
      title: "API Integrate",
      description: "Connettiti a servizi esterni con le nostre API premium"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-light">
      <VideoModal />
      
      {/* Header */}
      <header className="py-6 px-4 md:px-8 flex items-center justify-between">
        <div className="font-mono text-xl text-primary font-semibold tracking-wide">
          JARVIS WEB OS
        </div>
        
        {session?.user && (
          <div className="flex items-center gap-2">
            <img 
              src={session.user.image || "/api/placeholder/32/32"} 
              alt={session.user.name || "User"} 
              className="w-8 h-8 rounded-full"
            />
            <span>{session.user.name}</span>
          </div>
        )}
      </header>
      
      {/* Hero section */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Sblocca il pieno potenziale di Jarvis Web OS
              </h1>
              
              <p className="text-xl md:text-2xl text-white/70 mb-8">
                Passa a Premium oggi e porta la tua produttività a un livello superiore con funzionalità AI avanzate, spazio illimitato e molto altro.
              </p>
              
              {/* Toggle piano annuale/mensile */}
              <div className="mb-8">
                <div className="inline-flex items-center bg-surface-dark rounded-lg p-1">
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
                    Annuale <span className="text-xs ml-1 text-green-400">-20%</span>
                  </button>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="glass-panel p-6 rounded-lg overflow-hidden relative">
                {/* Anteprima dashboard */}
                <div className="relative pt-[75%] rounded-md overflow-hidden">
                  <div className="absolute inset-0 bg-surface-dark border border-white/10">
                    {/* UI mockup della dashboard premium */}
                    <div className="h-full flex items-center justify-center">
                      <img src="/api/placeholder/600/400" alt="Dashboard Premium" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
                </div>
                
                {/* Pulsante per mostrare il video demo */}
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors"
                  onClick={() => setShowVideo(true)}
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <FiPlay size={24} className="ml-1" />
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Sezione feature premium */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Caratteristiche Premium</h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Scopri tutte le potenti funzionalità disponibili esclusivamente per gli utenti Premium.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {premiumFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="glass-panel p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Sezione testimonial */}
      <section className="py-16 px-4 md:px-8 bg-surface-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cosa dicono i nostri utenti</h2>
            <p className="text-xl text-white/70">
              Migliaia di professionisti hanno già potenziato la loro produttività con Jarvis Premium.
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-lg relative overflow-hidden">
            {/* Controlli navigazione */}
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
              <button
                className="p-2 rounded-full bg-surface-dark hover:bg-surface text-white/70 hover:text-white"
                onClick={() => setCurrentTestimonial(prev => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              >
                <FiChevronRight className="transform rotate-180" />
              </button>
            </div>
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
              <button
                className="p-2 rounded-full bg-surface-dark hover:bg-surface text-white/70 hover:text-white"
                onClick={() => setCurrentTestimonial(prev => (prev === testimonials.length - 1 ? 0 : prev + 1))}
              >
                <FiChevronRight />
              </button>
            </div>
            
            {/* Testimonianza corrente */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                {Array.from({ length: testimonials[currentTestimonial].stars }).map((_, i) => (
                  <FiStar key={i} className="text-amber-400" />
                ))}
              </div>
              
              <blockquote className="text-xl italic mb-6">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={testimonials[currentTestimonial].avatar} 
                  alt={testimonials[currentTestimonial].name} 
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-left">
                  <div className="font-semibold">{testimonials[currentTestimonial].name}</div>
                  <div className="text-white/70 text-sm">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>
            
            {/* Indicatori */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === currentTestimonial ? 'bg-primary' : 'bg-white/30'}`}
                  onClick={() => setCurrentTestimonial(i)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Domande frequenti</h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Tutto quello che devi sapere sul piano Premium.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              q: "Cosa include il periodo di prova gratuito?",
              a: "Il periodo di prova gratuito di 14 giorni include l'accesso completo a tutte le funzionalità Premium senza alcuna limitazione. Non è richiesta alcuna carta di credito per iniziare."
            },
            {
              q: "Posso annullare in qualsiasi momento?",
              a: "Sì, puoi annullare il tuo abbonamento in qualsiasi momento. Se annulli durante il periodo di prova gratuito, non ti verrà addebitato nulla."
            },
            {
              q: "Come funziona la fatturazione?",
              a: "La fatturazione avviene automaticamente alla fine del periodo di prova gratuito e poi mensilmente o annualmente, a seconda del piano scelto."
            },
            {
              q: "C'è un contratto a lungo termine?",
              a: "No, non c'è alcun contratto a lungo termine. Puoi annullare l'abbonamento in qualsiasi momento senza penalità."
            },
            {
              q: "Cosa succede ai miei dati se annullo?",
              a: "I tuoi dati rimarranno disponibili per 30 giorni dopo l'annullamento. Durante questo periodo, puoi scaricarli o ripristinare l'abbonamento."
            },
            {
              q: "Posso cambiare da mensile ad annuale?",
              a: "Sì, puoi passare da un piano mensile a uno annuale in qualsiasi momento e beneficiare immediatamente dello sconto."
            }
          ].map((faq, i) => (
            <motion.div
              key={i}
              className="glass-panel p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
              <p className="text-white/70">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* CTA finale */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-primary/20 to-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto a trasformare il tuo modo di lavorare?
            </h2>
            
            <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto">
              Unisciti a migliaia di professionisti che hanno già sbloccato il pieno potenziale di Jarvis Web OS.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium flex items-center gap-2"
                onClick={handleStartPremium}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiZap size={18} />
                    <span>Inizia con Premium</span>
                  </>
                )}
              </button>
              
              <button
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2"
                onClick={() => setShowVideo(true)}
              >
                <FiPlay size={18} />
                <span>Guarda la demo</span>
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-white/70">
              <FiHeart className="text-red-400" />
              <span>Soddisfazione garantita o rimborso entro 30 giorni</span>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="font-mono text-lg text-primary font-semibold tracking-wide mb-4 md:mb-0">
            JARVIS WEB OS
          </div>
          
          <div className="flex items-center gap-6 text-white/70">
            <a href="#" className="hover:text-white">Termini</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
