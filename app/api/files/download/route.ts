// src/app/api/files/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";
import { WasabiStorageService } from "@/lib/services/wasabiStorageService";

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
    const fileId = searchParams.get("id");
    
    if (!fileId) {
      return NextResponse.json(
        { message: "ID file mancante" },
        { status: 400 }
      );
    }

    // Recupera il file dal database
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: session.user.id
      }
    });

    if (!file) {
      return NextResponse.json(
        { message: "File non trovato" },
        { status: 404 }
      );
    }

    // Se è una cartella, non è possibile scaricarla
    if (file.type === 'folder') {
      return NextResponse.json(
        { message: "Non è possibile scaricare una cartella" },
        { status: 400 }
      );
    }

    let fileContent: Buffer | string;
    let contentType: string;

    // Determina il tipo MIME
    contentType = determineContentType(file.name, file.type);

    // Ottieni il contenuto del file
    if (file.storageKey) {
      // Il file è su Wasabi, scaricalo da lì
      fileContent = await WasabiStorageService.downloadFile(file.storageKey);
    } else if (file.content) {
      // Il file è ancora nel database, usa il contenuto diretto
      fileContent = file.content;
    } else {
      return NextResponse.json(
        { message: "Contenuto del file non disponibile" },
        { status: 404 }
      );
    }

    // Crea una risposta con il contenuto del file
    const response = new NextResponse(fileContent);
    
    // Imposta gli header appropriati
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${file.name}"`);

    return response;

  } catch (error) {
    console.error("Errore durante il download del file:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il download del file" },
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
    'md': 'text/markdown',
    // JavaScript/JSON
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
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