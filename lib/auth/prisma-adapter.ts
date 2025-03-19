// src/lib/auth/prisma-adapter.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function CustomPrismaAdapter() {
  return {
    ...PrismaAdapter(prisma),
    // Qui puoi estendere l'adattatore con funzioni personalizzate se necessario
  };
}

export { prisma };