// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  
  // Percorsi pubblici che non richiedono autenticazione
  const publicPaths = ["/", "/login", "/register", "/api/auth"];
  
  // Controlla se il percorso attuale è pubblico
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path + "/")
  );
  
  // Se l'utente non è autenticato e sta cercando di accedere a una pagina protetta
  if (!isAuthenticated && !isPublicPath) {
    // Reindirizza alla pagina di login con redirect_url
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Se l'utente è autenticato e sta cercando di accedere alla pagina di login o registrazione
  if (isAuthenticated && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    // Reindirizza alla dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // In tutti gli altri casi, procedi normalmente
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