const { z } = require('zod');

const minLengthUsername = 3;
const minLengthPassword = 3;

const userSchema = z.object({
    username: z.string().min(minLengthUsername, 'Username must be at least ' + minLengthUsername + ' characters long'),
    password: z.string().min(minLengthPassword, 'Password must be at least ' + minLengthPassword + ' characters long')
});

module.exports = { userSchema };
