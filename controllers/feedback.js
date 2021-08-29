const Feedback = require("../models/Feedback.schema");

const save = async ({ userId, tweetId, action, value = 0 }) => {
  if (tweetId == null || action == null)
    throw new Error("tweetId and action are mandatory feilds");

  //If userId is provided but is invalid
  if (userId && !userId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error("Not a valid userId");
  }
  if (
    !(
      action === "save" ||
      action === "share" ||
      action === "report" ||
      action === "click"
    )
  )
    throw new Error(
      "invalid action. Can be save/share/report/click. For unsave event use action=save and value=-1"
    );

  const { n, nModified } = await Feedback.updateOne(
    {
      tweet_id: tweetId,
      userId: userId,
      action: action,
    },
    {
      tweet_id: tweetId,
      userId: userId,
      action: action,
      value: value,
    },
    { upsert: true }
  );
  return n == 0 ? "Failed" : n == nModified ? "updated" : "inserted";
};

module.exports = {
  save,
};
