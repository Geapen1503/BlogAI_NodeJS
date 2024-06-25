const express = require('express');
const router = express.Router();
const { User, ApiKey } = require('../db/db');
const crypto = require('crypto');


function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    else return res.status(403).json({ message: 'You must be log to access this page' });

}

async function generateApiKey() {
    let apiKey;
    let isUnique = false;

    while (!isUnique) {
        apiKey = crypto.randomBytes(32).toString('hex');
        const existingApiKey = await ApiKey.findOne({ where: { key: apiKey } });

        if (!existingApiKey) isUnique = true;
    }

    return apiKey;
}


/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: The API key.
 *         userId:
 *           type: integer
 *           description: ID of the user who owns the API key.
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message.
 */
/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: Get API keys of the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     type: string
 *       403:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/keys:
 *   post:
 *     summary: Generate a new API key for the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Newly generated API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *       403:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */


router.get('/keys', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ where: { userId: req.session.user.id } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const apiKeys = await ApiKey.findAll({ where: { userId: user.userId } });
        res.json({ apiKeys: apiKeys.map(key => key.key) });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/keys', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ where: { userId: req.session.user.id } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newApiKey = await generateApiKey();
        await ApiKey.create({ key: newApiKey, userId: user.userId });

        res.json({ apiKey: newApiKey });
    } catch (error) {
        console.error('Error generating API key:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;
