import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import LocationMap from '../components/LocationMap';
import { useLang } from '../context/LangContext';

const TABS = ['Dashboard', 'Pending', 'All Requests'];
const CATEGORIES = ['all', 'power_outage', 'billing', 'meter', 'connection', 'maintenance', 'other'];
const STATUS_LIST = ['all','pending','approved','assigned','completed','rejected'];

export default function ApproverDashboard() {
  const toast = useToast();
  const { t } = useLang();
  const CAT_LABELS = { power_outage: t.catPowerOutage, billing: t.catBilling, meter: t.catMeter, connection: t.catConnection, maintenance: t.catMaintenance, other: t.catOther };
  const [tab, setTab] = useState('Dashboard');
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({ byCategory: [], byStatus: [] });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [rejectForm, setRejectForm] = useState({ id: null, reason: '' });
  const [assignForm, setAssignForm] = useState({ id: null, group_id: '' });
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [p, a, g, s] = await Promise.all([
        api.get('/approver/pending'),
        api.get('/approver/all'),
        api.get('/approver/groups'),
        api.get('/approver/stats'),
      ]);
      setPending(p.data.requests);
      setAll(a.data.requests);
      setGroups(g.data.groups);
      setStats(s.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const approve = async (id) => {
    setMsg(''); setError('');
    try { await api.put(`/approver/${id}/approve`); toast.show('Request approved! ✓', 'success'); fetchData(); }
    catch (err) { toast.show(err.response?.data?.message || 'Failed', 'error'); }
  };

  const reject = async (id) => {
    if (!rejectForm.reason) return toast.show('Enter a rejection reason', 'error');
    setMsg(''); setError('');
    try {
      await api.put(`/approver/${id}/reject`, { reason: rejectForm.reason });
      toast.show('Request rejected.', 'info'); setRejectForm({ id: null, reason: '' }); fetchData();
    } catch (err) { toast.show(err.response?.data?.message || 'Failed', 'error'); }
  };

  const assignGroup = async (id) => {
    if (!assignForm.group_id) return toast.show('Select a group', 'error');
    setMsg(''); setError('');
    try {
      await api.put(`/approver/${id}/assign-group`, { group_id: assignForm.group_id });
      toast.show('Group assigned! ⚡', 'success'); setAssignForm({ id: null, group_id: '' }); fetchData();
    } catch (err) { toast.show(err.response?.data?.message || 'Failed', 'error'); }
  };

  // Filter all requests client-side
  const filteredAll = all.filter(r => {
    const matchCat = catFilter === 'all' || r.category === catFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchCat && matchStatus;
  });

  const renderRequest = (r) => (
    <div className="card" key={r.id}>
      <div className="card-header">
        <div>
          <div className="card-title">{r.title}</div>
          <div className="card-meta">
            👤 {r.citizen_name} · 📞 {r.citizen_phone || 'N/A'} · 🪪 {r.service_id}
          </div>
          <div className="card-meta">📍 {r.location || 'No location'} · {new Date(r.created_at).toLocaleDateString()}</div>
          {r.category && (
            <span style={{display:'inline-block', marginTop:4, padding:'2px 10px', borderRadius:20, background:'#e3f2fd', color:'#1565c0', fontSize:'0.75rem', fontWeight:600}}>
              {CAT_LABELS[r.category] || r.category}
            </span>
          )}
        </div>
        <span className={`badge badge-${r.status}`}>{r.status}</span>
      </div>
      <p style={{fontSize:'0.88rem', color:'#555', marginBottom:12}}>{r.description}</p>

      {/* Mini map if location coords available */}
      {r.latitude && r.longitude && (
        <div style={{marginBottom:12}}>
          <LocationMap
            height="160px"
            single
            markers={[{ lat: parseFloat(r.latitude), lng: parseFloat(r.longitude), title: r.title, description: r.location, status: r.status, type: 'request' }]}
          />
        </div>
      )}

      {r.status === 'pending' && (
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-sm" onClick={() => approve(r.id)}>✓ Approve</button>
          <button className="btn btn-danger btn-sm" onClick={() => setRejectForm({ id: r.id, reason: '' })}>✗ Reject</button>
        </div>
      )}

      {rejectForm.id === r.id && (
        <div style={{marginTop:10}}>
          <input style={{width:'100%', padding:'8px', borderRadius:6, border:'1px solid #ddd', marginBottom:6}}
            placeholder="Rejection reason..." value={rejectForm.reason}
            onChange={e => setRejectForm({...rejectForm, reason: e.target.value})} />
          <button className="btn btn-danger btn-sm" onClick={() => reject(r.id)}>Confirm</button>
          <button className="btn btn-outline btn-sm" style={{marginLeft:6}} onClick={() => setRejectForm({id:null, reason:''})}>Cancel</button>
        </div>
      )}

      {r.status === 'approved' && (
        <div style={{marginTop:10}}>
          {assignForm.id === r.id ? (
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <select style={{padding:'6px 10px', borderRadius:6, border:'1px solid #ddd'}}
                value={assignForm.group_id} onChange={e => setAssignForm({...assignForm, group_id: e.target.value})}>
                <option value="">Select electrician group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>⚡ {g.name}</option>)}
              </select>
              <button className="btn btn-orange btn-sm" onClick={() => assignGroup(r.id)}>Assign</button>
              <button className="btn btn-outline btn-sm" onClick={() => setAssignForm({id:null, group_id:''})}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-orange btn-sm" onClick={() => setAssignForm({ id: r.id, group_id: '' })}>⚡ Assign Group</button>
          )}
        </div>
      )}

      {r.group_name && <p style={{fontSize:'0.82rem', color:'#1565c0', marginTop:8}}>⚡ Assigned to: {r.group_name}</p>}
    </div>
  );

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        {TABS.map(tabKey => (
          <div key={tabKey} className={`sidebar-item ${tab === tabKey ? 'active' : ''}`} onClick={() => setTab(tabKey)}>
            {tabKey === 'Dashboard' ? '🏠' : tabKey === 'Pending' ? '⏳' : '📋'}
            {' '}{tabKey === 'Dashboard' ? t.dashboard : tabKey === 'Pending' ? t.pendingTab : t.allRequests}
            {tabKey === 'Pending' && pending.length > 0 && (
              <span style={{marginLeft:'auto', background:'#e65100', color:'white', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem'}}>{pending.length}</span>
            )}
          </div>
        ))}
      </div>

      <div className="main-content">
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Dashboard Home ── */}
        {tab === 'Dashboard' && (
          <>
            <h2 className="page-title">{t.approverDashboard}</h2>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number" style={{color:'#e65100'}}>{pending.length}</div><div className="stat-label">{t.pendingReview}</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#1565c0'}}>{all.filter(r=>r.status==='approved').length}</div><div className="stat-label">{t.approved}</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#6a1b9a'}}>{all.filter(r=>r.status==='assigned').length}</div><div className="stat-label">{t.assigned}</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#2e7d32'}}>{all.filter(r=>r.status==='completed').length}</div><div className="stat-label">{t.completed}</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#c62828'}}>{all.filter(r=>r.status==='rejected').length}</div><div className="stat-label">{t.rejected}</div></div>
            </div>

            {/* Category breakdown */}
            {stats.byCategory.length > 0 && (
              <>
                <h3 style={{fontSize:'1rem', fontWeight:700, color:'#2e7d32', marginBottom:12}}>Requests by Category</h3>
                <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:24}}>
                  {stats.byCategory.map(c => (
                    <div key={c.category} style={{background:'white', borderRadius:8, padding:'10px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', textAlign:'center', minWidth:100}}>
                      <div style={{fontWeight:700, fontSize:'1.4rem', color:'#2e7d32'}}>{c.count}</div>
                      <div style={{fontSize:'0.78rem', color:'#888', marginTop:2}}>{CAT_LABELS[c.category] || c.category}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick actions */}
            <h3 style={{fontSize:'1rem', fontWeight:700, color:'#2e7d32', marginBottom:12}}>{t.quickActions}</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12}}>
              {[
                { icon:'⏳', label: t.reviewPending, desc:`${pending.length} ${t.pending}`, action:() => setTab('Pending'), color:'#e65100' },
                { icon:'📋', label: t.allRequests, desc: t.allRequests, action:() => setTab('All Requests'), color:'#1565c0' },
              ].map(q => (
                <div key={q.label} className="card" style={{cursor:'pointer', borderLeft:`4px solid ${q.color}`, padding:16}} onClick={q.action}>
                  <div style={{fontSize:'1.8rem', marginBottom:6}}>{q.icon}</div>
                  <div style={{fontWeight:700, fontSize:'0.9rem', color:q.color}}>{q.label}</div>
                  <div style={{fontSize:'0.8rem', color:'#888', marginTop:3}}>{q.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'Pending' && (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number" style={{color:'#e65100'}}>{pending.length}</div><div className="stat-label">Pending</div></div>
              <div className="stat-card"><div className="stat-number">{all.filter(r=>r.status==='approved').length}</div><div className="stat-label">Approved</div></div>
              <div className="stat-card"><div className="stat-number">{all.filter(r=>r.status==='assigned').length}</div><div className="stat-label">Assigned</div></div>
              <div className="stat-card"><div className="stat-number">{all.filter(r=>r.status==='completed').length}</div><div className="stat-label">Completed</div></div>
            </div>

            {/* Category breakdown */}
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:20}}>
              {stats.byCategory.map(c => (
                <div key={c.category} style={{background:'white', borderRadius:8, padding:'8px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', fontSize:'0.82rem'}}>
                  <span style={{fontWeight:700, color:'#2e7d32'}}>{c.count}</span>
                  <span style={{color:'#888', marginLeft:6}}>{CAT_LABELS[c.category] || c.category}</span>
                </div>
              ))}
            </div>

            {/* Category filter pills */}
            <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:16}}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  style={{padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
                    background: catFilter === c ? '#2e7d32' : '#e8f5e9', color: catFilter === c ? 'white' : '#2e7d32'}}>
                  {c === 'all' ? 'All' : CAT_LABELS[c]}
                </button>
              ))}
            </div>

            <h2 className="page-title">{t.pendingRequests}</h2>
            {pending.filter(r => catFilter === 'all' || r.category === catFilter).length === 0
              ? <div className="empty"><div className="empty-icon">✅</div><p>No pending requests</p></div>
              : pending.filter(r => catFilter === 'all' || r.category === catFilter).map(renderRequest)}
          </>
        )}

        {tab === 'All Requests' && (
          <>
            <h2 className="page-title">{t.allRequests}</h2>
            <div style={{display:'flex', gap:10, marginBottom:16, flexWrap:'wrap'}}>
              <select style={{padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:'0.88rem'}}
                value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? t.allCategories : CAT_LABELS[c]}</option>)}
              </select>
              <select style={{padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:'0.88rem'}}
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s === 'all' ? t.allStatuses : t[s] || s}</option>)}
              </select>
              {(catFilter !== 'all' || statusFilter !== 'all') && (
                <button className="btn btn-outline btn-sm" onClick={() => { setCatFilter('all'); setStatusFilter('all'); }}>{t.clear}</button>
              )}
              <span style={{fontSize:'0.82rem', color:'#888', alignSelf:'center'}}>{filteredAll.length} {t.results}</span>
            </div>

            {filteredAll.length === 0
              ? <div className="empty"><div className="empty-icon">📭</div><p>No requests found</p></div>
              : filteredAll.map(renderRequest)}
          </>
        )}
      </div>
    </div>
  );
}
