const express = require("express")
const { default: mongoose } = require("mongoose")
const cors = require("cors")
const cookieParser = require('cookie-parser');
require("dotenv").config()
const app = express()
const AuthRoute = require("./routes/authRoute.js")
const PropertyRoute = require("./routes/propertyRoute.js")
const InterestRoute = require("./routes/interestRoute.js")
const ApplicationRoute = require("./routes/applicationRoute.js")
app.use(cors({
    credentials: true,
    origin : ["http://localhost:3000"]
}))
app.use(express.json())
app.use(cookieParser());
const initCronJobs = require("./services/cron/index")
app.use("/api/auth", AuthRoute)
app.use("/api/property", PropertyRoute)
app.use("/api/interest", InterestRoute)
app.use("/api/application", ApplicationRoute)
app.get("/", (req, res) => {
  res.send("Server is awake 😎");
});
mongoose.connect(process.env.MONGODB_URL).then(() => {
    app.listen(process.env.PORT_NUMBER || 4100, () => {
        console.log("listening on port 4100")
           initCronJobs();
})
}).catch((err) => {
    console.log(err)
})
