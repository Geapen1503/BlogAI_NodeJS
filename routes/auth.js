const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db/db');
const { userSchema } = require('../schemas/userSchema');
const validate = require('../middleware/validate');
const router = express.Router();

const JWT_SECRET = "${process.env.TOKEN_SECRET}";



/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - mail
 *       properties:
 *         username:
 *           type: string
 *           description: The user's username
 *         password:
 *           type: string
 *           description: The user's password
 *         mail:
 *           type: string
 *           description: The user's email
 *       example:
 *         username: root
 *         password: root
 *         mail: root@example.com
 */
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The authentication managing API
 */
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The user was successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: The user already exists or email already taken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exists or Email already taken
 *       500:
 *         description: Error registering user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error registering user
 */



router.post('/register', validate(userSchema), async (req, res) => {
    const { username, mail, password } = req.body;

    try {
        const userExists = await User.findOne({ where: { username } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const mailExists = await User.findOne({ where: { mail } });
        if (mailExists) return res.status(400).json({ message: 'Mail already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, mail, password: hashedPassword });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});



/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The user was successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Error logging in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error logging in
 */



router.post('/login', validate(userSchema), async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("login attempt:", {username, password});

        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

        req.session.user = {
            id: user.userId
        };

        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });


        // useless
        // res.cookie('token', token, { httpOnly: true, secure: false });
        /*user.token = token;
        await user.save();
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });*/

        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});




/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a User
 *     tags:
 *       - Auth
 *     responses:
 *       '200':
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       '500':
 *         description: Error while logging out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error logging out
 */


router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Error logging out' });

        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});



module.exports = router;
