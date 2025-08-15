// src/DashaTable.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import '../styles/DashaTable.css'; // Ensure this CSS file exists

// --- Helper Function for Date Formatting ---
const formatDashaDate = (dateString, t) => {
    // ... (keep existing formatDashaDate function)
    if (!dateString) return t ? t('utils.notAvailable', 'N/A') : 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
             console.warn(`Invalid date string received: ${dateString}`); // Add warning
             return t ? t('utils.invalidDate', 'Invalid Date') : 'Invalid Date';
        }
        return date.toLocaleDateString('en-CA', { // YYYY-MM-DD format
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting dasha date:", e);
        return dateString;
    }
};

// --- Helper Function to generate unique keys ---
// Ensures keys are unique even if lords/dates repeat across levels
const generateKey = (period, levelPrefix) => {
    let key = `${levelPrefix}-${period.lord}-${period.start}`;
    if (period.mahaLord) key += `-${period.mahaLord}`;
    if (period.antarLord) key += `-${period.antarLord}`; // Add antarLord if present
    return key;
};


const DashaTable = ({ dashaPeriods }) => {
    const { t } = useTranslation();
    // State to track expanded items (MDs and ADs) using their unique keys
    const [expandedItems, setExpandedItems] = useState(new Set());

    // --- Data Processing ---
    // Handles leveled Dasha data up to Pratyantar Dasha (Level 3)
    const processedPeriods = useMemo(() => {
        if (!dashaPeriods || dashaPeriods.length === 0) return [];

        // Check if the first period has a 'level' property.
        const hasLevels = dashaPeriods[0] && typeof dashaPeriods[0].level === 'number';

        if (hasLevels) {
            // --- Logic for Leveled Dashas (Vimsottari up to Level 3) ---
            const mahadashas = dashaPeriods.filter(p => p.level === 1);
            const antardashas = dashaPeriods.filter(p => p.level === 2);
            const pratyantardashas = dashaPeriods.filter(p => p.level === 3); // Filter Level 3

            // --- Nest Pratyantardashas within Antardashas ---
            antardashas.forEach(ad => {
                // Find corresponding pratyantardashas
                // Assumes level 3 periods have 'mahaLord' and 'antarLord' properties
                ad.subPeriods = pratyantardashas.filter(pd =>
                    pd.mahaLord === ad.mahaLord && // Match Maha Dasha Lord
                    pd.antarLord === ad.lord &&    // Match Antar Dasha Lord (which is the current AD's lord)
                    new Date(pd.start) >= new Date(ad.start) &&
                    new Date(pd.end) <= new Date(ad.end)
                );
                // Ensure subPeriods is an array and sort it
                if (!Array.isArray(ad.subPeriods)) {
                    ad.subPeriods = [];
                }
                ad.subPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));
            });

            // --- Nest Antardashas within Mahadashas ---
            mahadashas.forEach(md => {
                // Find corresponding antardashas (which now contain their own subPeriods)
                md.subPeriods = antardashas.filter(ad =>
                    ad.mahaLord === md.lord &&
                    new Date(ad.start) >= new Date(md.start) &&
                    new Date(ad.end) <= new Date(md.end)
                );
                // Ensure subPeriods is an array and sort it
                if (!Array.isArray(md.subPeriods)) {
                    md.subPeriods = [];
                }
                md.subPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));
            });

            // Handle edge case where only level 2+ data might be sent
            if (mahadashas.length === 0 && dashaPeriods.length > 0) {
                 console.warn("DashaTable: No level 1 periods found in leveled data, treating all periods as top-level.");
                 return dashaPeriods.map(p => ({ ...p, subPeriods: [] }))
                                    .sort((a, b) => new Date(a.start) - new Date(b.start));
            }

            return mahadashas; // Return the processed Mahadashas with nested subPeriods

        } else {
            // --- Logic for Flat Dashas (No change needed here) ---
           
            return dashaPeriods.map(p => ({ ...p, subPeriods: [] }))
                               .sort((a, b) => new Date(a.start) - new Date(b.start));
        }

    }, [dashaPeriods]);


    // --- Toggle Handler for any expandable item ---
    const toggleItem = (itemKey) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemKey)) {
                next.delete(itemKey);
            } else {
                next.add(itemKey);
            }
            return next;
        });
    };

    // --- Render Logic ---
    if (!processedPeriods || processedPeriods.length === 0) {
         return <p className="info-text">{t('dashaTable.dataUnavailable', 'Dasha data unavailable.')}</p>;
    }

    return (
        <div className="dasha-table-container result-section">
            <div className="table-wrapper dasha-table-wrapper">
                <table className="results-table dasha-table">
                    <thead>
                        <tr>
                            {/* Adjust header width slightly if needed */}
                            <th style={{ width: '80px' }}>{t('dashaTable.headerLevel', 'Level')}</th>
                            <th>{t('dashaTable.headerLord', 'Lord')}</th>
                            <th>{t('dashaTable.headerStartDate', 'Start Date')}</th>
                            <th>{t('dashaTable.headerEndDate', 'End Date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map over Mahadashas (Level 1) */}
                        {processedPeriods.map((mahaDasha) => {
                            const mdKey = generateKey(mahaDasha, 'MD');
                            const isMdExpanded = expandedItems.has(mdKey);
                            const hasMdSubPeriods = Array.isArray(mahaDasha.subPeriods) && mahaDasha.subPeriods.length > 0;

                            return (
                                <React.Fragment key={mdKey}>
                                    {/* Mahadasha Row (Level 1) */}
                                    <tr className="mahadasha-row">
                                        <td>
                                            {hasMdSubPeriods ? (
                                                <button
                                                    onClick={() => toggleItem(mdKey)}
                                                    className={`toggle-button ${isMdExpanded ? 'expanded' : ''}`}
                                                    aria-expanded={isMdExpanded}
                                                    title={isMdExpanded ? t('dashaTable.collapseMahadasha', 'Collapse MD') : t('dashaTable.expandMahadasha', 'Expand MD')}
                                                >
                                                    {isMdExpanded ? '−' : '+'} {t('dashaTable.levelMD', 'MD')}
                                                </button>
                                            ) : (
                                                <span className="level-indicator">{t('dashaTable.levelMD', 'MD')}</span>
                                            )}
                                        </td>
                                        <td><strong>{t(`planets.${mahaDasha.lord}`, mahaDasha.lord)}</strong></td>
                                        <td>{formatDashaDate(mahaDasha.start, t)}</td>
                                        <td>{formatDashaDate(mahaDasha.end, t)}</td>
                                    </tr>

                                    {/* Antardasha Rows (Level 2) - Render if MD is expanded */}
                                    {isMdExpanded && hasMdSubPeriods && mahaDasha.subPeriods.map((antarDasha) => {
                                        // Generate a unique key for the Antar Dasha
                                        const adKey = generateKey(antarDasha, 'AD');
                                        const isAdExpanded = expandedItems.has(adKey);
                                        // Check if this Antar Dasha has Pratyantar Dashas
                                        const hasAdSubPeriods = Array.isArray(antarDasha.subPeriods) && antarDasha.subPeriods.length > 0;

                                        return (
                                            <React.Fragment key={adKey}>
                                                {/* Antardasha Row (Level 2) */}
                                                <tr className="antardasha-row">
                                                    <td>
                                                        {hasAdSubPeriods ? (
                                                            <button
                                                                onClick={() => toggleItem(adKey)}
                                                                className={`toggle-button nested ${isAdExpanded ? 'expanded' : ''}`}
                                                                aria-expanded={isAdExpanded}
                                                                title={isAdExpanded ? t('dashaTable.collapseAntardasha', 'Collapse AD') : t('dashaTable.expandAntardasha', 'Expand AD')}
                                                            >
                                                                {/* Use different symbols or just +/- */}
                                                                {isAdExpanded ? '−' : '+'} {t('dashaTable.levelAD', 'AD')}
                                                            </button>
                                                        ) : (
                                                            <span className="level-indicator nested">{t('dashaTable.levelAD', 'AD')}</span>
                                                        )}
                                                    </td>
                                                    <td>{t(`planets.${antarDasha.lord}`, antarDasha.lord)}</td>
                                                    <td>{formatDashaDate(antarDasha.start, t)}</td>
                                                    <td>{formatDashaDate(antarDasha.end, t)}</td>
                                                </tr>

                                                {/* Pratyantardasha Rows (Level 3) - Render if AD is expanded */}
                                                {isAdExpanded && hasAdSubPeriods && antarDasha.subPeriods.map((pratyantarDasha) => {
                                                    // Generate a unique key for the Pratyantar Dasha
                                                    const pdKey = generateKey(pratyantarDasha, 'PD');

                                                    return (
                                                        <tr key={pdKey} className="pratyantardasha-row"> {/* Add new CSS class */}
                                                            <td>
                                                                {/* No toggle needed for level 3 */}
                                                                <span className="level-indicator nested-more">{t('dashaTable.levelPD', 'PD')}</span> {/* Add new translation key */}
                                                            </td>
                                                            <td>{t(`planets.${pratyantarDasha.lord}`, pratyantarDasha.lord)}</td>
                                                            <td>{formatDashaDate(pratyantarDasha.start, t)}</td>
                                                            <td>{formatDashaDate(pratyantarDasha.end, t)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- PropTypes ---
// Update prop types to potentially include antarLord for level 3
DashaTable.propTypes = {
    dashaPeriods: PropTypes.arrayOf(PropTypes.shape({
        level: PropTypes.number,
        lord: PropTypes.string.isRequired,
        start: PropTypes.string.isRequired,
        end: PropTypes.string.isRequired,
        mahaLord: PropTypes.string,
        antarLord: PropTypes.string, // Add antarLord as optional
    })),
};

export default DashaTable;
