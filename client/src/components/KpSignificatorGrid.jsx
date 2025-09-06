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
    '': { favorable: [], unfavorable: [], significatorPlanet: '' }, // Default empty state
    'marriage': { favorable: [2, 7, 11], unfavorable: [1, 6, 10, 12], significatorPlanet: 'Venus' },
    'dowry': { favorable: [8, 11], unfavorable: [], significatorPlanet: '' },
    'divorce': { favorable: [1, 6, 10], unfavorable: [2, 7, 11], significatorPlanet: 'Saturn' },
    'plutonic_love': { favorable: [5, 11], unfavorable: [], significatorPlanet: '' },
    'scandalous_love_affair': { favorable: [5, 8, 12], unfavorable: [], significatorPlanet: '' },
    'rape': { favorable: [5, 8, 12], unfavorable: [], significatorPlanet: 'Venus' },
    'prostitution': { favorable: [5, 8, 12], unfavorable: [], significatorPlanet: 'Venus' },
    'call_girl': { favorable: [3, 5, 7, 8, 11, 12], unfavorable: [], significatorPlanet: 'Venus' },

    'litigation': { favorable: [6, 10, 11], unfavorable: [], significatorPlanet: 'Saturn, Rahu, Ketu' },
    'imprisonment': { favorable: [2, 3, 8, 12], unfavorable: [], significatorPlanet: 'Rahu' },
    'bail_win_litigation': { favorable: [6, 10, 11], unfavorable: [], significatorPlanet: '' },
    'political_confinement': { favorable: [2, 3, 12], unfavorable: [], significatorPlanet: '' },
    'house_arrest': { favorable: [4, 8, 12], unfavorable: [], significatorPlanet: 'Rahu' },
    'underground': { favorable: [3, 4, 8, 12], unfavorable: [], significatorPlanet: 'Rahu' },
    'kidnapping': { favorable: [2, 3, 4, 8, 12], unfavorable: [], significatorPlanet: 'Rahu' },

    'property_purchase': { favorable: [4, 11, 12], unfavorable: [], significatorPlanet: 'Mars' },
    'property_sale': { favorable: [3, 5, 10], unfavorable: [], significatorPlanet: 'Mars' },
    'property_purchase_on_loan': { favorable: [4, 6, 11, 12], unfavorable: [], significatorPlanet: 'Mars' },
    'change_of_residence': { favorable: [3, 5], unfavorable: [], significatorPlanet: 'Saturn' },

    'vehicle_purchase': { favorable: [4, 11, 12], unfavorable: [], significatorPlanet: 'Venus' },
    'vehicle_sale': { favorable: [3, 5, 10], unfavorable: [], significatorPlanet: 'Venus' },
    'vehicle_purchase_on_loan': { favorable: [4, 6, 11, 12], unfavorable: [], significatorPlanet: 'Venus' },
    'theft_of_vehicle': { favorable: [4, 6, 8, 12], unfavorable: [], significatorPlanet: 'Venus' },
    'snatching_of_vehicle': { favorable: [4, 6, 8, 12], unfavorable: [], significatorPlanet: 'Venus' },

    'travel': { favorable: [3, 9, 12], unfavorable: [], significatorPlanet: 'Saturn' },
    'coming_back_home': { favorable: [4, 11, 12], unfavorable: [], significatorPlanet: '' },

    'job': { favorable: [2, 6, 10, 11], unfavorable: [], significatorPlanet: 'Saturn' },
    'business': { favorable: [2, 7, 10, 11], unfavorable: [], significatorPlanet: 'Mercury' },
    'loss_in_job_business': { favorable: [5, 8, 12], unfavorable: [], significatorPlanet: '' },
    'change_of_job_business': { favorable: [5, 9], unfavorable: [], significatorPlanet: 'Saturn' },
    'addition_in_business_job': { favorable: [5, 9], unfavorable: [], significatorPlanet: 'Mercury' },


    'education': { favorable: [4, 5, 9, 11], unfavorable: [8, 12], significatorPlanet: 'Mercury' },
    'maximum_marks': { favorable: [4, 9, 11], unfavorable: [], significatorPlanet: '' },
    'average_marks': { favorable: [4, 5, 11], unfavorable: [], significatorPlanet: '' },
    'fail': { favorable: [6, 8, 12], unfavorable: [], significatorPlanet: '' },
    'success_in_competition': { favorable: [4, 5, 6, 9, 11], unfavorable: [], significatorPlanet: '' },
    'getting_an_award': { favorable: [10, 11], unfavorable: [], significatorPlanet: 'Jupiter' },
    'getting_prize': { favorable: [6, 11], unfavorable: [], significatorPlanet: 'Jupiter' },
    'illiterate': { favorable: [6, 8, 12], unfavorable: [], significatorPlanet: 'Mercury' },

    'good_health': { favorable: [1, 5, 9, 11], unfavorable: [], significatorPlanet: 'Jupiter' },
    'incurable_disease': { favorable: [1, 6, 8, 12], unfavorable: [], significatorPlanet: 'Saturn' },
    'curable_disease': { favorable: [1, 6, 12], unfavorable: [], significatorPlanet: '' },
    'surgery': { favorable: [1, 6, 8], unfavorable: [], significatorPlanet: 'Mars' },
    'accident': { favorable: [1, 4, 8, 12], unfavorable: [], significatorPlanet: 'Rahu' },
    'heart_attack': { favorable: [4, 6, 8, 12], unfavorable: [5, 9, 11], significatorPlanet: 'Sun' },
    'depression': { favorable: [1, 2, 6, 8], unfavorable: [], significatorPlanet: 'Moon' },
    'aggression': { favorable: [7, 8, 12], unfavorable: [], significatorPlanet: 'Mars' },
    'loving_caring': { favorable: [2, 5, 9, 11], unfavorable: [], significatorPlanet: 'Moon' },
    'hospitalization': { favorable: [1, 6, 8, 12], unfavorable: [], significatorPlanet: 'Saturn' },
    'cold_nature': { favorable: [1, 4, 6, 10], unfavorable: [], significatorPlanet: 'Saturn' },
    'ego': { favorable: [8, 12], unfavorable: [], significatorPlanet: 'Sun' },

    'theft_robbery': { favorable: [7, 8, 12], unfavorable: [], significatorPlanet: 'Mars' },
    'childbirth': { favorable: [2, 5, 11], unfavorable: [], significatorPlanet: 'Jupiter' },
    'no_childbirth': { favorable: [1, 4, 10], unfavorable: [], significatorPlanet: '' },
    'abortion': { favorable: [1, 4, 6, 8, 10, 12], unfavorable: [], significatorPlanet: 'Mars' },
    'custody_of_child_to_mother': { favorable: [4, 8], unfavorable: [], significatorPlanet: '' },
    'custody_of_child_to_father': { favorable: [3, 9], unfavorable: [], significatorPlanet: '' },
    'custody_of_child_to_third_person': { favorable: [3, 8], unfavorable: [], significatorPlanet: '' },
    'adoption': { favorable: [4, 8], unfavorable: [], significatorPlanet: 'Jupiter' },
    'career_start': { favorable: [2, 6, 10, 11], unfavorable: [5, 8, 12], significatorPlanet: 'Sun' },
    'career_promotion': { favorable: [6, 10, 11], unfavorable: [5, 8, 12], significatorPlanet: 'Sun' },    
    
    'return_home': { favorable: [2, 4, 11], unfavorable: [], significatorPlanet: 'Moon' },
    'huge_earnings': { favorable: [2, 6, 10, 11], unfavorable: [], significatorPlanet: 'Jupiter' },
    'loss': { favorable: [5, 6, 8, 12], unfavorable: [], significatorPlanet: 'Saturn' },    
    
    'finance': { favorable: [2, 6, 10, 7, 11], unfavorable: [6, 8, 12], significatorPlanet: 'Jupiter' },
    'fame': { favorable: [3, 6, 10, 11], unfavorable: [], significatorPlanet: 'Sun' },
    'bad_fame': { favorable: [5, 8, 12], unfavorable: [], significatorPlanet: 'Saturn' },   
};

