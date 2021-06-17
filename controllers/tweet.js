const Tweet = require("../models/Tweet.schema");

const allCities = require("../data/newAllCities.json");
const resources = require("../data/resources.json");

//Retrive all Tweets
exports.findAll = async (req, res) => {
  try {
    const { limit = 20, offset = 0, role, type } = req.query;
    const query = {};

    if(role) query.role = role;
    if(type) query.type = type;

    res.send(
      await Tweet.find(query, null, {
        limit: Number(limit),
        skip: Number(offset),
        sort: { created_on: -1 },
      }).exec()
    );
  } catch (error) {
    res.send({ error: error.message });
  }
};