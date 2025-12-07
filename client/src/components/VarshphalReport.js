// client/src/components/VarshphalReport.js
import React from 'react';
import DiamondChart from './DiamondChart';
import DashaTable from './DashaTable';
import KpSignificatorGrid from './KpSignificatorGrid';
import DetailedPlanetTable from './DetailedPlanetTable'; // Import DetailedPlanetTable
import CustomDetailedPlanetTable from './CustomDetailedPlanetTable'; // Import CustomDetailedPlanetTable
import { PLANET_ORDER } from './AstrologyUtils'; // Import PLANET_ORDER


const VarshphalReport = ({ varshphalResult, reportYear, natalInputParams, t, i18n, formatDisplayDateTime, isPrintable }) => {
    if (!varshphalResult) {
        return <div>Varshphal data not available.</div>;
    }

    const { varshphalChart, muntha, muddaDasha, yearLord, kpSignificators } = varshphalResult;

    // Helper function to interpret UPBS score (copied from PlanetDetailsPage.jsx)
    const interpretUPBS = (score) => {
        if (score >= 12) return t('upbsInterpretation.highlyBenefic');
        if (score >= 5) return t('upbsInterpretation.benefic');
        if (score >= 0) return t('upbsInterpretation.mildBenefic');
        if (score >= -4) return t('upbsInterpretation.mildMalefic');
        if (score >= -10) return t('upbsInterpretation.malefic');
        return t('upbsInterpretation.highlyMalefic'); // Score -11 to -20
    };

    const canRenderChart = varshphalChart?.houses && varshphalChart?.planetaryPositions?.sidereal;
    const hasDashaData = muddaDasha && Array.isArray(muddaDasha) && muddaDasha.length > 0;
    const hasKpData = kpSignificators && Array.isArray(kpSignificators) && kpSignificators.length > 0;

    const titleText = reportYear ? `Varshphal Report for ${reportYear}` : 'Varshphal Report';

    const varshphalDateFormatted = varshphalChart?.date ? formatDisplayDateTime(varshphalChart.date, t, i18n) : 'N/A';
    const birthDateFormatted = natalInputParams?.date ? formatDisplayDateTime(natalInputParams.date, t, i18n) : 'N/A';
    const birthLocationCoords = natalInputParams?.latitude && natalInputParams?.longitude
        ? `${natalInputParams.latitude.toFixed(4)}, ${natalInputParams.longitude.toFixed(4)}`
        : 'N/A';

    const summaryLine = `Calculated for Year: ${reportYear} (Varshphal Date: ${varshphalDateFormatted}) | Birth: ${birthDateFormatted} at ${natalInputParams?.placeName || 'N/A'} (${birthLocationCoords})`;

    // Define columns for the two tables for vertical split in printable mode
    const COLUMNS_TABLE_1_VARSHPHAL = [
        'planet', 'position', 'nakPada', 'nakLord', 'subLord', 'subSub', 'nakDeg', 'rashi', 'rashiLord', 'bhava'
    ];
    const COLUMNS_TABLE_2_VARSHPHAL = [
        'planet', 'dignity', 'balaadi', 'jagradadi', 'deeptaadi', 'speed', 'retrograde', 'combust'
    ];

    return (
        <div>
            <h2>{titleText}</h2>
            <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#555', margin: '10px 0 20px 0' }}>{summaryLine}</p>
            {canRenderChart && (
                <>
                    <div className="varshphal-chart-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ textAlign: 'center' }}>Lagna Chart</h3>
                        <DiamondChart
                            title={`Varshphal Chart`}
                            houses={varshphalChart.houses}
                            planets={varshphalChart.planetaryPositions.sidereal}
                            size={350}
                            chartType="lagna"
                        />
                    </div>
                    {varshphalChart.planetHousePlacements && (
                        <div className="varshphal-chart-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ textAlign: 'center' }}>Nirayan Bhav Chalit Chart</h3>
                            <DiamondChart
                                title={`Nirayan Bhav Chalit Chart`}
                                houses={varshphalChart.houses}
                                planetHousePlacements={varshphalChart.planetHousePlacements}
                                size={350}
                                chartType="bhava"
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '100px' }}></div> {/* Spacer to push content to next page */}
                </>
            )}
            <div className="result-section varshphal-details">
                {muntha && (
                    <p>
                        <strong>Muntha:</strong> House {muntha.house}, Sign {muntha.sign}
                    </p>
                )}
                {yearLord && (
                    <p>
                        <strong>Year Lord:</strong> {yearLord}
                    </p>
                )}
            </div>
            {hasDashaData && (
                <div className="result-section mudda-dasha">
                    <h3>Mudda Dasha</h3>
                    <DashaTable dashaPeriods={muddaDasha} />
                </div>
            )}
            {canRenderChart && (varshphalChart?.houses) && (
                <div className="result-section" style={{ pageBreakInside: 'avoid' }}>
                    <h3>House Cusps</h3>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>{t('common.house')}</th>
                                    <th>{t('common.start')}</th>
                                    <th>{t('common.mean')}</th>
                                    <th>{t('common.end')}</th>
                                    <th>{t('common.rashi')}</th>
                                    <th>{t('common.nakshatra')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {varshphalChart.houses.map((house) => (
                                    <tr key={house.house_number}>
                                        <td>{house.house_number}</td>
                                        <td>{house.start_dms || 'N/A'}</td>
                                        <td>{house.mean_dms || 'N/A'}</td>
                                        <td>{house.end_dms || 'N/A'}</td>
                                        <td>{t(`rashis.${house.start_rashi}`, house.start_rashi) || 'N/A'} ({t(`planets.${house.start_rashi_lord}`, house.start_rashi_lord) || 'N/A'})</td>
                                        <td>{t(`nakshatras.${house.start_nakshatra}`, house.start_nakshatra) || 'N/A'} ({t(`planets.${house.start_nakshatra_lord}`, house.start_nakshatra_lord) || 'N/A'})</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {canRenderChart && (
                isPrintable ? (
                    <div style={{ pageBreakInside: 'avoid' }}>
                        <h3>Planetary Positions</h3>
                        <div style={{ marginBottom: '20px' }}>
                            <CustomDetailedPlanetTable
                                planets={varshphalChart.planetaryPositions.sidereal}
                                houses={varshphalChart.houses}
                                planetDetails={varshphalChart.planetDetails}
                                planetOrder={PLANET_ORDER}
                                columns={COLUMNS_TABLE_1_VARSHPHAL}
                            />
                        </div>
                        <div style={{ pageBreakBefore: 'avoid' }}>
                            <CustomDetailedPlanetTable
                                planets={varshphalChart.planetaryPositions.sidereal}
                                houses={varshphalChart.houses}
                                planetDetails={varshphalChart.planetDetails}
                                planetOrder={PLANET_ORDER}
                                columns={COLUMNS_TABLE_2_VARSHPHAL}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="landscape-section">
                        <h3>Planetary Positions</h3>
                        <DetailedPlanetTable
                            planets={varshphalChart.planetaryPositions.sidereal}
                            houses={varshphalChart.houses}
                            planetDetails={varshphalChart.planetDetails}
                        />
                    </div>
                )
            )}
            {/* Uncommon Planetary Beneficence Score (UPBS) for Varshphal */}
            {varshphalChart?.planetDetails?.upbsScores && (
                <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
                    <h3 style={{ pageBreakBefore: 'always' }}>{t('varshphalPage.upbsTitle')}</h3>
                    <div className="table-wrapper upbs-table-wrapper">
                        <table className="results-table upbs-table">
                            <thead>
                                <tr>
                                    <th>{t('upbsTableHeaders.planet')}</th>
                                    <th>{t('upbsBreakdownShort.NBS')}</th>
                                    <th>{t('upbsBreakdownShort.FBS')}</th>
                                    <th>{t('upbsBreakdownShort.PDS')}</th>
                                    <th>{t('upbsBreakdownShort.SS')}</th>
                                    <th>{t('upbsBreakdownShort.CRS')}</th>
                                    <th>{t('upbsBreakdownShort.HPS')}</th>
                                    <th>{t('upbsBreakdownShort.ARS')}</th>
                                    <th>{t('upbsBreakdownShort.NLM')}</th>
                                    <th>{t('upbsBreakdownShort.ASC')}</th>
                                    <th>{t('upbsTableHeaders.totalScoreShort')}</th>
                                    <th>{t('upbsTableHeaders.interpretationShort')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PLANET_ORDER.filter(p => p !== 'Uranus' && p !== 'Neptune' && p !== 'Pluto').map(planet => {
                                    const planetUPBS = varshphalChart.planetDetails.upbsScores[planet];
                                    if (!planetUPBS || isNaN(planetUPBS.total) || !planetUPBS.breakdown) {
                                        return (
                                            <tr key={`upbs-varshphal-${planet}`}>
                                                <td>{t(`planets.${planet}`, planet)}</td>
                                                <td colSpan="11">{t('varshphalPage.upbsDataMissing')}</td>
                                            </tr>
                                        );
                                    }
                                    const interpretation = interpretUPBS(planetUPBS.total);
                                    return (
                                        <tr key={`upbs-varshphal-${planet}`}>
                                            <td>{t(`planets.${planet}`, planet)}</td>
                                            <td>{(planetUPBS.breakdown.NBS ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.FBS ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.PDS ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.SS ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.CRS ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.HPS ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.ARS ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.NLM ?? 0).toFixed(2)}</td>
                                            <td>{(planetUPBS.breakdown.ASC ?? 0).toFixed(2)}</td>
                                            <td><strong>{(planetUPBS.total ?? 0).toFixed(2)}</strong></td>
                                            <td>{interpretation}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="upbs-legend">
                        <h4>{t('upbsLegend.title')}</h4>
                        <ul>
                            <li><strong>{t('upbsBreakdownShort.NBS')}</strong>: {t('upbsBreakdown.NBS')}</li>
                            <li><strong>{t('upbsBreakdownShort.FBS')}</strong>: {t('upbsBreakdown.FBS')}</li>
                            <li><strong>{t('upbsBreakdownShort.PDS')}</strong>: {t('upbsBreakdown.PDS')}</li>
                            <li><strong>{t('upbsBreakdownShort.SS')}</strong>: {t('upbsBreakdown.SS')}</li>
                            <li><strong>{t('upbsBreakdownShort.CRS')}</strong>: {t('upbsBreakdown.CRS')}</li>
                            <li><strong>{t('upbsBreakdownShort.HPS')}</strong>: {t('upbsBreakdown.HPS')}</li>
                            <li><strong>{t('upbsBreakdownShort.ARS')}</strong>: {t('upbsBreakdown.ARS')}</li>
                            <li><strong>{t('upbsBreakdownShort.NLM')}</strong>: {t('upbsBreakdown.NLM')}</li>
                            <li><strong>{t('upbsBreakdownShort.ASC')}</strong>: {t('upbsBreakdown.ASC')}</li>
                            <li><strong>{t('upbsTableHeaders.totalScoreShort')}</strong>: {t('upbsTableHeaders.totalScore')}</li>
                            <li><strong>{t('upbsTableHeaders.interpretationShort')}</strong>: {t('upbsTableHeaders.interpretation')}</li>
                        </ul>
                    </div>
                </div>
            )}
            {hasKpData && (
                <div className="result-section">
                    <h3>KP Significators</h3>
                    <KpSignificatorGrid
                        significatorDetailsMap={new Map(kpSignificators.map(s => [s.name, s]))}
                        selectedEvent=""
                        significatorPlanet=""
                    />
                </div>
            )}
        </div>
    );
};

export default VarshphalReport;

