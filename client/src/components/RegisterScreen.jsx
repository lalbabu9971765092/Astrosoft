
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/actions/userActions';
import { useTranslation } from 'react-i18next';
import '../styles/AuthScreen.css';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const userRegister = useSelector((state) => state.userRegister);
  const { loading, error, userInfo } = userRegister;

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(t('register.passwordsDoNotMatch'));
    } else {
      dispatch(register(name, email, password));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('register.title')}</h2>
        {message && <div className="error-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        {loading && <div>{t('common.loading')}</div>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="name">{t('register.name')}</label>
            <input
              type="text"
              id="name"
              placeholder={t('register.enterName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">{t('register.email')}</label>
            <input
              type="email"
              id="email"
              placeholder={t('register.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('register.password')}</label>
            <input
              type="password"
              id="password"
              placeholder={t('register.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder={t('register.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            {t('register.register')}
          </button>
        </form>
        <div className="auth-links">
          <span>
            {t('register.haveAccount')}{' '}
            <Link to={redirect ? `/login?redirect=${redirect}` : '/login'}>
              {t('register.login')}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
