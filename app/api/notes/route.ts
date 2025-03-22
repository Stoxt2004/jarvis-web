// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";

/**
 * GET: Recupera le note dell'utente
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
    const workspaceId = searchParams.get("workspaceId");
    const noteId = searchParams.get("id");
    const tag = searchParams.get("tag");
    
    // Se viene fornito un ID nota specifico, restituisci solo quella nota
    if (noteId) {
      const note = await prisma.note.findUnique({
        where: {
          id: noteId,
          userId: session.user.id
        }
      });
      
      if (!note) {
        return NextResponse.json(
          { message: "Nota non trovata" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(note);
    }
    
    // Costruisci la query di filtro in base ai parametri
    const where = {
      userId: session.user.id,
      ...(workspaceId ? { workspaceId } : {}),
      ...(tag ? { tags: { has: tag } } : {})
    };
    
    // Recupera le note filtrate
    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Errore durante il recupero delle note:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero delle note" },
      { status: 500 }
    );
  }
}

/**
 * POST: Crea una nuova nota
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

    // Ottieni i dati dalla richiesta
    const noteData = await request.json();
    
    // Verifica che il titolo sia presente
    if (!noteData.title) {
      return NextResponse.json(
        { message: "Titolo mancante" },
        { status: 400 }
      );
    }

    // Crea la nota
    const note = await prisma.note.create({
      data: {
        title: noteData.title,
        content: noteData.content || "",
        color: noteData.color,
        isPinned: noteData.isPinned || false,
        tags: noteData.tags || [],
        userId: session.user.id,
        workspaceId: noteData.workspaceId
      }
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione della nota:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante la creazione della nota" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Aggiorna una nota esistente
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

    // Ottieni i dati dalla richiesta
    const noteData = await request.json();
    
    // Verifica che l'ID della nota sia presente
    if (!noteData.id) {
      return NextResponse.json(
        { message: "ID nota mancante" },
        { status: 400 }
      );
    }

    // Verifica che la nota esista e appartenga all'utente
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteData.id,
        userId: session.user.id
      }
    });

    if (!existingNote) {
      return NextResponse.json(
        { message: "Nota non trovata o non autorizzata" },
        { status: 404 }
      );
    }

    // Aggiorna la nota
    const updatedNote = await prisma.note.update({
      where: { id: noteData.id },
      data: {
        title: noteData.title,
        content: noteData.content,
        color: noteData.color,
        isPinned: noteData.isPinned,
        tags: noteData.tags,
        workspaceId: noteData.workspaceId
      }
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Errore durante l'aggiornamento della nota:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'aggiornamento della nota" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Elimina una nota
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
    const noteId = searchParams.get("id");
    
    if (!noteId) {
      return NextResponse.json(
        { message: "ID nota mancante" },
        { status: 400 }
      );
    }

    // Verifica che la nota esista e appartenga all'utente
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: session.user.id
      }
    });

    if (!note) {
      return NextResponse.json(
        { message: "Nota non trovata o non autorizzata" },
        { status: 404 }
      );
    }

    // Elimina la nota
    await prisma.note.delete({
      where: { id: noteId }
    });

    return NextResponse.json({ message: "Nota eliminata con successo" });
  } catch (error) {
    console.error("Errore durante l'eliminazione della nota:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'eliminazione della nota" },
      { status: 500 }
    );
  }
}