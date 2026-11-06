"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const legal_controller_1 = require("./legal.controller");
const router = (0, express_1.Router)();
router.get('/impressum', legal_controller_1.LegalController.getImpressum);
router.get('/datenschutz', legal_controller_1.LegalController.getDatenschutz);
exports.default = router;
