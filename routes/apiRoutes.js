const express = require("express");
const tweetController = require("../controllers/tweet");
const router = express.Router();

/**
 * @swagger
 * /api/:
 *     get:
 *         summary: Simple test endpoint
 *         description: Simple test endpoint
 *         responses:
 *             200:
 *                 description: A successful response
 */
router.get("/", async (req, res) => {
  res.send("This is the API endpoint");
});

/**
 * @swagger
 * /api/tweets:
 *     get:
 *         summary: Retrieve a list tweets.
 *         description: Retrive a list of 'limit' number of recent tweets based on the query filters
 *         parameters:
 *             - in: query
 *               name: limit
 *               type: integer
 *               description: max number of tweets to return
 *             - in: query
 *               name: offset
 *               type: integer
 *               description: number of tweets to offset the results by
 *             - in: query
 *               name: type
 *               type: string
 *               description: fulltime/parttime/internship/freelance
 *             - in: query
 *               name: role
 *               type: string
 *               description: role to filter
 *             - in: query
 *               name: category
 *               type: string
 *               description: job category to filter
 *             - in: query
 *               name: q
 *               type: string
 *               description: keyword search
 *         responses:
 *             200:
 *                 description: A list of n number of resource objects
 */
router.get("/tweets", tweetController.findAll);

module.exports = router;
