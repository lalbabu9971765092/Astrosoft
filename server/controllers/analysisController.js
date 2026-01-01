import asyncHandler from 'express-async-handler';
import { findTransitEvents } from '../utils/transitSearchUtils.js';
import logger from '../utils/logger.js';

/**
 * @desc    Search for specific transit events based on multiple criteria.
 * @route   POST /api/analysis/transit-search
 * @access  Public
 */
const searchTransits = asyncHandler(async (req, res) => {
    const { planets, houses, startDate, endDate, options, natalChart } = req.body;

    // Basic validation
    if (!planets || !Array.isArray(planets) || planets.length < 3 ||
        !houses || !Array.isArray(houses) || houses.length !== 3 ||
        !startDate || !endDate || !options || !natalChart) {
        res.status(400);
        throw new Error('Missing or invalid required search parameters.');
    }

    try {
        logger.info('Starting transit search...');
        const results = await findTransitEvents({ planets, houses, startDate, endDate, options, natalChart });
        logger.info(`Transit search completed with ${results.length} results.`);
        res.json({ results });
    } catch (error) {
        logger.error(`Transit search failed: ${error.message}`);
        res.status(500).json({ error: 'An error occurred during the transit search.' });
    }
});

export { searchTransits };
