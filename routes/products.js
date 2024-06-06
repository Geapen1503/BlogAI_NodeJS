const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


/**
 * @swagger
 * /:
 *   get:
 *     summary: Retrieve a list of products
 *     description: Fetches a list of products and their prices from Stripe.
 *     responses:
 *       '200':
 *         description: A JSON array of products.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: integer
 *                   priceId:
 *                     type: string
 *       '500':
 *         description: Internal server error.
 */



router.get('/', async (req, res) => {
    try {
        const products = await stripe.products.list();
        const prices = await stripe.prices.list();

        const productDetails = products.data.map(product => {
            const productPrice = prices.data.find(price => price.product === product.id);

            if (productPrice) {
                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: productPrice.unit_amount,
                    priceId: productPrice.id
                };
            } else {
                console.warn(`No price found for product: ${product.id}`);
                return null;
            }
        }).filter(product => product !== null);

        res.json(productDetails);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

module.exports = router;
