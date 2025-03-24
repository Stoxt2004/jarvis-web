// src/app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/auth/prisma-adapter";

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

    // Ottieni l'utente dal database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utente non trovato" },
        { status: 404 }
      );
    }

    // Preferenze predefinite
    const defaultPreferences = {
      theme: 'dark',
      language: 'it',
      timezone: 'Europe/Rome',
      notifications: {
        email: true,
        browser: true,
        sound: true,
      },
      aiAssistant: {
        voiceEnabled: true,
        voiceActivation: true,
        personality: 'friendly',
      },
    };

    // Unisci le preferenze predefinite con quelle dell'utente
    const preferences = typeof user.preferences === 'object' && user.preferences !== null && !Array.isArray(user.preferences)
  ? { ...defaultPreferences, ...user.preferences }
  : defaultPreferences;

    return NextResponse.json({ preferences }, { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero delle preferenze:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante il recupero delle preferenze" },
      { status: 500 }
    );
  }
}

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
    const { preferences } = await request.json();

    if (!preferences) {
      return NextResponse.json(
        { message: "Dati preferenze mancanti" },
        { status: 400 }
      );
    }

    // Aggiorna le preferenze dell'utente
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: preferences,
      },
    });

    return NextResponse.json(
      { message: "Preferenze aggiornate con successo", preferences },
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle preferenze:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante l'aggiornamento delle preferenze" },
      { status: 500 }
    );
  }
}