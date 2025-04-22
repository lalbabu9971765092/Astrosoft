// src/KpSignificatorGrid.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import '../styles/KpSignificatorsPage.css'; // Ensure this CSS file exists and is imported

// --- Constants ---
const SIGNIFICATOR_GRID_ORDER = [
    ['Ketu', 'Moon', 'Jupiter'],
    ['Venus', 'Mars', 'Saturn'],
    ['Sun', 'Rahu', 'Mercury']
];
const FLATTENED_GRID_ORDER = SIGNIFICATOR_GRID_ORDER.flat();
export const EVENT_HOUSES = { // Or pass this mapping as a prop
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

// --- Helper Components (Keep RenderHouseNumbers and getHouseSignificance as is) ---
const getHouseSignificance = (house, eventKey) => {
    const eventConfig = EVENT_HOUSES[eventKey];
    // Add check for eventKey existence
    if (!eventConfig || !house || !eventKey) return 'neutral-house';
    if (eventConfig.favorable.includes(house)) return 'favorable-house';
    if (eventConfig.unfavorable.includes(house)) return 'unfavorable-house';
    return 'neutral-house';
};

const RenderHouseNumbers = ({ houseArray, eventKey }) => {
    const { t } = useTranslation();
    if (!Array.isArray(houseArray) || houseArray.length === 0) {
        return <span className="neutral-house">{t('kpSignificatorGrid.noHouses', '--')}</span>;
    }
    return houseArray.map((house, index) => (
        <React.Fragment key={`${eventKey}-${house}-${index}`}>
            <span className={getHouseSignificance(house, eventKey)}>
                {house}
            </span>
            {index < houseArray.length - 1 && ', '}
        </React.Fragment>
    ));
};

RenderHouseNumbers.propTypes = {
    houseArray: PropTypes.arrayOf(PropTypes.number),
    eventKey: PropTypes.string,
};

// --- Main Grid Component ---
const KpSignificatorGrid = ({ significatorDetailsMap, selectedEvent }) => {
    const { t } = useTranslation();

    if (!significatorDetailsMap || !(significatorDetailsMap instanceof Map) || significatorDetailsMap.size === 0) {
        return null;
    }

    return (
        <div className="significators-grid">
            {FLATTENED_GRID_ORDER.map(planetName => {
                const sigData = significatorDetailsMap.get(planetName);

                // Use default structure if data is missing (includes default favourability)
                const displayData = sigData || {
                    name: planetName,
                    allHouses: [],
                    nakshatraLordName: t('utils.notAvailable', 'N/A'),
                    nakLordAllHouses: [],
                    subLordName: t('utils.notAvailable', 'N/A'),
                    subLordAllHouses: [],
                    score: 0,
                    favourability: 'N/A', // Default favourability
                    completeness: 'N/A'
                };

                const translatedPlanetName = t(`planets.${displayData.name}`, { defaultValue: displayData.name });
                const translatedNakLordName = t(`planets.${displayData.nakshatraLordName}`, { defaultValue: displayData.nakshatraLordName });
                const translatedSubLordName = t(`planets.${displayData.subLordName}`, { defaultValue: displayData.subLordName });

                // *** START: MODIFICATION TO ADD FAVOURABILITY CLASS ***
                let itemClassName = "significator-grid-item"; // Base class
                // Only add favourability class if an event is selected and favourability exists
                if (selectedEvent && displayData.favourability) {
                    // Generate class like 'item-favourable', 'item-unfavourable', 'item-neutral', 'item-n/a'
                    const favourabilityClass = `item-${displayData.favourability.toLowerCase().replace(/ /g, '-')}`; // Handle potential spaces if needed, ensure lowercase
                    itemClassName += ` ${favourabilityClass}`;
                }
                // *** END: MODIFICATION TO ADD FAVOURABILITY CLASS ***

                return (
                    // Apply the potentially modified className here
                    <div key={planetName} className={itemClassName}>
                        <div className="significator-planet-name">{translatedPlanetName}</div>
                        <div className="significator-detail">
                            <span className="significator-label">{t('kpSignificatorGrid.housesLabel')}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.allHouses} eventKey={selectedEvent} />
                            </span>
                        </div>
                        <div className="significator-detail">
                            <span className="significator-label">{t('kpSignificatorGrid.nakLordLabel', { lordName: translatedNakLordName })}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.nakLordAllHouses} eventKey={selectedEvent} />
                            </span>
                        </div>
                        <div className="significator-detail">
                            <span className="significator-label">{t('kpSignificatorGrid.subLordLabel', { lordName: translatedSubLordName })}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.subLordAllHouses} eventKey={selectedEvent} />
                            </span>
                        </div>

                        {/* Optional: Display score/completeness info */}
                        {selectedEvent && displayData.favourability !== 'N/A' && (
                             <div className="kp-planet-score-info">
                                <span className={`kp-favourability ${displayData.favourability?.toLowerCase()}`}>
                                    {t(`favourability.${displayData.favourability}`, displayData.favourability)}
                                </span>
                                <span className="kp-score">
                                    ({t('kpSignificatorsPage.scoreLabel', 'Score')}: {displayData.score})
                                </span>
                                <span className="kp-completeness">
                                    {t(`completeness.${displayData.completeness.replace(/[ ()]/g, '')}`, displayData.completeness)}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Update PropTypes to include the score/favourability fields expected in the map items
KpSignificatorGrid.propTypes = {
    significatorDetailsMap: PropTypes.instanceOf(Map).isRequired,
    selectedEvent: PropTypes.string.isRequired,
};

export default KpSignificatorGrid;
