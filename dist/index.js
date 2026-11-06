"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./core/config");
const db_1 = require("./core/db");
const dsgvo_1 = require("./core/middleware/dsgvo");
const auth_1 = require("./core/middleware/auth");
const bot_1 = require("./bot/bot");
// Module Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const drivers_routes_1 = __importDefault(require("./modules/drivers/drivers.routes"));
const seasons_routes_1 = __importDefault(require("./modules/seasons/seasons.routes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance.routes"));
const results_routes_1 = __importDefault(require("./modules/results/results.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const legal_routes_1 = __importDefault(require("./modules/legal/legal.routes"));
// Services für Homepage
const seasons_service_1 = require("./modules/seasons/seasons.service");
const results_service_1 = require("./modules/results/results.service");
const app = (0, express_1.default)();
// View Engine (EJS) - Unterstützt sowohl tsx in dev als auch kompiliertes dist in prod
const viewsPath = fs_1.default.existsSync(path_1.default.join(__dirname, 'views'))
    ? path_1.default.join(__dirname, 'views')
    : path_1.default.join(process.cwd(), 'src/views');
app.set('view engine', 'ejs');
app.set('views', viewsPath);
// Body Parser
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Trust Proxy (Essenziell für Nginx Reverse Proxy, korrekte Client-IPs & HTTPS Session Cookies)
app.set('trust proxy', 1);
// Statische Dateien
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// DSGVO-konforme First-Party Sessions (100% tracker-frei & Nginx Reverse-Proxy-ready)
app.use((0, express_session_1.default)({
    secret: config_1.config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Berücksichtigt X-Forwarded-Proto von Nginx
    cookie: {
        httpOnly: true,
        secure: config_1.config.isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    },
}));
// Globale Middlewares
app.use(dsgvo_1.dsgvoMiddleware);
app.use(auth_1.attachUser);
// Startseite
app.get('/', async (req, res) => {
    try {
        const nextRace = await seasons_service_1.SeasonsService.getNextUpcomingRace();
        const { driverStandings } = await results_service_1.ResultsService.getSeasonStandings();
        res.render('home/index', {
            pageTitle: 'the grid. - racing league | Offizielle Simracing-Plattform',
            nextRace,
            topDrivers: driverStandings,
            deleted: req.query.deleted === 'true',
        });
    }
    catch (err) {
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
app.use('/auth', auth_routes_1.default);
app.use('/driver', drivers_routes_1.default);
app.use('/', seasons_routes_1.default);
app.use('/attendance', attendance_routes_1.default);
app.use('/', results_routes_1.default);
app.use('/admin', admin_routes_1.default);
app.use('/', legal_routes_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).render('legal/impressum', {
        pageTitle: '404 - Seite nicht gefunden | the grid.',
    });
});
// Server Start & Initialisierung
async function startServer() {
    // 1. Datenbank verbinden
    await (0, db_1.connectDb)();
    // 2. Discord-Bot initialisieren (resilient, läuft auch offline ohne Crash)
    await bot_1.DiscordBot.init();
    // 3. HTTP Server lauschen
    app.listen(config_1.config.port, () => {
        console.log(`\n======================================================`);
        console.log(`🏁  the grid. - racing league Server läuft!`);
        console.log(`🌐  URL: http://localhost:${config_1.config.port}`);
        console.log(`🛡️   DSGVO-Compliance: Aktiviert (Tracker-frei, Art. 17 Self-Service)`);
        console.log(`🤖  Discord Bot: ${config_1.config.discord.botToken ? 'Online' : 'Offline-Modus'}`);
        console.log(`======================================================\n`);
    });
}
// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('\nFahre Server herunter...');
    await db_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\nFahre Server herunter...');
    await db_1.prisma.$disconnect();
    process.exit(0);
});
startServer();
