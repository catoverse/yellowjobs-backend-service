const fetch = require("node-fetch");
const { fetchTweetAst } = require("static-tweets");

// TODO: update the parsing logic
const { parseTweet } = require("./parser");

const Tweet = require("./models/Tweet.schema");
const Meta = require("./models/Meta.schema");

//const analytics = require("./analytics")
// const Mixpanel = require('mixpanel');
// var analytics = Mixpanel.init(process.env.ANALYTICS_KEY);

const MAX_RESULTS = 100;

const fetchSearchResults = async (newestID, resource) => {
  // TODO: change the query url
  const url = `https://api.twitter.com/1.1/search/tweets.json?${
    newestID ? `since_id=${newestID}&` : ""
  }q=verified ${
    resourceQueries[resource]
  } -"request" -"requests" -"requesting" -"needed" -"needs" -"need" -"seeking" -"seek" -"not verified" -"looking" -"unverified" -"urgent" -"urgently" -"urgently required" -"send" -"help" -"get" -"old" -"male" -"female" -"saturation" -filter:retweets -filter:quote&count=${MAX_RESULTS}&tweet_mode=extended&include_entities=false`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + process.env.BEARER_TOKEN,
      },
    }).then((res) => res.json());

    return response;
  } catch (error) {
    console.error(error);
    return {};
  }
};

const buildTweetObject = async (tweet) => {
  const data = parseTweet(tweet.full_text || tweet.text);

  const obj = {
    tyep: data.type,
    roles: data.roles,
    
    phone: data.phone_numbers,
    email: data.emails,

    created_by: tweet.user.name,
    created_on: new Date(tweet.created_at).getTime(),

    tweet_id: tweet.id_str,
    tweet_url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    author_id: tweet.user.id_str,
    text: tweet.full_text,
    likes: tweet.favorite_count,
    retweets: tweet.retweet_count,
    author_followers: tweet.user.followers_count,
    tweetAst: JSON.stringify(await fetchTweetAst(tweet.id_str)),
  };

  return obj;
};

const isValid = tweet => {
  const followers = tweet.user.followers_count;
  const accountAge = Date.now() - new Date(status.created_at).getTime();

  return (followers > 30 && accountAge > 1000 * 60 * 60 * 24 * 30) || followers > 200;
};

const fetchTweets = async () => {
  let newestID = Number((await Meta.findOne({})).sinceId);
  let max_id = newestID;

  const resources = Object.keys(resourceTypes);

  let total_no_of_tweets_fetched = 0;
  let total_no_of_discarded_tweets = 0;
  
  // TODO: change the `resources` to whatever we need
  const tweets = await Promise.all(resources.map(async (resource) => {
    const apiRes = await fetchSearchResults(newestID, resource);

    if (!apiRes.search_metadata) {
      return []; // return empty array and continue fetching in case a request to twitter fails
    }
    if (apiRes.search_metadata.max_id > max_id) {
      max_id = apiRes.search_metadata.max_id;
    }

    const validTweets = await Promise.all(apiRes.statuses.filter(isValid).map(buildTweetObject));
  
    total_no_of_tweets_fetched += apiRes.statuses.length;
    total_no_of_discarded_tweets += apiRes.statuses.length - validTweets.length;

    // analytics.track("Tweet fraud filter Summary",{
    //     fraud_tweets_found: fraudCount,
    //     final_tweets_length: finalTweets.length
    // });
    return validTweets;
  })).flat();

  // have a 10 minutes overlapping interval for the next tweets to be fetched
  await Meta.updateOne({}, { sinceId: String(BigInt(max_id) - (BigInt(1000 * 60 * 10) << BigInt(22))) });

  console.log("\n### Tweet fetch cycle summary ###");
  console.log("Tweets fetched from API:", total_no_of_tweets_fetched);
  console.log("Tweets discarded by filters:", total_no_of_discarded_tweets);
  console.log("Tweets discarded by fraud detection:", total_no_of_fraud_tweets);
  console.log("Total number of tweets TO BE written in DB:", tweets.length);
  console.log();

  // analytics.track("fetch tweet cycle summary",{
  //     total_no_of_tweets_fetched : total_no_of_tweets_fetched,
  //     total_no_of_discarded_tweets : total_no_of_discarded_tweets,
  //     total_no_of_fraud_tweets : total_no_of_fraud_tweets,
  //     tweets_to_be_written_in_db : tweets.length
  // });

  return tweets;
};

const saveTweets = async (tweets) => {
  let promises = [];

  let nMatch = 0;
  let nMod = 0;
  let nInsert = 0;
  
  for (let i in tweets) {
    promises.push(Tweet.updateOne({ text: tweet.text }, tweets[i], { upsert: true }));

    // Send requests to the database in batches of 20
    // Directly using await instead of this makes the function 20 times slower

    if (promises.length == 20 || i == tweets.length - 1) {
      const result = await Promise.all(promises);
      
      for(const { n, nModified } of result){
        nMatch += n;
        nMod += nModified;
        nInsert += n && 1;
      }
      promises = [];
    }
  }

  console.log(`${nMatch} tweets matched update filter`);
  console.log(`${nMod} tweets updated`);
  console.log(`Inserted ${nInsert} new tweets to DB`);

  // analytics.track("tweets object saved to db",{qty:promises.length})
};

module.exports.fetchAndSaveTweets = () => fetchTweets.then(saveTweets);