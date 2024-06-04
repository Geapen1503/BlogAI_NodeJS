const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/', async (req, res) => {
    try {
        const products = await stripe.products.list();
        const prices = await stripe.prices.list();

        const productDetails = products.data.map(product => {
            const productPrice = prices.data.find(price => price.product === product.id);
            return {
                id: product.id,
                name: product.name,
                description: product.description,
                price: productPrice.unit_amount,
                priceId: productPrice.id
            };
        });

        res.json(productDetails);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

module.exports = router;
