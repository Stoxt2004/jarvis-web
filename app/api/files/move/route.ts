// app/api/files/move/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";

export async function POST(request: NextRequest) {
  try {
    // Verifica l'autenticazione
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
    }

    // Log per debug
    console.log("API move file chiamata - sessione:", session.user.id);
    
    // Ottieni i dati dalla richiesta
    const data = await request.json();
    const { fileId, targetFolderId } = data;
    
    console.log("Dati ricevuti:", { fileId, targetFolderId });
    
    // Verifica che i parametri siano validi
    if (!fileId || !targetFolderId) {
      return NextResponse.json({ message: "Parametri mancanti" }, { status: 400 });
    }
    
    // Esegui lo spostamento
    const result = await FileStorageService.moveFile(fileId, targetFolderId, session.user.id);
    console.log("File spostato con successo:", result);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Errore nello spostamento del file:", error);
    return NextResponse.json(
      { message: error.message || "Si è verificato un errore durante lo spostamento del file" },
      { status: 500 }
    );
  }
}