console.log("Starting the script...");

require("dotenv").config();

const { connect: connectDB } = require("../lib/db");
const Tweet = require("../models/Tweet.schema");

const verifyTweet = require("../lib/verifyTweet");

connectDB().then(async () => {
  console.log("Database connected.");
  console.log("Fetching tweets...");

  const tweets = await (Tweet.find({}, null).exec());

  console.log(tweets.length + " tweets fetched.");
  console.log("Running validation code...");

  const ops = [];
  let deleted = 0;
  let marked = 0;

  for(const tweet of tweets){
    if(tweet.need_manual_verification == "approved"){
      continue;
    }

    switch(verifyTweet(tweet)){
    case -1:
      ops.push({
        deleteOne: {
          filter: { text: tweet.text }
        }
      });
      deleted++;
      break;
    case 0:
      ops.push({
        updateOne: {
          filter: { text: tweet.text },
          update: { need_manual_verification: "true" }
        }
      });
      marked++;
      break;
    case 1:
      ops.push({
        updateOne: {
          filter: { text: tweet.text },
          update: { need_manual_verification: "false" }
        }
      });
      break;
    }
  }

  console.log(marked + " tweets marked for manual verification.");
  console.log(deleted + " tweets deleted.");
  console.log("Updating the database...");

  await Tweet.bulkWrite(ops);

  console.log("Done updating database. Script executed successfully.");
  process.exit();

}).catch(console.error);
