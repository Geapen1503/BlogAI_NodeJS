const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../db/db');


/**
 * @openapi
 * /create-session:
 *   post:
 *     summary: Create a new Stripe checkout session
 *     description: This endpoint is used to create a new Stripe checkout session for purchasing a product.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priceId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Stripe session created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       '401':
 *         description: User not logged in.
 *       '500':
 *         description: Internal server error.
 */



router.post('/create-session', async (req, res) => {
    const { priceId } = req.body;
    const session = req.session;

    if (!session.user) return res.status(401).json({ message: 'User not logged in' });

    try {
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/cancel.html`,
            metadata: {
                userId: session.user.id
            }
        });

        res.json({ url: stripeSession.url });
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        res.status(500).json({ message: 'Error creating Stripe session' });
    }
});

module.exports = router;
