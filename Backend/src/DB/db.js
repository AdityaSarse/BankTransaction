require("dotenv").config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');

async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database is connected");
}

module.exports = connectDB;