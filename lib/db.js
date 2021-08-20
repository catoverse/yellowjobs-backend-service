const mongoose = require("mongoose");
const DB_URL = process.env.MONGO_URI;

module.exports.connect = () => mongoose.connect(DB_URL, { 
    dbName: process.env.NODE_ENV == "production" ? "prod" : "staging", 
    useNewUrlParser: true,  
    useUnifiedTopology: true 
});
