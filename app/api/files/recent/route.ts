// src/app/api/files/recent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";

/**
 * GET: Recupera i file recenti dell'utente
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    
    // Recupera i file recenti
    const recentFiles = await FileStorageService.getRecentFiles(session.user.id, limit);
    
    return NextResponse.json(recentFiles);
  } catch (error) {
    console.error("Errore durante il recupero dei file recenti:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero dei file recenti" },
      { status: 500 }
    );
  }
}