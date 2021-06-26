const fetch = require("node-fetch");
const { parseTweet } = require("./parser");
const Tweet = require("./models/Tweet.schema");
const Meta = require("./models/Meta.schema");

// const analytics = require("./analytics")
// const Mixpanel = require('mixpanel');
// const analytics = Mixpanel.init(process.env.ANALYTICS_KEY);

const MAX_RESULTS = 100;

const fetchSearchResults = async (newestID) => {
  const url = `https://api.twitter.com/1.1/search/tweets.json?count=${MAX_RESULTS}&${newestID ? `since_id=${newestID}&` : ""}q=(("looking for" -job -gig -intern -role -am) OR hiring) remote -podcast -know -how -tips -nobody -anybody -anyone -blog -filter:retweets -filter:quote&tweet_mode=extended&include_entities=false`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: "Bearer " + process.env.BEARER_TOKEN },
  });

  return await res.json();
};

const buildTweetObject = async (tweet) => {
  const data = await parseTweet(tweet.full_text || tweet.text);
  
  const obj = {
    type: data.type,
    categories: data.categories,
    roles: data.roles,
    
    email: data.emails,
    urls: data.urls,

    created_by: tweet.user.name,
    created_on: new Date(tweet.created_at).getTime(),

    need_manual_verification: data.need_manual_verification,

    tweet_id: tweet.id_str,
    tweet_url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    author_id: tweet.user.id_str,
    text: data.stripped_text,
    likes: tweet.favorite_count,
    retweets: tweet.retweet_count,
    author_followers: tweet.user.followers_count,
  };

  return obj;
};

const isValid = tweet => {
  const followers = tweet.user.followers_count;
  // const accountAge = Date.now() - new Date(status.created_at).getTime();
  // return (followers > 30 && accountAge > 1000 * 60 * 60 * 24 * 30) || followers > 200;
  return followers > 50;
};

const fetchTweets = async () => {
  const newestID = Number((await Meta.findOne({})).sinceId);

  const apiRes = await fetchSearchResults(newestID);
  const tweetsRaw = apiRes.statuses.filter(isValid);
  let tweets = [];
  const proms = [];

  for(let tweet of tweetsRaw){
    proms.push(buildTweetObject(tweet));
    
    if(proms.length == 10){
      tweets = tweets.concat(await Promise.allSettled(proms)).filter(result => result.status == "fulfilled").map(result => result.value);
      proms = [];
    }
  }
  tweets = tweets.concat(await Promise.allSettled(proms)).filter(result => result.status == "fulfilled").map(result => result.value);
  
  const tweetsFetched = apiRes.statuses.length;
  const tweetsDiscarded = apiRes.statuses.length - tweets.length;
  const maxId = apiRes.search_metadata.max_id;

  // analytics.track("Tweet fraud filter Summary",{
  //     fraud_tweets_found: fraudCount,
  //     final_tweets_length: finalTweets.length
  // });
  
  console.log("\n### Tweet fetch cycle summary ###");
  console.log("Tweets fetched from API:", tweetsFetched);
  console.log("Tweets discarded by filters:", tweetsDiscarded);
  console.log("Total number of tweets TO BE written in DB:", tweets.length);
  console.log();

  // analytics.track("fetch tweet cycle summary",{
  //     total_no_of_tweets_fetched : total_no_of_tweets_fetched,
  //     total_no_of_discarded_tweets : total_no_of_discarded_tweets,
  //     total_no_of_fraud_tweets : total_no_of_fraud_tweets,
  //     tweets_to_be_written_in_db : tweets.length
  // });

  return { tweets, maxId };
};

const saveTweets = async ({ tweets, maxId }) => {
  console.log(tweets);

  const ops = tweets.map((tweet) => ({
    updateOne: {
      upsert: true,
      filter: { text: tweet.text },
      update: tweet
    }
  }));

  await Tweet.bulkWrite(ops);
  await Meta.updateOne({}, { sinceId: String(BigInt(maxId) - (BigInt(1000 * 60 * 10) << BigInt(22))) });

  // console.log(`${nMatch} tweets matched update filter`);
  // console.log(`${nMod} tweets updated`);
  // console.log(`Inserted ${nInsert} new tweets to DB`);

  // analytics.track("tweets object saved to db",{qty:promises.length})
};

module.exports.fetchAndSaveTweets = () => fetchTweets().then(saveTweets);
