"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const auth_service_1 = require("./auth.service");
const db_1 = require("../../core/db");
const config_1 = require("../../core/config");
class AuthController {
    static getLoginPage(req, res) {
        if (req.session.user) {
            return res.redirect('/driver/dashboard');
        }
        res.render('auth/login', {
            pageTitle: 'Anmelden | the grid. - racing league',
            devLoginEnabled: config_1.config.devLoginEnabled,
        });
    }
    static redirectToDiscord(req, res) {
        const state = crypto_1.default.randomBytes(16).toString('hex');
        req.session.oauthState = state;
        const authUrl = auth_service_1.AuthService.getDiscordAuthUrl(state);
        res.redirect(authUrl);
    }
    static async handleDiscordCallback(req, res) {
        const { code, state } = req.query;
        if (!code || typeof code !== 'string') {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Discord-Autorisierung fehlgeschlagen oder abgebrochen.',
            };
            return res.redirect('/auth/login');
        }
        // State CSRF Validierung
        if (!state || state !== req.session.oauthState) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Ungültiger CSRF-State bei der Discord-Anmeldung.',
            };
            return res.redirect('/auth/login');
        }
        delete req.session.oauthState;
        try {
            const accessToken = await auth_service_1.AuthService.exchangeCodeForToken(code);
            const discordUser = await auth_service_1.AuthService.getDiscordUser(accessToken);
            const syncResult = await auth_service_1.AuthService.syncDiscordUser(discordUser, accessToken);
            if (!syncResult.authorized || !syncResult.user) {
                req.session.flashMessage = {
                    type: 'danger',
                    text: syncResult.errorMessage || 'Du musst dich vorher einmal bei der Rennleitung registrieren um einen account zu erstellen.',
                };
                return res.redirect('/auth/login');
            }
            const user = syncResult.user;
            req.session.user = {
                id: user.id,
                discordId: user.discordId,
                discordUsername: user.discordUsername,
                discordAvatar: user.discordAvatar,
                gamertag: user.gamertag,
                eaId: user.eaId,
                platform: user.platform,
                platformUsername: user.platformUsername,
                raceNumber: user.raceNumber,
                assists: user.assists,
                experience: user.experience,
                role: user.role,
                isAdmin: Boolean(user.isAdmin || user.role === 'ADMIN'),
                hasDriverRole: user.hasDriverRole,
                teamId: user.teamId,
                team: user.team,
            };
            // Prüfen, ob Onboarding erforderlich ist
            if (!user.gamertag || !user.platform || !user.raceNumber) {
                req.session.flashMessage = {
                    type: 'info',
                    text: 'Willkommen bei the grid! Bitte vervollständige dein Fahrerprofil, um startklar zu sein.',
                };
                return res.redirect('/driver/onboarding');
            }
            req.session.flashMessage = {
                type: 'success',
                text: `Willkommen zurück, ${user.gamertag || user.discordUsername}!`,
            };
            return res.redirect('/driver/dashboard');
        }
        catch (err) {
            console.error('Fehler beim Discord OAuth2 Callback:', err?.response?.data || err.message);
            req.session.flashMessage = {
                type: 'danger',
                text: 'Fehler bei der Kommunikation mit Discord. Bitte versuche es erneut.',
            };
            return res.redirect('/auth/login');
        }
    }
    static logout(req, res) {
        req.session.destroy((err) => {
            if (err)
                console.error('Fehler beim Logout:', err);
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    }
    // Entwickler-Login für lokale Tests ohne Discord App
    static async devLogin(req, res) {
        if (!config_1.config.devLoginEnabled) {
            return res.status(403).send('Entwickler-Login ist deaktiviert.');
        }
        const { role } = req.params; // 'admin', 'driver', 'reserve'
        let targetDiscordId = 'dev_admin_1001';
        if (role === 'driver') {
            targetDiscordId = 'dev_driver_1003'; // Charles / Ferrari
        }
        else if (role === 'reserve') {
            targetDiscordId = 'dev_reserve_1007'; // Rookie
        }
        const user = await db_1.prisma.user.findUnique({
            where: { discordId: targetDiscordId },
            include: { team: true },
        });
        if (!user) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Test-Benutzer nicht gefunden. Bitte führe "npm run seed" aus.',
            };
            return res.redirect('/auth/login');
        }
        req.session.user = {
            id: user.id,
            discordId: user.discordId,
            discordUsername: user.discordUsername,
            discordAvatar: user.discordAvatar,
            gamertag: user.gamertag,
            eaId: user.eaId,
            platform: user.platform,
            platformUsername: user.platformUsername,
            raceNumber: user.raceNumber,
            assists: user.assists,
            experience: user.experience,
            role: user.role,
            isAdmin: Boolean(user.isAdmin || user.role === 'ADMIN'),
            hasDriverRole: user.hasDriverRole ?? true,
            teamId: user.teamId,
            team: user.team,
        };
        req.session.flashMessage = {
            type: 'success',
            text: `Entwickler-Login erfolgreich als ${user.role} (${user.gamertag})`,
        };
        return res.redirect('/driver/dashboard');
    }
}
exports.AuthController = AuthController;
