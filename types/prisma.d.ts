// types/prisma.d.ts
import { Prisma, File as PrismaFile } from '@prisma/client';

// Estendi l'interfaccia File di Prisma per aggiungere i nuovi campi
declare global {
  namespace PrismaJson {
    type FilePreferences = any;
  }
}

// Estendi il tipo File per includere i nuovi campi
declare module '@prisma/client' {
  interface File {
    id: string;
    name: string;
    type: string;
    size: number;
    path: string;
    content: string | null;
    isPublic: boolean;
    storageKey: string | null;
    storageUrl: string | null;
    parentId: string | null;
    userId: string;
    workspaceId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
}