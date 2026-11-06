"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDb = connectDb;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
async function connectDb() {
    try {
        await exports.prisma.$connect();
        console.log('📦 Datenbankverbindung (Prisma) erfolgreich hergestellt.');
    }
    catch (err) {
        console.error('❌ Fehler beim Verbinden mit der Datenbank:', err);
        process.exit(1);
    }
}
