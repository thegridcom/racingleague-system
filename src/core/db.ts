import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDb() {
  try {
    await prisma.$connect();
    console.log('📦 Datenbankverbindung (Prisma) erfolgreich hergestellt.');
  } catch (err) {
    console.error('❌ Fehler beim Verbinden mit der Datenbank:', err);
    process.exit(1);
  }
}

