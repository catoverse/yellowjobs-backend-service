const { contentSecurityPolicy } = require("helmet");
const fetch = require("node-fetch");
const rolesRaw = require("./data/roles.json");

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

//remove all special characters incliuding spaces
// const normalize = (text) => {
//   return text.toLowerCase().replace(/\W/g, "");
// };
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
  return Promise.all(
    (text.match(/https:\/\/t.co\/\w{10}/g) || []).map(
      async (url) => (await fetch(url)).url
    )
  );
};

const parseJobType = (text) => {
  let words = text
    .toLowerCase()
    .split(/\W/g)
    .filter((_) => _);
  let nextWords = new Array(words.length + 1).fill("");

  for (let i = 0; nextWords.length > 1 && i < 2; ++i) {
    nextWords.pop();

    for (let j = 0; j < nextWords.length; ++j) {
      nextWords[j] += words[i + j];
    }
    for (const word of nextWords) {
      if (word == "parttime") {
        return "parttime";
      }
      if (word == "intern" || word == "interns" || word == "internship") {
        return "internship";
      }
      if (word == "freelance" || word == "temporary") {
        return "freelance";
      }
      if (word == "fulltime") {
        return "fulltime";
      }
      if (word == "freshers" || word == "no experience"  || word == "fresher") {
         return "freshers";
      }
    }
  }
  return "fulltime";
};

const needManualVerification = (text) => {
  return text.search(/\?/) != -1;
};

const parseRoles = (text) => {
  // Converts a text like "This is a sentence" to "thisis", "isa", "asentence", "thisisa", "isasentence", "thisisasentence" and matches with the keywords list

  let words = text
    .toLowerCase()
    .split(/\W/g)
    .filter((_) => _);
  let nextWords = new Array(words.length + 1).fill("");
  const roles = new Set();

  for (let i = 0; nextWords.length > 1 && i < 3; ++i) {
    // stop when either there are no more words to join or the number of words already joined is more than 3, assuming our keyword list doesn't have any keyword that requires more than 3 whitespaces
    nextWords.pop();

    for (let j = 0; j < nextWords.length; ++j) {
      nextWords[j] += words[i + j];
    }
    for (const word of nextWords) {
      if (keywords[word]) {
        // `keywords` is a map created from roles.json for constant time lookups
        roles.add(keywords[word]);
      }
    }
  }
  //console.log(`Text: ${text}\nRoles: ${[...roles]}\n`);
  return [...roles].flat();
};

const parseTweet = async (raw_text) => {
  //const text = normalize(raw_text); //remove all special characters incliuding spaces
  const roles = parseRoles(raw_text);

  return {
    categories: [...new Set(roles.map((role) => categories[role]).flat())],
    roles: roles,
    type: parseJobType(raw_text),
    emails: raw_text.match(emailRegex) || [],
    urls: [...new Set(await parseURLs(raw_text))],
    need_manual_verification: needManualVerification(raw_text),
    //stripped_text: text,
  };
};

module.exports = { parseTweet, keywords, categories, parseRoles };
