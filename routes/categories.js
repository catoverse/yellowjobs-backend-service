const express = require("express");
const categoryController = require("../controllers/category");
const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *     get:
 *         summary: Retrieve a list categories.
 *         description: Retrive a list of categories sorted by the number of visits
 *         parameters:
 *             - in: query
 *               name: limit
 *               type: integer
 *               description: max number of categories to return
 *             - in: query
 *               name: offset
 *               type: integer
 *               description: number of categories to skip
 *             - in: query
 *               name: name
 *               type: string
 *               description: find category by name						
 *         responses:
 *             200:
 *                 description: A list of category objects
 */
router.get("/categories", async (req, res) => {
	try {
		res.send(await categoryController.find(req.query));
	} catch(error){
		res.send({ error: error.message });
	}
});

module.exports = router;