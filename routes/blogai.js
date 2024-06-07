const express = require('express');
const axios = require('axios');
const GPT3Tokenizer = require('gpt-3-encoder');
const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


/**
 * @swagger
 * components:
 *   schemas:
 *     GenerateArticleRequest:
 *       type: object
 *       required:
 *         - subject
 *         - description
 *         - maxTokens
 *       properties:
 *         subject:
 *           type: string
 *           description: The subject of the blog post
 *         description:
 *           type: string
 *           description: The detailed description of the blog post
 *         includeImages:
 *           type: boolean
 *           description: Whether to include images in the blog post
 *         numImages:
 *           type: integer
 *           description: The number of images to include in the blog post
 *         maxTokens:
 *           type: integer
 *           description: The maximum number of tokens for the generated article
 *         gptModel:
 *           type: string
 *           description: The GPT model to use for generating the article (e.g., GPT3_5, GPT4)
 *       example:
 *         subject: The story of a chicken company
 *         description: The impact of chicken on society and daily life.
 *         includeImages: true
 *         numImages: 3
 *         maxTokens: 500
 *         gptModel: GPT4
 *     GenerateArticleResponse:
 *       type: object
 *       properties:
 *         article:
 *           type: string
 *           description: The generated blog article in HTML format
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
 *                   example: Subject, description, and max tokens are required
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



router.post('/generate', async (req, res) => {
    const { subject, description, includeImages, numImages, maxTokens, gptModel } = req.body;

    if (!subject || !description || !maxTokens) return res.status(400).json({ message: 'Subject, description, and max tokens are required' });

    try {
        console.log('Received request to generate article...');
        console.log('Subject:', subject);
        console.log('Description:', description);
        console.log('Include Images:', includeImages);
        console.log('Number of Images:', numImages);
        console.log('Max Tokens:', maxTokens);
        console.log('GPT Model:', gptModel);

        const textPrompt = `Write a detailed blog post about the subject: ${subject}. Description: ${description}. The post should include titles and subtitles. Use HTML tags like h1, h2, h3, p to format the text. Include img tags where images would be appropriate. Make sure to conclude the post naturally within ${maxTokens} tokens.`;

        console.log('Generating text content...');
        let gptModelUrl = '';
        let data = {};

        switch (gptModel) {
            case 'GPT3_5':
                gptModelUrl = 'https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions';
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

        article = cleanIncompleteSentence(article);


        const encodedArticle = GPT3Tokenizer.encode(article);
        const numTokens = encodedArticle.length;
        console.log(`Number of tokens used in the generated article: ${numTokens}`);

        console.log('Text content generated.');

        if (includeImages) {
            console.log('Generating images...');
            const imgTags = article.match(/<img\b[^>]*>/g) || [];
            const numTags = Math.min(imgTags.length, numImages);

            const sections = article.split(/(<img\b[^>]*>)/).filter(Boolean);
            let imgCount = 0;

            const imagePromises = sections.map((section) => {
                if (section.startsWith('<img') && imgCount < numTags) {
                    imgCount++;
                    const imagePrompt = `Generate an illustration that represents the following content: "${subject}". The illustration should be without text, realistic and relevant to the topic of "${subject}".`;
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

            const sectionsWithImages = await Promise.all(imagePromises);
            article = sectionsWithImages.join('');
            console.log('Images generated and inserted into article.');
        }

        console.log('Generated article:', article);
        res.status(200).json({ article });
    } catch (error) {
        console.error('Error generating article:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error generating article' });
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
