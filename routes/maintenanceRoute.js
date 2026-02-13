const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const multer = require("multer");
const {
  createMaintenanceRequest,
  getTenantMaintenanceRequests,
  getLandlordMaintenanceRequests,
  getMaintenanceRequestById,
  acceptRequest,
  rejectRequest,
  assignAgent,
  getAgentMaintenanceRequests,
  agentAcceptRequest,
  agentRejectRequest,
  getAssignedAgentMaintenanceRequests
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
const upload = multer({ storage });

// ---- Tenant ----
// POST /maintenance → create maintenance request
router.post("/", requireAuth, upload.array("images", 10), createMaintenanceRequest);
// GET /maintenance/my → tenant's requests
router.get("/my", requireAuth, getTenantMaintenanceRequests);

// ---- Landlord ----
// GET /maintenance/landlord → landlord's requests
router.get("/landlord", requireAuth, getLandlordMaintenanceRequests);
// PATCH /maintenance/:id/accept
router.patch("/:id/accept", requireAuth, acceptRequest);
// PATCH /maintenance/:id/reject
router.patch("/:id/reject", requireAuth, rejectRequest);
// POST /maintenance/:id/assign-agent
router.post("/:id/assign-agent", requireAuth, assignAgent);

// ---- Agent ----
// GET /maintenance/agent → requests assigned to this agent
router.get("/agent", requireAuth, getAgentMaintenanceRequests);
// PATCH /maintenance/:id/agent-accept
router.patch("/:id/agent-accept", requireAuth, agentAcceptRequest);
// PATCH /maintenance/:id/agent-reject
router.patch("/:id/agent-reject", requireAuth, agentRejectRequest);

// ---- Shared (tenant/landlord/agent as per getMaintenanceRequestById logic) ----
// GET /maintenance/:id → single request details
router.get("/:id", requireAuth, getMaintenanceRequestById);


router.get("/agent/all", requireAuth, getAssignedAgentMaintenanceRequests)

module.exports = router;
