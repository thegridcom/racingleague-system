"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("./attendance.controller");
const auth_1 = require("../../core/middleware/auth");
const router = (0, express_1.Router)();
router.post('/checkin', auth_1.isAuthenticated, auth_1.requireOnboarding, attendance_controller_1.AttendanceController.postCheckIn);
exports.default = router;
