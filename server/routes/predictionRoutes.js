import express from 'express';
import { query, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import * as predictionTextGenerator from '../utils/predictionTextGenerator.js'; // Import the general prediction generator

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

// New route: Generate KP Significator analysis
router.route('/kp-analysis').post(async (req, res) => {
    try {
        const { kpSignificators, planetDetails, lang } = req.body || {};
        if (!kpSignificators || !planetDetails) {
            return res.status(400).json({ error: 'kpSignificators and planetDetails payload are required.' });
        }

        const analysisText = predictionTextGenerator.getKpAnalysis({ kpSignificators, planetDetails }, lang || 'en');
        if (!analysisText) return res.status(404).json({ error: 'No KP analysis could be generated.' });
        res.json({ analysis: analysisText });
    } catch (error) {
        handleRouteError(res, error, 'POST /api/predictions/kp-analysis', req.body);
    }
});

export default router;