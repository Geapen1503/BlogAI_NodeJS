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
