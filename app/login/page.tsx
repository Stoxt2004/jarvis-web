// src/app/login/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FiMail, FiLock, FiGithub, FiAlertCircle, FiLoader } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Separated login form component that uses useSearchParams
function LoginForm() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Check if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [status, router]);
  
  // Colori moderni 2025 (stessi di HomeClient)
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
  
  // Gestisci la posizione del mouse per l'effetto luce
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log(`Logging in with email: ${email} and redirecting to: ${redirectUrl}`);
      
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: redirectUrl
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
        toast.error("Login failed");
      } else {
        toast.success("Login successful");
        
        // Manual redirect after short delay
        setTimeout(() => {
          console.log(`Redirecting to: ${redirectUrl}`);
          router.push(redirectUrl);
          router.refresh();
        }, 500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login.");
      toast.error("Authentication error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    setIsLoading(true);
    console.log(`OAuth login with ${provider}, redirecting to: ${redirectUrl}`);
    signIn(provider, { callbackUrl: redirectUrl });
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" 
        style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)` }}>
        <div className="text-center">
          <motion.div 
            className="w-16 h-16 border-4 border-t-primary border-white/20 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          ></motion.div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If already authenticated, don't show the login form
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center" 
        style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)` }}>
        <div className="text-center">
          <p className="text-white mb-4">You're already logged in!</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded bg-primary text-white"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" 
      style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)` }}>
        
      
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
        className="font-mono text-2xl font-semibold tracking-wide mb-6"
        style={{ color: colors.primary }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
      >
        JARVIS WEB OS
      </motion.div>
      
      <motion.div 
        className="w-full max-w-md p-8 rounded-xl relative z-10"
        style={{ 
          background: `rgba(26, 26, 46, 0.5)`,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1 
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: colors.text }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Access your account
        </motion.h1>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              className="p-3 mb-4 rounded-md flex items-center gap-2"
              style={{ backgroundColor: `${colors.rose}20`, border: `1px solid ${colors.rose}` }}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FiAlertCircle className="text-lg flex-shrink-0" style={{ color: colors.rose }} />
              <span style={{ color: colors.rose }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium" style={{ color: colors.textMuted }}>
              Email
            </label>
            <div className="relative">
              <motion.div 
                className="absolute left-3 top-1/2 -translate-y-1/2"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FiMail style={{ color: colors.primary }} />
              </motion.div>
              <motion.input
                type="email"
                className="w-full py-2.5 pl-10 pr-4 rounded-md bg-black/20 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                whileFocus={{ 
                  boxShadow: `0 0 0 2px ${colors.primary}30`,
                  borderColor: colors.primary
                }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium" style={{ color: colors.textMuted }}>
                Password
              </label>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link 
                  href="/password-reset" 
                  className="text-sm hover:underline"
                  style={{ color: colors.secondary }}
                >
                  Forgot password?
                </Link>
              </motion.div>
            </div>
            <div className="relative">
              <motion.div 
                className="absolute left-3 top-1/2 -translate-y-1/2"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FiLock style={{ color: colors.primary }} />
              </motion.div>
              <motion.input
                type="password"
                className="w-full py-2.5 pl-10 pr-4 rounded-md bg-black/20 border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
                whileFocus={{ 
                  boxShadow: `0 0 0 2px ${colors.primary}30`,
                  borderColor: colors.primary
                }}
              />
            </div>
          </div>
          
          <motion.button
            type="submit"
            className="w-full py-2.5 px-4 rounded-md text-white font-medium"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              boxShadow: `0 4px 15px ${colors.primary}40`
            }}
            disabled={isLoading}
            whileHover={{ 
              scale: 1.02, 
              boxShadow: `0 8px 25px ${colors.primary}50`,
              background: `linear-gradient(135deg, ${colors.primary} 20%, ${colors.secondary} 80%)`
            }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                ></motion.div>
                Logging In...
              </span>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>
        
        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 absolute w-full"></div>
            <span className="bg-surface px-2 relative z-10 text-sm" style={{ 
              color: colors.textMuted,
              backgroundColor: 'rgba(26, 26, 46, 0.5)'
            }}>
              or continue with
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <motion.button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              className="py-2.5 px-4 rounded-md bg-white text-gray-800 hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
              disabled={isLoading}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <FcGoogle className="text-xl" />
              <span>Google</span>
            </motion.button>
            
            <motion.button
              type="button"
              onClick={() => handleOAuthSignIn("github")}
              className="py-2.5 px-4 rounded-md bg-[#24292e] hover:bg-[#2c3137] transition-colors font-medium flex items-center justify-center gap-2"
              disabled={isLoading}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiGithub className="text-xl" />
              <span>GitHub</span>
            </motion.button>
          </div>
        </div>
        
        <motion.p 
          className="mt-6 text-center text-sm"
          style={{ color: colors.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Don't have an account?{" "}
          <motion.span
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link 
              href="/register" 
              className="font-medium hover:underline"
              style={{ color: colors.secondary }}
            >
              Sign up
            </Link>
          </motion.span>
        </motion.p>
      </motion.div>
      
    </div>
  );
}

// Default export with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <FiLoader className="w-10 h-10 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-white">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}