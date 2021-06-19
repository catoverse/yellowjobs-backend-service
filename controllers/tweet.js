const Tweet = require("../models/Tweet.schema");
const { keywords, caategories } = require("../parser");

const parseRolesFromQuery = (q) => {
  const text = q.split(/s+/g);
  const nextText = [];
  const roles = [];

  while(1){
    for(let word of text){
      const role = keywords[word];
      
      if(role){
        roles.push(role);
      } else {
        nextText.push(word);
      }
    }
    text = [];
    for(let i = 0; i < nextText.length - 1; ++i){
      text.push(nextText[i]+nextText[i+1]);
    }
    if(nextText.length == 1){
      break;
    }
    nextText = [];
  }
  console.log(nextText);
  return roles;
};

exports.findAll = async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, role, type, q } = req.query;
    const mongoQuery = {};

    if(type) mongoQuery.type = type;
    if(category) mongoQuery.category = category;

    if(role) mongoQuery.role = role;
    else if(q) mongoQuery.role = { $in: parseRolesFromQuery(q) };

    res.send(
      await Tweet.find(mongoQuery, null, {
        limit: Number(limit),
        skip: Number(offset),
        sort: { created_on: -1 },
      }).exec()
    );
  } catch (error) {
    res.send({ error: error.message });
  }
};