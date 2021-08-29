const express = require("express");
// const { incVisits } = require("../controllers/category");
const tweetController = require("../controllers/tweet");
const router = express.Router();

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
 *               name: typea
 *               type: array
 *               items:
 *                   type: string
 *               description: fulltime/parttime/internship/freelance
 *             - in: query
 *               name: roles
 *               type: array
 *               items:
 *                   type: string
 *               description: list of roles to filter
 *             - in: query
 *               name: categories
 *               type: array
 *               items:
 *                   type: string
 *               description: list of job categories to filter
 *             - in: query
 *               name: q
 *               type: string
 *               description: keyword search
 *             - in: query
 *               name: unverified
 *               type: string
 *               enum: [true, false]
 *               description: set true to get unverified tweets
 *               default: false
 *         responses:
 *             200:
 *                 description: A list of tweet objects
 */
router.get("/tweets", async (req, res) => {
  let tweets = null;

  try {
    tweets = await tweetController.findAll(req.query);
    res.send(tweets); // send response before we update the visits, no problem even if the update fails after the response has been sent
  } catch (error) {
    res.send({ error: error.message });
  }
  /*
  try {
    const categories = new Set();

    for (let tweet of tweets) {
      for (let category of tweet.categories) {
        categories.add(category);
      }
    }
    await Promise.all([...categories].map(incVisits));
  } catch (error) {
    console.error(error);
  }
  */
});

/**
 * @swagger
 * /api/savedtweets:
 *   get:
 *     summary: Get saved tweets
 *     description: saved
 *     parameters:
 *         - in: query
 *           name: userId
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/savedtweets", async (req, res) => {
  let tweets = null;

  try {
    tweets = await tweetController.findSaved(req.query);
    res.send(tweets); // send response before we update the visits, no problem even if the update fails after the response has been sent
  } catch (error) {
    res.send({ error: error.message });
  }
});

module.exports = router;
