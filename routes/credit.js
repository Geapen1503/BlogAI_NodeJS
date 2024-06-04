const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../db/db');



router.get('/', async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token required' });
    }

    try {
        const user = await User.findOne({ where: { token } });
        if (!user) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        res.json({ credits: user.credits });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('An error occurred.');
    }
});



module.exports = router;
