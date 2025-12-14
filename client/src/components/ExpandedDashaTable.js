// client/src/components/ExpandedDashaTable.js
import React, { useMemo } from 'react';
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
        return date.toLocaleDateString('en-GB');
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


const ExpandedDashaTable = ({ dashaPeriods }) => {
    const { t } = useTranslation();

    // --- Data Processing ---
    // Handles leveled Dasha data up to Pratyantar Dasha (Level 3)
    const processedPeriods = useMemo(() => {
        if (!dashaPeriods || dashaPeriods.length === 0) return [];

        const hasLevels = dashaPeriods[0] && typeof dashaPeriods[0].level === 'number';

        if (hasLevels) {
            const mahadashas = dashaPeriods.filter(p => p.level === 1);
            const antardashas = dashaPeriods.filter(p => p.level === 2);
            const pratyantardashas = dashaPeriods.filter(p => p.level === 3);

            antardashas.forEach(ad => {
                ad.subPeriods = pratyantardashas.filter(pd =>
                    pd.mahaLord === ad.mahaLord &&
                    pd.antarLord === ad.lord &&
                    new Date(pd.start) >= new Date(ad.start) &&
                    new Date(pd.end) <= new Date(ad.end)
                ).sort((a, b) => new Date(a.start) - new Date(b.start));
            });

            mahadashas.forEach(md => {
                md.subPeriods = antardashas.filter(ad =>
                    ad.mahaLord === md.lord &&
                    new Date(ad.start) >= new Date(md.start) &&
                    new Date(ad.end) <= new Date(md.end)
                ).sort((a, b) => new Date(a.start) - new Date(b.start));
            });

            if (mahadashas.length === 0 && dashaPeriods.length > 0) {
                 console.warn("DashaTable: No level 1 periods found in leveled data, treating all periods as top-level.");
                 return dashaPeriods.map(p => ({ ...p, subPeriods: [] }))
                                    .sort((a, b) => new Date(a.start) - new Date(b.start));
            }

            return mahadashas;

        } else {
            return dashaPeriods.map(p => ({ ...p, subPeriods: [] }))
                               .sort((a, b) => new Date(a.start) - new Date(b.start));
        }

    }, [dashaPeriods]);

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
                            const hasMdSubPeriods = Array.isArray(mahaDasha.subPeriods) && mahaDasha.subPeriods.length > 0;

                            return (
                                <React.Fragment key={mdKey}>
                                    {/* Mahadasha Row (Level 1) */}
                                    <tr className="mahadasha-row">
                                        <td>
                                            <span className="level-indicator">{t('dashaTable.levelMD', 'MD')}</span>
                                        </td>
                                        <td><strong>{t(`planets.${mahaDasha.lord}`, mahaDasha.lord)}</strong></td>
                                        <td>{formatDashaDate(mahaDasha.start, t)}</td>
                                        <td>{formatDashaDate(mahaDasha.end, t)}</td>
                                    </tr>

                                    {/* Antardasha Rows (Level 2) - Always render */}
                                    {hasMdSubPeriods && mahaDasha.subPeriods.map((antarDasha) => {
                                        const adKey = generateKey(antarDasha, 'AD');

                                        return (
                                            <React.Fragment key={adKey}>
                                                {/* Antardasha Row (Level 2) */}
                                                <tr className="antardasha-row">
                                                    <td>
                                                        <span className="level-indicator nested">{t('dashaTable.levelAD', 'AD')}</span>
                                                    </td>
                                                    <td>{t(`planets.${antarDasha.lord}`, antarDasha.lord)}</td>
                                                    <td>{formatDashaDate(antarDasha.start, t)}</td>
                                                    <td>{formatDashaDate(antarDasha.end, t)}</td>
                                                </tr>

                                                {/* Pratyantardasha Rows (Level 3) - Always render */}
                                                {/* {hasAdSubPeriods && antarDasha.subPeriods.map((pratyantarDasha) => {
                                                    const pdKey = generateKey(pratyantarDasha, 'PD');

                                                    return (
                                                        <tr key={pdKey} className="pratyantardasha-row">
                                                            <td>
                                                                <span className="level-indicator nested-more">{t('dashaTable.levelPD', 'PD')}</span>
                                                            </td>
                                                            <td>{t(`planets.${pratyantarDasha.lord}`, pratyantarDasha.lord)}</td>
                                                            <td>{formatDashaDate(pratyantarDasha.start, t)}</td>
                                                            <td>{formatDashaDate(pratyantarDasha.end, t)}</td>
                                                        </tr>
                                                    );
                                                })} */}
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
ExpandedDashaTable.propTypes = {
    dashaPeriods: PropTypes.arrayOf(PropTypes.shape({
        level: PropTypes.number,
        lord: PropTypes.string.isRequired,
        start: PropTypes.string.isRequired,
        end: PropTypes.string.isRequired,
        mahaLord: PropTypes.string,
        antarLord: PropTypes.string,
    })),
};

export default ExpandedDashaTable;
