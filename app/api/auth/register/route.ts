// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/prisma-adapter";
import { hashPassword } from "@/lib/auth/password-utils";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validazione base
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Dati mancanti" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "La password deve essere lunga almeno 8 caratteri" },
        { status: 400 }
      );
    }

    // Verifica se l'email è già in uso
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email già registrata" },
        { status: 409 }
      );
    }

    // Hash della password
    const hashedPassword = await hashPassword(password);

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Valori predefiniti
        role: "USER",
        plan: "FREE",
      },
    });

    // Crea un workspace predefinito per l'utente
    await prisma.workspace.create({
      data: {
        name: "Workspace Predefinito",
        userId: user.id,
        isDefault: true,
        data: {},
      },
    });

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: "Utente registrato con successo", 
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    return NextResponse.json(
      { message: "Si è verificato un errore durante la registrazione" },
      { status: 500 }
    );
  }
}