console.log("Starting the script...");

require("dotenv").config();

const { connect: connectDB } = require("../lib/db");
const Tweet = require("../models/Tweet.schema");

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

connectDB().then(async () => {
  console.log("Database connected.");
  console.log("Fetching tweets...");

  const tweets = await (Tweet.find({}, null).exec());
  
  console.log(tweets.length + " tweets fetched.");
  console.log("Running validation code...");

  const ops = [];
  let count = 0;

  for(const tweet of tweets){
    if(tweet.need_manual_verification == "approved"){
      continue;
    }

    if(!validate(tweet)){
      ops.push({
        updateOne: {
          filter: { text: tweet.text },
          update: { need_manual_verification: "true" }
        }
      });
      count++;
    } else {
      ops.push({
        updateOne: {
          filter: { text: tweet.text },
          update: { need_manual_verification: "false" }
        }
      });
    }
  }

  console.log(count + " tweets marked for manual verification.");
  console.log("Updating the database...");

  await Tweet.bulkWrite(ops);

  console.log("Done updating database. Script executed successfully.");
  process.exit();

}).catch(console.error);
