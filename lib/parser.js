const fetch = require("node-fetch");

const fs = require("fs");
const { parse: parseCSV } = require("csv/lib/sync");

const rolesRaw = require("../data/roles.json");
const cities = parseCSV(fs.readFileSync(__dirname + "/../data/cities.csv"));
const citiesIndex = {};

for (let city of cities) {
  citiesIndex[city[0].toLowerCase().replace(/\W/g, "")] = city[0];
  citiesIndex[city[1].toLowerCase().replace(/\W/g, "")] = city[1];
  citiesIndex[city[2].toLowerCase().replace(/\W/g, "")] = city[2];
}

const categories = Object.keys(rolesRaw)
  .map((category) =>
    Object.keys(rolesRaw[category]).map((role) => ({ role, category }))
  )
  .flat()
  .reduce(
    (acc, { role, category }) =>
      acc[role]
        ? acc[role].push(category) && acc
        : { ...acc, [role]: [category] },
    {}
  );

const keywords = Object.values(rolesRaw)
  .map((r) =>
    Object.entries(r).map(([role, keywords]) =>
      keywords.map((keyword) => ({ keyword, role }))
    )
  )
  .flat(2)
  .reduce(
    (acc, { keyword, role }) =>
      acc[keyword]
        ? acc[keyword].push(role) && acc
        : { ...acc, [keyword]: [role] },
    {}
  );

const emailRegex =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/g;

/*
const phoneRegex =
  /(?!([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2}))(\+?\d[\d -]{8,12}\d)/g;
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

const keywordMatch = (text, callback, maxDepth = 3) => {
  // Converts a text like "This is a sentence" to "thisis", "isa", "asentence", "thisisa", "isasentence", "thisisasentence" and matches with the callback

  let words = text
    .toLowerCase()
    .split(/\W/g)
    .filter((_) => _);
  let nextWords = new Array(words.length + 1).fill("");

  for (let i = 0; nextWords.length > 1 && i < maxDepth; ++i) {
    // stop when either there are no more words to join or the number of words already joined is more than 3, assuming our keyword list doesn't have any keyword that requires more than `maxDepth` whitespaces
    nextWords.pop();

    for (let j = 0; j < nextWords.length; ++j) {
      nextWords[j] += words[i + j];
    }
    for (const word of nextWords) {
      if(callback(word)){
        return true;
      }
    }
  }
  return false;
};

const parseURLs = (text) => [...new Set(text.match(/https:\/\/t.co\/\w{10}/g) || [])];
const normalizeURLs = async (urls) => [...new Set(await Promise.all(urls.map(async (url) => (await fetch(url)).url)))];
const parseEmails = (raw_text) => raw_text.match(emailRegex) || [];

const parseLocation = (text) => {
  let location = null;

  keywordMatch(text, (word) => {
    if (citiesIndex[word]) {
      location = citiesIndex[word];
      return true;
    }
  });

  return location;
};

const parseRoles = (text) => {
  const roles = new Set();

  keywordMatch(text, word => {
    if(keywords[word]){ // `keywords` is a map created from roles.json for constant time lookups
      roles.add(keywords[word]);
    }
  });
  //console.log(`Text: ${text}\nRoles: ${[...roles]}\n`);
  return [...roles].flat();
};

const parseJobType = (text) => {
  let type = "fulltime";

  keywordMatch(text, (word) => {
    if (word == "parttime") {
      type = "parttime";
    } else if (word == "intern" || word == "interns" || word == "internship" || word == "apprentice" || word == "apprenticeship") {
      type = "internship";
    } else if (word == "freelance" || word == "temporary" || word == "budget" || word == "contract") {
      type = "freelance";
    } else if (word == "fulltime") {
      type = "fulltime";
    } else if (word == "freshers" || word == "noexperience" || word == "fresher") {
      type = "freshers";
    } else {
      return false; // continue iterating
    }
    return true; // stop iterating once a type is found
  });

  return type;
};

const getCategoriesFromRoles = (roles) => [...new Set(roles.map((role) => categories[role]).flat())];
const parseTweet = async (raw_text) => {
  //const text = normalize(raw_text); //remove all special characters incliuding spaces
  const roles = parseRoles(raw_text);

  return {
    categories: getCategoriesFromRoles(roles),
    roles: roles,
    type: parseJobType(raw_text),
    emails: parseEmails(rawText),
    urls: parseURLs(raw_text),
    //stripped_text: text,
  };
};

module.exports = { keywords, categories, parseTweet, parseRoles, parseEmails, parseJobType, parseURLs, normalizeURLs, getCategoriesFromRoles, parseLocation };