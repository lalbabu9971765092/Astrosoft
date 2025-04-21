// src/TimeAdjustmentTool.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import '../styles/TimeAdjustmentTool.css'; // Styles are defined here

const TimeAdjustmentTool = ({
    initialDateTimeString,
    onDateTimeChange,
    label,
    showReset = true,
}) => {
    const { t } = useTranslation();
    const [currentDateTime, setCurrentDateTime] = useState(null);

    const displayLabel = label || t('timeAdjustmentTool.adjustTimeLabel', 'Adjust Time');

    useEffect(() => {
        if (initialDateTimeString) {
            const initialDate = new Date(initialDateTimeString);
            if (!isNaN(initialDate)) {
                setCurrentDateTime(initialDate);
            } else {
                console.error("TimeAdjustmentTool: Invalid initialDateTimeString provided:", initialDateTimeString);
                setCurrentDateTime(null);
            }
        } else {
            setCurrentDateTime(null);
        }
    }, [initialDateTimeString]);

    const adjustTime = useCallback((amount, unit) => {
        if (!currentDateTime) return;
        const newDateTime = new Date(currentDateTime.getTime());
        switch (unit) {
            case 'minute': newDateTime.setMinutes(newDateTime.getMinutes() + amount); break;
            case 'hour': newDateTime.setHours(newDateTime.getHours() + amount); break;
            case 'day': newDateTime.setDate(newDateTime.getDate() + amount); break;
            case 'month': newDateTime.setMonth(newDateTime.getMonth() + amount); break;
            case 'year': newDateTime.setFullYear(newDateTime.getFullYear() + amount); break;
            default: break;
        }
        setCurrentDateTime(newDateTime);
        if (onDateTimeChange) {
            onDateTimeChange(newDateTime.toISOString().slice(0, 19));
        }
    }, [currentDateTime, onDateTimeChange]);

    const handleReset = () => {
        if (initialDateTimeString) {
             const initialDate = new Date(initialDateTimeString);
             if (!isNaN(initialDate)) {
                 setCurrentDateTime(initialDate);
                 if (onDateTimeChange) {
                     onDateTimeChange(initialDate.toISOString().slice(0, 19));
                 }
             }
        }
    };

    const displayDateTime = currentDateTime
        ? currentDateTime.toLocaleString()
        : t('timeAdjustmentTool.notAvailable', 'N/A');

    if (!initialDateTimeString) {
        return <div className="time-adjustment-tool-placeholder">{t('timeAdjustmentTool.waitingForInitialTime')}</div>;
    }
     if (!currentDateTime) {
        return <div className="time-adjustment-tool-placeholder error">{t('timeAdjustmentTool.invalidInitialTime')}</div>;
    }

    // *** JSX Structure with Modified Button Labels and Layout ***
    return (
        <div className="time-adjustment-tool">
            <h4 className="tool-label">{displayLabel}</h4>
            <p className="current-time-display">
                {t('timeAdjustmentTool.currentAdjustedTimeLabel')} <strong>{displayDateTime}</strong>
            </p>
            <div className="adjustment-controls">
                {/* Years Group */}
                <div className="control-group">
                    {/* Label placed before buttons */}
                    <span className="unit-label">{t('timeAdjustmentTool.yearsLabel')}</span>
                    {/* Button text is now the number, title remains descriptive */}
                    <button onClick={() => adjustTime(-1, 'year')} title={t('timeAdjustmentTool.minus1YearTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'year')} title={t('timeAdjustmentTool.plus1YearTitle')}>+1</button>
                </div>
                {/* Months Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.monthsLabel')}</span>
                    <button onClick={() => adjustTime(-1, 'month')} title={t('timeAdjustmentTool.minus1MonthTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'month')} title={t('timeAdjustmentTool.plus1MonthTitle')}>+1</button>
                </div>
                {/* Days Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.daysLabel')}</span>
                    <button onClick={() => adjustTime(-1, 'day')} title={t('timeAdjustmentTool.minus1DayTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'day')} title={t('timeAdjustmentTool.plus1DayTitle')}>+1</button>
                </div>
                {/* Hours Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.hoursLabel')}</span>
                    <button onClick={() => adjustTime(-1, 'hour')} title={t('timeAdjustmentTool.minus1HourTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'hour')} title={t('timeAdjustmentTool.plus1HourTitle')}>+1</button>
                </div>
                {/* Minutes Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.minutesLabel')}</span>
                    <button onClick={() => adjustTime(-10, 'minute')} title={t('timeAdjustmentTool.minus10MinTitle')}>-10</button>
                    <button onClick={() => adjustTime(-1, 'minute')} title={t('timeAdjustmentTool.minus1MinTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'minute')} title={t('timeAdjustmentTool.plus1MinTitle')}>+1</button>
                    <button onClick={() => adjustTime(10, 'minute')} title={t('timeAdjustmentTool.plus10MinTitle')}>+10</button>
                </div>

                {/* Reset Button */}
                {showReset && (
                    <div className="control-group reset-group"> {/* Optional: wrap reset in its own group for styling */}
                        <button onClick={handleReset} className="reset-button" title={t('timeAdjustmentTool.resetButtonTitle')}>
                            {t('timeAdjustmentTool.resetButtonText')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// PropTypes remain the same
TimeAdjustmentTool.propTypes = {
    initialDateTimeString: PropTypes.string,
    onDateTimeChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    showReset: PropTypes.bool,
};

export default TimeAdjustmentTool;
