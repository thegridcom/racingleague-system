"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachUser = attachUser;
exports.isAuthenticated = isAuthenticated;
exports.isAdmin = isAdmin;
exports.requireOnboarding = requireOnboarding;
const db_1 = require("../db");
async function attachUser(req, res, next) {
    res.locals.user = null;
    res.locals.currentPath = req.path;
    res.locals.flashMessage = req.session.flashMessage || null;
    res.locals.announcement = null;
    delete req.session.flashMessage;
    // System-Ankündigung laden
    try {
        const activeSetting = await db_1.prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_ACTIVE' } });
        if (activeSetting?.value === 'true') {
            const textSetting = await db_1.prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_TEXT' } });
            const typeSetting = await db_1.prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_TYPE' } });
            if (textSetting && textSetting.value.trim().length > 0) {
                res.locals.announcement = {
                    text: textSetting.value.trim(),
                    type: typeSetting?.value || 'info',
                };
            }
        }
    }
    catch (e) { }
    if (req.session.user && req.session.user.id) {
        try {
            const dbUser = await db_1.prisma.user.findUnique({
                where: { id: req.session.user.id },
                include: { team: true },
            });
            if (dbUser) {
                req.session.user = {
                    id: dbUser.id,
                    discordId: dbUser.discordId,
                    discordUsername: dbUser.discordUsername,
                    discordAvatar: dbUser.discordAvatar,
                    gamertag: dbUser.gamertag,
                    eaId: dbUser.eaId,
                    platform: dbUser.platform,
                    platformUsername: dbUser.platformUsername,
                    raceNumber: dbUser.raceNumber,
                    assists: dbUser.assists,
                    experience: dbUser.experience,
                    role: dbUser.role,
                    isAdmin: Boolean(dbUser.isAdmin || dbUser.role === 'ADMIN'),
                    hasDriverRole: dbUser.hasDriverRole,
                    teamId: dbUser.teamId,
                    team: dbUser.team,
                };
                res.locals.user = req.session.user;
            }
            else {
                // User was deleted (e.g. via GDPR deletion)
                delete req.session.user;
            }
        }
        catch (e) {
            console.error('Fehler beim Aktualisieren der User-Session:', e);
        }
    }
    next();
}
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        req.session.flashMessage = {
            type: 'warning',
            text: 'Bitte melde dich an, um auf diese Seite zuzugreifen.',
        };
        return res.redirect('/auth/login');
    }
    next();
}
function isAdmin(req, res, next) {
    if (!req.session.user) {
        req.session.flashMessage = {
            type: 'warning',
            text: 'Authentifizierung erforderlich.',
        };
        return res.redirect('/auth/login');
    }
    const isUserAdmin = Boolean(req.session.user.isAdmin || req.session.user.role === 'ADMIN');
    if (!isUserAdmin) {
        req.session.flashMessage = {
            type: 'danger',
            text: 'Zugriff verweigert. Administrator-Rechte erforderlich.',
        };
        return res.redirect('/driver/dashboard');
    }
    next();
}
function requireOnboarding(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    const user = req.session.user;
    // Wenn Onboarding unvollständig ist und wir nicht bereits auf der Onboarding-Route sind
    const isOnboardingIncomplete = !user.gamertag || !user.platform || !user.raceNumber;
    if (isOnboardingIncomplete && req.path !== '/onboarding' && req.path !== '/logout') {
        return res.redirect('/driver/onboarding');
    }
    next();
}
