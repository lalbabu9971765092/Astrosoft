import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from './api';
import '../styles/TransitSearchBlock.css';

const TransitSearchBlock = ({ natalData }) => {
    const { t } = useTranslation();
    const [selectedPlanets, setSelectedPlanets] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedHouses, setSelectedHouses] = useState([]);
    const [searchOptions, setSearchOptions] = useState({
        threePlanetConjunction: true,
        threePlanetAspect: true,
        threePlanetNatalReturn: true,
        threePlanetInHouses: true,
        threePlanetAspectingHouses: true,
    });
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    const houses = Array.from({ length: 12 }, (_, i) => i + 1);

    const handlePlanetChange = (planet) => {
        setSelectedPlanets(prev =>
            prev.includes(planet)
                ? prev.filter(p => p !== planet)
                : [...prev, planet]
        );
    };

    const handleHouseChange = (house) => {
        setSelectedHouses(prev => {
            const isSelected = prev.includes(house);
            if (isSelected) {
                return prev.filter(h => h !== house);
            } else {
                if (prev.length < 3) {
                    return [...prev, house];
                }
                // To prevent selecting more than 3, we can show a message or just do nothing.
                // For now, we just don't add it.
                return prev;
            }
        });
    };

    const handleOptionChange = (option) => {
        setSearchOptions(prev => ({ ...prev, [option]: !prev[option] }));
    };

    const handleSearch = async () => {
        if (selectedPlanets.length < 3) {
            setError(t('transitSearch.selectAtLeast3Planets', 'Please select at least three planets.'));
            return;
        }
        if (selectedHouses.length !== 3) {
            setError(t('transitSearch.select3Houses', 'Please select exactly 3 houses.'));
            return;
        }
        if (!startDate || !endDate) {
            setError(t('transitSearch.selectDateRange', 'Please select a date range.'));
            return;
        }

        const atLeastOneOption = Object.values(searchOptions).some(v => v);
        if (!atLeastOneOption) {
            setError(t('transitSearch.selectAtLeastOneOption', 'Please select at least one search condition.'));
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const payload = {
                planets: selectedPlanets,
                houses: selectedHouses,
                startDate,
                endDate,
                options: searchOptions,
                natalChart: natalData, // Pass the full natal chart data
            };
            // Replace mock data with a real API call to get exact data
            const response = await api.post('/analysis/transit-search', payload);
            setResults(response.data.results || []);

        } catch (err) {
            console.error("Transit search failed", err);
            setError(err.response?.data?.error || t('transitSearch.searchFailed', 'Transit search failed.'));
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="transit-search-block">
            <h2>{t('transitSearch.title', 'Transit Search (Gochar)')}</h2>
            <div className="search-form">
                <div className="form-group">
                    <label>{t('transitSearch.selectPlanets', 'Select at least 3 planets:')}</label>
                    <div className="checkbox-group">
                        {planets.map(planet => (
                            <label key={planet} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    value={planet}
                                    checked={selectedPlanets.includes(planet)}
                                    onChange={() => handlePlanetChange(planet)}
                                />
                                {t(`planets.${planet.toLowerCase()}`, planet)}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="start-date">{t('transitSearch.dateRange', 'Date Range:')}</label>
                    <div>
                        <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span className="date-separator"> - </span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} aria-label={t('transitSearch.endDate', 'End Date')} />
                    </div>
                </div>

                <div className="form-group">
                    <label>{t('transitSearch.selectHouses', 'Select exactly 3 houses:')}</label>
                    <div className="checkbox-group">
                        {houses.map(house => (
                            <label key={house} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    value={house}
                                    checked={selectedHouses.includes(house)}
                                    onChange={() => handleHouseChange(house)}
                                    disabled={selectedHouses.length >= 3 && !selectedHouses.includes(house)}
                                />
                                {house}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>{t('transitSearch.searchFor', 'Search for events where at least three selected planets:')}</label>
                    <div className="checkbox-group options-group">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={searchOptions.threePlanetConjunction} onChange={() => handleOptionChange('threePlanetConjunction')} />
                            {t('transitSearch.options.conjunction', 'Conjunct each other')}
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={searchOptions.threePlanetAspect} onChange={() => handleOptionChange('threePlanetAspect')} />
                            {t('transitSearch.options.aspect', 'Aspect each other')}
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={searchOptions.threePlanetNatalReturn} onChange={() => handleOptionChange('threePlanetNatalReturn')} />
                            {t('transitSearch.options.natalReturn', 'Pass over their natal degree')}
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={searchOptions.threePlanetInHouses} onChange={() => handleOptionChange('threePlanetInHouses')} />
                            {t('transitSearch.options.inHouses', 'Occupy the selected houses')}
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={searchOptions.threePlanetAspectingHouses} onChange={() => handleOptionChange('threePlanetAspectingHouses')} />
                            {t('transitSearch.options.aspectingHouses', 'Aspect the selected houses')}
                        </label>
                    </div>
                </div>

                <button onClick={handleSearch} disabled={isLoading || !natalData || selectedPlanets.length < 3 || selectedHouses.length !== 3} className="search-button">
                    {isLoading ? t('transitSearch.searching', 'Searching...') : t('transitSearch.search', 'Search')}
                </button>
                {!natalData && <p className="info-message">{t('transitSearch.noNatalData', 'Please calculate a natal chart first.')}</p>}
            </div>

            {error && <div className="error-message">{error}</div>}

            {results && (
                <div className="results-container">
                    <h3>{t('transitSearch.resultsTitle', 'Search Results')}</h3>
                    {results.length > 0 ? (
                        <ul className="results-list">
                            {results.map((result, index) => (
                                <li key={index}>
                                    <strong>{new Date(result.date).toLocaleString()}:</strong> {result.event}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>{t('transitSearch.noResults', 'No matching transits found in the selected range.')}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransitSearchBlock;