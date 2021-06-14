const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    roles: [String],
    type: String,
    phone: [String],
    email: [String],
    created_by: String,
    created_on: Number,
    tweet_id: String,
    tweet_url: String,
    author_id: String,
    text: String,
    likes: Number,
    retweets: Number,
    author_followers: Number,
    tweetAst: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Tweet ?? mongoose.model("Tweet", schema);
