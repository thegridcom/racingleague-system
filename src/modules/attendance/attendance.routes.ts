import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { isAuthenticated, requireOnboarding } from '../../core/middleware/auth';

const router = Router();

router.post('/checkin', isAuthenticated, requireOnboarding, AttendanceController.postCheckIn);

export default router;

