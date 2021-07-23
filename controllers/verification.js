const Tweet = require("../models/Tweet.schema");

const modify = async ({ auth, tweetId, accepted }) => {
  if (tweetId == null || accepted == null)
    throw new Error("tweetId and accepted are mandatory");
  console.log("Human Verification:", tweetId, accepted);
  const { n } = await Tweet.updateOne(
    { tweet_id: tweetId },
    {
      need_manual_verification:
        accepted === "approved" ? "approved" : "rejected",
    }
  );
  return n ? "Success" : "Tweet not found";
};

module.exports = {
  modify,
};
