const express = require('express');
const { User } = require('../db/db');
const router = express.Router();


function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'User not logged in' });
}

/**
 * @swagger
 * tags:
 *   name: DisplayTags
 *   description: Routes for displaying tags
 */
/**
 * @swagger
 * /display/tags:
 *   get:
 *     summary: Display tags of the connected user
 *     tags: [DisplayTags]
 *     responses:
 *       200:
 *         description: Tags displayed successfully
 *       401:
 *         description: Unauthorized, user not logged in
 *       404:
 *         description: User not found
 *       500:
 *         description: Error fetching tags
 */


router.get('/tags', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findByPk(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const tags = JSON.parse(user.tags || '[]');
        res.json({ tags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ message: 'Error fetching tags' });
    }
});

module.exports = router;
