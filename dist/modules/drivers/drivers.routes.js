"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drivers_controller_1 = require("./drivers.controller");
const auth_1 = require("../../core/middleware/auth");
const router = (0, express_1.Router)();
// Öffentliche Fahrerliste
router.get('/roster', drivers_controller_1.DriversController.getDriversRoster);
// Onboarding
router.get('/onboarding', auth_1.isAuthenticated, drivers_controller_1.DriversController.getOnboardingPage);
router.post('/onboarding', auth_1.isAuthenticated, drivers_controller_1.DriversController.postOnboarding);
// Fahrer-Dashboard & Profil
router.get('/dashboard', auth_1.isAuthenticated, auth_1.requireOnboarding, drivers_controller_1.DriversController.getDashboardPage);
router.post('/profile', auth_1.isAuthenticated, auth_1.requireOnboarding, drivers_controller_1.DriversController.postUpdateProfile);
// DSGVO Art. 17 Account-Löschung
router.post('/delete-account', auth_1.isAuthenticated, drivers_controller_1.DriversController.postDeleteAccountGdpr);
exports.default = router;
