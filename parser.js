const rolesRaw = require("./data/roles.json");
const categories = Object.keys(rolesRaw).map(category => Object.keys(rolesRaw[category]).map(el => ({ [el]: category }))).flat().reduce((acc, el) => ({ ...acc, ...el }), {});
const keywords = Object.values(rolesRaw).map(r => Object.entries(r).map(([role, keywords]) => keywords.map(el => ({ [el]: role })))).flat().flat().reduce((acc, el) => ({ ...acc, ...el }), {});

const normalize = (text) => {
  return text
    .toLowerCase()
    .split(/ |\n|\t|\.|,/g)
    .filter((i) => i)
    .join("");
};
/*
const find = (text, values) => {
  const set = new Set();

  for (let key in values) {
    for (let word of values[key]) {
      if (text.search(word) != -1) {
        set.add(key);
      }
    }
  }
  return Array.from(set) || [];
};
*/
const phoneRegex =
  /(?!([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2}))(\+?\d[\d -]{8,12}\d)/g;
const emailRegex =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/g;

const parsePhoneNumbers = (text) => {
  return [
    ...new Set(
      (text.match(phoneRegex) || [])
        .concat(text.replace(/\s+/g, "@").match(phoneRegex) || [])
        .map((phone) => phone.replace(/\s+|-/g, ""))
        .map((phone) =>
          phone.length == 10
            ? phone
            : phone.length > 10 && phone[0] == "0"
            ? phone.substring(0, 11)
            : phone.substring(phone.length - 10)
        )
    ),
  ].filter((_) => _);
};

const parseJobType = (text) => {
  if(text.search("parttime") != -1){
    return "parttime";
  }
  if(text.search("intern") != -1){
    return "internship";
  }
  return "fulltime";
};

const needManualVerification = (text) => {
  return text.search(/\?/) != -1;
};

const parseRoles = (text) => {
  const roles = [];

  for(const keyword in keywords){
    if(text.search("keyword") != -1){
      roles.push(keywords[keyword]);
    }
  }
  return roles;
};

const parseTweet = (raw_text) => {
  const text = normalize(raw_text);
  const roles = parseRoles(text);

  return {
    categories: roles.map(role => categories[role]),
    roles: roles,
    type: parseJobType(text),
    phone_numbers: parsePhoneNumbers(raw_text),
    emails: raw_text.match(emailRegex) || [],
    need_manual_verification: needManualVerification(text)
  };
};

module.exports = { parseTweet, keywords, categories };
