const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const authenticateJWT = require('./middleware/auth');
const swaggerConfig = require('./swagger');
const blogaiRoute = require('./routes/blogai');
const creditRouter = require('./routes/credit');
const cookieParser = require('cookie-parser');



dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};


app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/auth', authRoutes);
app.use('/blog', blogaiRoute);
app.use('/credits', creditRouter);


app.get('/protected', authenticateJWT, (req, res) => {res.send('This is a protected route'); });

app.use(express.static(path.join(__dirname, 'public')));


swaggerConfig(app);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing'}`);

});
