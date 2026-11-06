import express, { Request, Response } from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { config } from './core/config';
import { connectDb, prisma } from './core/db';
import { dsgvoMiddleware } from './core/middleware/dsgvo';
import { attachUser } from './core/middleware/auth';
import { DiscordBot } from './bot/bot';

// Module Routes
import authRoutes from './modules/auth/auth.routes';
import driverRoutes from './modules/drivers/drivers.routes';
import seasonsRoutes from './modules/seasons/seasons.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import resultsRoutes from './modules/results/results.routes';
import adminRoutes from './modules/admin/admin.routes';
import legalRoutes from './modules/legal/legal.routes';

// Services für Homepage
import { SeasonsService } from './modules/seasons/seasons.service';
import { ResultsService } from './modules/results/results.service';

const app = express();

// View Engine (EJS) - Unterstützt sowohl tsx in dev als auch kompiliertes dist in prod
const viewsPath = fs.existsSync(path.join(__dirname, 'views'))
  ? path.join(__dirname, 'views')
  : path.join(process.cwd(), 'src/views');
app.set('view engine', 'ejs');
app.set('views', viewsPath);

// Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Trust Proxy (Essenziell für Nginx Reverse Proxy, korrekte Client-IPs & HTTPS Session Cookies)
app.set('trust proxy', 1);

// Statische Dateien
app.use(express.static(path.join(__dirname, '../public')));

// DSGVO-konforme First-Party Sessions (100% tracker-frei & Nginx Reverse-Proxy-ready)
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Berücksichtigt X-Forwarded-Proto von Nginx
    cookie: {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    },
  })
);

// Globale Middlewares
app.use(dsgvoMiddleware);
app.use(attachUser);

// Startseite
app.get('/', async (req: Request, res: Response) => {
  try {
    const nextRace = await SeasonsService.getNextUpcomingRace();
    const { driverStandings } = await ResultsService.getSeasonStandings();

    res.render('home/index', {
      pageTitle: 'the grid. - racing league | Offizielle Simracing-Plattform',
      nextRace,
      topDrivers: driverStandings,
      deleted: req.query.deleted === 'true',
    });
  } catch (err) {
    console.error('Fehler beim Laden der Startseite:', err);
    res.render('home/index', {
      pageTitle: 'the grid. - racing league',
      nextRace: null,
      topDrivers: [],
      deleted: false,
    });
  }
});

// Modul-Routen registrieren
app.use('/auth', authRoutes);
app.use('/driver', driverRoutes);
app.use('/', seasonsRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/', resultsRoutes);
app.use('/admin', adminRoutes);
app.use('/', legalRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).render('legal/impressum', {
    pageTitle: '404 - Seite nicht gefunden | the grid.',
  });
});

// Server Start & Initialisierung
async function startServer() {
  // 1. Datenbank verbinden
  await connectDb();

  // 2. Discord-Bot initialisieren (resilient, läuft auch offline ohne Crash)
  await DiscordBot.init();

  // 3. HTTP Server lauschen
  app.listen(config.port, () => {
    console.log(`\n======================================================`);
    console.log(`🏁  the grid. - racing league Server läuft!`);
    console.log(`🌐  URL: http://localhost:${config.port}`);
    console.log(`🛡️   DSGVO-Compliance: Aktiviert (Tracker-frei, Art. 17 Self-Service)`);
    console.log(`🤖  Discord Bot: ${config.discord.botToken ? 'Online' : 'Offline-Modus'}`);
    console.log(`======================================================\n`);
  });
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\nFahre Server herunter...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nFahre Server herunter...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
