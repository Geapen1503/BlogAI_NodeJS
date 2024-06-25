const express = require('express');
const router = express.Router();
const { User } = require('../db/db');



const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    else return res.status(401).json({ message: 'Unauthorized' });
};

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: sessionId
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         credits:
 *           type: integer
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Unauthorized
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Unauthorized
 *
 *     NotFoundError:
 *       description: User not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: User not found
 *
 *     InternalServerError:
 *       description: Error adding credits
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Error adding credits
 */
/**
 * @swagger
 * /add-credits-test/add-credits:
 *   post:
 *     summary: Add credits to the authenticated user
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Credits added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Credits added successfully
 *                 credits:
 *                   type: integer
 *                   example: 200
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */


router.post('/add-credits', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });


        user.credits += 100;
        await user.save();

        res.json({ message: 'Credits added successfully', credits: user.credits });
    } catch (error) {
        console.error('Error adding credits:', error);
        res.status(500).json({ message: 'Error adding credits' });
    }
});

module.exports = router;
