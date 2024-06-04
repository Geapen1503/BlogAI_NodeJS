const authenticateTokenFromDB = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Token required' });
        }

        const user = await User.findOne({ where: { token } });
        if (!user) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error authenticating token:', error);
        res.status(500).json({ message: 'Error authenticating token' });
    }
};

module.exports = authenticateTokenFromDB;
