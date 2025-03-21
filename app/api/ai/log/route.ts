import { NextResponse } from 'next/server';
import { prisma } from '@/lib/auth/prisma-adapter';

export async function POST(req: Request) {
  try {
    const { userId, type, tokenCount, successful } = await req.json();
    
    await prisma.aIRequestLog.create({
      data: {
        userId,
        type,
        tokenCount,
        successful
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nel logging della richiesta AI:", error);
    return NextResponse.json(
      { error: "Errore nel logging della richiesta" },
      { status: 500 }
    );
  }
}
