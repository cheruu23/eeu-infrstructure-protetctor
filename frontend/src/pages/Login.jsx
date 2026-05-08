import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';
import { validateEthiopianPhone, normalizePhone } from '../utils/validation';

export default function Login() {
  const { t } = useLang();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', service_id: '' });
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'phone') {
      const result = validateEthiopianPhone(e.target.value);
      setPhoneError(result.valid ? '' : result.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      login(res.data.user, res.data.token);
      navigate(`/${res.data.user.role}`);
    } catch (err) { setError(err.response?.data?.message || t.loginFailed); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);

    // Validate phone before submitting
    if (form.phone) {
      const phoneCheck = validateEthiopianPhone(form.phone);
      if (!phoneCheck.valid) {
        setPhoneError(phoneCheck.message);
        setLoading(false);
        return;
      }
    }

    try {
      await api.post('/auth/register', {
        ...form,
        phone: form.phone ? normalizePhone(form.phone) : undefined,
      });
      setSuccess(t.accountCreated);
      setTab('login');
    } catch (err) { setError(err.response?.data?.message || t.registerFailed); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img
            src="/eeu-logo.png"
            alt="Ethiopian Electric Utility"
            style={{ width: 140, height: 'auto', margin: '0 auto', display: 'block' }}
          />
          <h2 style={{ marginTop: 8 }}>{t.appName}</h2>
          <p>የኢትዮጵያ ኤሌክትሪክ አገልግሎት · Tajaajila Elektirikii Itoophiyaa</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          <LangSwitcher dark />
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>{t.login}</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>{t.register}</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>{t.email}</label>
              <input name="email" type="email" value={form.email} onChange={handle} required placeholder="your@email.com" autoComplete="email" />
            </div>
            <div className="form-group">
              <label>{t.password}</label>
              <input name="password" type="password" value={form.password} onChange={handle} required placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? t.loggingIn : t.login}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>{t.fullName} *</label>
              <input name="name" value={form.name} onChange={handle} required placeholder="John Doe" autoComplete="name" />
            </div>
            <div className="form-group">
              <label>{t.email} *</label>
              <input name="email" type="email" value={form.email} onChange={handle} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label>{t.password} *</label>
              <input name="password" type="password" value={form.password} onChange={handle} required placeholder="Min 6 characters" autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label>{t.phone}</label>
              {/* Ethiopian phone input with prefix hint */}
              <input
                name="phone"
                value={form.phone}
                onChange={handle}
                placeholder="09xxxxxxxx or +251xxxxxxxxx"
                inputMode="tel"
                autoComplete="tel"
                className={phoneError ? 'input-error' : ''}
              />
              {phoneError && <div className="error-msg">⚠ {phoneError}</div>}
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 3 }}>
                Valid: 09xxxxxxxx · 07xxxxxxxx · +2519xxxxxxxx · +2517xxxxxxxx
              </div>
            </div>
            <div className="form-group">
              <label>{t.serviceId}</label>
              <input name="service_id" value={form.service_id} onChange={handle} placeholder="EEU-12345" />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading || !!phoneError}>
              {loading ? t.creatingAccount : t.createAccount}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
