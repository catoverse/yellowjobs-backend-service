const config = require("../data/verificationConfig.json");

const verifyTweetText = (tweet) => {
  const words = tweet.text.toLowerCase().split(/\W/g).filter(_ => _).join(" ");

  if(config.add){
    for(let phrase of config.add){
      if(words.search(phrase) != -1){
        return 2;
      }
    }
  }
  if(config.delete){
    for(let phrase of config.delete){
      if(words.search(phrase) != -1){
        return -1;
      }
    }
  }
  if(config.markForVerification){
    for(let phrase of config.markForVerification){
      if(words.search(phrase) != -1){
        return 0;
      }
    }
  }

  switch(config.default){
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
/* 
const verifyTweetText = (tweet) => {
  let state = 0;
  const words = tweet.text.toLowerCase().split(/\W/g).filter(_=>_);

  for(let i = 0; i < words.length; ++i){
    const word = words[i];

    switch(word){
    case "advice":
      return -1;
    }

    switch(state){
    case 0:

      switch(word){
      case "a":
        state = 6;
        break;
      case "i":
        state = 1;
        break;
      case "am":
        state = 2;
        break;
      case "my":
        state = 3;
        break;
      case "check":
        state = 4;
        break;
      case "are":
        state = 9;
        break;
      case "hire":
        state = 13;
        break;
      case "join":
        state = 14;
        break;
      case "premium":
        state = 16;
        break;
      case "article":
        return -1;
      }
      break;

    case 1:
      switch(word){
      case "m":
      case "am":
        state = 2;
        break;
      case "need":
        state = 8;
        break;
      default:
        return 0;
      }
      break;

    case 2:
      switch(word){
      case "hiring":
        return 2;
      case "looking":
        state = 7;
        break;
      default:
        return 0;
      }
      break;

    case 3:
      switch(word){
      case "work":
      case "cv":
      case "resume":
      case "portfolio":
      case "profile":
        return -1;
      default:
        state = 0;
        break;
      }
      break;

    case 4:
      switch(word){
      case "out":
        state = 5;
        break;
      default:
        state = 0;
        break;
      }
      break;

    case 5:
      switch(word){
      case "my":
        return -1;
      default:
        state = 0;
        break;
      }
      break;

    case 6:
      switch(word){
      case "my":
        state = 3;
        break;
      case "check":
        state = 4;
        break;
      default:
        state = 0;
        break;
      }
      break;

    case 7:
      switch(word){
      case "for":
        state = 8;
        break;
      default:
        return 0;
      }
      break;

    case 8:
      switch(word){
      case "someone":
        return 2;
      default:
        return 0;
      }
      break;

    case 9:
      switch(word){
      case "you":
        state == 10;
        break;
      case "hiring":
        return 2;
      default:
        state = 0;
        break;
      }
      break;

    case 10:
      switch(word){
      case "looking":
        state = 11;
        break;
      default:
        state = 0;
        break;
      }
      break;

    case 11:
      switch(word){
      case "for":
        state = 12;
        break;
      default:
        state = 0;
        break;
      }
      break;

    case 12:
      switch(word){
      case "someone":
        return -1;
      default:
        state = 0;
        break;
      }
      break;

    case 13:
      switch(word){
      case "me":
      case "them":
      case "him":
      case "us":
        return -1;
      default:
        state = 0;
        break;
      }
      break;
    
    case 14:
      switch(word){
      case "our":
        state = 15;
        break;
      default:
        state = 0;
        break;
      }
      break;

    case 15:
      switch(word){
      case "server":
        return -1;
      default:
        state = 0;
        break;
      }
      break;

    case 16:
      switch(word){
      case "accounts":
        return -1;
      default:
        state = 0;
        break; 
      }
      break;
    }
  }
  return 1;
};
*/

const verifyTweet = (tweet) => {
  const r = verifyTweetText(tweet);

  if(r != 1){
    return r == 2 ? 1 : r;
  }
  const trimedText = tweet.text.toLowerCase().replace(/\W/g, "")
  
  if(tweet.text.length < 80){
    return 0;
  }
  if(tweet.urls.length == 0 && tweet.email.length == 0 && tweet.text.toLowerCase().search(/dm|comment|contact/) == -1){
    return 0;
  }
  if(tweet.text.split("").filter(char => char.search(/\W/) == -1 && char == char.toUpperCase()).length > 20){
    return 0;
  }
  if(trimedText.search(/location|store|onsite/) != -1 && trimedText.search(/remote|wfh|workfromhome/g) == -1){
    return tweet.categories.some(el => el == "Tech" || el == "Design") ? 0 : -1;
  }
  if(trimedText.search(/hiring|lookingfor/) == -1){
    return 0;
  }
  return 1;
};

module.exports = verifyTweet;