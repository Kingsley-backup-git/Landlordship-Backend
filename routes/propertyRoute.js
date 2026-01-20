const express = require("express");
const route = express.Router();
const multer = require("multer");
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
const {
  createProperty,
  getProperties,
  getPaginatedProperties,
  getPropertiesBySlug,
  getEachProperty,
  getEachPropertyForLoggedInUsers,
} = require("../controllers/property.js");
const requireAuth = require("../middleware/authMiddleware.js");
route.post(
  "/create",
  requireAuth,
  upload.fields([{ name: "property_images" }, { name: "property_documents" }]),
  createProperty,
);
route.get("/all", requireAuth, getProperties);
route.get("/search", requireAuth, getPaginatedProperties);
route.get("/:slug", getPropertiesBySlug);
route.get("/id/:propertyId", getEachProperty);
route.get("/user/id/:propertyId", requireAuth, getEachPropertyForLoggedInUsers);
module.exports = route;
