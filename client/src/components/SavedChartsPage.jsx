import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from './api';
import { formatToLocalISOString } from './AstrologyUtils';
import '../styles/SavedChartsPage.css';

const SavedChartsPage = () => {
    const { t } = useTranslation();
    const [savedCharts, setSavedCharts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSavedCharts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/charts');
            setSavedCharts(response.data?.charts || []);
        } catch (err) {
            console.error("Error fetching saved charts:", err);
            setError(t('savedChartsPage.loadError', { message: err.response?.data?.error || err.message || "Failed." }));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSavedCharts();
        document.title = t('savedChartsPage.pageTitle', 'Saved Charts');
    }, [fetchSavedCharts, t]);

    const handleSelectChart = (chart) => {
        if (window.opener && !window.opener.closed) {
            const event = new CustomEvent('loadChart', { detail: { chartToLoad: chart } });
            window.opener.dispatchEvent(event);
            window.opener.focus();
            window.close();
        } else {
            alert(t('savedChartsPage.openerError', 'Could not communicate with the main window. Please reopen this list from the main form.'));
        }
    };

    const filteredCharts = useMemo(() => {
        if (!searchTerm) {
            return savedCharts;
        }
        return savedCharts.filter(chart =>
            chart.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chart.placeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [savedCharts, searchTerm]);

    return (
        <div className="saved-charts-container">
            <h2>{t('savedChartsPage.pageTitle', 'Saved Charts')}</h2>
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder={t('savedChartsPage.searchPlaceholder', 'Search by name or place...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>
            {isLoading && <div className="loader">{t('savedChartsPage.loading', 'Loading...')}</div>}
            {error && <p className="error-text">{error}</p>}
            {!isLoading && !error && (
                filteredCharts.length > 0 ? (
                    <ul className="saved-charts-list">
                        {filteredCharts.map(chart => (
                            <li key={chart.id} onClick={() => handleSelectChart(chart)}>
                                <div className="chart-info">
                                    <strong>{chart.name}</strong> ({t(`sharedLayout.gender${chart.gender}`) || chart.gender || t('utils.notAvailable', 'N/A')})
                                    <br />
                                    <small>{formatToLocalISOString(new Date(chart.date))} - {chart.placeName}</small>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>{t('savedChartsPage.noCharts', 'No saved charts found.')}</p>
                )
            )}
        </div>
    );
};

export default SavedChartsPage;
