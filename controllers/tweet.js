const Tweet = require("../models/Tweet.schema");
const Feedback = require("../models/Feedback.schema");

const { parseRoles } = require("../parser");
const roles_ = Object.values(require("../data/roles.json"))
  .flatMap((roles) => Object.keys(roles))
  .map((role) => ({ [role.toLowerCase().replace(/\s+/g, "")]: role }))
  .reduce((a, b) => ({ ...a, ...b }), {});
const categories_ = Object.keys(require("../data/roles.json"))
  .map((category) => ({
    [category.toLowerCase().replace(/\s+/g, "")]: category,
  }))
  .reduce((a, b) => ({ ...a, ...b }), {});

exports.findAll = async ({
  limit = 20,
  offset = 0,
  categories,
  roles,
  types,
  q,
  unverified,
  IDs,
}) => {
  //const mongoQuery = { $and: [{ need_manual_verification: false }] };
  const mongoQuery = {
    $and: [
      {
        need_manual_verification:
          unverified === "true" ? "true" : { $in: ["false", "approved"] },
      },
    ],
  };

  if (categories) {
    mongoQuery.$or = [];

    mongoQuery.$or.push({
      $or: categories
        .toLowerCase()
        .split(",")
        .map((c) => {
          if (categories_[c]) {
            return { categories: categories_[c] };
          }
          throw new Error("Invalid category " + c);
        }),
    });
  }
  if (roles) {
    if (!mongoQuery.$or) {
      mongoQuery.$or = [];
    }
    mongoQuery.$or.push({
      $or: roles
        .toLowerCase()
        .split(",")
        .map((r) => {
          if (roles_[r]) {
            return { roles: roles_[r] };
          }
          throw new Error("Invalid role " + r);
        }),
    });
  }
  if (types) {
    mongoQuery.$and.push({
      $or: types
        .toLowerCase()
        .split(",")
        .map((type) => ({ type })),
    });
  }

  if (q) {
    // Errors are to be handled in the catch block of the function calling this
    if (q.length > 256) {
      throw new Error("Too long query.");
    }
    const or = parseRoles(q).map((role) => ({ roles: role }));

    if (or.length > 0) {
      mongoQuery.$and.push({ $or: or });
    } else {
      // Log the query for manual inspection for updating the keywords list if neccessary
    }
  }
  if (IDs) {
    mongoQuery.$and.push({
      $or: IDs.toLowerCase()
        .split(",")
        .map((tweet_id) => ({ tweet_id })),
    });
  }

  console.log(mongoQuery);
  return (
    (await Tweet.find(mongoQuery, null, {
      limit: Number(limit),
      skip: Number(offset),
      sort: { created_on: -1 },
    }).exec()) || []
  );
};

exports.findSaved = async ({ userId }) => {
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error("Not a valid userId");
  }

  let data = await Feedback.find({
    userId: userId,
    action: "save",
    value: { $ne: -1 },
  });

  console.log(data);
  let string = "";

  data.forEach((element) => {
    string += element.tweet_id + ",";
  });

  console.log("the ids:", string);
  // if (!string) throw new Error("No saved tweets");
  if (!string) return [];
  const tweetObjects = await this.findAll({ IDs: string });
  return tweetObjects;
};
