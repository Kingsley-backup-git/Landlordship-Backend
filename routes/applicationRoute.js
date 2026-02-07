const express = require("express");
const router = express.Router();
const { applyHandler, getApplications, updateApplicationStatus } = require("../controllers/application");
const multer = require("multer");
const requireAuth = require("../middleware/authMiddleware")
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
router.post(
  "/apply",
  requireAuth,
  upload.fields([
    { name: "idDoc" },
    { name: "addressDoc" },
    { name: "recent_payment_slip" },
    { name: "recent_bank_statement" },
    { name: "proof_of_income" },
  ]),
  applyHandler,
);

router.get("/:propertyId", requireAuth, getApplications);

// Landlord updates application status (approve/reject)
router.patch("/:applicationId/status", requireAuth, updateApplicationStatus);

module.exports = router;
