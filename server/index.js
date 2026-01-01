// index.js
import express from 'express';
 import 'dotenv/config'; 
import cors from 'cors';
import path, { dirname } from 'path'; // Import dirname from path
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swisseph from 'swisseph-v2';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url'; // Make sure this is imported

// --- Import Logger ---
import logger from './utils/logger.js';

// --- Import the routes ---
import astrologyRoutes from './routes/astrologyRoutes.js';
import kpSignificatorRoutes from './routes/kpSignificatorRoutes.js';
import generalRoutes from './routes/generalRoutes.js';
import userRoutes from './routes/userRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js'; // Import predictionRoutes
import holisticPredictionRoutes from './routes/holisticPredictionRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
const app = express();

// --- ES Module __dirname and __filename equivalents ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// --- End ES Module equivalents ---

// --- Configuration ---
// Use the calculated __dirname here
const EPHEMERIS_PATH = path.join(__dirname, 'ephe');
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI;

// --- MongoDB Connection ---
if (!MONGODB_URI) {
    logger.error("FATAL ERROR: MONGODB_URI environment variable is not set.");
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.info('MongoDB connected successfully.');
        // --- IMPORT/REGISTER MODELS HERE ---
        // Import the model file AFTER connection to ensure Mongoose is ready
        // and the model gets registered correctly.
        import('./models/Chart.js'); // Dynamic import or place static import here
        import('./models/User.js');
        // Import other models if you have them
        // ---------------------------------
    })
    .catch(err => {
        logger.error('MongoDB connection error:', { error: err.message, stack: err.stack });
        process.exit(1);
    });

mongoose.connection.on('error', err => {
    logger.error('MongoDB runtime error:', { error: err.message, stack: err.stack });
});
// --- End MongoDB Connection ---


// --- Security Middleware ---
app.use(helmet());
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests) in dev
        const allow = NODE_ENV !== 'production' || !origin || allowedOrigins.indexOf(origin) !== -1;
        if (allow) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
// Apply the rate limiting middleware to API calls only
// app.use('/api', limiter);

// --- General Middleware ---
// Use logger's stream for morgan HTTP request logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev', { stream: logger.stream }));
app.use(express.json({ limit: '50mb' })); // for parsing application/json, increased limit for large payloads
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// --- Swiss Ephemeris Global Setup ---
try {
    swisseph.swe_set_ephe_path(EPHEMERIS_PATH);
    logger.info(`Swiss Ephemeris path set to: ${EPHEMERIS_PATH}`);
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    logger.info('Default Sidereal mode set to Lahiri.');
} catch (err) {
    logger.error("CRITICAL: Failed to set ephemeris path or default sidereal mode:", { error: err.message, stack: err.stack });
    // Consider exiting if ephemeris is critical: process.exit(1);
}

// --- Mount API Routes ---
// Define base paths for your API routes
app.use('/api', astrologyRoutes);
app.use('/api/kp-significators', kpSignificatorRoutes);
app.use('/api/general', generalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/predictions', predictionRoutes); // Mount predictionRoutes
app.use('/api/predictions/holistic', holisticPredictionRoutes);
app.use('/api/analysis', analysisRoutes);
app.set('trust proxy', 1);
// --- Basic Root Route (Optional Health Check) ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Astrology Calculation API is running.' });
});

// --- Centralized Error Handling Middleware ---
// This should be the last middleware added
app.use((err, req, res, next) => {
    // Log the error using Winston logger
    logger.error(`Unhandled Error: ${err.message}`, {
        status: err.status || 500,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        stack: err.stack // Log stack trace
    });

    const statusCode = err.status || 500;
    const errorMessage = (NODE_ENV === 'production' && statusCode === 500)
        ? 'Something went wrong on the server!'
        : err.message || 'Internal Server Error';

    // Avoid sending stack trace in production response
    const errorResponse = { error: errorMessage };
    if (NODE_ENV !== 'production' && err.stack) {
         errorResponse.stack = err.stack.split('\n');
    }

    res.status(statusCode).json(errorResponse);
});

// --- Server Start ---
app.listen(PORT, () => {
    logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    if (NODE_ENV === 'production' && allowedOrigins.length > 0) {
        logger.info(`CORS enabled for: ${allowedOrigins.join(', ')}`);
    } else if (NODE_ENV === 'production') {
        logger.warn('Warning: CORS_ALLOWED_ORIGINS environment variable not set. CORS might be too open.');
    } else {
         logger.info('CORS allows all origins in development mode.');
    }
});
