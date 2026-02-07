const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const {
  createAgent,
  createOrUpdateAgentProfile,
  getAllAgents,
  getAgentById,
  assignAgentToMaintenanceRequest,
  agentConfirmAvailability,
  updateAgent,
} = require("../controllers/agent");

// Create a new agent (can be public or require auth based on your needs)
router.post("/",requireAuth, createAgent);
// Authenticated agent creates/updates profile (links Agent to Auth for dashboard)
router.post("/profile", requireAuth, createOrUpdateAgentProfile);

// Get all agents (can be public or require auth based on your needs)
router.get("/", requireAuth, getAllAgents);

// Get a single agent by ID
router.get("/:agentId",requireAuth, getAgentById);

// Landlord assigns an agent to a maintenance request
router.post("/assign", requireAuth, assignAgentToMaintenanceRequest);

// Agent confirms or rejects availability
router.patch("/:agentId/availability/:requestId", agentConfirmAvailability);

// Update agent information
router.patch("/:agentId", updateAgent);

module.exports = router;
