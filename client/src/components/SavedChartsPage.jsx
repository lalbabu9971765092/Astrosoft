import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import api from './api';
import { formatToLocalISOString } from './AstrologyUtils';
import '../styles/SavedChartsPage.css';

const SavedChartsPage = () => {
    const { t } = useTranslation();
    const [savedCharts, setSavedCharts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const fetchSavedCharts = useCallback(async () => {
        if (!userInfo) {
            setError(t('savedChartsPage.notLoggedIn', 'Please log in to view your saved charts.'));
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const response = await api.get('/charts', config);
            setSavedCharts(response.data?.charts || []);
        } catch (err) {
            console.error("Error fetching saved charts:", err);
            setError(t('savedChartsPage.loadError', { message: err.response?.data?.error || err.message || "Failed." }));
        } finally {
            setIsLoading(false);
        }
    }, [t, userInfo]);

    const handleDeleteChart = useCallback(async (id) => {
        if (!userInfo) {
            setError(t('savedChartsPage.notLoggedIn', 'Please log in to delete charts.'));
            return;
        }

        if (window.confirm(t('savedChartsPage.confirmDelete', 'Are you sure you want to delete this chart?'))) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                await api.delete(`/charts/${id}`, config);
                fetchSavedCharts(); // Refresh the list after deletion
            } catch (err) {
                console.error("Error deleting chart:", err);
                setError(t('savedChartsPage.deleteError', { message: err.response?.data?.error || err.message || "Failed to delete chart." }));
            }
        }
    }, [t, userInfo, fetchSavedCharts]);

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
                            <li key={chart.id}>
                                <div className="chart-info" onClick={() => handleSelectChart(chart)}>
                                    <strong>{chart.name}</strong> ({t(`sharedLayout.gender${chart.gender}`) || chart.gender || t('utils.notAvailable', 'N/A')})
                                    <br />
                                    <small>{formatToLocalISOString(new Date(chart.date))} - {chart.placeName}</small>
                                </div>
                                <button onClick={() => handleDeleteChart(chart.id)} className="delete-button">
                                    {t('savedChartsPage.delete', 'Delete')}
                                </button>
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
