import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLang } from '../context/LangContext';
import { useToast } from '../components/Toast';

const TABS_KEYS = ['dashboard', 'assignedWork', 'completed'];
const TABS_ICONS = { dashboard: '🏠', assignedWork: '🔧', completed: '✅' };

export default function ElectricianDashboard() {
  const { t } = useLang();
  const toast = useToast();
  const [tab, setTab] = useState('dashboard');
  const [assigned, setAssigned] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [completeForm, setCompleteForm] = useState({ id: null, service_id: '' });

  const fetchData = async () => {
    try {
      const [a, c, g] = await Promise.all([
        api.get('/electrician/assigned'),
        api.get('/electrician/completed'),
        api.get('/electrician/my-group'),
      ]);
      setAssigned(a.data.requests);
      setCompleted(c.data.requests);
      setMyGroup(g.data.group);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const complete = async (id) => {
    if (!completeForm.service_id) return toast.show(t.enterServiceId, 'error');
    try {
      await api.put(`/electrician/${id}/complete`, { verified_service_id: completeForm.service_id });
      toast.show(t.serviceCompleted, 'success');
      setCompleteForm({ id: null, service_id: '' });
      fetchData();
    } catch (err) { toast.show(err.response?.data?.message || 'Failed', 'error'); }
  };

  const avgRating = completed.filter(r => r.rating).length > 0
    ? (completed.filter(r => r.rating).reduce((s, r) => s + r.rating, 0) / completed.filter(r => r.rating).length).toFixed(1)
    : null;

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        {TABS_KEYS.map(k => (
          <div key={k} className={`sidebar-item ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {TABS_ICONS[k]} {t[k] || k}
          </div>
        ))}
      </div>

      <div className="main-content">
        {myGroup && (
          <div style={{background:'#e8f5e9', borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:'0.88rem', color:'#2e7d32', fontWeight:600}}>
            ⚡ {t.myGroup}: {myGroup.name}
          </div>
        )}
        {!myGroup && (
          <div className="alert alert-error" style={{marginBottom:16}}>{t.noGroupWarning}</div>
        )}

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <>
            <h2 className="page-title">{t.electricianDashboard}</h2>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number" style={{color:'#1565c0'}}>{assigned.length}</div><div className="stat-label">{t.assigned}</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#2e7d32'}}>{completed.length}</div><div className="stat-label">{t.completed}</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#F5A623'}}>{avgRating || '—'}</div><div className="stat-label">Avg Rating</div></div>
            </div>

            <h3 style={{fontSize:'1rem', fontWeight:700, color:'#2e7d32', marginBottom:12}}>{t.quickActions}</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:24}}>
              {[
                { icon:'🔧', labelKey:'assignedWork', desc:`${assigned.length} ${t.pending}`, action:() => setTab('assignedWork'), color:'#1565c0' },
                { icon:'✅', labelKey:'completed', desc:`${completed.length} ${t.completed}`, action:() => setTab('completed'), color:'#2e7d32' },
              ].map(q => (
                <div key={q.labelKey} className="card" style={{cursor:'pointer', borderLeft:`4px solid ${q.color}`, padding:16}} onClick={q.action}>
                  <div style={{fontSize:'1.8rem', marginBottom:6}}>{q.icon}</div>
                  <div style={{fontWeight:700, fontSize:'0.9rem', color:q.color}}>{t[q.labelKey]}</div>
                  <div style={{fontSize:'0.8rem', color:'#888', marginTop:3}}>{q.desc}</div>
                </div>
              ))}
            </div>

            {assigned.length > 0 && (
              <>
                <h3 style={{fontSize:'1rem', fontWeight:700, color:'#2e7d32', marginBottom:12}}>{t.latestAssigned}</h3>
                {assigned.slice(0,2).map(r => (
                  <div className="card" key={r.id} style={{padding:'14px 18px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:600, fontSize:'0.9rem'}}>{r.title}</div>
                        <div style={{fontSize:'0.78rem', color:'#888', marginTop:2}}>👤 {r.citizen_name} · {new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setTab('assignedWork')}>View</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── Assigned ── */}
        {tab === 'assignedWork' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number" style={{color:'#1565c0'}}>{assigned.length}</div><div className="stat-label">{t.assigned}</div></div>
              <div className="stat-card"><div className="stat-number">{completed.length}</div><div className="stat-label">{t.completed}</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#F5A623'}}>{avgRating || '—'}</div><div className="stat-label">Avg Rating</div></div>
            </div>
            <h2 className="page-title">{t.assignedWork}</h2>
            {assigned.length === 0 ? (
              <div className="empty"><div className="empty-icon">🎉</div><p>{t.noAssigned}</p></div>
            ) : assigned.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">👤 {r.citizen_name} · 📞 {r.citizen_phone || 'N/A'}</div>
                    <div className="card-meta">📍 {r.location || t.noLocation} · {new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className="badge badge-assigned">{t.assigned}</span>
                </div>
                <p style={{fontSize:'0.88rem', color:'#555', marginBottom:12}}>{r.description}</p>

                {completeForm.id === r.id ? (
                  <div>
                    <p style={{fontSize:'0.85rem', marginBottom:6, color:'#555'}}>{t.enterServiceId}</p>
                    <div style={{display:'flex', gap:8}}>
                      <input style={{flex:1, padding:'8px', borderRadius:6, border:'1px solid #ddd'}}
                        placeholder="EEU-12345" value={completeForm.service_id}
                        onChange={e => setCompleteForm({...completeForm, service_id: e.target.value})} />
                      <button className="btn btn-primary btn-sm" onClick={() => complete(r.id)}>{t.confirm}</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setCompleteForm({id:null, service_id:''})}>{t.cancel}</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => setCompleteForm({ id: r.id, service_id: '' })}>✓ {t.markComplete}</button>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Completed ── */}
        {tab === 'completed' && (
          <>
            <h2 className="page-title">{t.completed}</h2>
            {completed.length === 0 ? (
              <div className="empty"><div className="empty-icon">📭</div><p>{t.noCompleted}</p></div>
            ) : completed.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">{t.completed}: {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <span className="badge badge-completed">{t.completed}</span>
                </div>
                {r.rating ? (
                  <div style={{marginTop:8}}>
                    <span style={{color:'#F5A623', fontSize:'1.1rem'}}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                    <span style={{fontSize:'0.82rem', color:'#555', marginLeft:8}}>{r.feedback || '—'}</span>
                  </div>
                ) : <p style={{fontSize:'0.82rem', color:'#aaa', marginTop:8}}>—</p>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
