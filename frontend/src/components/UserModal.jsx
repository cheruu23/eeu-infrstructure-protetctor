import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';

const ROLES = ['citizen', 'approver', 'electrician', 'admin'];
const EMPTY = { name: '', email: '', password: '', phone: '', role: 'citizen', service_id: '', team_name: '' };

export default function UserModal({ mode, user, onSave, onClose, loading, error }) {
  const { t } = useLang();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setForm({ name: user.name||'', email: user.email||'', password: '', phone: user.phone||'', role: user.role||'citizen', service_id: user.service_id||'', team_name: user.team_name||'' });
    } else { setForm(EMPTY); }
  }, [mode, user]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (mode === 'edit' && !payload.password) delete payload.password;
    onSave(payload);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'white', borderRadius:14, padding:32, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ color:'#2e7d32', fontSize:'1.1rem' }}>
            {mode === 'create' ? `➕ ${t.createNewUser}` : `✏️ ${t.editUser}`}
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'#888' }}>×</button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.fullName} *</label>
            <input name="name" value={form.name} onChange={handle} required placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>{t.email} *</label>
            <input name="email" type="email" value={form.email} onChange={handle} required placeholder="user@example.com" />
          </div>
          <div className="form-group">
            <label>{mode === 'edit' ? t.newPassword : `${t.password} *`}</label>
            <input name="password" type="password" value={form.password} onChange={handle}
              required={mode === 'create'} placeholder={mode === 'edit' ? '••••••••' : 'Min 6 characters'} />
          </div>
          <div className="form-group">
            <label>{t.phone}</label>
            <input name="phone" value={form.phone} onChange={handle} placeholder="09xxxxxxxx" />
          </div>
          <div className="form-group">
            <label>{t.role} *</label>
            <select name="role" value={form.role} onChange={handle}>
              {ROLES.map(r => <option key={r} value={r}>{t[r] || r}</option>)}
            </select>
          </div>
          {form.role === 'citizen' && (
            <div className="form-group">
              <label>{t.serviceId}</label>
              <input name="service_id" value={form.service_id} onChange={handle} placeholder="EEU-12345" />
            </div>
          )}
          {form.role === 'electrician' && (
            <div className="form-group">
              <p style={{ fontSize:'0.82rem', color:'#888', padding:'8px 0' }}>{t.electricianNote}</p>
            </div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex:1 }}>
              {loading ? t.saving : mode === 'create' ? t.createUser : t.save}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose} style={{ flex:1 }}>{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
