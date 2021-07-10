const Category = require("../models/Category.schema");
const cache = {};

const incVisits = async (category) => {
	cache[category] = cache[category] ? cache[category] + 1 : 1;

	// console.log(`${cache[category]} visits to ${category}.`);

	if(cache[category] >= 100){
		console.log(`Commiting visits to category ${category} to the DB...`);

		const visits = cache[category];

		await Category.updateOne({ _id: category }, { $inc: { visits } }, { upsert: true });
		cache[category] = cache[category] - visits;
		
		console.log(`Commit successful.`);
	}
};

const flush = async () => {
	console.log("Flushing cache to the DB...");
	console.log(cache);
	const ops = [];

	for(let category in cache){
		if(cache[category] == 0){
			continue;
		}
		ops.push({
			updateOne: {
				upsert: true,
				filter: { _id: category },
				update: { $inc: { visits: cache[category] }}
			}
		});
	}
	await Category.bulkWrite(ops);
	cache = {};
	console.log("Done flushing cache.");
};

const find = async ({ limit, offset, name }) => (
	await (
		name ?
			Category.find({ 
				_id: name.toLowerCase().split("-").map(e => e[0].toUpperCase() + e.substring(1, e.length)).join(" ")
			}).exec() :
			Category.find({}, null, {
				limit: Number(limit || 10),
				skip: Number(offset || 0),
				sort: { visits: -1 }
			}).exec()
	) || []
);

module.exports = {
	incVisits,
	flush,
	find
};