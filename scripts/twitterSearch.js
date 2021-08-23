console.log("Starting the script...");

require("dotenv").config();

const fetchSearchResults = require("../lib/twitter");
const Meta = require("../models/Meta.schema");
const { parseTweet } = require("../lib/parser");

const connectDB = require("../lib/db");

connectDB().then(async () => {
  console.log("Database connected.");
  console.log("Fetching tweets...");

  const rawTweets = await fetchSearchResults();

  console.log(rawTweets);
});

