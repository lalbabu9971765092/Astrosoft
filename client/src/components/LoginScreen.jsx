
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/actions/userActions';
import { useTranslation } from 'react-i18next';
import '../styles/AuthScreen.css'; // Assuming you'll create this CSS

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('login.title')}</h2>
        {error && <div className="error-message">{error}</div>}
        {loading && <div>{t('common.loading')}</div>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="email">{t('login.email')}</label>
            <input
              type="email"
              id="email"
              placeholder={t('login.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              placeholder={t('login.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            {t('login.signIn')}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/forgotpassword">{t('login.forgotPassword')}</Link>
          <span>
            {t('login.newCustomer')}{' '}
            <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
              {t('login.register')}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
