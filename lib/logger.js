//TODO: bulk write
const Logs = require("../models/Logs.schema");

const log = (event, value) => {
  let data = {
    event: event,
    value: String(value),
  };
  console.log("new:", data);
  let l = new Logs(data);
  l.save();
};
module.exports = { log };
