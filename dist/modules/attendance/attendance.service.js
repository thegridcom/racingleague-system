"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const db_1 = require("../../core/db");
class AttendanceService {
    static async setAttendance(userId, raceId, status, notes) {
        return db_1.prisma.attendance.upsert({
            where: {
                raceId_userId: {
                    raceId,
                    userId,
                },
            },
            update: {
                status,
                notes: notes !== undefined ? notes : undefined,
                updatedAt: new Date(),
            },
            create: {
                raceId,
                userId,
                status,
                notes: notes || null,
            },
            include: {
                user: {
                    include: { team: true },
                },
                race: true,
            },
        });
    }
    static async getRaceAttendanceSummary(raceId) {
        const attendances = await db_1.prisma.attendance.findMany({
            where: { raceId },
            include: {
                user: {
                    include: { team: true },
                },
            },
            orderBy: { updatedAt: 'asc' },
        });
        const attending = attendances.filter((a) => a.status === 'ATTENDING');
        const absent = attendances.filter((a) => a.status === 'ABSENT');
        const reserve = attendances.filter((a) => a.status === 'RESERVE');
        return {
            total: attendances.length,
            attending,
            absent,
            reserve,
            counts: {
                attending: attending.length,
                absent: absent.length,
                reserve: reserve.length,
            },
        };
    }
}
exports.AttendanceService = AttendanceService;
