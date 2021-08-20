const express = require("express");
const swaggerJSDoc = require("swagger-jsdoc");
const feedbackController = require("../controllers/feedback");
const router = express.Router();

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Record user interaction with a tweet
 *     description: record share,report,save event
 *     parameters:
 *     - in: "body"
 *       name: "body"
 *       required: true
 *       schema:
 *         type: object
 *         properties:
 *           userId:
 *             type: string
 *           tweetId:
 *             type: string
 *           action:
 *             type: string
 *           value:
 *             type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/feedback", async (req, res) => {
  try {
    res.send(await feedbackController.save(req.body));
  } catch (error) {
    res.send({ error: error.message });
  }
});

module.exports = router;
