// src/app/api/files/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";
import { WasabiStorageService } from "@/lib/services/wasabiStorageService";
import { ResourceLimiterService } from "@/lib/services/resourceLimiterService";
import { storageLimiterMiddleware } from "@/lib/middleware/storageLimiterMiddleware";

/**
 * POST: Gestisce l'upload di file con controllo dei limiti di storage
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

    // Estrai il file dalla richiesta
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentId = formData.get('parentId') as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "Nessun file ricevuto" },
        { status: 400 }
      );
    }

    // Ottieni la dimensione del file
    const fileSize = file.size;

    // Controlla se l'utente ha spazio sufficiente
    // Utilizziamo il middleware per verificare il limite di storage
    const limiterResponse = await storageLimiterMiddleware(request, fileSize);
    if (limiterResponse) {
      return limiterResponse; // Se il middleware ritorna una risposta, significa che l'utente ha superato il limite
    }

    // Se arriviamo qui, l'utente ha spazio sufficiente
    // Converti il file in array buffer
    const buffer = await file.arrayBuffer();
    
    // Genera una chiave per Wasabi
    const storageKey = WasabiStorageService.generateFileKey(session.user.id, file.name);
    
    // Determina il tipo MIME
    const contentType = file.type || determineContentType(file.name, '');
    
    // Carica il file su Wasabi
    const storageUrl = await WasabiStorageService.uploadFile(
      storageKey,
      Buffer.from(buffer),
      contentType
    );
    
    // Determina il percorso del file
    let path = `/${file.name}`;
    if (parentId) {
      const parentFolder = await FileStorageService.getFile(parentId, session.user.id);
      if (parentFolder && parentFolder.type === 'folder') {
        path = `${parentFolder.path}/${file.name}`;
      }
    }
    
    // Salva i metadati del file nel database
    const savedFile = await FileStorageService.saveFile({
      name: file.name,
      type: file.type || file.name.split('.').pop() || 'binary',
      size: fileSize,
      path: path,
      userId: session.user.id,
      parentId: parentId || undefined,
      storageKey,
      storageUrl
    });

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    console.error("Errore durante l'upload del file:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'upload del file" },
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