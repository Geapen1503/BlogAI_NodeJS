const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../db/db');


/**
 * @openapi
 * /checkout/create-session:
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
 *                 description: The ID of the price to be used in the checkout session.
 *                 example: price_1I0bZa2eZvKYlo2CUxPwnZ9J
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
 *                   description: The URL of the created Stripe session.
 *                   example: https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0k
 *       '401':
 *         description: User not logged in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not logged in
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error creating Stripe session
 */



router.post('/create-session', async (req, res) => {
    const { priceId } = req.body;
    const session = req.session;

    if (!session.user) return res.status(401).json({ message: 'User not logged in' });

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/cancel.html`
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        res.status(500).json({ message: 'Error creating Stripe session' });
    }
});

module.exports = router;
