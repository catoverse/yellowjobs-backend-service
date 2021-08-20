const fetch = require("node-fetch");
const { parseTweet } = require("./parser");
const { fetchTweetAst } = require("static-tweets");
const Tweet = require("../models/Tweet.schema");
const Meta = require("../models/Meta.schema");

const Logger = require("./logger");

const MAX_RESULTS = 100;
const tweetQuery = require("../data/twitterQuery.json").query;
const { validate } = require("../models/Tweet.schema");

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

const verifyTweet = (tweet) => {
  const trimedText = tweet.text.toLowerCase().replace(/\W/g, "")
  
  if(tweet.text.length < 80){
    return false;
  }
  if(tweet.urls.length == 0 && tweet.email.length == 0 && trimedText.toLowerCase().indexOf(/dm|comment/) == -1){
    return false;
  }
  if(trimedText.indexOf(/location|store|onsite/) != -1 && tweet.categories.some(el => el == "Tech" || el == "Design")){
    return false;
  }

  let state = 0;
  const words = tweet.text.toLowerCase().split(/\W/g).filter(_=>_);

  for(let i = 0; i < words.length; ++i){
    const word = words[i];

    switch(state){
    case 0:

      switch(word){
      case "a":
        state = 6;
        break;
      case "i":
        state = 1;
        break;
      case "am":
        state = 2;
        break;
      case "my":
        state = 3;
        break;
      case "check":
        state = 4;
        break;
      }
      break;

    case 1:
      switch(word){
      case "m":
      case "am":
        state = 2;
        break;
      case "need":
        state = 8;
        break;
      default:
        return false;
      }
      break;

    case 2:
      switch(word){
      case "hiring":
        return true;
      case "looking":
        state = 7;
        break;
      default:
        return false;
      }
      break;

    case 3:
      switch(word){
      case "work":
      case "cv":
      case "resume":
      case "portfolio":
      case "profile":
        return false;
      default:
        state = 0;
      }
      break;

    case 4:
      switch(word){
      case "out":
        state = 5;
        break;
      default:
        state = 0;
        break;
      }
      break;

    case 5:
      switch(word){
      case "my":
        return false;
      }
      break;

    case 6:
      switch(word){
      case "my":
        state = 3;
        break;
      case "check":
        state = 4;
        break;
      default:
        state = 0;
        break;
      }
      break;

    case 7:
      switch(word){
      case "for":
        state = 8;
        break;
      default:
        return false;
      }
      break;

    case 8:
      switch(word){
      case "someone":
        return true;
      default:
        return false;
      }
      break;

    }
  }

  return true;
};

const buildTweetObject = async (tweet) => {
  const [data, tweetAst] = await Promise.all([
    parseTweet(tweet.full_text || tweet.text),
    fetchTweetAst(tweet.id_str),
  ]);

  const obj = {
    type: data.type,
    categories: data.categories,
    roles: data.roles,

    email: data.emails,
    urls: data.urls,

    created_by: tweet.user.name,
    created_on: new Date(tweet.created_at).getTime(),

    tweet_id: tweet.id_str,
    tweet_url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    author_id: tweet.user.id_str,
    text: tweet.full_text || tweet.text,
    likes: tweet.favorite_count,
    retweets: tweet.retweet_count,
    tweet_ast: tweetAst,
    author_followers: tweet.user.followers_count,
  };

  obj.need_manual_verification = String(!verifyTweet(obj));
  return obj;
};

const isValid = (tweet) => {
  const followers = tweet.user.followers_count;
  // const accountAge = Date.now() - new Date(status.created_at).getTime();
  // return (followers > 30 && accountAge > 1000 * 60 * 60 * 24 * 30) || followers > 200;
  return followers > 50;
};

const isValid2 = (tweet) => {
  const trimedText = tweet.text.toLowerCase().replace(/\W/g, "")
  
  if(trimedText.indexOf(/location|store|onsite/) != -1 && trimedText.indexOf(/remote|wfh|workfromhome/g) == -1 && !tweet.categories.some(el => el == "Tech" || el == "Design")){
    return false;
  }

  return tweet.roles.length > 0;
};

const fetchTweets = async () => {
  const newestID = BigInt(await (Meta.findOne({})
    .then(doc => {
      return doc.sinceId;
    })
    .catch(() => {
      console.error(
        'Failed!\nPlease make a "meta" collection and then create a "sinceId" placeholder in the DB in meta collection and init with 0'
      );
      process.exit(0);  
    })));
  const apiRes = await fetchSearchResults(newestID); // get tweets from the Twitter API

  console.log("Tweets fetched: ", apiRes.statuses.length);

  let tweets = await Promise.allSettled(
    apiRes.statuses
      .filter(isValid) // if the follower count of the user >50
      .map(buildTweetObject)
  );
  tweets = tweets.filter((result) => result.status == "fulfilled");
  tweets = tweets.map((result) => result.value);
  tweets = tweets.filter(isValid2); // check if tweet has a role

  const tweetsFetched = apiRes.statuses.length;
  const tweetsDiscarded = apiRes.statuses.length - tweets.length;
  const maxId = apiRes.search_metadata.max_id;

  console.log("\n### Tweet fetch cycle summary ###");
  Logger.log("api_fetch_count", tweetsFetched);
  Logger.log("filter_discarded_count", tweetsDiscarded);
  Logger.log("db_write_count", tweets.length);

  console.log("internship tweets: ", tweets.filter(tweet => tweet.type == "internship" || tweet.type == "freelance").length);
  console.log("freshers tweets:", tweets.filter(tweet => tweet.type == "freshers").length);

  console.log();

  return { tweets, maxId };
};

const saveTweets = async ({ tweets, maxId }) => {
  const newTweets = [];

  await Promise.all(
    tweets.map(async (tweet) => {
      if (await Tweet.findOne({ text: tweet.text })) {
        await Tweet.updateOne(
          { text: tweet.text },
          { created_on: tweet.created_on }
        );
      } else {
        newTweets.push(tweet);
      }
    })
  );
  await Tweet.insertMany(newTweets);

  console.log("db_duplicate_tweets: ", tweets.length - newTweets.length);

  await Meta.updateOne(
    {},
    { sinceId: String(BigInt(maxId) - (BigInt(1000 * 60 * 10) << BigInt(22))) }
  );
};

module.exports.fetchAndSaveTweets = () => fetchTweets().then(saveTweets);
