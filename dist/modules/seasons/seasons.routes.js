"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seasons_controller_1 = require("./seasons.controller");
const router = (0, express_1.Router)();
router.get('/calendar', seasons_controller_1.SeasonsController.getCalendarPage);
router.get('/races/:id', seasons_controller_1.SeasonsController.getRaceDetailPage);
exports.default = router;
