import { PrismaClient } from '@prisma/client';
import { TEAMS_2026, TRACKS_2026 } from '../src/core/motorsport-assets';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding "the grid. - racing league" database (Produktiv-Setup)...');

  // 1. Alle Demo-Fahrer und zugehörige Test-Daten entfernen
  const demoUsers = await prisma.user.findMany({
    where: {
      discordId: {
        startsWith: 'dev_',
      },
    },
  });

  if (demoUsers.length > 0) {
    const demoIds = demoUsers.map((u) => u.id);
    await prisma.attendance.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.raceResult.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.user.deleteMany({ where: { id: { in: demoIds } } });
    console.log(`🧹 ${demoUsers.length} Demo-Fahrer und zugehörige Test-Daten wurden vollständig entfernt.`);
  }

  // Veraltete Demo-Ergebnisse ohne User ebenfalls bereinigen
  await prisma.raceResult.deleteMany({
    where: {
      OR: [
        { driverName: { startsWith: 'Fahrer ' } },
        { driverName: 'SpeedyGonzales' },
        { driverName: 'GRID_Apex' },
        { driverName: 'RossoCorsa_99' },
        { driverName: 'Chili_55' },
        { driverName: 'Lando_4' },
        { driverName: 'SirLewis_44' },
        { driverName: 'AudiVorsprung_27' },
        { driverName: 'CadillacVSeries_8' },
        { driverName: 'FreshApex_77' },
      ],
    },
  });

  // 2. Veraltetes Kick Sauber (SAU) Team entfernen
  const oldSauber = await prisma.team.findUnique({ where: { shortCode: 'SAU' } });
  if (oldSauber) {
    await prisma.user.updateMany({
      where: { teamId: oldSauber.id },
      data: { teamId: null },
    });
    await prisma.team.delete({ where: { id: oldSauber.id } });
  }

  // 3. Die 11 offiziellen F1-Teams für 2026 anlegen / aktualisieren (inkl. Audi & Cadillac)
  const createdTeams = new Map<string, string>();
  for (const t of TEAMS_2026) {
    const team = await prisma.team.upsert({
      where: { shortCode: t.shortCode },
      update: {
        name: t.name,
        colorHex: t.colorHex,
        logoUrl: t.logoSvg,
      },
      create: {
        name: t.name,
        shortCode: t.shortCode,
        colorHex: t.colorHex,
        logoUrl: t.logoSvg,
      },
    });
    createdTeams.set(t.shortCode, team.id);
  }
  console.log(`✅ ${createdTeams.size} offizielle 2026 Rennteams initialisiert.`);

  // 4. Meisterschafts-Saison 2026 anlegen
  const season = await prisma.season.upsert({
    where: { id: 'season-2026-1' },
    update: {
      name: 'Offizielle FIA Formel 1 Meisterschaft 2026',
      status: 'ACTIVE',
    },
    create: {
      id: 'season-2026-1',
      name: 'Offizielle FIA Formel 1 Meisterschaft 2026',
      year: 2026,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Saison "${season.name}" initialisiert.`);

  // 5. Rennkalender mit Vektor-Streckenlayouts anlegen (alle Rennen auf UPCOMING setzen)
  for (const r of TRACKS_2026) {
    const existing = await prisma.race.findFirst({
      where: { seasonId: season.id, roundNumber: r.roundNumber },
    });

    if (existing) {
      await prisma.race.update({
        where: { id: existing.id },
        data: {
          trackName: r.trackName,
          country: r.country,
          flagEmoji: r.flagEmoji,
          trackLayoutSvg: r.svgPath,
          lengthKm: r.lengthKm,
          laps: r.laps,
          date: r.date,
          status: 'UPCOMING', // Saubere, noch nicht gestartete Saison
        },
      });
    } else {
      await prisma.race.create({
        data: {
          seasonId: season.id,
          roundNumber: r.roundNumber,
          trackName: r.trackName,
          country: r.country,
          flagEmoji: r.flagEmoji,
          trackLayoutSvg: r.svgPath,
          lengthKm: r.lengthKm,
          laps: r.laps,
          date: r.date,
          status: 'UPCOMING',
        },
      });
    }
  }
  console.log(`✅ ${TRACKS_2026.length} Strecken im Kalender (Startbereit für echte Fahrer).`);
  console.log('🏁 Datenbank ist nun 100% sauber ohne Demo-Fahrer!');
}

main()
  .catch((e) => {
    console.error('Fehler beim Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
