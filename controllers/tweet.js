const Tweet = require("../models/Tweet.schema");
const { keywords, categories } = require("../parser");

const parseRolesFromQuery = (q) => {
  let text = q.split(/\s+/g);
  let nextText = [];
  const roles = [];

  do {
    nextText = [];
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
  } while(nextText.length <= 1);
  
  console.log(nextText);
  return roles;
};

exports.findAll = async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, role, type, q } = req.query;
    const mongoQuery = {};

    if(type) mongoQuery.type = type.toLowerCase();
    if(category) mongoQuery.categories = category.toLowerCase().split("-").map(a => a[0].toUpperCase() + a.substring(1, a.length)).join(" ");

    if(role) mongoQuery.roles = role.toLowerCase().split("-").map(a => a[0].toUpperCase() + a.substring(1, a.length)).join(" ");
    else if(q) mongoQuery.roles = { $all: parseRolesFromQuery(q) };

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