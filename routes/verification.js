const express = require("express");
const verificationController = require("../controllers/verification");
const router = express.Router();
/**
 *@sw0agger
 *definitions:
 *  Verification:
 *    type: object
 *    properties:
 *      auth:
 *        type: string
 *      tweetId:
 *        type: string
 *      accepted:
 *        type: string
 **/

/**
 * @swagger
 * /api/verify:
 * api/verify:
 *   post:
 *     summary: For human verification of tweets
 *     description: Change need_manual_verification to approved or rejected after human verification
 *     parameters:
 *     - in: "body"
 *       name: "body"
 *       required: true
 *       schema:
 *         $ref: "#/definitions/Verification"
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
