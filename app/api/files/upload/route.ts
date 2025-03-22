// src/app/api/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";
import { WasabiStorageService } from "@/lib/services/wasabiStorageService"; // Aggiungi questa importazione

/**
 * GET: Recupera i file dell'utente
 * - Si può passare ?path= per ottenere i file in un percorso specifico
 * - Si può passare ?id= per ottenere un file specifico
 * - Senza parametri, restituisce i file nella root
 */
export async function GET(request: NextRequest) {
  try {
    // Il resto della funzione GET rimane invariato
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

    // NUOVA SEZIONE: Gestione esplicita di Wasabi per i file non-cartella
    let storageKey = null;
    let storageUrl = null;
    
    if (data.type !== 'folder' && data.content !== undefined) {
      // Genera una chiave per Wasabi
      storageKey = WasabiStorageService.generateFileKey(session.user.id, data.name);
      
      // Determina il tipo MIME basato sul tipo di file
      const contentType = determineContentType(data.name, data.type);
      
      try {
        // Carica il file su Wasabi
        storageUrl = await WasabiStorageService.uploadFile(
          storageKey,
          data.content || '', // Anche se il contenuto è vuoto, crea il file su Wasabi
          contentType
        );
        
        console.log(`File ${data.name} caricato su Wasabi: ${storageUrl}`);
      } catch (uploadError) {
        console.error("Errore durante il caricamento su Wasabi:", uploadError);
        // Non fallire completamente se il caricamento su Wasabi fallisce
        // Continua a salvare nel database, ma senza i riferimenti a Wasabi
        storageKey = null;
        storageUrl = null;
      }
    }

    // Salva il file nel database, possibilmente con riferimenti a Wasabi
    const file = await FileStorageService.saveFile({
      ...data,
      userId: session.user.id,
      storageKey, // Aggiungi storageKey ai dati
      storageUrl, // Aggiungi storageUrl ai dati
      // Se il file è stato caricato su Wasabi, non memorizzare il contenuto nel database
      ...(storageUrl ? { content: null } : {})
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
  // Il resto della funzione PUT rimane invariato
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
  // Il resto della funzione DELETE rimane invariato
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

/**
 * Determina il tipo di contenuto MIME in base all'estensione del file
 */
function determineContentType(fileName: string, fileType: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Testo
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'csv': 'text/csv',
    // JavaScript/JSON
    'js': 'application/javascript',
    'json': 'application/json',
    // Immagini
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    // Documenti
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Archivi
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'gz': 'application/gzip',
    // Altri
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
  };
  
  if (extension && mimeTypes[extension]) {
    return mimeTypes[extension];
  }
  
  // Tipo generico basato sul tipo di file
  if (fileType === 'image') return 'image/png';
  if (fileType === 'video') return 'video/mp4';
  if (fileType === 'audio') return 'audio/mpeg';
  
  // Usa application/octet-stream come fallback
  return 'application/octet-stream';
}