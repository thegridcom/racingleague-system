import { Router } from 'express';
import { DriversController } from './drivers.controller';
import { isAuthenticated, requireOnboarding } from '../../core/middleware/auth';

const router = Router();

// Öffentliche Fahrerliste
router.get('/roster', DriversController.getDriversRoster);

// Onboarding
router.get('/onboarding', isAuthenticated, DriversController.getOnboardingPage);
router.post('/onboarding', isAuthenticated, DriversController.postOnboarding);

// Fahrer-Dashboard & Profil
router.get('/dashboard', isAuthenticated, requireOnboarding, DriversController.getDashboardPage);
router.post('/profile', isAuthenticated, requireOnboarding, DriversController.postUpdateProfile);

// DSGVO Art. 17 Account-Löschung
router.post('/delete-account', isAuthenticated, DriversController.postDeleteAccountGdpr);

export default router;

