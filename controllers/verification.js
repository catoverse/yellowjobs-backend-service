const Tweet = require("../models/Tweet.schema");

const modify = async ({ auth, tweetId, accepted }) => {
  if (tweetId == null || accepted == null) return;
  console.log("Human Verification:", tweetId, accepted);
  await Tweet.updateOne(
    { tweet_id: tweetId },
    {
      need_manual_verification:
        accepted === "approved" ? "approved" : "rejected",
    }
  );
  return "Success!";
};

module.exports = {
  modify,
};
