const express = require("express")
const route = express.Router()
const requireAuth = require("../middleware/authMiddleware")
const {InterestApplication, getInterests} = require("../controllers/interest")
route.post("/apply/:propertyId", InterestApplication)
route.get("/:propertyId", requireAuth, getInterests)
module.exports = route