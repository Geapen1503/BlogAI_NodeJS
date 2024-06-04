const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error.errors) {
            return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
        } else {
            return res.status(400).json({ message: 'Invalid request' });
        }
    }
};

module.exports = validate;
