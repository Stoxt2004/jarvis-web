// src/components/home/ClientLoader.tsx
"use client"

import dynamic from 'next/dynamic'

// Una semplice schermata di caricamento
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-light flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-primary border-white/20 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl text-white/80">Caricamento...</h2>
      </div>
    </div>
  );
}

// Importa la Home page dinamicamente senza SSR
const HomeClient = dynamic(() => import('@/components/home/HomeClient'), { 
  ssr: false,
  loading: () => <LoadingScreen />
});

export default function ClientLoader() {
  return <HomeClient />
}