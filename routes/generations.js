const express = require('express');
const { Generation, User } = require('../db/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = "${process.env.TOKEN_SECRET}";



/**
 * @swagger
 * components:
 *   schemas:
 *     Generation:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - userId
 *       properties:
 *         idPost:
 *           type: integer
 *           description: The generation ID
 *         title:
 *           type: string
 *           description: The title of the generation
 *         description:
 *           type: string
 *           description: The description of the generation
 *         userId:
 *           type: integer
 *           description: The ID of the user who created the generation
 *       example:
 *         title: My First Generation
 *         description: This is a description of my first generation.
 *         userId: 1
 */
/**
 * @swagger
 * tags:
 *   name: Generations
 *   description: The generations managing API
 */
/**
 * @swagger
 * /generations:
 *   get:
 *     summary: Get generations of the logged-in user
 *     tags: [Generations]
 *     responses:
 *       200:
 *         description: Generations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Generation'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Error retrieving generations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error retrieving generations
 */


router.get('/', async (req, res) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: 'Unauthorized' });


    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ where: { username: decoded.username } });

        if (!user) return res.status(401).json({ message: 'Unauthorized' });


        const generations = await Generation.findAll({ where: { userId: user.userId } });

        res.json(generations);
    } catch (error) {
        console.error('Error retrieving generations:', error);
        res.status(500).json({ message: 'Error retrieving generations' });
    }
});

module.exports = router;
