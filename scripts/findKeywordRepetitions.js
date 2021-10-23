console.log("Starting the script...");

require("dotenv").config();

const { connect: connectDB } = require("../lib/db");
const Tweet = require("../models/Tweet.schema");

connectDB().then(async () => {
  console.log("Database connected.");
  console.log("Fetching tweets...");

  const keywords = {};
  const tweets = await (Tweet.find({}, null).exec());

  console.log(tweets.length + " tweets fetched.");
  console.log("Finding keyword patterns...");

  for(let tweet of tweets){
    if(tweet.need_manual_verification != "true"){
      continue;
    }
    let words = tweet.text
      .toLowerCase()
      .split(/\W/g)
      .filter((_) => _);
    let nextWords = new Array(words.length + 1).fill("");

    for (let i = 0; nextWords.length > 1; ++i) {
      nextWords.pop();

      for (let j = 0; j < nextWords.length && i < 5; ++j) {
          nextWords[j] += words[i + j];
      }
      for (const word of nextWords) {
        keywords[word] = keywords[word] ? keywords[word] + 1 : 1;
      }
    }
  };

  const final = Object.entries(keywords).filter(a => !Number(a[0]) ).sort((a, b) => b[1] - a[1]);

  console.log("Done finding patterns.");
  console.log("Storing results in results.json...");

  require("fs").writeFileSync("dump.json", JSON.stringify(final));

  console.log("Done!")
  process.exit();
}).catch(console.error);
