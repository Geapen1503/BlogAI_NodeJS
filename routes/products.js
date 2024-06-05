const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Retrieve AI Blog Products
 *     description: Retrieve a list of AI Blog Products with their details.
 *     responses:
 *       '200':
 *         description: A JSON array of AI Blog Products.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       '500':
 *         description: Internal server error.
 */

router.get('/', async (req, res) => {
    try {
        const products = await stripe.products.list();
        const prices = await stripe.prices.list();

        const productDetails = products.data
            .filter(product => product.metadata.tag === 'BlogAI_Products')
            .map(product => {
                const productPrice = prices.data.find(price => price.product === product.id);
                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: 1000,
                    priceId: productPrice.id,
                    credits: product.metadata.credits
                };
            });

        res.json(productDetails);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

module.exports = router;
