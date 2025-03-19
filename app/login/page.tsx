// src/app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FiMail, FiLock, FiGithub, FiAlertCircle, FiLoader } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError("Credenziali non valide. Riprova.");
        toast.error("Accesso fallito");
      } else {
        toast.success("Accesso effettuato con successo");
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (error) {
      setError("Si è verificato un errore durante l'accesso.");
      toast.error("Errore di autenticazione");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOAuthSignIn = (provider: string) => {
    setIsLoading(true);
    signIn(provider, { callbackUrl: redirectUrl });
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-background-light flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-6 left-6 font-mono text-lg text-primary font-semibold tracking-wide">
        JARVIS WEB OS
      </Link>
      
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Accedi al tuo account</h1>
          
          {error && (
            <div className="mb-6 p-3 rounded-md bg-red-500/20 text-red-300 flex items-center gap-2">
              <FiAlertCircle className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <FiMail />
                </span>
                <input
                  type="email"
                  className="w-full bg-surface-dark rounded-md py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary border border-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nome@esempio.com"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium">Password</label>
                <Link href="/reset-password" className="text-xs text-primary hover:underline">
                  Password dimenticata?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <FiLock />
                </span>
                <input
                  type="password"
                  className="w-full bg-surface-dark rounded-md py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary border border-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 rounded-md bg-primary hover:bg-primary-dark transition-colors font-medium flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-white/50">oppure continua con</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                onClick={() => handleOAuthSignIn("google")}
                className="py-2.5 px-4 rounded-md bg-white text-gray-800 hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <FcGoogle size={20} />
                <span>Google</span>
              </button>
              
              <button
                onClick={() => handleOAuthSignIn("github")}
                className="py-2.5 px-4 rounded-md bg-[#24292e] hover:bg-[#2c3137] transition-colors font-medium flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <FiGithub size={20} />
                <span>GitHub</span>
              </button>
            </div>
          </div>
          
          <p className="mt-6 text-center text-sm text-white/70">
            Non hai un account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}