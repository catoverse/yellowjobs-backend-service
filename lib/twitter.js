const fetch = require("node-fetch");

const BEARER_TOKEN = process.env.BEARER_TOKEN;
const MAX_RESULTS = 100;
const tweetQuery = require("../data/twitterQuery.json").query;

if(!BEARER_TOKEN){
  throw new Error("Inavlid bearer token. Please set BEARER_TOKEN env variable.");
}

const fetchSearchResults = async (newestID) => {
  const url = `https://api.twitter.com/1.1/search/tweets.json?count=${MAX_RESULTS}&${
    newestID ? `since_id=${newestID}&` : ""
  }q=${tweetQuery}&tweet_mode=extended&include_entities=false`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: "Bearer " + process.env.BEARER_TOKEN },
  });

  return await res.json();
};

module.exports = fetchSearchResults;
