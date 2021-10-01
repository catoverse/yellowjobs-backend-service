const Tweet = require("./models/Tweet.schema");
/**
 *
 * @param {*} req
 * @param {*} res
 * removing tweets form a certain date
 * access_time: { $lt: new Date(year, month_0_indexed, day) },
 */

exports.deleteLastNDaysTweets = async (noOfDays, env) => {
  console.log("ENV:  11", process.env.NODE_ENV);
  if (process.env.NODE_ENV !== env && env !== null) {
    throw new Error(`Environment ${env} is not supported`);
  } else if (
    process.env.NODE_ENV === null ||
    (process.env.NODE_ENV === "staging" && env !== "staging")
  ) {
    throw new Error(`Environment ${env} is not supported`);
  }
  if (noOfDays < 30 || noOfDays === null) {
    throw new Error("Cannot delete fewer than 30days");
  }
  console.log("DATE", new Date().getDate());
  var dateOffset = 24 * 60 * 60 * 1000 * noOfDays;
  var myDate = new Date();
  myDate.setTime(myDate.getTime() - dateOffset);
  console.log(myDate);
  console.log(`Deleting tweets older than ${myDate} days`);
  Tweet.deleteMany(
    {
      createdAt: { $lte: myDate },
    },
    (error, tweets) => {
      if (error) {
        console.log(error);
      } else console.log(`Successfuly Delted ${tweets.deletedCount} tweets`);
    }
  );
};
