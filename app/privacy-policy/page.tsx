// app/privacy-policy/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import router from "next/router";
import { useState } from "react";

const colors = {
  primary: "#A47864", // Mocha Mousse
  secondary: "#A78BFA", // Digital Lavender
  accent: "#4CAF50", // Verdant Green
  navy: "#101585", // Navy Blue
  rose: "#D58D8D", // Muted Rose
  background: "#0F0F1A", // Dark background
  surface: "#1A1A2E", // Slightly lighter surface
  text: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.7)",
};

const PrivacyPolicy = () => {
const [isLoading, setIsLoading] = useState(false)
  const handleDemoAccess = () => {
    if (isLoading) return
    
    setIsLoading(true)
    
    // Simuliamo un caricamento prima di reindirizzare alla dashboard
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div>
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
              href="/#features" 
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
              href="/#pricing" 
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background text-text min-h-screen py-12 px-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Titolo */}
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-5xl font-bold mb-8 text-primary"
        >
          Privacy Policy
        </motion.h1>

        {/* Introduzione */}
        <p className="text-lg mb-6 text-textMuted">
        Your privacy is important to us. Here we explain how we handle your personal data.
        </p>

        {/* Informazioni raccolte */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-secondary">
          Collected Information
          </h2>
          <p>
          We only collect the information necessary to provide our services, such as name, email, and other data provided voluntarily.
          </p>
        </section>

        {/* Utilizzo delle informazioni */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-accent">
          Use of Information
          </h2>
          <p>
          The collected information is used solely to improve our services and communicate with you.
          </p>
        </section>

        {/* Condivisione delle informazioni */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-navy">
          Information Sharing
          </h2>
          <p>
          We do not share or analyze your personal files. Your data remains private and is used only as specified in this policy.
          </p>
        </section>

        {/* Sicurezza dei dati */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-rose">
          Data Security
          </h2>
          <p>
          We implement advanced security measures to protect your files and personal information from unauthorized access.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-textMuted">
        Last updated: March 24, 2025.
        </footer>
      </div>
    </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
