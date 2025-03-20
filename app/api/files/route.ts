// src/app/api/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";

/**
 * GET: Recupera i file dell'utente
 * - Si può passare ?path= per ottenere i file in un percorso specifico
 * - Si può passare ?id= per ottenere un file specifico
 * - Senza parametri, restituisce i file nella root
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
    const path = searchParams.get("path");
    const fileId = searchParams.get("id");
    const workspaceId = searchParams.get("workspace") || undefined;

    // Se è stato fornito un ID, restituisci il file specifico
    if (fileId) {
      const file = await FileStorageService.getFile(fileId, session.user.id);
      if (!file) {
        return NextResponse.json(
          { message: "File non trovato" },
          { status: 404 }
        );
      }
      return NextResponse.json(file);
    }

    // Se è stato fornito un percorso, restituisci i file in quel percorso
    if (path) {
      const file = await FileStorageService.getFileByPath(path, session.user.id, workspaceId);
      
      // Se il percorso è una cartella, restituisci i suoi contenuti
      if (file && file.type === 'folder') {
        const files = await FileStorageService.getFilesInFolder(file.id, session.user.id, workspaceId);
        return NextResponse.json(files);
      }
      
      // Altrimenti restituisci il file
      if (file) {
        return NextResponse.json(file);
      }
      
      return NextResponse.json(
        { message: "Percorso non trovato" },
        { status: 404 }
      );
    }

    // Senza parametri, restituisci i file nella root
    const rootFiles = await FileStorageService.getRootFiles(session.user.id, workspaceId);
    return NextResponse.json(rootFiles);
  } catch (error) {
    console.error("Errore durante il recupero dei file:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero dei file" },
      { status: 500 }
    );
  }
}

/**
 * POST: Salva un nuovo file
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
    
    // Controlla che i campi obbligatori siano presenti
    if (!data.name || !data.type || data.size === undefined || !data.path) {
      return NextResponse.json(
        { message: "Dati incompleti" },
        { status: 400 }
      );
    }

    // Salva il file
    const file = await FileStorageService.saveFile({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error("Errore durante il salvataggio del file:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il salvataggio del file" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Aggiorna un file esistente
 */
export async function PUT(request: NextRequest) {
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
    
    // Controlla che l'ID del file sia presente
    if (!data.id) {
      return NextResponse.json(
        { message: "ID file mancante" },
        { status: 400 }
      );
    }

    // Verifica che il file esista e appartenga all'utente
    const existingFile = await FileStorageService.getFile(data.id, session.user.id);
    if (!existingFile) {
      return NextResponse.json(
        { message: "File non trovato o non autorizzato" },
        { status: 404 }
      );
    }

    // Se è una richiesta di rinomina, usa il metodo appropriato
    if (data.newName) {
      const renamedFile = await FileStorageService.renameFile(
        data.id, 
        data.newName, 
        session.user.id
      );
      return NextResponse.json(renamedFile);
    }

    // Altrimenti, aggiorna il contenuto del file
const updatedFile = await FileStorageService.saveFile({
    ...existingFile,
    ...(data.content !== undefined && { content: data.content }),
    ...(data.size !== undefined && { size: data.size }),
    userId: session.user.id,
    workspaceId: existingFile.workspaceId || undefined, // Converti null in undefined
    parentId: existingFile.parentId || undefined,       // Converti null in undefined
  });

    return NextResponse.json(updatedFile);
  } catch (error: any) {
    console.error("Errore durante l'aggiornamento del file:", error);
    return NextResponse.json(
      { message: error.message || "Si è verificato un errore durante l'aggiornamento del file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Elimina un file
 */
export async function DELETE(request: NextRequest) {
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
    const fileId = searchParams.get("id");
    
    if (!fileId) {
      return NextResponse.json(
        { message: "ID file mancante" },
        { status: 400 }
      );
    }

    // Elimina il file
    await FileStorageService.deleteFile(fileId, session.user.id);

    return NextResponse.json({ message: "File eliminato con successo" });
  } catch (error: any) {
    console.error("Errore durante l'eliminazione del file:", error);
    return NextResponse.json(
      { message: error.message || "Si è verificato un errore durante l'eliminazione del file" },
      { status: 500 }
    );
  }
}