const express = require('express');
const axios = require('axios');
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
 *         maxTokens:
 *           type: integer
 *           description: The maximum number of tokens for the generated article
 *       example:
 *         subject: The story of a chicken company
 *         description: The impact of chicken on society and daily life.
 *         includeImages: true
 *         maxTokens: 500
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
    const { subject, description, includeImages, maxTokens } = req.body;

    if (!subject || !description || !maxTokens) return res.status(400).json({ message: 'Subject and description are required' });

    try {
        console.log('Received request to generate article...');
        console.log('Subject:', subject);
        console.log('Description:', description);
        console.log('Include Images:', includeImages);
        console.log('Max Tokens:', maxTokens);

        const textPrompt = `Write a detailed blog post about the subject: ${subject}. Description: ${description}. The post should include titles and subtitles. Use HTML tags like h1, h2, h3, p to format the text. Make sure to conclude the post naturally within ${maxTokens} tokens.`;

        console.log('Generating text content...');
        const textResponse = await axios.post(
            'https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions',
            {
                prompt: textPrompt,
                max_tokens: parseInt(maxTokens, 10),
                n: 1,
                stop: ["\n\n\n\n"],
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );


        let article = textResponse.data.choices[0].text.trim();
        article = cleanIncompleteSentence(article);

        console.log('Text content generated.');

        if (includeImages) {
            console.log('Generating images...');
            const sections = article.split(/(<h1>|<h2>|<h3>|<p>)/).filter(Boolean);
            const imagePromises = sections.map((section, index) => {
                if (section.startsWith('<p>') || section.startsWith('<h2>') || section.startsWith('<h3>')) {
                    const textContent = section.replace(/<\/?[^>]+(>|$)/g, "").trim();
                    const imagePrompt = `Generate an illustration that represents the following content: "${textContent}". The illustration should be without text, realistic and relevant to the topic of "${subject}".`;
                    return axios.post(
                        'https://api.openai.com/v1/images/generations',
                        {
                            prompt: imagePrompt,
                            n: 1,
                            size: "1024x1024",
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                            },
                        }
                    ).then(response => {
                        const imageUrl = response.data.data[0].url;
                        return `<img src="${imageUrl}" alt="Generated Illustration" style="width:100%;height:auto;margin-top:20px;">${section}`;
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
