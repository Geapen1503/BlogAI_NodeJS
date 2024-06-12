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
const productsRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const webhookRoutes = require('./routes/webhook');
const displayTagsRoutes = require('./routes/displayTags');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./db/db');
const initializeProducts = require('./config/initializeProducts');


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

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    store: new SequelizeStore({ db: sequelize }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
    }
}));


app.use('/auth', authRoutes);
app.use('/blog', blogaiRoute);
app.use('/credits', creditRouter);
app.use('/products', productsRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/webhook', webhookRoutes);
app.use('/display', displayTagsRoutes);
app.use(express.static(path.join(__dirname, 'public')));



app.get('/protected', authenticateJWT, (req, res) => {res.send('This is a protected route'); });




swaggerConfig(app);
initializeProducts();



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing'}`);

});
