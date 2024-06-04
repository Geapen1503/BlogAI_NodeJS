const express = require('express');
const router = express.Router();




router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    res.json({
        username: req.session.user.username,
        credits: req.session.user.credits
    });
});

module.exports = router;
