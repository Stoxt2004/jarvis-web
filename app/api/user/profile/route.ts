// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";

export async function PUT(request: NextRequest) {
  try {
    // Ottieni la sessione dell'utente
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }

    // Ottieni i dati dalla richiesta
    const { name, image } = await request.json();

    // Aggiorna il profilo utente
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        image: image || undefined,
      },
    });

    // Rimuovi la password dalla risposta
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(
      { message: "Profilo aggiornato con successo", user: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore durante l'aggiornamento del profilo:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'aggiornamento del profilo" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ottieni la sessione dell'utente
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Non autorizzato" },
        { status: 401 }
      );
    }

    // Ottieni i dati dell'utente dal database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        plan: true,
        createdAt: true,
        emailVerified: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utente non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero del profilo:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero del profilo" },
      { status: 500 }
    );
  }
}