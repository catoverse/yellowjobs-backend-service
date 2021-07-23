const express = require("express");
const swaggerJSDoc = require("swagger-jsdoc");
const verificationController = require("../controllers/verification");
const router = express.Router();

/**
 * @swagger
 * /api/verify:
 *   post:
 *     summary: For human verification of tweets
 *     description: Change need_manual_verification to approved or rejected after human verification
 *     parameters:
 *     - in: "body"
 *       name: "body"
 *       required: true
 *       schema:
 *         type: object
 *         properties:
 *           auth:
 *             type: string
 *           tweetId:
 *             type: string
 *           accepted:
 *             type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/verify", async (req, res) => {
  try {
    res.send(await verificationController.modify(req.body));
  } catch (error) {
    res.send({ error: error.message });
  }
});

module.exports = router;
