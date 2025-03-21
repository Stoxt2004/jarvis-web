// src/app/api/ai/command/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { FileStorageService } from "@/lib/services/fileStorage";

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Ottieni i dati dalla richiesta
    const data = await request.json();
    const { command, params } = data;
    let result;

    // Esegui il comando appropriato
    switch (command) {
      case "CREATE_FILE": {
        // Estrai parametri
        const { fileName, content = '', type, path = '/', parentId } = params;
        
        if (!fileName) {
          return NextResponse.json({ error: "Nome file non specificato" }, { status: 400 });
        }
        
        // Determina il tipo di file dall'estensione se non specificato
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        const fileType = type || fileExtension || 'txt';
        
        // Crea il percorso completo
        const fullFilePath = path.endsWith('/') ? `${path}${fileName}` : `${path}/${fileName}`;
        
        // Calcola la dimensione approssimativa del contenuto in byte
        const size = content ? new TextEncoder().encode(content).length : 0;
        
        // Salva il file utilizzando il servizio di storage
        const file = await FileStorageService.saveFile({
          name: fileName,
          type: fileType,
          size,
          content,
          userId: session.user.id,
          path: fullFilePath,
          parentId
        });
        
        result = { success: true, file };
        break;
      }
        
      case "DELETE_FILE": {
        const { fileId, fileName: deleteFileName, filePath: deleteFilePath } = params;
        
        if (fileId) {
          await FileStorageService.deleteFile(fileId, session.user.id);
          result = { success: true };
        } else if (deleteFilePath) {
          const file = await FileStorageService.getFileByPath(deleteFilePath, session.user.id);
          if (!file) {
            return NextResponse.json({ error: `File non trovato al percorso ${deleteFilePath}` }, { status: 404 });
          }
          
          await FileStorageService.deleteFile(file.id, session.user.id);
          result = { success: true };
        } else if (deleteFileName) {
          // Cerca il file nella root (semplificato)
          const rootFiles = await FileStorageService.getRootFiles(session.user.id);
          const file = rootFiles.find(f => f.name.toLowerCase() === deleteFileName.toLowerCase());
          
          if (!file) {
            return NextResponse.json({ error: `File non trovato con nome ${deleteFileName}` }, { status: 404 });
          }
          
          await FileStorageService.deleteFile(file.id, session.user.id);
          result = { success: true };
        } else {
          return NextResponse.json({ error: "Informazioni file insufficienti per l'eliminazione" }, { status: 400 });
        }
        break;
      }
      
      case "READ_FILE": {
        const { fileId: readFileId, fileName: readFileName, filePath: readFilePath } = params;
        let fileContent;
        
        if (readFileId) {
          fileContent = await FileStorageService.getFile(readFileId, session.user.id);
        } else if (readFilePath) {
          fileContent = await FileStorageService.getFileByPath(readFilePath, session.user.id);
        } else if (readFileName) {
          // Cerca nella root
          const rootFiles = await FileStorageService.getRootFiles(session.user.id);
          fileContent = rootFiles.find(f => f.name.toLowerCase() === readFileName.toLowerCase());
        }
        
        if (!fileContent) {
          return NextResponse.json({ error: "File non trovato" }, { status: 404 });
        }
        
        result = { success: true, file: fileContent };
        break;
      }
      
      case "SEARCH_FILES": {
        const { query, type: searchType } = params;
        
        if (!query) {
          return NextResponse.json({ error: "Query di ricerca non specificata" }, { status: 400 });
        }
        
        // Implementazione semplificata: cerca solo nei file della root
        const rootFiles = await FileStorageService.getRootFiles(session.user.id);
        
        // Filtra i file in base alla query e (opzionalmente) al tipo
        const filteredFiles = rootFiles.filter(file => {
          const nameMatch = file.name.toLowerCase().includes(query.toLowerCase());
          const typeMatch = searchType ? file.type === searchType : true;
          return nameMatch && typeMatch;
        });
        
        result = { success: true, files: filteredFiles };
        break;
      }
      
      default:
        return NextResponse.json({ error: `Comando '${command}' non supportato` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Errore nell'API AI command:", error);
    return NextResponse.json(
      { error: error.message || "Errore sconosciuto" },
      { status: 500 }
    );
  }
}