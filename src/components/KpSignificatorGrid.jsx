// src/KpSignificatorGrid.jsx
import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { useTranslation } from 'react-i18next'; // Import the hook
import '../styles/KpSignificatorsPage.css'; // Reuse styles or create specific ones

// Constants (can be passed as props or defined here if static)
const SIGNIFICATOR_GRID_ORDER = [
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();
const EVENT_HOUSES = { // Or pass this mapping as a prop
    '': { favorable: [], unfavorable: [] }, // Default empty state
    'education': { favorable: [4, 5, 9, 11], unfavorable: [8, 12] },
    'career_start': { favorable: [2, 6, 10, 11], unfavorable: [5, 8, 12] },
    'career_promotion': { favorable: [6, 10, 11], unfavorable: [5, 8, 12] },
    'marriage': { favorable: [2, 7, 11], unfavorable: [1, 6, 10, 12] },
    'childbirth': { favorable: [2, 5, 11], unfavorable: [1, 4, 10, 12] },
    'property_purchase': { favorable: [4, 11, 12], unfavorable: [3, 8] },
    'vehicle_purchase': { favorable: [4, 9, 11], unfavorable: [3, 8, 12] },
    'foreign_travel': { favorable: [3, 7, 9, 12], unfavorable: [4, 8] },
    'health_issues': { favorable: [5, 11], unfavorable: [1, 6, 8, 12] }, // Favorable for recovery/improvement
};

// Helper to get significance class
const getHouseSignificance = (house, eventKey) => {
    const eventConfig = EVENT_HOUSES[eventKey];
    if (!eventConfig || !house) return 'neutral-house';
    if (eventConfig.favorable.includes(house)) return 'favorable-house';
    if (eventConfig.unfavorable.includes(house)) return 'unfavorable-house';
    return 'neutral-house';
};

// Helper to render colored house numbers - MODIFIED FOR TRANSLATION
const RenderHouseNumbers = ({ houseArray, eventKey }) => {
    const { t } = useTranslation(); // Get t function here

    if (!Array.isArray(houseArray) || houseArray.length === 0) {
        // Translate the placeholder for no houses
        // Ensure 'kpSignificatorGrid.noHouses' key exists in your translation files
        return <span className="neutral-house">{t('kpSignificatorGrid.noHouses', '--')}</span>;
    }
    return houseArray.map((house, index) => (
        <React.Fragment key={`${eventKey}-${house}-${index}`}> {/* More specific key */}
            <span className={getHouseSignificance(house, eventKey)}>
                {house}
            </span>
            {index < houseArray.length - 1 && ', '}
        </React.Fragment>
    ));
};

// Add PropTypes for the new helper component
RenderHouseNumbers.propTypes = {
    houseArray: PropTypes.arrayOf(PropTypes.number),
    eventKey: PropTypes.string,
};


const KpSignificatorGrid = ({ significatorDetailsMap, selectedEvent }) => {
    const { t } = useTranslation(); // Call the hook

    // Check if the map is valid before trying to render the grid
    if (!significatorDetailsMap || !(significatorDetailsMap instanceof Map) || significatorDetailsMap.size === 0) {
        // Parent component (KpSignificatorsPage) handles the main "unavailable" message
        // Or you could return a placeholder message here if preferred
        // return <p>{t('kpSignificatorGrid.dataUnavailable')}</p>;
        return null;
    }

    return (
        <div className="significators-grid">
            {FLATTENED_GRID_ORDER.map(planetName => {
                const sigData = significatorDetailsMap.get(planetName);

                // Use default structure if data is missing for a grid planet (safety net)
                const displayData = sigData || {
                    name: planetName,
                    allHouses: [],
                    nakshatraLordName: t('utils.notAvailable', 'N/A'), // Default translated N/A
                    nakLordAllHouses: [],
                    subLordName: t('utils.notAvailable', 'N/A'), // Default translated N/A
                    subLordAllHouses: []
                };

                // Translate the planet name for display
                const translatedPlanetName = t(`planets.${displayData.name}`, { defaultValue: displayData.name });
                // Translate lord names for interpolation
                const translatedNakLordName = t(`planets.${displayData.nakshatraLordName}`, { defaultValue: displayData.nakshatraLordName });
                const translatedSubLordName = t(`planets.${displayData.subLordName}`, { defaultValue: displayData.subLordName });

                const itemClassName = `significator-grid-item`;

                return (
                    <div key={planetName} className={itemClassName}>
                        {/* Display translated planet name */}
                        <div className="significator-planet-name">{translatedPlanetName}</div>
                        <div className="significator-detail">
                            {/* Translate label */}
                            <span className="significator-label">{t('kpSignificatorGrid.housesLabel')}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.allHouses} eventKey={selectedEvent} />
                            </span>
                        </div>
                        <div className="significator-detail">
                            {/* Translate label using interpolation with translated lord name */}
                            {/* Ensure translation files have '{{lordName}}' placeholder */}
                            <span className="significator-label">{t('kpSignificatorGrid.nakLordLabel', { lordName: translatedNakLordName })}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.nakLordAllHouses} eventKey={selectedEvent} />
                            </span>
                        </div>
                        <div className="significator-detail">
                            {/* Translate label using interpolation with translated lord name */}
                            {/* Ensure translation files have '{{lordName}}' placeholder */}
                            <span className="significator-label">{t('kpSignificatorGrid.subLordLabel', { lordName: translatedSubLordName })}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.subLordAllHouses} eventKey={selectedEvent} />
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Add PropTypes for the main component
KpSignificatorGrid.propTypes = {
    // Ensure significatorDetailsMap is a Map instance and is required
    significatorDetailsMap: PropTypes.instanceOf(Map).isRequired,
    // selectedEvent is a string and is required
    selectedEvent: PropTypes.string.isRequired,
};

export default KpSignificatorGrid;
