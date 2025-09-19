
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../store/actions/userActions';
import { useTranslation } from 'react-i18next';
import '../styles/AuthScreen.css';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const userForgotPassword = useSelector((state) => state.userForgotPassword);
  const { loading, error, success } = userForgotPassword;

  useEffect(() => {
    if (success) {
      setMessage(t('forgotPassword.emailSent'));
      navigate('/login'); // Navigate to login page on success
    }
  }, [success, t, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('forgotPassword.title')}</h2>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        {loading && <div>{t('common.loading')}</div>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="email">{t('forgotPassword.email')}</label>
            <input
              type="email"
              id="email"
              placeholder={t('forgotPassword.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            {t('forgotPassword.sendResetLink')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
