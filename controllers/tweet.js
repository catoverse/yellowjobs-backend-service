const Tweet = require("../models/Tweet.schema");
const { parseRoles } = require("../parser");

const normalize = (name_raw) => {
  let name = "";
  let state = 0;

  for(let c of name_raw){
    if(state == 0){
      name += c.toUpperCase();
      state = 1;
      continue;
    }
    if(c == "-"){
      name += " ";
      state = 0;
    } else {
      name += c;
    }
  }
  console.log(name_raw, name);
};

exports.findAll = async ({ limit = 20, offset = 0, category, role, type, q }) => {
  const mongoQuery = { need_manual_verification: false };

  if(type) mongoQuery.type = type.toLowerCase();
  if(category) mongoQuery.categories = normalize(category)
  if(role) mongoQuery.roles = normalize(role);

  if(q){
    // Errors are to be handled in the catch block of the function calling this
    if(q.length > 128){
      throw new Error("Too long query.");
    }
    const or = parseRoles(q).map(role => ({ roles: role }));
  
    if(or.length > 0){
      mongoQuery.$or = or;
    } else {
      // Log the query for manual inspection for updating the keywords list if neccessary
    }
  }

  return (await Tweet.find(mongoQuery, null, {
    limit: Number(limit),
    skip: Number(offset),
    sort: { created_on: -1 },
  }).exec()) || [];
};
