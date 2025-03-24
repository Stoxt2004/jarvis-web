// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Add console logging for debugging
  console.log(`Middleware called for path: ${request.nextUrl.pathname}`);
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Log authentication status
  console.log(`Authentication status: ${!!token ? 'Authenticated' : 'Not authenticated'}`);
  
  const isAuthenticated = !!token;
  
  // Percorsi pubblici che non richiedono autenticazione
  const publicPaths = ["/", "/login", "/register", "/api/auth"];
  
  // Controlla se il percorso attuale è pubblico
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path + "/")
  );
  
  console.log(`Is public path: ${isPublicPath}`);
  
  // Se l'utente non è autenticato e sta cercando di accedere a una pagina protetta
  if (!isAuthenticated && !isPublicPath) {
    console.log(`Redirecting unauthenticated user to login from: ${request.nextUrl.pathname}`);
    // Reindirizza alla pagina di login con redirect_url
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Se l'utente è autenticato e sta cercando di accedere alla pagina di login o registrazione
  if (isAuthenticated && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    console.log(`Redirecting authenticated user to dashboard from: ${request.nextUrl.pathname}`);
    // Reindirizza alla dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // In tutti gli altri casi, procedi normalmente
  console.log(`Proceeding normally for: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

// Configura quali rotte dovrebbero essere verificate dal middleware
export const config = {
  matcher: [
    /*
     * Corrispondenza di tutte le richieste di route eccetto:
     * 1. Richieste per risorse statiche (es. immagini, JS, CSS, ecc.)
     * 2. Richieste API diverse da auth (gestite separatamente)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/(?!auth)).*)",
  ],
};