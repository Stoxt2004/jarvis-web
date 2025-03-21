// src/app/api/ai/executeCommand.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { command, params } = await request.json();
    let result;

    switch (command) {
      case "CREATE_FILE":
        result = await FileStorageService.saveFile({
          name: params.fileName,
          type: params.type || "txt",
          size: params.content ? new TextEncoder().encode(params.content).length : 0,
          content: params.content || "",
          userId: session.user.id,
          path: params.path || "/",
          parentId: params.parentId
        });
        break;
      
      case "DELETE_FILE":
        await FileStorageService.deleteFile(params.fileId, session.user.id);
        result = { success: true };
        break;
      
      // Aggiungi altri casi per le diverse operazioni...
      
      default:
        return NextResponse.json({ error: "Comando non supportato" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Errore nell'esecuzione del comando:", error);
    return NextResponse.json(
      { error: error.message || "Errore sconosciuto" },
      { status: 500 }
    );
  }
}