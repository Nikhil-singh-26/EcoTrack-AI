const express = require("express");
const router = express.Router();

const { detectAnomaly } = require("./energy.anomaly.controller");

router.post("/detect-anomaly", detectAnomaly);

module.exports = router;
