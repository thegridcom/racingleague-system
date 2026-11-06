"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Admin-Rollen als Array parsen (unterstützt Komma-getrennte Liste mehrerer Rollen-IDs)
const rawAdminRoles = process.env.ADMIN_ROLE_IDS || process.env.ADMIN_ROLE_ID || '1549347126398685304,1544650644747714630';
const adminRoleIds = rawAdminRoles
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
exports.config = {
    port: parseInt(process.env.PORT || '8422', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    baseUrl: process.env.BASE_URL || 'http://localhost:8422',
    sessionSecret: process.env.SESSION_SECRET || 'thegrid-racing-super-secret-key-change-in-production',
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    // Discord OAuth2
    discord: {
        clientId: process.env.DISCORD_CLIENT_ID || '',
        clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
        redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:8422/auth/discord/callback',
        botToken: process.env.DISCORD_BOT_TOKEN || '',
        guildId: process.env.DISCORD_GUILD_ID || '',
        adminRoleIds, // Array aller gültigen Admin-Rollen-IDs
        adminRoleId: adminRoleIds[0] || '', // Für Abwärtskompatibilität
        driverRoleId: process.env.DRIVER_ROLE_ID || '1545431083905065071',
        reserveRoleId: process.env.RESERVE_ROLE_ID || '',
        standingsChannelId: process.env.DISCORD_STANDINGS_CHANNEL_ID || '',
        checkinChannelId: process.env.DISCORD_CHECKIN_CHANNEL_ID || '',
        rosterChannelId: process.env.DISCORD_ROSTER_CHANNEL_ID || '1568279489463586979',
    },
    // Developer mode
    devLoginEnabled: process.env.DEV_LOGIN_ENABLED === 'true' || process.env.NODE_ENV !== 'production',
    // Community & Legal Disclaimer (Verpflichtend laut Anforderung)
    disclaimer: `the grid. - racing league ist eine reine private Freizeit-Community ohne kommerzielle Absichten. Diese Plattform und Community stehen in keiner geschäftlichen oder offiziellen Verbindung zur Formula One Group, Electronic Arts Inc., Codemasters oder der FIA. 'F1', 'FORMULA 1' sowie alle Team- und Markennamen sind geschützte Marken der jeweiligen Rechteinhaber und werden hier ausschließlich zu Beschreibungs- und Zuordnungszwecken im Rahmen privater Gaming-Lobbys genutzt.`,
};
