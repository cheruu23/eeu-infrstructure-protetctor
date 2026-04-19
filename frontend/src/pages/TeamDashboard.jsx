import { useState, useEffect } from 'react';
import api from '../api/axios';

const TABS = ['Assigned', 'Completed'];

export default function TeamDashboard() {
  const [tab, setTab] = useState('Assigned');
  const [assigned, setAssigned] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [completeForm, setCompleteForm] = useState({ id: null, service_id: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [a, c] = await Promise.all([api.get('/team/assigned'), api.get('/team/completed')]);
      setAssigned(a.data.requests);
      setCompleted(c.data.requests);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const complete = async (id) => {
    if (!completeForm.service_id) return setError("Enter the citizen's Service ID");
    setMsg(''); setError('');
    try {
      await api.put(`/team/${id}/complete`, { verified_service_id: completeForm.service_id });
      setMsg('Service marked as completed!');
      setCompleteForm({ id: null, service_id: '' });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const avgRating = completed.filter(r => r.rating).reduce((sum, r, _, arr) => sum + r.rating / arr.length, 0);

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        {TABS.map(t => (
          <div key={t} className={`sidebar-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'Assigned' ? '🔧' : '✅'} {t}
          </div>
        ))}
      </div>

      <div className="main-content">
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {tab === 'Assigned' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number" style={{color:'#1565c0'}}>{assigned.length}</div><div className="stat-label">Assigned</div></div>
              <div className="stat-card"><div className="stat-number">{completed.length}</div><div className="stat-label">Completed</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#F5A623'}}>{avgRating ? avgRating.toFixed(1) : '—'}</div><div className="stat-label">Avg Rating</div></div>
            </div>
            <h2 className="page-title">Assigned Requests</h2>
            {assigned.length === 0 ? (
              <div className="empty"><div className="empty-icon">🎉</div><p>No assigned requests</p></div>
            ) : assigned.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">👤 {r.citizen_name} · 📞 {r.citizen_phone || 'N/A'}</div>
                    <div className="card-meta">📍 {r.location || 'No location'} · {new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className="badge badge-assigned">assigned</span>
                </div>
                <p style={{fontSize:'0.88rem', color:'#555', marginBottom:12}}>{r.description}</p>

                {completeForm.id === r.id ? (
                  <div>
                    <p style={{fontSize:'0.85rem', marginBottom:6, color:'#555'}}>Enter citizen's EEU Service ID to verify completion:</p>
                    <div style={{display:'flex', gap:8}}>
                      <input style={{flex:1, padding:'8px', borderRadius:6, border:'1px solid #ddd'}}
                        placeholder="EEU-12345" value={completeForm.service_id}
                        onChange={e => setCompleteForm({...completeForm, service_id: e.target.value})} />
                      <button className="btn btn-primary btn-sm" onClick={() => complete(r.id)}>Confirm</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setCompleteForm({id:null, service_id:''})}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => setCompleteForm({ id: r.id, service_id: '' })}>✓ Mark Complete</button>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'Completed' && (
          <>
            <h2 className="page-title">Completed Requests</h2>
            {completed.length === 0 ? (
              <div className="empty"><div className="empty-icon">📭</div><p>No completed requests yet</p></div>
            ) : completed.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">Completed: {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <span className="badge badge-completed">completed</span>
                </div>
                {r.rating ? (
                  <div style={{marginTop:8}}>
                    <span style={{color:'#F5A623', fontSize:'1.1rem'}}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                    <span style={{fontSize:'0.82rem', color:'#555', marginLeft:8}}>{r.feedback || 'No feedback'}</span>
                  </div>
                ) : (
                  <p style={{fontSize:'0.82rem', color:'#aaa', marginTop:8}}>Not rated yet</p>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
