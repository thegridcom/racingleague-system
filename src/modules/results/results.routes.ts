import { Router } from 'express';
import { ResultsController } from './results.controller';

const router = Router();

router.get('/standings', ResultsController.getStandingsPage);
router.get('/standings/export/csv', ResultsController.exportStandingsCsv);
router.get('/standings/export/json', ResultsController.exportStandingsJson);
router.get('/races/:raceId/attendance/export/csv', ResultsController.exportAttendanceCsv);

export default router;

