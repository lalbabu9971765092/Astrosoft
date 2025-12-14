import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DiamondChart from './DiamondChart';
import DetailedPlanetTable from './DetailedPlanetTable';
import HouseDetailsTable from './HouseDetailsTable';
import { convertDMSToDegrees } from './AstrologyUtils'; // Import necessary utilities
import { useOutletContext } from 'react-router-dom';
import '../styles/DivisionalChartsPage.css';

// (removed unused placeholder data)

const DivisionalChartsPage = () => {
    const { t } = useTranslation();
    // Use outlet context provided by SharedInputLayout to stay in sync with app calculations
    const outlet = useOutletContext();
    const mainResult = outlet?.mainResult || null;
    const calculationInputParams = outlet?.calculationInputParams || null;
    const adjustedBirthDateTimeString = outlet?.adjustedBirthDateTimeString || null;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [d1ChartData, setD1ChartData] = useState(null);
    const [d2ChartData, setD2ChartData] = useState(null); // New
    const [d3ChartData, setD3ChartData] = useState(null); // New
    const [d7ChartData, setD7ChartData] = useState(null); // New
    const [d9ChartData, setD9ChartData] = useState(null);
    const [d12ChartData, setD12ChartData] = useState(null); // New
    const [d30ChartData, setD30ChartData] = useState(null); // New
    const [d60ChartData, setD60ChartData] = useState(null); // New

    // Update divisional chart state when main calculation result or input params change
    useEffect(() => {
        setIsLoading(false);
        setError(null);

        if (!mainResult) {
            setD1ChartData(null); setD2ChartData(null); setD3ChartData(null); setD7ChartData(null);
            setD9ChartData(null); setD12ChartData(null); setD30ChartData(null); setD60ChartData(null);
            return;
        }

        const result = mainResult;

        // D1
        const d1Houses = result.houses;
        const d1Planets = result.planetaryPositions?.sidereal;
        const d1PlanetDetails = result.planetDetails;
        setD1ChartData({ houses: d1Houses, planets: d1Planets, planetDetails: d1PlanetDetails });

        // D2
        const d2Houses = result.d2_houses || result.d2Houses || result.d2?.houses || null;
        const d2Planets = result.d2_planets || result.d2?.planets || result.d2Planets || null;
        setD2ChartData({ houses: d2Houses, planets: d2Planets, planetDetails: {} });

        // D3
        const d3Houses = result.d3_houses || result.d3Houses || result.d3?.houses || null;
        const d3Planets = result.d3_planets || result.d3?.planets || result.d3Planets || null;
        setD3ChartData({ houses: d3Houses, planets: d3Planets, planetDetails: {} });

        // D7
        const d7Houses = result.d7_houses || result.d7Houses || result.d7?.houses || null;
        const d7Planets = result.d7_planets || result.d7?.planets || result.d7Planets || null;
        setD7ChartData({ houses: d7Houses, planets: d7Planets, planetDetails: {} });

        // D9
        const d9Houses = result.d9_houses || result.d9Houses || result.d9?.houses || null;
        const d9Planets = result.d9_planets || result.d9?.planets || result.d9Planets || null;
        setD9ChartData({ houses: d9Houses, planets: d9Planets, planetDetails: {} });

        // D12
        const d12Houses = result.d12_houses || result.d12Houses || result.d12?.houses || null;
        const d12Planets = result.d12_planets || result.d12?.planets || result.d12Planets || null;
        setD12ChartData({ houses: d12Houses, planets: d12Planets, planetDetails: {} });

        // D30
        const d30Houses = result.d30_houses || result.d30Houses || result.d30?.houses || null;
        const d30Planets = result.d30_planets || result.d30?.planets || result.d30Planets || null;
        setD30ChartData({ houses: d30Houses, planets: d30Planets, planetDetails: {} });

        // D60
        const d60Houses = result.d60_houses || result.d60Houses || result.d60?.houses || null;
        const d60Planets = result.d60_planets || result.d60?.planets || result.d60Planets || null;
        setD60ChartData({ houses: d60Houses, planets: d60Planets, planetDetails: {} });

    }, [mainResult, calculationInputParams, adjustedBirthDateTimeString]);

    // refs for each chart section to enable navigation
    const sectionRefs = useRef({});
    const setSectionRef = (key) => (el) => { sectionRefs.current[key] = el; };

    const chartList = [
        { key: 'd1', label: t('divisionalChartsPage.d1ChartTitle', 'D1 - Lagna Chart') },
        { key: 'd2', label: t('divisionalChartsPage.d2ChartTitle', 'D2 - Hora Chart') },
        { key: 'd3', label: t('divisionalChartsPage.d3ChartTitle', 'D3 - Drekkana Chart') },
        { key: 'd7', label: t('divisionalChartsPage.d7ChartTitle', 'D7 - Saptamsa Chart') },
        { key: 'd9', label: t('divisionalChartsPage.d9ChartTitle', 'D9 - Navamsa Chart') },
        { key: 'd12', label: t('divisionalChartsPage.d12ChartTitle', 'D12 - Dwadasamsa Chart') },
        { key: 'd30', label: t('divisionalChartsPage.d30ChartTitle', 'D30 - Trimsamsa Chart') },
        { key: 'd60', label: t('divisionalChartsPage.d60ChartTitle', 'D60 - Shashtiamsa Chart') },
    ];

    const jumpToChart = (key) => {
        const el = sectionRefs.current[key];
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            try { el.focus?.(); } catch (e) { /* ignore focus errors */ }
        }
    };

    // Which chart is currently visible (only this chart's section will render)
    const [selectedChart, setSelectedChart] = useState('d1');

    // Memoize placidusCuspDegrees for DetailedPlanetTable for all charts
    const d1PlacidusCuspDegrees = useMemo(() => {
        if (!d1ChartData?.houses || !Array.isArray(d1ChartData.houses) || d1ChartData.houses.length !== 12) return [];
        const degrees = d1ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d1ChartData]);

    const d2PlacidusCuspDegrees = useMemo(() => {
        if (!d2ChartData?.houses || !Array.isArray(d2ChartData.houses) || d2ChartData.houses.length !== 12) return [];
        const degrees = d2ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d2ChartData]);

    const d3PlacidusCuspDegrees = useMemo(() => {
        if (!d3ChartData?.houses || !Array.isArray(d3ChartData.houses) || d3ChartData.houses.length !== 12) return [];
        const degrees = d3ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d3ChartData]);

    const d7PlacidusCuspDegrees = useMemo(() => {
        if (!d7ChartData?.houses || !Array.isArray(d7ChartData.houses) || d7ChartData.houses.length !== 12) return [];
        const degrees = d7ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d7ChartData]);

    const d9PlacidusCuspDegrees = useMemo(() => {
        if (!d9ChartData?.houses || !Array.isArray(d9ChartData.houses) || d9ChartData.houses.length !== 12) return [];
        const degrees = d9ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d9ChartData]);

    const d12PlacidusCuspDegrees = useMemo(() => {
        if (!d12ChartData?.houses || !Array.isArray(d12ChartData.houses) || d12ChartData.houses.length !== 12) return [];
        const degrees = d12ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d12ChartData]);

    const d30PlacidusCuspDegrees = useMemo(() => {
        if (!d30ChartData?.houses || !Array.isArray(d30ChartData.houses) || d30ChartData.houses.length !== 12) return [];
        const degrees = d30ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d30ChartData]);

    const d60PlacidusCuspDegrees = useMemo(() => {
        if (!d60ChartData?.houses || !Array.isArray(d60ChartData.houses) || d60ChartData.houses.length !== 12) return [];
        const degrees = d60ChartData.houses.map(h => convertDMSToDegrees(h?.start_dms));
        if (degrees.some(isNaN)) {
            return [];
        }
        return degrees;
    }, [d60ChartData]);

    if (isLoading) {
        return <div className="loading-message">{t('divisionalChartsPage.loading', 'Loading divisional charts...')}</div>;
    }

    if (error) {
        return <div className="error-message">{t('divisionalChartsPage.error', 'Error:')} {error}</div>;
    }

    if (!d1ChartData || !d2ChartData || !d3ChartData || !d7ChartData || !d9ChartData || !d12ChartData || !d30ChartData || !d60ChartData) {
        return <div className="info-message">{t('divisionalChartsPage.noData', 'No chart data available. Please provide input parameters.')}</div>;
    }

    return (
        <div className="divisional-charts-page">
            <h1>{t('divisionalChartsPage.title', 'Divisional Charts')}</h1> {/* Changed title to be more general */}

            <div className="divisional-chart-nav" aria-label={t('divisionalChartsPage.navLabel','Jump to chart')}>
                {chartList.map(c => (
                    <button
                        key={c.key}
                        type="button"
                        className={`nav-chart-button ${selectedChart === c.key ? 'active' : ''}`}
                        onClick={() => { setSelectedChart(c.key); setTimeout(() => jumpToChart(c.key), 50); }}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* D1 Chart and Details */}
            {selectedChart === 'd1' && (
            <section ref={setSectionRef('d1')} tabIndex={-1} className="chart-section d1-chart-section">
                <h2>{t('divisionalChartsPage.d1ChartTitle', 'D1 - Lagna Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d1ChartData.houses && d1ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD1Title', 'Lagna Chart')}
                                houses={d1ChartData.houses}
                                planets={d1ChartData.planets}
                                chartType="lagna"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d1ChartUnavailable', 'D1 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d1HouseDetails', 'D1 House Details')}</h3>
                        <HouseDetailsTable houses={d1ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d1PlanetDetails', 'D1 Planetary Positions')}</h3>
                        {d1ChartData.planets && d1PlacidusCuspDegrees.length === 12 ? (
                             <DetailedPlanetTable
                                planets={d1ChartData.planets}
                                houses={d1ChartData.houses}
                                planetDetails={d1ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d1PlanetsUnavailable', 'D1 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}

            {/* D2 Chart and Details */}
            {selectedChart === 'd2' && (
            <section ref={setSectionRef('d2')} tabIndex={-1} className="chart-section d2-chart-section">
                <h2>{t('divisionalChartsPage.d2ChartTitle', 'D2 - Hora Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d2ChartData.houses && d2ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD2Title', 'Hora Chart')}
                                houses={d2ChartData.houses}
                                planets={d2ChartData.planets}
                                chartType="d2"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d2ChartUnavailable', 'D2 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d2HouseDetails', 'D2 House Details')}</h3>
                        <HouseDetailsTable houses={d2ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d2PlanetDetails', 'D2 Planetary Positions')}</h3>
                        {d2ChartData.planets && d2PlacidusCuspDegrees.length === 12 ? (
                             <DetailedPlanetTable
                                planets={d2ChartData.planets}
                                houses={d2ChartData.houses}
                                planetDetails={d2ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d2PlanetsUnavailable', 'D2 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}

            {/* D3 Chart and Details */}
            {selectedChart === 'd3' && (
            <section ref={setSectionRef('d3')} tabIndex={-1} className="chart-section d3-chart-section">
                <h2>{t('divisionalChartsPage.d3ChartTitle', 'D3 - Drekkana Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d3ChartData.houses && d3ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD3Title', 'Drekkana Chart')}
                                houses={d3ChartData.houses}
                                planets={d3ChartData.planets}
                                chartType="d3"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d3ChartUnavailable', 'D3 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d3HouseDetails', 'D3 House Details')}</h3>
                        <HouseDetailsTable houses={d3ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d3PlanetDetails', 'D3 Planetary Positions')}</h3>
                        {d3ChartData.planets && d3PlacidusCuspDegrees.length === 12 ? (
                             <DetailedPlanetTable
                                planets={d3ChartData.planets}
                                houses={d3ChartData.houses}
                                planetDetails={d3ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d3PlanetsUnavailable', 'D3 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}

            {/* D7 Chart and Details */}
            {selectedChart === 'd7' && (
            <section ref={setSectionRef('d7')} tabIndex={-1} className="chart-section d7-chart-section">
                <h2>{t('divisionalChartsPage.d7ChartTitle', 'D7 - Saptamsa Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d7ChartData.houses && d7ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD7Title', 'Saptamsa Chart')}
                                houses={d7ChartData.houses}
                                planets={d7ChartData.planets}
                                chartType="d7"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d7ChartUnavailable', 'D7 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d7HouseDetails', 'D7 House Details')}</h3>
                        <HouseDetailsTable houses={d7ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d7PlanetDetails', 'D7 Planetary Positions')}</h3>
                        {d7ChartData.planets && d7PlacidusCuspDegrees.length === 12 ? (
                             <DetailedPlanetTable
                                planets={d7ChartData.planets}
                                houses={d7ChartData.houses}
                                planetDetails={d7ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d7PlanetsUnavailable', 'D7 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}

            {/* D9 Chart and Details */}
            {selectedChart === 'd9' && (
            <section ref={setSectionRef('d9')} tabIndex={-1} className="chart-section d9-chart-section">
                <h2>{t('divisionalChartsPage.d9ChartTitle', 'D9 - Navamsa Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d9ChartData.houses && d9ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD9Title', 'Navamsa Chart')}
                                houses={d9ChartData.houses}
                                planets={d9ChartData.planets}
                                chartType="d9"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d9ChartUnavailable', 'D9 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d9HouseDetails', 'D9 House Details')}</h3>
                        <HouseDetailsTable houses={d9ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d9PlanetDetails', 'D9 Planetary Positions')}</h3>
                         {d9ChartData.planets && d9PlacidusCuspDegrees.length === 12 ? (
                            <DetailedPlanetTable
                                planets={d9ChartData.planets}
                                houses={d9ChartData.houses}
                                planetDetails={d9ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d9PlanetsUnavailable', 'D9 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}

            {/* D12 Chart and Details */}
            {selectedChart === 'd12' && (
            <section ref={setSectionRef('d12')} tabIndex={-1} className="chart-section d12-chart-section">
                <h2>{t('divisionalChartsPage.d12ChartTitle', 'D12 - Dwadasamsa Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d12ChartData.houses && d12ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD12Title', 'Dwadasamsa Chart')}
                                houses={d12ChartData.houses}
                                planets={d12ChartData.planets}
                                chartType="d12"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d12ChartUnavailable', 'D12 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d12HouseDetails', 'D12 House Details')}</h3>
                        <HouseDetailsTable houses={d12ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d12PlanetDetails', 'D12 Planetary Positions')}</h3>
                        {d12ChartData.planets && d12PlacidusCuspDegrees.length === 12 ? (
                             <DetailedPlanetTable
                                planets={d12ChartData.planets}
                                houses={d12ChartData.houses}
                                planetDetails={d12ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d12PlanetsUnavailable', 'D12 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}

            {/* D30 Chart and Details */}
            {selectedChart === 'd30' && (
            <section ref={setSectionRef('d30')} tabIndex={-1} className="chart-section d30-chart-section">
                <h2>{t('divisionalChartsPage.d30ChartTitle', 'D30 - Trimsamsa Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d30ChartData.houses && d30ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD30Title', 'Trimsamsa Chart')}
                                houses={d30ChartData.houses}
                                planets={d30ChartData.planets}
                                chartType="d30"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d30ChartUnavailable', 'D30 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d30HouseDetails', 'D30 House Details')}</h3>
                        <HouseDetailsTable houses={d30ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d30PlanetDetails', 'D30 Planetary Positions')}</h3>
                        {d30ChartData.planets && d30PlacidusCuspDegrees.length === 12 ? (
                             <DetailedPlanetTable
                                planets={d30ChartData.planets}
                                houses={d30ChartData.houses}
                                planetDetails={d30ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d30PlanetsUnavailable', 'D30 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}

            {/* D60 Chart and Details */}
            {selectedChart === 'd60' && (
            <section ref={setSectionRef('d60')} tabIndex={-1} className="chart-section d60-chart-section">
                <h2>{t('divisionalChartsPage.d60ChartTitle', 'D60 - Shashtiamsa Chart')}</h2>
                <div className="chart-and-tables-container">
                    <div className="chart-display">
                        {d60ChartData.houses && d60ChartData.planets ? (
                            <DiamondChart
                                title={t('astrologyForm.chartD60Title', 'Shashtiamsa Chart')}
                                houses={d60ChartData.houses}
                                planets={d60ChartData.planets}
                                chartType="d60"
                                size={400}
                            />
                        ) : <p>{t('divisionalChartsPage.d60ChartUnavailable', 'D60 Chart Unavailable')}</p>}
                    </div>
                    <div className="tables-display">
                        <h3>{t('divisionalChartsPage.d60HouseDetails', 'D60 House Details')}</h3>
                        <HouseDetailsTable houses={d60ChartData.houses} />

                        <h3>{t('divisionalChartsPage.d60PlanetDetails', 'D60 Planetary Positions')}</h3>
                        {d60ChartData.planets && d60PlacidusCuspDegrees.length === 12 ? (
                             <DetailedPlanetTable
                                planets={d60ChartData.planets}
                                houses={d60ChartData.houses}
                                planetDetails={d60ChartData.planetDetails}
                            />
                        ) : <p>{t('divisionalChartsPage.d60PlanetsUnavailable', 'D60 Planetary Positions Unavailable')}</p>}
                    </div>
                </div>
            </section>
            )}
        </div>
    );
};

export default DivisionalChartsPage;
