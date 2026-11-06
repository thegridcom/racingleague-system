import { prisma } from '../../core/db';
import { AttendanceStatus } from '../../core/types';

export class AttendanceService {
  public static async setAttendance(userId: string, raceId: string, status: AttendanceStatus, notes?: string) {
    return prisma.attendance.upsert({
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

  public static async getRaceAttendanceSummary(raceId: string) {
    const attendances = await prisma.attendance.findMany({
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

