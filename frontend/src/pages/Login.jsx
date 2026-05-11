import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';
import { validateName, validatePassword, validateEthiopianPhone, normalizePhone, passwordStrengthInfo } from '../utils/validation';
import { useToast } from '../components/Toast';

// Password strength bar component
function PasswordStrength({ password }) {
  if (!password) return null;
  const { strength, checks } = validatePassword(password);
  const info = passwordStrengthInfo(strength);
  return (
    <div style={{ marginTop: 8 }}>
      {/* Bar */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= strength ? info.color : '#e0e0e0',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '0.75rem', color: info.color, fontWeight: 600 }}>{info.label}</div>
      {/* Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: 6 }}>
        {[
          { key: 'length',    label: '8+ characters' },
          { key: 'uppercase', label: 'Uppercase letter' },
          { key: 'number',    label: 'Number' },
          { key: 'special',   label: 'Special character' },
        ].map(c => (
          <div key={c.key} style={{ fontSize: '0.72rem', color: checks?.[c.key] ? '#2e7d32' : '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{checks?.[c.key] ? '✓' : '○'}</span> {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const { t } = useLang();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', service_id: '' });
  const [resetForm, setResetForm] = useState({ email: '', token: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Live validation
    const newErrors = { ...errors };
    if (name === 'name') {
      const r = validateName(value);
      newErrors.name = r.valid ? '' : r.message;
    }
    if (name === 'password' && tab === 'register') {
      const r = validatePassword(value);
      newErrors.password = r.valid ? '' : r.message;
    }
    if (name === 'phone') {
      const r = validateEthiopianPhone(value);
      newErrors.phone = r.valid ? '' : r.message;
    }
    setErrors(newErrors);
  };

  const handleReset = (e) => {
    setResetForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      login(res.data.user, res.data.token);
      navigate(`/${res.data.user.role}`);
    } catch (err) { toast.show(err.response?.data?.message || t.loginFailed, 'error'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true);
    const nameCheck = validateName(form.name);
    const passCheck = validatePassword(form.password);
    const phoneCheck = validateEthiopianPhone(form.phone);
    if (!nameCheck.valid || !passCheck.valid || !phoneCheck.valid) {
      setErrors({ name: nameCheck.message, password: passCheck.message, phone: phoneCheck.message });
      setLoading(false);
      return;
    }
    try {
      await api.post('/auth/register', { ...form, phone: form.phone ? normalizePhone(form.phone) : undefined });
      toast.show(t.accountCreated, 'success');
      setTab('login');
    } catch (err) { toast.show(err.response?.data?.message || t.registerFailed, 'error'); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: resetForm.email });
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token);
        setResetForm(f => ({ ...f, token: res.data.reset_token }));
        toast.show('Reset token generated. Copy it and set your new password.', 'info');
        setTab('reset');
      } else {
        toast.show(res.data.message, 'info');
      }
    } catch (err) { toast.show(err.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setLoading(true);
    const passCheck = validatePassword(resetForm.newPassword);
    if (!passCheck.valid) { toast.show(passCheck.message, 'error'); setLoading(false); return; }
    try {
      await api.post('/auth/reset-password', resetForm);
      toast.show('Password reset successfully! You can now login.', 'success');
      setTab('login');
      setResetForm({ email: '', token: '', newPassword: '' });
      setResetToken('');
    } catch (err) { toast.show(err.response?.data?.message || 'Reset failed', 'error'); }
    finally { setLoading(false); }
  };

  const hasFormError = Object.values(errors).some(Boolean);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <img src="/eeu-logo.png" alt="Ethiopian Electric Utility" style={{ width: 130, height: 'auto', margin: '0 auto', display: 'block' }} />
          <h2 style={{ marginTop: 8 }}>{t.appName}</h2>
          <p>የኢትዮጵያ ኤሌክትሪክ አገልግሎት · Tajaajila Elektirikii Itoophiyaa</p>
        </div>

        {/* Language switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          <LangSwitcher dark />
        </div>

        {/* Tabs — only show login/register tabs, not forgot/reset */}
        {(tab === 'login' || tab === 'register') && (
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>{t.login}</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>{t.register}</button>
          </div>
        )}

        {/* ── Login ── */}        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>{t.email}</label>
              <input name="email" type="email" value={form.email} onChange={handle} required placeholder="your@email.com" autoComplete="email" />
            </div>
            <div className="form-group">
              <label>{t.password}</label>
              <input name="password" type="password" value={form.password} onChange={handle} required placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading} style={{ marginBottom: 10 }}>
              {loading ? t.loggingIn : t.login}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => setTab('forgot')}
                style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {/* ── Register ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>{t.fullName} *</label>
              <input name="name" value={form.name} onChange={handle} required placeholder="John Doe" autoComplete="name"
                className={errors.name ? 'input-error' : ''} />
              {errors.name && <div className="error-msg">⚠ {errors.name}</div>}
            </div>
            <div className="form-group">
              <label>{t.email} *</label>
              <input name="email" type="email" value={form.email} onChange={handle} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label>{t.password} *</label>
              <input name="password" type="password" value={form.password} onChange={handle} required placeholder="Min 8 chars" autoComplete="new-password"
                className={errors.password ? 'input-error' : ''} />
              <PasswordStrength password={form.password} />
            </div>
            <div className="form-group">
              <label>{t.phone}</label>
              <input name="phone" value={form.phone} onChange={handle} placeholder="09xxxxxxxx or +251xxxxxxxxx" inputMode="tel"
                className={errors.phone ? 'input-error' : ''} />
              {errors.phone && <div className="error-msg">⚠ {errors.phone}</div>}
              <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: 3 }}>Valid: 09xxxxxxxx · +2519xxxxxxxx</div>
            </div>
            <div className="form-group">
              <label>{t.serviceId}</label>
              <input name="service_id" value={form.service_id} onChange={handle} placeholder="EEU-12345" />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading || hasFormError}>
              {loading ? t.creatingAccount : t.createAccount}
            </button>
          </form>
        )}

        {/* ── Forgot Password ── */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>🔑</div>
              <div style={{ fontWeight: 700, color: '#2e7d32', marginBottom: 4 }}>Reset Password</div>
              <div style={{ fontSize: '0.82rem', color: '#888' }}>Enter your email to get a reset token</div>
            </div>
            <div className="form-group">
              <label>{t.email}</label>
              <input name="email" type="email" value={resetForm.email} onChange={handleReset} required placeholder="your@email.com" />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading} style={{ marginBottom: 10 }}>
              {loading ? 'Sending...' : 'Get Reset Token'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => setTab('login')}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.85rem', cursor: 'pointer' }}>
                ← Back to login
              </button>
            </div>
          </form>
        )}

        {/* ── Reset Password ── */}
        {tab === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>🔒</div>
              <div style={{ fontWeight: 700, color: '#2e7d32', marginBottom: 4 }}>Set New Password</div>
            </div>
            <div className="form-group">
              <label>{t.email}</label>
              <input name="email" type="email" value={resetForm.email} onChange={handleReset} required placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label>Reset Token</label>
              <input name="token" value={resetForm.token} onChange={handleReset} required placeholder="Paste your reset token" />
              {resetToken && (
                <div style={{ marginTop: 6, padding: '8px 10px', background: '#e8f5e9', borderRadius: 6, fontSize: '0.75rem', wordBreak: 'break-all', color: '#2e7d32', fontFamily: 'monospace' }}>
                  {resetToken}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>New Password *</label>
              <input name="newPassword" type="password" value={resetForm.newPassword} onChange={handleReset} required placeholder="Min 8 chars" />
              <PasswordStrength password={resetForm.newPassword} />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading} style={{ marginBottom: 10 }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => setTab('login')}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.85rem', cursor: 'pointer' }}>
                ← Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
