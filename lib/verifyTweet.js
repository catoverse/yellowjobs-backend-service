const config = require("../data/verificationConfig.json");

const $or = (str, filters) => {
  let r = false;

  for(let filter of filters){
    if(typeof filter == "string"){
      r = str.search(filter) != -1;
    } else if(filter.$and) {
      r = $and(str, filter.$and);
    } else if(filter.$or){
      r = $or(str, filter.$or);
    } else {
      throw new Error(`Invalid filter ${JSON.stringify(filter)}`);
    }

    if(r){
      return r;
    }
  }

  return false;
};

const $and = (str, filters) => {
  let r = true;

  for(let filter of filters){
    if(typeof filter == "string"){
      r = str.search(filter) != -1;
    } else if(filter.$and) {
      r = $and(str, filter.$and);
    } else if(filter.$or){
      r = $or(str, filter.$or);
    } else {
      throw new Error(`Invalid filter ${JSON.stringify(filter)}`);
    }

    if(!r){
      return false;
    }
  }

  return true;
};

const verifyTweetText = (tweet) => {
  const words = tweet.text.toLowerCase().split(/\W/g).filter(_ => _).join(" ");

  if(config.alwaysDelete){
    if($or(words, config.alwaysDelete)){
      return -1;
    }
  }
  if(config.alwaysAdd){
    if($or(words, config.alwaysAdd)){
      return 2; // bypass further filtering
    }
    /*
    for(let phrase of config.alwaysAdd){
      if(words.search(phrase) != -1){
        return 2;
      }
    }
    */
  }
  if(config.delete){
    if($or(words, config.delete)){
      return -1; // delete
    }
  }
  if(config.add){
    if($or(words, config.add)){
      return 1; // add if the next filters pass
    }
  }
  if(config.markForVerification){
    if($or(words, config.markForVerification)){
      return 0; // mark for verification
    }
  }

  switch(config.default){
  case "alwaysAdd":
    return 2;
  case "add":
    return 1;
  case "markForVerification":
    return 0;
  case "delete":
    return -1;
  default:
    return 1;
  }
};

const verifyTweet = (tweet) => {
  const r = verifyTweetText(tweet);

  if(r != 1){
    return r == 2 ? 1 : r;
  }
  const trimedText = tweet.text.toLowerCase().replace(/\W/g, "")
  
  if(tweet.text.length < 75){
    return 0;
  }
  if(tweet.urls.length == 0 && tweet.email.length == 0 && tweet.text.toLowerCase().search(/dm|comment|contact/) == -1){
    return 0;
  }
  if(tweet.text.split("").filter(char => char.search(/\W/) == -1 && char == char.toUpperCase()).length > 20){
    return 0;
  }
  if(trimedText.search(/location|store|onsite/) != -1 && trimedText.search(/remote|wfh|workfromhome/g) == -1){
    return !tweet.categories.some(el => el == "Tech" || el == "Design") && tweet.type == "fulltime" ? -1 : 0;
  }
  if(trimedText.search(/hiring|lookingfor/) == -1){
    return 0;
  }
  return 1;
};

module.exports = verifyTweet;
