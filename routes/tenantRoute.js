const express = require("express");
const router = express.Router();
const { getTenants, getLandlordTenants } = require("../controllers/tenant");
const requireAuth = require("../middleware/authMiddleware")
router.get("/", requireAuth, getTenants)
router.get("/:propertyId", requireAuth, getLandlordTenants)
module.exports = router