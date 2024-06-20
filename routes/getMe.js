const express = require('express');
const router = express.Router();
const { User } = require('../db/db');

/**
 * @swagger
 * /get-me:
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

router.get('/', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ message: 'User not logged in' });

        const userId = req.session.user.id;

        const user = await User.findByPk(userId, {
            attributes: ['username', 'mail', 'credits']
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            username: user.username,
            mail: user.mail,
            credits: user.credits
        });
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ message: 'Error fetching user information' });
    }
});

module.exports = router;
