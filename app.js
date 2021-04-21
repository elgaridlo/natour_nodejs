// const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const userRouter = require('./routers/usersRouter');
const tourRouter = require('./routers/toursRouter');
const reviewRouter = require('./routers/reviewRouter');
const viewRouter = require('./routers/viewRouter');
const AppError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');

const app = express();
// pug is provided by the express
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE
// serving static file
// app.use(express.static(`${__dirname}/public`));
// we dont need to give / or anything because the path will provide the right path
app.use(express.static(path.join(__dirname, 'public')));
// SET SECURITY HTTP HEADERS
app.use(helmet());
// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// LIMIT REQUEST FROM THE SAME API
// it is use if the hacker or malware try to get in using brute guessing technique
const limiter = rateLimit({
    max: 100, //maximum limit
    windowMs: 60 * 60 * 1000, //in time
    message: 'Too many requst from thi IP, please try again in the hour!',
});
// it means the limiter apply to all /api route
app.use('/api', limiter);

// Middleware routing
// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

// TEST MIDDLEWARE
// You can create alot of middleware as you like
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// BODY PARSER, READING DATA FROM body into req.body
// middleware
// limiting the amount of data that comes-in in one request
app.use(express.json({ limit: '10kb' }));

// Data sanitization againts NoSQL query injection. Note: if the app is server-side
// it's remove all dollar sign
app.use(mongoSanitize());

// Data sanitization againts XSS
// if client input data using html format like <div>name</div>
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsAverage',
            'ratingsQuantity',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);

// It calls mounting (variable tourRouter) to the  routing /api/v1/blablabla
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
    next(
        new AppError(`Cannot find this url ${req.originalUrl} on this server!`, 404)
    );
});

app.use(errorHandler);

// app.get('/api/v1/tours', getAllTours)
// app.get('/api/v1/tours/:id', getId)
// app.post('/api/v1/tours', createNewTours)

// 3) ROUTE

module.exports = app;