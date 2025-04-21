// src/DashaTable.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import '../styles/DashaTable.css'; // Ensure this CSS file exists

// --- Helper Function for Date Formatting ---
const formatDashaDate = (dateString, t) => {
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


const DashaTable = ({ dashaPeriods }) => {
    const { t } = useTranslation();
    // State to track expanded Mahadashas using the Mahadasha lord and start time as a unique key
    const [expandedMahadashas, setExpandedMahadashas] = useState(new Set());

    // --- Data Processing ---
    // Handles both leveled (Vimsottari) and potentially flat (Mudda) Dasha data
    const processedPeriods = useMemo(() => {
        if (!dashaPeriods || dashaPeriods.length === 0) return []; // Return empty if no input

        // Check if the first period has a 'level' property.
        const hasLevels = dashaPeriods[0] && typeof dashaPeriods[0].level === 'number';

        if (hasLevels) {
            // --- Logic for Leveled Dashas (like Vimsottari) ---
            const mahadashas = dashaPeriods.filter(p => p.level === 1);
            const antardashas = dashaPeriods.filter(p => p.level === 2);
            // Add more levels (pratyantar, sookshma) if your API provides them (level 3, 4, etc.)

            mahadashas.forEach(md => {
                // Find corresponding antardashas
                md.subPeriods = antardashas.filter(ad =>
                    ad.mahaLord === md.lord &&
                    new Date(ad.start) >= new Date(md.start) &&
                    new Date(ad.end) <= new Date(md.end)
                );
                // Ensure subPeriods is definitely an array and sort it
                if (!Array.isArray(md.subPeriods)) {
                    md.subPeriods = []; // Ensure it's an array even if filter fails unexpectedly
                }
                md.subPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));
            });

            // If filtering resulted in no level 1 periods, but we had data, treat all as level 1
            // This handles cases where only level 2+ data might be sent, though less common
            if (mahadashas.length === 0 && dashaPeriods.length > 0) {
                 console.warn("DashaTable: No level 1 periods found in leveled data, treating all periods as top-level.");
                 // Return the original periods, adding an empty subPeriods array
                 return dashaPeriods.map(p => ({ ...p, subPeriods: [] }))
                                    .sort((a, b) => new Date(a.start) - new Date(b.start));
            }

            return mahadashas; // Return the processed Mahadashas with nested subPeriods

        } else {
            // --- Logic for Flat Dashas (Assume Mudda Dasha might be flat) ---
            console.log("DashaTable: No 'level' property found, treating as a flat list.");
            // Treat all periods as top-level, add empty subPeriods array
            // Ensure sorting by start date
            return dashaPeriods.map(p => ({ ...p, subPeriods: [] }))
                               .sort((a, b) => new Date(a.start) - new Date(b.start));
        }

    }, [dashaPeriods]);


    // --- Toggle Handler ---
    const toggleMahadasha = (mahadashaKey) => {
        setExpandedMahadashas(prev => {
            const next = new Set(prev);
            if (next.has(mahadashaKey)) {
                next.delete(mahadashaKey);
            } else {
                next.add(mahadashaKey);
            }
            return next;
        });
    };

    // --- Render Logic ---
    // Check if processing resulted in an empty array, which implies input was empty or invalid
    if (!processedPeriods || processedPeriods.length === 0) {
         // This condition should ideally only be met if dashaPeriods was initially null/empty
         return <p className="info-text">{t('dashaTable.dataUnavailable', 'Dasha data unavailable.')}</p>;
    }

    return (
        <div className="dasha-table-container result-section">
            <div className="table-wrapper dasha-table-wrapper">
                <table className="results-table dasha-table">
                    <thead>
                        <tr>
                            <th>{t('dashaTable.headerLevel', 'Level')}</th>
                            <th>{t('dashaTable.headerLord', 'Lord')}</th>
                            <th>{t('dashaTable.headerStartDate', 'Start Date')}</th>
                            <th>{t('dashaTable.headerEndDate', 'End Date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map over the processed periods (which are now always top-level) */}
                        {processedPeriods.map((period) => {
                            // Use period.lord and period.start for a unique key
                            const periodKey = `${period.lord}-${period.start}`;
                            const isExpanded = expandedMahadashas.has(periodKey);
                            // Check if this period has actual sub-periods calculated in useMemo
                            const hasSubPeriodsToShow = Array.isArray(period.subPeriods) && period.subPeriods.length > 0;

                            return (
                                <React.Fragment key={periodKey}>
                                    {/* Top-Level Period Row (MD or Flat Dasha) */}
                                    <tr className="mahadasha-row"> {/* Use mahadasha style for top level */}
                                        <td>
                                            {/* Show button only if there are sub-periods */}
                                            {hasSubPeriodsToShow ? (
                                                <button
                                                    onClick={() => toggleMahadasha(periodKey)}
                                                    className={`toggle-button ${isExpanded ? 'expanded' : ''}`}
                                                    aria-expanded={isExpanded}
                                                    title={isExpanded ? t('dashaTable.collapseMahadasha', 'Collapse') : t('dashaTable.expandMahadasha', 'Expand')}
                                                >
                                                    {/* + for collapsed, − for expanded */}
                                                    {isExpanded ? '−' : '+'} {t('dashaTable.levelMD', 'MD')} {/* Assume MD label for expandable */}
                                                </button>
                                            ) : (
                                                /* Show appropriate label (MD or maybe just empty if flat?) */
                                                <span className="level-indicator">{period.level === 1 ? t('dashaTable.levelMD', 'MD') : ''}</span>
                                            )}
                                        </td>
                                        <td><strong>{t(`planets.${period.lord}`, period.lord)}</strong></td>
                                        <td>{formatDashaDate(period.start, t)}</td>
                                        <td>{formatDashaDate(period.end, t)}</td>
                                    </tr>

                                    {/* Sub-Period Rows (Antardasha, etc.) - Render only if expanded AND there are sub-periods */}
                                    {isExpanded && hasSubPeriodsToShow && period.subPeriods.map((subPeriod) => (
                                        <tr key={`${periodKey}-${subPeriod.lord}-${subPeriod.start}`} className="antardasha-row"> {/* Use antardasha style */}
                                            <td>
                                                {/* Assume AD label for sub-periods */}
                                                <span className="level-indicator nested">{t('dashaTable.levelAD', 'AD')}</span>
                                            </td>
                                            <td>{t(`planets.${subPeriod.lord}`, subPeriod.lord)}</td>
                                            <td>{formatDashaDate(subPeriod.start, t)}</td>
                                            <td>{formatDashaDate(subPeriod.end, t)}</td>
                                        </tr>
                                        // Add further nesting here if Pratyantar etc. data is processed
                                    ))}
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
// Make prop types more flexible to allow for missing level/mahaLord in flat data
DashaTable.propTypes = {
    dashaPeriods: PropTypes.arrayOf(PropTypes.shape({
        level: PropTypes.number, // Level might not always be present
        lord: PropTypes.string.isRequired,
        start: PropTypes.string.isRequired,
        end: PropTypes.string.isRequired,
        mahaLord: PropTypes.string, // MahaLord might not always be present
    })),
};

export default DashaTable;
