const express = require("express")
const route = express.Router()
const { RegisterUser, LoginUser, refreshTokenHandler, getUser } = require("../controllers/auth.js")
const {createProperty} = require("../controllers/property.js")
const requireAuth = require("../middleware/authMiddleware.js")
route.post("/register", RegisterUser)
route.post("/login", LoginUser)
route.get("/me",requireAuth, getUser)

route.post("/refreshToken", refreshTokenHandler)

module.exports = route