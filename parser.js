const fetch = require("node-fetch");
const rolesRaw = require("./data/roles.json");
const categories = Object.keys(rolesRaw).map(category => Object.keys(rolesRaw[category]).map(el => ({ [el]: category }))).flat().reduce((acc, el) => ({ ...acc, ...el }), {});
const keywords = Object.values(rolesRaw).map(r => Object.entries(r).map(([role, keywords]) => keywords.map(el => ({ [el]: role })))).flat().flat().reduce((acc, el) => ({ ...acc, ...el }), {});

const normalize = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+|\?|!|&|\.|,|:|\'|\"|\/|\(|\)|-/g, "");
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
// const phoneRegex =
//  /(?!([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2}))(\+?\d[\d -]{8,12}\d)/g;
const emailRegex =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/g;
/*
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
*/
const parseURLs = (text) => {
  return Promise.all((text.match(/https:\/\/t.co\/\w{10}/g) || []).map(async url => {
    const res = await fetch(url);
    console.log(res.url);
    return res.url;
  }));
};

const parseJobType = (text) => {
  if(text.search("parttime") != -1){
    return "parttime";
  }
  if(text.search("intern") != -1){
    return "internship";
  }
  if(text.search(/contract|freelance|temporary|consultant/g) != -1){
    return "freelance";
  }
  return "fulltime";
};

const needManualVerification = (text) => {
  return text.search(/\?/) != -1;
};

const parseRoles = (text) => {
  let words = text.toLowerCase().split(/\s+|\?|!|&|\.|,|:|\'|\"|\/|\(|\)|-/g);
  let nextWords = [];
  const roles = new Set;
  
  do {
    nextWords = [];

    for(let word of words){
      if(keywords[word]){
        roles.add(keywords[word]);
      } else {
        nextWords.push(word);
      }
    }
    words = [];
    for(let i = 0; i < nextWords.length - 1; ++i){
      words.push(nextWords[i] + nextWords[i+1]);
    }
  } while(nextWords.length <= 1);

  return [...roles];
};

const parseTweet = async (raw_text) => {
  const text = normalize(raw_text);
  const roles = parseRoles(raw_text);

  return {
    categories: [... new Set(roles.map(role => categories[role]))],
    roles: roles,
    type: parseJobType(text),
    emails: raw_text.match(emailRegex) || [],
    urls: await parseURLs(raw_text),
    need_manual_verification: needManualVerification(raw_text)
  };
};

module.exports = { parseTweet, keywords, categories };
