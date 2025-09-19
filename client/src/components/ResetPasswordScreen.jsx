
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '../store/actions/userActions';
import { useTranslation } from 'react-i18next';
import '../styles/AuthScreen.css';

const ResetPasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { resettoken } = useParams();
  const { t } = useTranslation();

  const userResetPassword = useSelector((state) => state.userResetPassword);
  const { loading, error, success } = userResetPassword;

  useEffect(() => {
    if (success) {
      setMessage(t('resetPassword.success'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [success, navigate, t]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(t('resetPassword.passwordsDoNotMatch'));
    } else {
      dispatch(resetPassword(resettoken, password));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('resetPassword.title')}</h2>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        {loading && <div>{t('common.loading')}</div>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="password">{t('resetPassword.newPassword')}</label>
            <input
              type="password"
              id="password"
              placeholder={t('resetPassword.enterNewPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('resetPassword.confirmNewPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder={t('resetPassword.confirmNewPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            {t('resetPassword.resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
