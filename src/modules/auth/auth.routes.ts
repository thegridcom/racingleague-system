import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

router.get('/login', AuthController.getLoginPage);
router.get('/discord', AuthController.redirectToDiscord);
router.get('/discord/callback', AuthController.handleDiscordCallback);
router.get('/logout', AuthController.logout);
router.post('/logout', AuthController.logout);
router.get('/dev-login/:role', AuthController.devLogin);

export default router;

