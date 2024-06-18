const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get user information
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: The username of the logged-in user
 *                 mail:
 *                   type: string
 *                   description: The email of the logged-in user
 *                 credits:
 *                   type: integer
 *                   description: The credits of the logged-in user
 *               example:
 *                 username: john_doe
 *                 mail: john_doe@example.com
 *                 credits: 100
 *       401:
 *         description: User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: User not logged in
 */


router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    res.json({
        username: req.session.user.username,
        mail: req.session.user.mail,
        credits: req.session.user.credits
    });
});

module.exports = router;
