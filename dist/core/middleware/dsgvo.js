"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dsgvoMiddleware = dsgvoMiddleware;
const config_1 = require("../config");
function dsgvoMiddleware(req, res, next) {
    // Global Disclaimer in allen Templates verfügbar machen
    res.locals.disclaimer = config_1.config.disclaimer;
    res.locals.appName = 'the grid. - racing league';
    res.locals.year = new Date().getFullYear();
    // Sicherheits- & Datenschutz-Header setzen (Komplett tracker-frei, DSGVO-konform)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Datenschutz-Hinweis: Keine Cookies an Dritte weitergeben
    res.setHeader('X-Privacy-Policy', '/datenschutz');
    next();
}
