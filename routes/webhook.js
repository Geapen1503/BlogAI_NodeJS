const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../db/db');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_email;

        try {
            const user = await User.findOne({ where: { email: customerEmail } });

            if (user) {
                const product = await stripe.products.retrieve(session.line_items.data[0].price.product);
                const creditsToAdd = parseInt(product.metadata.credits, 10);

                user.credits += creditsToAdd;
                await user.save();
            }
        } catch (error) {
            console.error('Error updating user credits:', error);
            return res.status(500).send('Internal server error');
        }
    }

    res.json({ received: true });
});

module.exports = router;
