import { Router } from 'express';
import { SeasonsController } from './seasons.controller';

const router = Router();

router.get('/calendar', SeasonsController.getCalendarPage);
router.get('/races/:id', SeasonsController.getRaceDetailPage);

export default router;

