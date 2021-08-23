const fetch = require("node-fetch");

const MAX_RESULTS = 100;
const tweetQuery = require("../data/twitterQuery.json").query;

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
