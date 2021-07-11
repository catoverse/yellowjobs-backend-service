const express = require("express");
const verificationController = require("../controllers/verification");
const router = express.Router();

/**
 * @swagger
 * /api/verify:
 *     post:
 *         summary: Change need_manual_verification after human verification
 *         description: Change need_manual_verification after human verification
 *         requestBody:
 *           content:
 *             application/json:
 *           schema:
 *             type: object
 *             properties:
 *               auth:
 *                 type: string
 *               tweetId:
 *                 type: string
 *               accepted:
 *                 type: string
 *         responses:
 *             200:
 *                 description: Success
 */
router.post("/verify", async (req, res) => {
  try {
    res.send(await verificationController.modify(req.body));
  } catch (error) {
    res.send({ error: error.message });
  }
});

module.exports = router;
