const express = require('express');
const axios = require('axios');
const GPT3Tokenizer = require('gpt-3-encoder');
const { User, Generation, ApiKey} = require('../db/db');
const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;




/**
 *  @swagger
 *  components:
 *    schemas:
 *      GenerateArticleRequest:
 *        type: object
 *        required:
 *          - description
 *          - maxTokens
 *        properties:
 *          description:
 *            type: string
 *            description: The detailed description of the blog post
 *          includeImages:
 *            type: boolean
 *            description: Whether to include images in the blog post
 *          numImages:
 *            type: integer
 *            description: The number of images to include in the blog post
 *          maxTokens:
 *            type: integer
 *            description: The maximum number of tokens for the generated article
 *          gptModel:
 *            type: string
 *            description: The GPT model to use for generating the article (e.g., GPT3_5, GPT4)
 *          apiKey:
 *            type: string
 *            description: The API key for authentication
 *        example:
 *          description: The impact of chicken on society and daily life.
 *          includeImages: true
 *          numImages: 3
 *          maxTokens: 500
 *          gptModel: GPT4
 *          apiKey: your_api_key_here
 */
/**
 * @swagger
 * /blog/generate:
 *   post:
 *     summary: Generate a blog article
 *     tags: [Blog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateArticleRequest'
 *     responses:
 *       200:
 *         description: The generated blog article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateArticleResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Description and max tokens are required
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not logged in
 *       402:
 *         description: Payment Required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User does not have enough credits
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error generating article
 */
/**
 * @swagger
 * /blog/test-token-count:
 *   post:
 *     summary: Test token count and cost estimation
 *     tags: [Blog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to test token count
 *               gptModel:
 *                 type: string
 *                 description: The GPT model to use for testing (e.g., GPT3_5, GPT4)
 *             example:
 *               text: Write a detailed blog post about the impact of technology on education.
 *               gptModel: GPT4
 *     responses:
 *       200:
 *         description: The token count and estimated cost
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inputTokens:
 *                   type: integer
 *                   description: The number of input tokens
 *                 outputTokens:
 *                   type: integer
 *                   description: The number of output tokens (assumed to be the same as input for estimation)
 *                 inputCost:
 *                   type: string
 *                   description: The cost of input tokens
 *                 outputCost:
 *                   type: string
 *                   description: The cost of output tokens
 *                 totalCost:
 *                   type: string
 *                   description: The total cost of input and output tokens
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Text and GPT model are required
 */





