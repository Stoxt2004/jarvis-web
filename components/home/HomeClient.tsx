// src/components/home/HomeClient.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

// Definisci l'interfaccia per le particelle
interface Particle {
  id: number
  x: number
  y: number
  destX: number
  destY: number
  duration: number
  size: number
  color: string
}

// Definisci l'interfaccia per le caratteristiche
interface Feature {
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

// Definisci l'interfaccia per i piani di abbonamento
interface PricingPlan {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  highlight: boolean
  color: string
}

export default function HomeClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  
  // Colori moderni 2025
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
  
  // Genera le particelle solo lato client con lazy loading
  useEffect(() => {
    const generateParticles = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      const colorOptions = [colors.primary, colors.secondary, colors.accent, colors.rose]
      
      const newParticles: Particle[] = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * windowWidth,
        y: Math.random() * windowHeight,
        destX: Math.random() * windowWidth,
        destY: Math.random() * windowHeight,
        duration: 10 + Math.random() * 30,
        size: 2 + Math.random() * 6,
        color: colorOptions[Math.floor(Math.random() * colorOptions.length)]
      }))
      
      setParticles(newParticles)
    }

    // Usa requestAnimationFrame per migliorare le performance
    requestAnimationFrame(generateParticles)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    // Cleanup function
    return () => {
      setParticles([])
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
  
  // Gestisce l'accesso demo con feedback visivo
  const handleDemoAccess = () => {
    if (isLoading) return
    
    setIsLoading(true)
    
    // Simuliamo un caricamento prima di reindirizzare alla dashboard
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }

  // Features data con icone SVG
  const features: Feature[] = [
    {
      title: "Futuristic Web OS",
      description: "Direct browser access with a modular interface, dynamic panels, and voice commands.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
          <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
          <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
        </svg>
      ),
      color: colors.primary
    },
    {
      title: "File Manager",
      description: "Browse and manage files with drag & drop, tagging, and smart search.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
        </svg>
      ),
      color: colors.accent
    },
    {
      title: "Web IDE",
      description: "High-performance code editor with multi-language syntax support and integrated terminal.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
      ),
      color: colors.navy
    },
    {
      title: "AI Assistant",
      description: "Accessible via voice or text to manage files, generate code, and automate tasks.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M16.5 7.5h-9v9h9v-9z" />
          <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
        </svg>
      ),
      color: colors.rose
    },

  ]

  // Pricing plans data
  const pricingPlans: PricingPlan[] = [
    {
      name: "Free",
      price: "€0",
      description: "Basic features for personal use",
      features: [
        "Basic AI Assistant",
        "Basic IDE",
        "1GB Cloud Storage",
        "1 Workspace at a time",
        "Community Support"
      ],
      cta: "Start for Free",
      highlight: false,
      color: colors.navy
    },
    {
      name: "Premium",
      price: "€9.99",
      period: "/month",
      description: "All features for professionals",
      features: [
        "Advanced AI Assistant",
        "Full IDE + Terminal",
        "10GB Cloud Storage",
        "Unlimited Workspaces",
        "Custom APIs",
        "Priority Support"
      ],
      cta: "Inizia Ora",
      highlight: true,
      color: colors.accent
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
      highlight: false,
      color: colors.rose
    }
  ]
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-background-light flex flex-col" style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)` }}>
      {/* Navbar */}
      <motion.nav 
        className="p-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md"
        style={{ backgroundColor: `rgba(15, 15, 26, 0.8)` }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="font-mono text-xl font-semibold tracking-wide"
          style={{ color: colors.primary }}
          whileHover={{ scale: 1.05 }}
        >
          JARVIS WEB OS
        </motion.div>
        
        <div className="flex items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link 
              href="#features" 
              className="text-white/70 hover:text-white transition-colors"
            >
              Features
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link 
              href="#pricing" 
              className="text-white/70 hover:text-white transition-colors"
            >
              Plans
            </Link>
          </motion.div>
          
          <motion.button 
            className="px-4 py-2 rounded-md text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              boxShadow: `0 4px 20px rgba(164, 120, 100, 0.3)`
            }}
            onClick={handleDemoAccess}
            disabled={isLoading}
            whileHover={{ scale: 1.05, boxShadow: `0 8px 25px rgba(164, 120, 100, 0.5)` }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                ></motion.div>
                Loading...
              </span>
            ) : (
              'Try For Free'
            )}
          </motion.button>
        </div>
      </motion.nav>
      
      {/* Hero section */}
      <section ref={heroRef} className="flex-1 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden py-20">
        {/* Pattern di sfondo con animazione */}
        <motion.div 
          className="absolute inset-0 bg-grid-pattern opacity-5 z-0"
          style={{ 
            backgroundImage: `radial-gradient(${colors.primary}22 1px, transparent 1px)`,
            backgroundSize: '30px 30px' 
          }}
          animate={{ 
            backgroundPosition: ['0px 0px', '30px 30px'],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Animazione particelle */}
        <div className="absolute inset-0 z-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{ 
                width: particle.size, 
                height: particle.size, 
                backgroundColor: particle.color,
                filter: 'blur(1px)'
              }}
              initial={{ x: particle.x, y: particle.y, opacity: 0 }}
              animate={{ 
                x: [particle.x, particle.destX, particle.x + Math.random() * 100 - 50], 
                y: [particle.y, particle.destY, particle.y + Math.random() * 100 - 50],
                opacity: [0, 0.7, 0]
              }}
              transition={{ 
                duration: particle.duration,
                repeat: Infinity,
                repeatType: 'loop',
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Effetto di luce che segue il mouse */}
        <motion.div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none z-0"
          style={{ 
            background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
            left: mousePosition.x - 250,
            top: mousePosition.y - 250
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        
        <motion.div
          style={{ opacity, scale }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl"
        >
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text'
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: 'loop',
              ease: "easeInOut"
            }}
          >
            Your Web OS of the Future
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl mb-8 leading-relaxed"
            style={{ color: colors.textMuted }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            A seamless, powerful experience, fully accessible via browser. Inspired by the Jarvis assistant.
          </motion.p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <motion.button 
              className="px-6 py-3 rounded-md text-white transition-all text-lg w-full md:w-auto shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 4px 20px rgba(164, 120, 100, 0.3)`
              }}
              onClick={handleDemoAccess}
              disabled={isLoading}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: `0 8px 25px rgba(164, 120, 100, 0.5)`,
                background: `linear-gradient(135deg, ${colors.primary} 20%, ${colors.secondary} 80%)`
              }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  ></motion.div>
                  Loading...
                </span>
              ) : (
                'Free Trial'
              )}
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="#features" 
                className="px-6 py-3 rounded-md border border-white/20 hover:bg-white/10 text-white transition-colors text-lg w-full md:w-auto flex items-center justify-center"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 mt-12 w-full max-w-5xl"
        >
          <motion.div 
            className="p-2 shadow-xl rounded-lg overflow-hidden border border-white/10 backdrop-blur-md"
            style={{ background: `rgba(26, 26, 46, 0.5)` }}
            whileHover={{ 
              boxShadow: `0 25px 50px -12px rgba(167, 139, 250, 0.25)`,
              y: -5
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative pt-[56.25%] rounded-md overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center" style={{ 
                  background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.background} 100%)`
                }}>
                  <motion.div 
                    className="text-white/30 text-lg p-8 flex flex-col items-center"
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  >
                    <motion.div 
                      className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
                      style={{ background: `rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0.2)` }}
                      animate={{ 
                        boxShadow: [
                          `0 0 0 rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0)`,
                          `0 0 20px rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0.5)`,
                          `0 0 0 rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0)`
                        ]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: 'loop'
                      }}
                    >
                      <motion.div 
                        className="w-8 h-8 rounded-full"
                        style={{ background: colors.primary }}
                        animate={{ 
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                      ></motion.div>
                    </motion.div>
                    Anteprima dell'interfaccia Jarvis Web OS
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>
      {/* Features */}
      <section id="features" className="py-24 px-4" style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Key Features
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto"
              style={{ color: colors.textMuted }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Jarvis Web OS combines power, flexibility, and a futuristic interface to deliver a complete experience right from your browser.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-xl transition-all hover:shadow-lg group"
                style={{ 
                  background: `rgba(26, 26, 46, 0.5)`,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                whileHover={{ 
                  y: -10,
                  boxShadow: `0 20px 25px -5px rgba(${parseInt(feature.color.slice(1, 3), 16)}, ${parseInt(feature.color.slice(3, 5), 16)}, ${parseInt(feature.color.slice(5, 7), 16)}, 0.1)`,
                  border: `1px solid ${feature.color}30`
                }}
              >
                <motion.div 
                  className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${feature.color}20` }}
                  whileHover={{ 
                    backgroundColor: `${feature.color}30`,
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-6 h-6" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                </motion.div>
                <h3 
                  className="text-xl font-semibold mb-3 text-white group-hover:text-white transition-colors"
                  style={{ color: colors.text }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: colors.textMuted }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing */}
<section id="pricing" className="py-24 px-4" style={{ background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.background} 100%)` }}>
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-16">
      <motion.h2 
        className="text-3xl md:text-4xl font-bold mb-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Plans & Subscriptions
      </motion.h2>
      <motion.p 
        className="max-w-2xl mx-auto"
        style={{ color: colors.textMuted }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Choose the plan that best fits your needs from the free version with essential features to the complete premium package.
      </motion.p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {pricingPlans.map((plan, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className={`p-8 flex flex-col rounded-xl relative ${
            plan.highlight 
              ? 'shadow-xl' 
              : 'hover:shadow-lg transition-all'
          }`}
          style={{ 
            background: `rgba(26, 26, 46, 0.5)`,
            backdropFilter: 'blur(10px)',
            border: plan.highlight ? `1px solid ${plan.color}` : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: plan.highlight ? `0 20px 25px -5px ${plan.color}30` : 'none'
          }}
          whileHover={{ 
            y: plan.name === "Free" ? -10 : 0,
            boxShadow: plan.name === "Free" ? 
              `0 20px 25px -5px rgba(${parseInt(plan.color.slice(1, 3), 16)}, ${parseInt(plan.color.slice(3, 5), 16)}, ${parseInt(plan.color.slice(5, 7), 16)}, 0.2)` : 'none',
          }}
        >
          {/* Red X overlay for Premium and Team plans */}
          {plan.name !== "Free" && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div 
                className="text-red-600 font-bold text-9xl opacity-70"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 0.8 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ 
                  textShadow: '0 0 15px rgba(255, 0, 0, 0.7)', 
                  filter: 'blur(2px)',
                  transform: 'rotate(-5deg)'
                }}
              >
                X
              </motion.div>
            </div>
          )}
          
          <motion.div
            whileHover={{ scale: plan.name === "Free" ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <h3 className="text-xl font-semibold mb-1 text-white">{plan.name}</h3>
            <div className="flex items-end mb-4">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              {plan.period && <span style={{ color: colors.textMuted }} className="ml-1">{plan.period}</span>}
            </div>
          </motion.div>
          <p style={{ color: colors.textMuted }} className="mb-6">{plan.description}</p>
          
          <ul className="space-y-3 mb-8 flex-grow">
            {plan.features.map((feature, j) => (
              <motion.li 
                key={j} 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: j * 0.1 + 0.2 }}
              >
                <span style={{ color: plan.color }} className="mr-2 flex-shrink-0">✓</span>
                <span className="text-white">{feature}</span>
              </motion.li>
            ))}
          </ul>
          
          <motion.button 
            className={`mt-auto px-4 py-3 rounded-md text-white ${plan.name !== "Free" ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ 
              background: plan.highlight 
                ? `linear-gradient(135deg, ${plan.color} 0%, ${colors.secondary} 100%)` 
                : 'transparent',
              border: plan.highlight ? 'none' : `1px solid ${colors.textMuted}`,
              boxShadow: plan.highlight ? `0 4px 15px ${plan.color}40` : 'none'
            }}
            whileHover={{ 
              scale: plan.name === "Free" ? 1.05 : 1, 
              boxShadow: plan.name === "Free" ? 
                `0 8px 25px ${plan.color}50` : 'none',
              background: plan.name === "Free" && plan.highlight ? 
                `linear-gradient(135deg, ${plan.color} 20%, ${colors.secondary} 80%)` : 
                plan.name === "Free" ? `rgba(255, 255, 255, 0.1)` : 'transparent'
            }}
            whileTap={{ scale: plan.name === "Free" ? 0.95 : 1 }}
          >
            {plan.cta}
          </motion.button>
        </motion.div>
      ))}
    </div>
  </div>
</section>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10" style={{ background: colors.background }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <motion.div 
            className="font-mono text-lg font-semibold tracking-wide mb-4 md:mb-0"
            style={{ color: colors.primary }}
            whileHover={{ scale: 1.05 }}
          >
            JARVIS WEB OS
          </motion.div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
            
              <motion.div
                
                whileHover={{ scale: 1.1, color: colors.primary }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/privacy-policy" className="text-white/70 hover:text-white transition-colors">
                 <p>Privacy Policy</p>
                </Link>
              </motion.div>
              <motion.div
                
                whileHover={{ scale: 1.1, color: colors.primary }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/terms-of-service" className="text-white/70 hover:text-white transition-colors">
                 <p>Terms of Service</p>
                </Link>
              </motion.div>
            
          </div>
        </div>
        
        <motion.div 
          className="mt-8 text-center text-sm"
          style={{ color: colors.textMuted }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          &copy; {new Date().getFullYear()} Jarvis Web OS. Tutti i diritti riservati.
        </motion.div>
      </footer>
    </main>
  )
}

