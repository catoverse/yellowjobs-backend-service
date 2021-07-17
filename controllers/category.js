const Category = require("../models/Category.schema");
const categories = require("../data/roles.json");

const categoriesKeywords = Object.keys(categories)
  .map((category) => ({
    [category.toLowerCase().replace(/\s+/g, "")]: category,
  }))
  .reduce((a, b) => ({ ...a, ...b }), {});

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

const find = async ({ limit, offset, name }) => {

	if(name){
		const category = categoriesKeywords[name];
		const roles = categories[category];

		return { category, roles };
	}

	const categories_ = await Category
		.find({}, null, {
			limit: Number(limit || 100),
			offset: Number(offset || 0),
			sort: { visits: -1 }
		})
		.exec();

	const final = categories_
		.filter(category => {
			return categories[category._id]
		})
		.map(category => ({
			category: category._id,
			roles: Object.keys(categories[category._id] || {})
		}));

	return final;
};

module.exports = {
	incVisits,
	flush,
	find
};