router.post('/generate', async (req, res) => {
    const { description, includeImages, numImages, maxTokens, gptModel, apiKey } = req.body;
    let userRecord = null;


    if (!description || !maxTokens) return res.status(400).json({ message: 'description, and max tokens are required' });

    if (maxTokens < 1000) return res.status(400).json({ message: 'maxTokens must be at least 1000' });


    try {
        console.log('Received request to generate article...');
        console.log('Description:', description);
        console.log('Include Images:', includeImages);
        console.log('Number of Images:', numImages);
        console.log('Max Tokens:', maxTokens);
        console.log('GPT Model:', gptModel);


        if (req.session && req.session.user) {
            userRecord = await User.findOne({ where: { userId: req.session.user.id } });
        } else if (apiKey) {
            userRecord = await User.findOne({
                include: {
                    model: ApiKey,
                    where: { key: apiKey }
                }
            });
        }


        if (!userRecord) return res.status(403).json({ message: 'Unauthorized' });


        const user = userRecord;

        if (user.credits >= maxTokens) user.credits -= maxTokens;
        else return res.status(402).json({ message: 'User do not have enough credits' });


        const previousTitles = JSON.parse(user.titles || '[]');
        const titlesString = previousTitles.length ? ` Make sure the post is different from previous topics: ${previousTitles.join(', ')}.` : '';

        const textPrompt = `Write a detailed blog post about the description: ${description}.${titlesString} The post should include a clear and concise title followed by the content. Use HTML tags like h1 for the title, h2, h3, p to format the text. You must include ${numImages} img tags where images would be appropriate. Make sure to conclude the post naturally within ${maxTokens * 0.6} tokens.`;


        console.log('Generating text content...');
        let gptModelUrl = '';
        let data = {};

        switch (gptModel) {
            case 'GPT3_5':
                gptModelUrl = 'https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions';
                //gptModelUrl = 'https://api.pawan.krd/v1/chat/completions';
                data = {
                    prompt: textPrompt,
                    max_tokens: parseInt(maxTokens, 10),
                    n: 1,
                    stop: ["\n\n\n\n"],
                    temperature: 0.7,
                };
                break;
            case 'GPT4':
                gptModelUrl = 'https://api.openai.com/v1/chat/completions';
                data = {
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: textPrompt }
                    ],
                    max_tokens: parseInt(maxTokens, 10),
                    n: 1,
                    stop: ["\n\n\n\n"],
                    temperature: 0.7,
                };
                break;
            default:
                gptModelUrl = 'https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions';
                data = {
                    prompt: textPrompt,
                    max_tokens: parseInt(maxTokens, 10),
                    n: 1,
                    stop: ["\n\n\n\n"],
                    temperature: 0.7,
                };
        }

        const inputTokens = GPT3Tokenizer.encode(textPrompt).length;

        const textResponse = await axios.post(
            gptModelUrl,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        let article = '';
        if (gptModel === 'GPT4') article = textResponse.data.choices[0].message.content.trim();
        else article = textResponse.data.choices[0].text.trim();

        const outputTokens = GPT3Tokenizer.encode(article).length;
        console.log(`Input Tokens: ${inputTokens}, Output Tokens: ${outputTokens}`);

        let inputCost = 0;
        let outputCost = 0;
        let imageCost = 0;

        const cssStyles = `
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9;
            }

            article {
                max-width: 800px;
                margin: 40px auto;
                padding: 20px;
                background: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
            }

            h1, h2, h3 {
                margin-top: 20px;
                color: #333;
            }

            h1 {
                font-size: 2em;
                border-bottom: 2px solid #eaeaea;
                padding-bottom: 10px;
            }

            h2 {
                font-size: 1.5em;
                margin-top: 30px;
            }

            h3 {
                font-size: 1.2em;
                margin-top: 20px;
            }

            p {
                margin: 15px 0;
            }

            img {
                display: block;
                max-width: 100%;
                height: auto;
                margin: 20px 0;
            }

            a {
                color: #3498db;
                text-decoration: none;
            }

            a:hover {
                text-decoration: underline;
            }

            ul, ol {
                margin: 20px 0;
                padding-left: 40px;
            }

            blockquote {
                margin: 20px 0;
                padding: 10px 20px;
                background: #f1f1f1;
                border-left: 5px solid #ccc;
            }

            code {
                font-family: "Courier New", Courier, monospace;
                background: #f4f4f4;
                padding: 2px 4px;
                border-radius: 4px;
            }
        </style>`;


        article = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${cssStyles}
        </head>
        <body>
            <article>
                ${article}
            </article>
        </body>
        </html>`;


        if (gptModel === 'GPT3_5') {
            inputCost = (inputTokens / 1000000) * 1.50;
            outputCost = (outputTokens / 1000000) * 2.00;
        } else if (gptModel === 'GPT4') {
            inputCost = (inputTokens / 1000000) * 10.00;
            outputCost = (outputTokens / 1000000) * 30.00;
        }

        if (includeImages) imageCost = numImages * 0.08;


        const totalCost = inputCost + outputCost + imageCost;
        console.log(`Cost: Input - $${inputCost.toFixed(4)}, Output - $${outputCost.toFixed(4)}, Images - $${imageCost.toFixed(4)}, Total - $${totalCost.toFixed(4)}`);


        console.log('Text content generated.');



        if (includeImages) {
            console.log('Generating images...');
            let imgTags = article.match(/<img\b[^>]*>/g) || [];
            let numTags = imgTags.length;

            const sections = article.split(/(<img\b[^>]*>)/).filter(Boolean);
            let imgCount = 0;

            const imagePromises = sections.map((section) => {
                if (section.startsWith('<img') && imgCount < numTags) {
                    imgCount++;
                    const imagePrompt = `Generate an illustration that represents the following content: "${description}". The illustration should be without text, realistic and relevant to the topic of "${description}".`;
                    return axios.post(
                        'https://api.openai.com/v1/images/generations',
                        {
                            model: "dall-e-3",
                            prompt: imagePrompt,
                            n: 1,
                            size: "1024x1024",
                            quality: "hd",
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                            },
                        }
                    ).then(response => {
                        const imageUrl = response.data.data[0].url;
                        return `<img src="${imageUrl}" alt="Generated Illustration" style="width:100%;height:auto;margin-top:20px;">`;
                    }).catch(error => {
                        console.error('Error generating image:', error.response ? error.response.data : error.message);
                        return section;
                    });
                } else {
                    return Promise.resolve(section);
                }
            });

            let sectionsWithImages = await Promise.all(imagePromises);
            article = sectionsWithImages.join('');

            imgTags = article.match(/<img\b[^>]*>/g) || [];
            numTags = imgTags.length;
            if (numTags < numImages) {
                for (let i = numTags; i < numImages; i++) {
                    const imagePrompt = `Generate an illustration that represents the following content: "${description}". The illustration should be without text, realistic and relevant to the topic of "${description}".`;
                    const response = await axios.post(
                        'https://api.openai.com/v1/images/generations',
                        {
                            model: "dall-e-3",
                            prompt: imagePrompt,
                            n: 1,
                            size: "1024x1024",
                            quality: "hd",
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                            },
                        }
                    );
                    const imageUrl = response.data.data[0].url;
                    article += `<img src="${imageUrl}" alt="Generated Illustration" style="width:100%;height:auto;margin-top:20px;">`;
                }
            }
            console.log('Images generated and inserted into article.');
        }

        //article = cleanIncompleteSentence(article);

        console.log('Generated article:', article);

        const titleMatch = article.match(/<h1>(.*?)<\/h1>/);
        const title = titleMatch ? titleMatch[1] : 'Untitled';

        const uniqueTitles = Array.from(new Set([...previousTitles, title]));

        user.titles = JSON.stringify(uniqueTitles);
        await user.save();

        await Generation.create({
            title: title,
            description: article,
            userId: user.userId,
        });

        return res.json({
            article,
            title,
            totalCost,
            modelUsed: gptModel,
            inputTokens,
            outputTokens,
        });
    } catch (error) {
        console.error('Error generating article:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error generating article' });
    }
});


router.get('/tags', async (req, res) => {
    const userId = req.session.user && req.session.user.id;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const tags = await Tag.findAll({ where: { userId } });
        res.status(200).json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error.message);
        res.status(500).json({ message: 'Error fetching tags' });
    }
});


router.post('/test-token-count', (req, res) => {
    const { text, gptModel } = req.body;

    if (!text || !gptModel) return res.status(400).json({ message: 'Text and GPT model are required' });

    try {
        const inputTokens = GPT3Tokenizer.encode(text).length;

        const outputTokens = inputTokens;

        let inputCost = 0;
        let outputCost = 0;

        if (gptModel === 'GPT3_5') {
            inputCost = (inputTokens / 1000000) * 1.50;
            outputCost = (outputTokens / 1000000) * 2.00;
        } else if (gptModel === 'GPT4') {
            inputCost = (inputTokens / 1000000) * 10.00;
            outputCost = (outputTokens / 1000000) * 30.00;
        }

        const totalCost = inputCost + outputCost;

        console.log(`Test - Input Tokens: ${inputTokens}, Output Tokens: ${outputTokens}`);
        console.log(`Test Cost: Input - $${inputCost.toFixed(4)}, Output - $${outputCost.toFixed(4)}, Total - $${totalCost.toFixed(4)}`);

        res.status(200).json({
            inputTokens,
            outputTokens,
            inputCost: `$${inputCost.toFixed(4)}`,
            outputCost: `$${outputCost.toFixed(4)}`,
            totalCost: `$${totalCost.toFixed(4)}`
        });
    } catch (error) {
        console.error('Error in test-token-count:', error.message);
        res.status(500).json({ message: 'Error calculating token count and cost' });
    }
});

function cleanIncompleteSentence(text) {
    const lastPeriodIndex = text.lastIndexOf('.');
    const lastExclamationIndex = text.lastIndexOf('!');
    const lastQuestionIndex = text.lastIndexOf('?');

    const lastPunctuationIndex = Math.max(lastPeriodIndex, lastExclamationIndex, lastQuestionIndex);

    if (lastPunctuationIndex === -1) return text;

    return text.substring(0, lastPunctuationIndex + 1);
}



module.exports = router;
