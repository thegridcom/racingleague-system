"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalController = void 0;
class LegalController {
    static getImpressum(req, res) {
        res.render('legal/impressum', {
            pageTitle: 'Impressum | the grid. - racing league',
        });
    }
    static getDatenschutz(req, res) {
        res.render('legal/datenschutz', {
            pageTitle: 'Datenschutzerklärung | the grid. - racing league',
        });
    }
}
exports.LegalController = LegalController;
