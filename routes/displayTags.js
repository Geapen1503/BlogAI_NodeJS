const express = require('express');
const router = express.Router();

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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized, user not logged in
 *       404:
 *         description: User not found
 *       500:
 *         description: Error fetching tags
 */


router.get('/tags', (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const tags = req.session.user.tags;

        if (!tags) {
            return res.status(404).json({ error: 'Tags not found' });
        }

        res.status(200).json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Error fetching tags' });
    }
});

module.exports = router;
