const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const multer = require("multer");
const {
  createMaintenanceRequest,
  getTenantMaintenanceRequests,
  getLandlordMaintenanceRequests,
  updateMaintenanceRequestStatus,
  getMaintenanceRequestById,
} = require("../controllers/maintenanceRequest");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

// Tenant creates a maintenance request
router.post(
  "/",
  requireAuth,
  upload.array("images"), // Allow up to 10 images
  createMaintenanceRequest
);

// Tenant gets all their maintenance requests
router.get("/tenant", requireAuth, getTenantMaintenanceRequests);

// Landlord gets all maintenance requests for his properties
router.get("/landlord", requireAuth, getLandlordMaintenanceRequests);

// Get a single maintenance request by ID
router.get("/:requestId", requireAuth, getMaintenanceRequestById);

// Landlord updates maintenance request status (accept/reject)
router.patch("/:requestId/status", requireAuth, updateMaintenanceRequestStatus);

module.exports = router;