// --- Helper Components ---
const getHouseSignificance = (house, eventKey) => {
    const eventConfig = EVENT_HOUSES[eventKey];
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
const KpSignificatorGrid = ({ significatorDetailsMap, selectedEvent, significatorPlanet }) => {
    const { t } = useTranslation();

    if (!significatorDetailsMap || !(significatorDetailsMap instanceof Map) || significatorDetailsMap.size === 0) {
        // Consider rendering a message instead of null if appropriate
        return <p>{t('kpSignificatorGrid.noData', 'Significator data not available.')}</p>;
    }

    return (
        <div className="significators-grid">
            {FLATTENED_GRID_ORDER.map(planetName => {
                const sigData = significatorDetailsMap.get(planetName);

                // Ensure displayData always has the expected structure, even if sigData exists but is incomplete
                const displayData = {
                    name: planetName,
                    allHouses: sigData?.allHouses || [],
                    nakshatraLordName: sigData?.nakshatraLordName || 'N/A', // Use a static string 'N/A'
                    nakLordAllHouses: sigData?.nakLordAllHouses || [],
                    subLordName: sigData?.subLordName || 'N/A', // Use a static string 'N/A'
                    subLordAllHouses: sigData?.subLordAllHouses || [],
                    // Provide default fallbacks for potentially missing properties
                    score: sigData?.score ?? 0, // Use nullish coalescing for score (0 is valid)
                    favourability: sigData?.favourability || 'N/A',
                    completeness: sigData?.completeness || 'N/A'
                };
                

               

                const translatedPlanetName = t(`planets.${displayData.name}`, { defaultValue: displayData.name });
                // Ensure lord names are not 'N/A' before translating, or handle 'N/A' translation
                const translatedNakLordName = displayData.nakshatraLordName === 'N/A'
                    ? t('utils.notAvailable', 'N/A')
                    : t(`planets.${displayData.nakshatraLordName}`, { defaultValue: displayData.nakshatraLordName });
                const translatedSubLordName = displayData.subLordName === 'N/A'
                    ? t('utils.notAvailable', 'N/A')
                    : t(`planets.${displayData.subLordName}`, { defaultValue: displayData.subLordName });

                let itemClassName = "significator-grid-item";
                if (planetName === significatorPlanet) {
                    itemClassName += " significator-planet";
                }

                // Check favourability is not the default 'N/A' before adding class
                if (selectedEvent && displayData.favourability && displayData.favourability !== 'N/A') {
                    // Safely generate class name
                    const favourabilityClass = `item-${displayData.favourability.toLowerCase().replace(/ /g, '-')}`;
                    itemClassName += ` ${favourabilityClass}`;
                }

                // Determine if score info should be shown
                const showScoreInfo = selectedEvent && displayData.favourability && displayData.favourability !== 'N/A';

                return (
                    <div key={planetName} className={itemClassName}>
                        <div className="significator-planet-name">{translatedPlanetName}</div>
                        <div className="significator-detail">
                            <span className="significator-label">{t('kpSignificatorGrid.housesLabel', 'Houses:')}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.allHouses} eventKey={selectedEvent} />
                            </span>
                        </div>
                        <div className="significator-detail">
                            {/* Use interpolation for lord name in label */}
                            <span className="significator-label">{t('kpSignificatorGrid.nakLordLabel', { lordName: translatedNakLordName, defaultValue: `NL (${translatedNakLordName}):` })}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.nakLordAllHouses} eventKey={selectedEvent} />
                            </span>
                        </div>
                        <div className="significator-detail">
                            {/* Use interpolation for lord name in label */}
                            <span className="significator-label">{t('kpSignificatorGrid.subLordLabel', { lordName: translatedSubLordName, defaultValue: `SL (${translatedSubLordName}):` })}</span>
                            <span className="significator-value">
                                <RenderHouseNumbers houseArray={displayData.subLordAllHouses} eventKey={selectedEvent} />
                            </span>
                        </div>

                        {/* Display score/completeness info only if relevant */}
                        {showScoreInfo && (
                             <div className="kp-planet-score-info">
                                {/* Safely access favourability for class and translation */}
                                <span className={`kp-favourability ${displayData.favourability.toLowerCase()}`}>
                                    {t(`favourability.${displayData.favourability}`, displayData.favourability)}
                                </span>
                                {/* Display score */}
                                <span className="kp-score">
                                    ({t('kpSignificatorsPage.scoreLabel', 'Score')}: {displayData.score})
                                </span>
                                {/* Safely access completeness for translation key and fallback */}
                                <span className="kp-completeness">
                                    {/* FIX: Use fallback for completeness before replace */}
                                    {t(`completeness.${(displayData.completeness || '').replace(/[ ()]/g, '')}`, displayData.completeness || 'N/A')}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Update PropTypes if score/favourability/completeness are expected (even if optional)
// Since they are NOT currently provided by the parent, keep PropTypes as is for now,
// but ideally, the parent should provide them or these props should be marked optional.
KpSignificatorGrid.propTypes = {
    significatorDetailsMap: PropTypes.instanceOf(Map).isRequired,
    selectedEvent: PropTypes.string.isRequired, // Can be empty string ''
    significatorPlanet: PropTypes.string.isRequired,
};

export default KpSignificatorGrid;
