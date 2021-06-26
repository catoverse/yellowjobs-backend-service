const Tweet = require("../models/Tweet.schema");
const { keywords } = require("../parser");

const parseRolesFromQuery = (q) => {
  // Errors are to be handled in the catch block of the function calling this
  if(q.length > 128){
    throw new Error("Too long query.");
  }
  let text = q.split(/\s+/g);
  
  if(text.length > 32){ // Making a total 1024 (n^2) iterations in the worst case 
    throw new Error("Too long query.");
  }

  const nextText = [];
  const roles = new Set;

  do {
    nextText.length = 0;
    for(let word of text){
      const role = keywords[word];
      
      if(role){
        roles.add(role);
      } else {
        nextText.push(word);
      }
    }
    text.length = 0;
    for(let i = 0; i < nextText.length - 1; ++i){
      text.push(nextText[i]+nextText[i+1]);
    }
  } while(nextText.length > 1);
  
  console.log(nextText); // this is the remains of the query string for which we were not able to find the keyword mapping, storing it can be helpful for insights on what keywords we should add
  return [...roles];
};

exports.findAll = async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, role, type, q } = req.query;
    const mongoQuery = { need_manual_verification: false };

    if(type) mongoQuery.type = type.toLowerCase();
    if(category) mongoQuery.categories = category.toLowerCase().split("-").filter(_=>_).map(a => a[0].toUpperCase() + a.substring(1, a.length)).join(" ");

    if(role) mongoQuery.roles = role.toLowerCase().split("-").filter(_=>_).map(a => a[0].toUpperCase() + a.substring(1, a.length)).join(" ");
    
    if(q) {
      const or = parseRolesFromQuery(q).map(role => ({ roles: role }));
    
      if(or.length > 0){
        mongoQuery.$or = or;
      }
    }

    res.send(
      (await Tweet.find(mongoQuery, null, {
        limit: Number(limit),
        skip: Number(offset),
        sort: { created_on: -1 },
      }).exec()) || []
    );
  } catch (error) {
    res.send({ error: error.message });
  }
};
