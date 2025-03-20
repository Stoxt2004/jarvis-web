// src/app/api/files/folder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";

/**
 * POST: Crea una nuova cartella
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }

    // Ottieni i dati dal corpo della richiesta
    const data = await request.json();
    
    // Verifica che il nome della cartella sia fornito
    if (!data.name) {
      return NextResponse.json(
        { message: "Nome cartella mancante" },
        { status: 400 }
      );
    }

    // Crea la cartella
    const folder = await FileStorageService.createFolder(
      data.name,
      data.parentId || null,
      session.user.id,
      data.workspaceId
    );

    return NextResponse.json(folder, { status: 201 });
  } catch (error: any) {
    console.error("Errore durante la creazione della cartella:", error);
    return NextResponse.json(
      { message: error.message || "Si è verificato un errore durante la creazione della cartella" },
      { status: 500 }
    );
  }
}

/**
 * GET: Ottieni i contenuti di una cartella
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
    const folderId = searchParams.get("id");
    const workspaceId = searchParams.get("workspace") || undefined;
    
    if (!folderId) {
      // Se non è fornito un ID cartella, restituisci i file nella root
      const rootFiles = await FileStorageService.getRootFiles(
        session.user.id,
        workspaceId
      );
      return NextResponse.json(rootFiles);
    }

    // Verifica che la cartella esista
    const folder = await FileStorageService.getFile(folderId, session.user.id);
    if (!folder || folder.type !== 'folder') {
      return NextResponse.json(
        { message: "Cartella non trovata" },
        { status: 404 }
      );
    }

    // Ottieni i file nella cartella
    const files = await FileStorageService.getFilesInFolder(
      folderId,
      session.user.id,
      workspaceId
    );

    return NextResponse.json(files);
  } catch (error) {
    console.error("Errore durante il recupero dei file:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero dei file" },
      { status: 500 }
    );
  }
}