const cron = require("node-cron");
require("dotenv").config()
const axios = require("axios")
module.exports = async function keepAlive() {
  try {
    const url = process.env.API_URL; 

    if (!url) {
      return console.log("⚠️ No RENDER_URL set");
    }

 await axios.get(url);

    console.log(" Keep-alive ping sent:", new Date().toLocaleString());
  } catch (err) {
    console.error("❌ Keep-alive error:", err.message);
  }
};