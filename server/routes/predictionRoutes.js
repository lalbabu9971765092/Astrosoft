import express from 'express';
import { query, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import * as predictionTextGenerator from '../utils/predictionTextGenerator.js'; // Import the general prediction generator
import { getDashaPrediction } from '../utils/dashaPredictionGenerator.js'; // Import the Dasha prediction generator

// --- Helper Function for Error Handling ---
// Centralizes the error response logic (Copied from astrologyRoutes.js)
function handleRouteError(res, error, routeName, inputData = {}) {
    logger.error(`Error in ${routeName} route: ${error.message}`, {
        routeName,
        // input: inputData, // Be cautious logging full input in production
        error: error.stack || error // Log stack trace
    });

    const statusCode = error.status || 500;
    // Use NODE_ENV from process.env, ensure it's set in your environment
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = (isProduction && statusCode === 500)
        ? "An internal server error occurred. Please try again later."
        : error.message || "An internal server error occurred.";

    // Avoid sending stack trace in production response
    const errorResponse = { error: errorMessage };
    if (!isProduction && error.stack) {
        errorResponse.stack = error.stack.split('\n'); // Optionally include stack in dev
    }

    res.status(statusCode).json(errorResponse);
}

const router = express.Router();

// Validation for general prediction query parameters
const generalPredictionValidation = [
    query('lagnaRashi').notEmpty().withMessage('Lagna Rashi is required.'),
    query('moonRashi').notEmpty().withMessage('Moon Rashi is required.'),
    query('moonNakshatra').notEmpty().withMessage('Moon Nakshatra is required.'),
    query('lang').optional().isIn(['en', 'hi']).withMessage('Language must be "en" or "hi".'), // Add lang validation
];

// Validation for dasha prediction query parameters
const dashaPredictionValidation = [
    query('mahadasha').notEmpty().withMessage('Mahadasha lord is required.'),
    query('bhukti').notEmpty().withMessage('Bhukti lord is required.'),
    query('antar').notEmpty().withMessage('Antar lord is required.'),
    query('lang').optional().isIn(['en', 'hi']).withMessage('Language must be "en" or "hi".'),
];

// Route for general predictions (Lagna, Moon Rashi, Moon Nakshatra)
router.route('/').get(generalPredictionValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { lagnaRashi, moonRashi, moonNakshatra, lang } = req.query; // Destructure lang
        // Generate prediction directly using the utility function
        const predictionText = predictionTextGenerator.getCombinedPredictionLong(lagnaRashi, moonRashi, moonNakshatra, lang); // Pass lang
        
        if (!predictionText) {
            return res.status(404).json({ error: "No prediction found for the given combination." });
        }
        res.json({ prediction: predictionText });
    } catch (error) {
        handleRouteError(res, error, 'GET /api/predictions');
    }
});

// New route for Dasha predictions
router.route('/dasha').get(dashaPredictionValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { mahadasha, bhukti, antar, lang } = req.query; // Destructure lang
        const dashaPredictionText = getDashaPrediction(mahadasha, bhukti, antar, lang); // Pass lang

        if (!dashaPredictionText) {
            return res.status(404).json({ error: "No Dasha prediction found for the given combination." });
        }
        res.json({ prediction: dashaPredictionText });
    } catch (error) {
        handleRouteError(res, error, 'GET /api/dasha-predictions');
    }
});

// New route: Generate Varshaphal-specific prediction text from Varshphal payload
router.route('/varshaphal').post(async (req, res) => {
    try {
        const { varshphalChart, muntha, yearLord, muddaDasha, kpSignificators, lang, style, varshphalYear } = req.body || {};
        if (!varshphalChart) {
            return res.status(400).json({ error: 'varshphalChart payload is required.' });
        }

        const predictionText = predictionTextGenerator.getVarshphalPrediction({ varshphalChart, muntha, yearLord, muddaDasha, kpSignificators, style, varshphalYear }, lang || 'en');
        if (!predictionText) return res.status(404).json({ error: 'No varshaphal prediction could be generated.' });
        res.json({ prediction: predictionText });
    } catch (error) {
        handleRouteError(res, error, 'POST /api/predictions/varshaphal', req.body);
    }
});

export default router;