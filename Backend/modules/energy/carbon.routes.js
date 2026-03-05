const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth");
const { calculateCarbonImpact } = require("./carbon.controller");

router.post("/carbon-impact", protect, calculateCarbonImpact);

module.exports = router;
