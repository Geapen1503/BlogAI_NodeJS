const dotenv = require('dotenv');
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function initializeProducts() {
    try {
        const existingProducts = await stripe.products.list();
        const existingPrices = await stripe.prices.list();

        const productExists = existingProducts.data.some(product => product.name === '100 Credits');
        const priceExists = existingPrices.data.some(price => price.unit_amount === 1000 && price.currency === 'usd');

        if (!productExists) {
            const product = await stripe.products.create({
                name: '100 Credits',
                description: 'Get 100 credits for your account',
                metadata: { credits: '1000', tag: 'BlogAI_Products' },
            });

            if (!priceExists) {
                await stripe.prices.create({
                    unit_amount: 1000,
                    currency: 'usd',
                    product: product.id,
                });
            }
            console.log('Product and price created:', product.id);
        } else {
            console.log('Product already exists.');
        }
    } catch (error) {
        console.error('Error initializing products:', error);
    }
}

module.exports = initializeProducts;
