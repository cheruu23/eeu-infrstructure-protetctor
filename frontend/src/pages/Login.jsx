import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';

export default function Login() {
  const { t } = useLang();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'citizen', service_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
    try {
      await api.post('/auth/register', form);
      setSuccess(t.accountCreated);
      setTab('login');
    } catch (err) { setError(err.response?.data?.message || t.registerFailed); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto', background:'linear-gradient(135deg,#F5A623 45%,#4CAF50 45%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:5, height:44, background:'white', borderRadius:3 }} />
          </div>
          <h2>{t.appName}</h2>
          <p>የኢትዮጵያ ኤሌክትሪክ አገልግሎት · Tajaajila Elektirikii Itoophiyaa</p>
        </div>

        {/* Language switcher on login page */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:16 }}>
          <LangSwitcher dark />
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab==='login'?'active':''}`} onClick={() => setTab('login')}>{t.login}</button>
          <button className={`auth-tab ${tab==='register'?'active':''}`} onClick={() => setTab('register')}>{t.register}</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>{t.email}</label>
              <input name="email" type="email" value={form.email} onChange={handle} required placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label>{t.password}</label>
              <input name="password" type="password" value={form.password} onChange={handle} required placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? t.loggingIn : t.login}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>{t.fullName}</label>
              <input name="name" value={form.name} onChange={handle} required placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>{t.email}</label>
              <input name="email" type="email" value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label>{t.password}</label>
              <input name="password" type="password" value={form.password} onChange={handle} required />
            </div>
            <div className="form-group">
              <label>{t.phone}</label>
              <input name="phone" value={form.phone} onChange={handle} placeholder="09xxxxxxxx" />
            </div>
            <div className="form-group">
              <label>{t.serviceId}</label>
              <input name="service_id" value={form.service_id} onChange={handle} placeholder="EEU-12345" />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? t.creatingAccount : t.createAccount}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
