const mongoose = require("mongoose");

const schema = new mongoose.Schema({
	_id: String,
	visits: Number
});

module.exports = mongoose.models.Category || mongoose.model("Category", schema);
