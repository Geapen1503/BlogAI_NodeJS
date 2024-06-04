const jwt = require('jsonwebtoken');
const { User } = require('../db/db');


const authenticateJWT = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token required' });


    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const user = await User.findOne({ where: { username: decoded.username } });
        if (!user) return res.status(403).json({ message: 'Invalid token' });

        req.user = user;
        next();
    } catch (error) {
        console.error('Error in authenticateJWT:', error);
        res.status(500).json({ message: 'Failed to authenticate token' });
    }
};

module.exports = authenticateJWT;
