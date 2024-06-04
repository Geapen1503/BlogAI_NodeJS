const dotenv = require('dotenv');
dotenv.config();
4
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../db/db');

router.post('/create-session', async (req, res) => {
    const { priceId } = req.body;
    const session = req.session;

    if (!session.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }

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
