// src/components/home/HomeClient.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Definisci l'interfaccia per le particelle
interface Particle {
  id: number
  x: number
  y: number
  destX: number
  destY: number
  duration: number
}

export default function HomeClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  // Specifica il tipo per lo state delle particelle
  const [particles, setParticles] = useState<Particle[]>([])
  
  // Genera le particelle solo lato client
  useEffect(() => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    const newParticles: Particle[] = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * windowWidth,
      y: Math.random() * windowHeight,
      destX: Math.random() * windowWidth,
      destY: Math.random() * windowHeight,
      duration: 10 + Math.random() * 20
    }))
    
    setParticles(newParticles)
  }, [])
  
  // Gestisce l'accesso demo
  const handleDemoAccess = () => {
    setIsLoading(true)
    
    // Simuliamo un caricamento prima di reindirizzare alla dashboard
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }
  
  // Il resto del codice rimane identico
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-background-light flex flex-col">
      {/* Navbar */}
      <nav className="p-4 flex items-center justify-between">
        <div className="font-mono text-xl text-primary font-semibold tracking-wide">
          JARVIS WEB OS
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="#features" 
            className="text-white/70 hover:text-white transition-colors"
          >
            Funzionalità
          </Link>
          <Link 
            href="#pricing" 
            className="text-white/70 hover:text-white transition-colors"
          >
            Piani
          </Link>
          <button 
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-dark text-white transition-colors"
            onClick={handleDemoAccess}
            disabled={isLoading}
          >
            {isLoading ? 'Caricamento...' : 'Accedi Demo'}
          </button>
        </div>
      </nav>
      
      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
        {/* Pattern di sfondo */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 z-0"></div>
        
        {/* Animazione particelle */}
        <div className="absolute inset-0 z-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full bg-primary/30"
              initial={{ x: particle.x, y: particle.y }}
              animate={{ x: particle.destX, y: particle.destY }}
              transition={{ 
                duration: particle.duration,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Il tuo Web Operating System del futuro
          </h1>
          <p className="text-xl md:text-2xl text-white/70 mb-8">
            Esperienza fluida, potente e completamente accessibile via browser. <br />
            Ispirato all'assistente Jarvis di Iron Man.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              className="px-6 py-3 rounded-md bg-primary hover:bg-primary-dark text-white transition-colors text-lg w-full md:w-auto"
              onClick={handleDemoAccess}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Inizializzazione...
                </span>
              ) : (
                'Prova Demo Gratuita'
              )}
            </button>
            <Link 
              href="#features" 
              className="px-6 py-3 rounded-md border border-white/20 hover:bg-white/10 text-white transition-colors text-lg w-full md:w-auto"
            >
              Scopri di più
            </Link>
          </div>
        </motion.div>
        
        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 mt-12 w-full max-w-5xl"
        >
          <div className="glass-panel p-2 shadow-xl rounded-lg overflow-hidden">
            <div className="relative pt-[56.25%] rounded-md overflow-hidden">
              <div className="absolute inset-0 bg-surface">
                {/* Qui potrebbe andare uno screenshot/mockup dell'app */}
                <div className="h-full flex items-center justify-center text-white/30 text-lg">
                  Anteprima dell'interfaccia Jarvis Web OS
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Funzionalità Principali
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Jarvis Web OS combina potenza, flessibilità e un'interfaccia futuristica per offrirti un'esperienza completa direttamente nel tuo browser.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Web OS Futuristico",
                description: "Accesso diretto via browser con interfaccia modulare, pannelli dinamici e comandi vocali."
              },
              {
                title: "Browser Interno",
                description: "Web View avanzata con sessioni parallele e filtri di sicurezza configurabili."
              },
              {
                title: "File Manager",
                description: "Visualizzazione e gestione di file con drag & drop, tagging e ricerca intelligente."
              },
              {
                title: "Web IDE",
                description: "Editor di codice performante con sintassi multilinguaggio e terminale integrato."
              },
              {
                title: "Assistente AI",
                description: "Accessibile vocalmente e testualmente, per gestire file, generare codice e automatizzare task."
              },
              {
                title: "Dashboard Personalizzabile",
                description: "Layout flessibile con widget personalizzabili e temi grafici custom."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-panel p-6 hover:border-primary/30 transition-colors"
              >
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-surface-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Piani e Abbonamenti
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Scegli il piano più adatto alle tue esigenze, dalla versione gratuita con funzionalità essenziali al piano premium completo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "€0",
                description: "Funzionalità di base per uso personale",
                features: [
                  "AI assistant con funzioni base",
                  "IDE di base",
                  "5GB di spazio cloud",
                  "1 workspace alla volta",
                  "Supporto community"
                ],
                cta: "Prova Gratis",
                highlight: false
              },
              {
                name: "Premium",
                price: "€9.99",
                period: "/mese",
                description: "Tutte le funzionalità per professionisti",
                features: [
                  "AI assistant avanzato",
                  "IDE completo + terminal",
                  "50GB di spazio cloud",
                  "Workspace illimitati",
                  "API personalizzate",
                  "Supporto prioritario"
                ],
                cta: "Inizia Ora",
                highlight: true
              },
              {
                name: "Team",
                price: "€24.99",
                period: "/mese",
                description: "Soluzione completa per team e aziende",
                features: [
                  "Tutto del piano Premium",
                  "100GB di spazio cloud",
                  "Collaborazione in tempo reale",
                  "Controlli admin avanzati",
                  "Onboarding personalizzato",
                  "Supporto 24/7"
                ],
                cta: "Contattaci",
                highlight: false
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`glass-panel p-6 flex flex-col ${plan.highlight ? 'border-primary ring-1 ring-primary/30' : ''}`}
              >
                <h3 className="text-xl font-semibold mb-1 text-white">{plan.name}</h3>
                <div className="flex items-end mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-white/70">{plan.period}</span>}
                </div>
                <p className="text-white/70 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  className={`mt-auto px-4 py-2 rounded-md ${
                    plan.highlight
                      ? 'bg-primary hover:bg-primary-dark text-white'
                      : 'border border-white/20 hover:bg-white/10 text-white'
                  } transition-colors`}
                  onClick={handleDemoAccess}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="font-mono text-lg text-primary font-semibold tracking-wide mb-4 md:mb-0">
            JARVIS WEB OS
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <Link href="#" className="text-white/70 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-white/70 hover:text-white transition-colors">
              Termini di Servizio
            </Link>
            <Link href="#" className="text-white/70 hover:text-white transition-colors">
              Contattaci
            </Link>
            <Link href="#" className="text-white/70 hover:text-white transition-colors">
              FAQ
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center text-white/50 text-sm">
          &copy; {new Date().getFullYear()} Jarvis Web OS. Tutti i diritti riservati.
        </div>
      </footer>
    </main>
  )
}
