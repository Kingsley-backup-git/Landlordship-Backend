const cron = require("node-cron");
const keepAlive = require("./cron");
require("dotenv").config()
module.exports = function initCronJobs() {
    console.log("Cron jobs initialized...");


 
  cron.schedule("*/10 * * * *", keepAlive);
};