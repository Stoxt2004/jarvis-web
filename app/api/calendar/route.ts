// src/app/api/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";

/**
 * GET: Recupera gli eventi del calendario dell'utente
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
    const eventId = searchParams.get("id");
    
    // Se viene fornito un ID evento specifico, restituisci solo quell'evento
    if (eventId) {
      const event = await prisma.calendarEvent.findUnique({
        where: {
          id: eventId,
          userId: session.user.id
        }
      });
      
      if (!event) {
        return NextResponse.json(
          { message: "Evento non trovato" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(event);
    }
    
    // Altrimenti, restituisci tutti gli eventi dell'utente (possibilmente filtrati per workspace)
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: session.user.id,
        ...(workspaceId ? { workspaceId } : {})
      },
      orderBy: {
        start: 'asc'
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Errore durante il recupero degli eventi:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero degli eventi" },
      { status: 500 }
    );
  }
}

/**
 * POST: Crea un nuovo evento del calendario
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
    const eventData = await request.json();
    
    // Verifica che i campi obbligatori siano presenti
    if (!eventData.title || !eventData.start || !eventData.end) {
      return NextResponse.json(
        { message: "Dati evento incompleti" },
        { status: 400 }
      );
    }

    // Crea l'evento
    const event = await prisma.calendarEvent.create({
      data: {
        title: eventData.title,
        description: eventData.description || null,
        location: eventData.location || null,
        start: new Date(eventData.start),
        end: new Date(eventData.end),
        reminder: eventData.reminder || false,
        reminderTime: eventData.reminderTime || 15,
        color: eventData.color || null,
        userId: session.user.id,
        workspaceId: eventData.workspaceId || null
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione dell'evento:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante la creazione dell'evento" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Aggiorna un evento del calendario esistente
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
    const eventData = await request.json();
    
    // Verifica che l'ID dell'evento sia presente
    if (!eventData.id) {
      return NextResponse.json(
        { message: "ID evento mancante" },
        { status: 400 }
      );
    }

    // Verifica che l'evento esista e appartenga all'utente
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventData.id,
        userId: session.user.id
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { message: "Evento non trovato o non autorizzato" },
        { status: 404 }
      );
    }

    // Aggiorna l'evento
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventData.id },
      data: {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: new Date(eventData.start),
        end: new Date(eventData.end),
        reminder: eventData.reminder,
        reminderTime: eventData.reminderTime,
        color: eventData.color,
        workspaceId: eventData.workspaceId
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'evento:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'aggiornamento dell'evento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Elimina un evento del calendario
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
    const eventId = searchParams.get("id");
    
    if (!eventId) {
      return NextResponse.json(
        { message: "ID evento mancante" },
        { status: 400 }
      );
    }

    // Verifica che l'evento esista e appartenga all'utente
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId: session.user.id
      }
    });

    if (!event) {
      return NextResponse.json(
        { message: "Evento non trovato o non autorizzato" },
        { status: 404 }
      );
    }

    // Elimina l'evento
    await prisma.calendarEvent.delete({
      where: { id: eventId }
    });

    return NextResponse.json({ message: "Evento eliminato con successo" });
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'evento:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'eliminazione dell'evento" },
      { status: 500 }
    );
  }
}