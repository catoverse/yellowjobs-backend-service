const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    type: String,
    categories: [String],
    roles: [String],

    email: [String],
    urls: [String],

    created_by: String,
    created_on: Number,
    location: String,

    need_manual_verification: {
      type: String,
      enum: ["true", "false", "verified", "rejected"],
      default: "false",
    },

    tweet_id: String,
    tweet_url: String,
    author_id: String,
    text: String,
    likes: Number,
    tweet_ast: mongoose.Schema.Types.Mixed,
    retweets: Number,
    author_followers: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Tweet || mongoose.model("Tweet", schema);
