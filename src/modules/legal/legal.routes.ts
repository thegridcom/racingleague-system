import { Router } from 'express';
import { LegalController } from './legal.controller';

const router = Router();

router.get('/impressum', LegalController.getImpressum);
router.get('/datenschutz', LegalController.getDatenschutz);

export default router;

