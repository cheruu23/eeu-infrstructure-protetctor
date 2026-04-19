import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ReportInfrastructure from './ReportInfrastructure';
import LocationMap from '../components/LocationMap';
import { useToast } from '../components/Toast';
import { useLang } from '../context/LangContext';

const TABS = ['Dashboard', 'My Requests', 'Submit Request', 'Report Problem', 'My Reports'];
const CAT_LABELS = { power_outage:'Power Outage', billing:'Billing', meter:'Meter', connection:'Connection', maintenance:'Maintenance', other:'Other' };

// ── Pre-submit review card ───────────────────────────────────
function ReviewCard({ data, type, onConfirm, onEdit, loading }) {
  const rows = type === 'request' ? [
    { label: 'Category',    value: CAT_LABELS[data.category] || data.category },
    { label: 'Title',       value: data.title },
    { label: 'Description', value: data.description },
    { label: 'Location',    value: data.location || '—' },
    { label: 'Service ID',  value: data.service_id },
  ] : [
    { label: 'Problem Type', value: data.report_type?.charAt(0).toUpperCase() + data.report_type?.slice(1) },
    { label: 'Title',        value: data.title },
    { label: 'Description',  value: data.description },
    { label: 'Asset Code',   value: data.asset_code || '—' },
    { label: 'Location',     value: data.location_address || '—' },
    data.latitude && { label: 'GPS', value: `${parseFloat(data.latitude).toFixed(5)}, ${parseFloat(data.longitude).toFixed(5)}` },
  ].filter(Boolean);

  return (
    <div style={{maxWidth:560}}>
      <div style={{background:'linear-gradient(135deg,#1565c0,#1976d2)', borderRadius:14, padding:'20px 24px', color:'white', marginBottom:16}}>
        <div style={{fontSize:'1.1rem', fontWeight:700}}>
          {type === 'request' ? '📋 Review Your Request' : '⚠️ Review Your Report'}
        </div>
        <div style={{fontSize:'0.85rem', opacity:0.85, marginTop:4}}>Please confirm the details before submitting.</div>
      </div>
      <div className="card">
        {rows.map(({ label, value }) => (
          <div key={label} style={{display:'flex', gap:12, padding:'9px 0', borderBottom:'1px solid #f5f5f5', fontSize:'0.88rem'}}>
            <span style={{color:'#888', minWidth:110, flexShrink:0}}>{label}</span>
            <span style={{color:'#212121'}}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:10, marginTop:14}}>
        <button className="btn btn-primary" style={{flex:2}} onClick={onConfirm} disabled={loading}>
          {loading ? 'Submitting...' : '✓ Confirm & Submit'}
        </button>
        <button className="btn btn-outline" style={{flex:1}} onClick={onEdit}>✏️ Edit</button>
      </div>
    </div>
  );
}

// ── Post-submit confirmation card ────────────────────────────
function ConfirmationCard({ data, type, onViewAll, onSubmitAnother }) {
  const rows = type === 'request' ? [
    { label: 'Reference',   value: `#${data.id}` },
    { label: 'Category',    value: CAT_LABELS[data.category] || data.category },
    { label: 'Title',       value: data.title },
    { label: 'Service ID',  value: data.service_id },
    { label: 'Status',      value: 'Pending Review' },
    { label: 'Submitted',   value: new Date().toLocaleString() },
  ] : [
    { label: 'Reference',    value: `#${data.id}` },
    { label: 'Problem Type', value: data.report_type?.charAt(0).toUpperCase() + data.report_type?.slice(1) },
    { label: 'Title',        value: data.title },
    data.asset_code && { label: 'Asset Code', value: data.asset_code },
    data.location_address && { label: 'Location', value: data.location_address },
    { label: 'Status',       value: 'Open' },
    { label: 'Submitted',    value: new Date().toLocaleString() },
  ].filter(Boolean);

  return (
    <div style={{maxWidth:560}}>
      <div style={{background:'linear-gradient(135deg,#2e7d32,#4CAF50)', borderRadius:14, padding:'28px 24px', color:'white', textAlign:'center', marginBottom:16}}>
        <div style={{fontSize:'3rem', marginBottom:8}}>✅</div>
        <div style={{fontSize:'1.2rem', fontWeight:700}}>
          {type === 'request' ? 'Request Submitted!' : 'Report Submitted!'}
        </div>
        <div style={{fontSize:'0.85rem', opacity:0.85, marginTop:6}}>
          {type === 'request' ? 'Your request is pending review.' : 'Thank you for protecting EEU infrastructure.'}
        </div>
      </div>
      <div className="card">
        <div style={{fontWeight:700, color:'#2e7d32', marginBottom:12, fontSize:'0.9rem'}}>
          {type === 'request' ? '📋 Request Details' : '⚠️ Report Details'}
        </div>
        {rows.map(({ label, value }) => (
          <div key={label} style={{display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid #f5f5f5', fontSize:'0.88rem'}}>
            <span style={{color:'#888', minWidth:110, flexShrink:0}}>{label}</span>
            <span style={{color:'#212121', fontWeight: label === 'Status' ? 600 : 400}}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:10, marginTop:14}}>
        <button className="btn btn-primary" style={{flex:1}} onClick={onViewAll}>
          {type === 'request' ? '📋 View My Requests' : '📍 View My Reports'}
        </button>
        <button className="btn btn-outline" style={{flex:1}} onClick={onSubmitAnother}>
          {type === 'request' ? '➕ Submit Another' : '⚠️ Report Another'}
        </button>
      </div>
    </div>
  );
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLang();
  const [tab, setTab] = useState('Dashboard');
  const [requests, setRequests] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'other', description: '', location: '', service_id: user?.service_id || '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [ratingForm, setRatingForm] = useState({ request_id: null, rating: 0, feedback: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  // 'idle' | 'review' | 'confirmed'
  const [submitStage, setSubmitStage] = useState('idle');
  const [submittedData, setSubmittedData] = useState(null);

  // For report: 'idle' | 'review' | 'confirmed'
  const [reportStage, setReportStage] = useState('idle');
  const [reportDraft, setReportDraft] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);

  const fetchRequests = async () => {
    try { const res = await api.get('/requests/my'); setRequests(res.data.requests); } catch {}
  };
  const fetchReports = async () => {
    try { const res = await api.get('/reports/my'); setMyReports(res.data.reports); } catch {}
  };

  useEffect(() => { fetchRequests(); fetchReports(); }, []);

  // Called when citizen fills form and clicks "Preview"
  const handlePreview = (e) => {
    e.preventDefault();
    setSubmitStage('review');
  };

  // Called when citizen confirms from review card
  const handleConfirmSubmit = async () => {
    setSubmitLoading(true); setError('');
    try {
      const res = await api.post('/requests', form);
      setSubmittedData({ ...form, id: res.data.request_id });
      setSubmitStage('confirmed');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
      setSubmitStage('idle');
    } finally { setSubmitLoading(false); }
  };

  const handleRate = async (requestId) => {
    setMsg(''); setError('');
    try {
      await api.post('/ratings', { request_id: requestId, rating: ratingForm.rating, feedback: ratingForm.feedback });
      setMsg('Thank you for your feedback!');
      setRatingForm({ request_id: null, rating: 0, feedback: '' });
      fetchRequests();
    } catch (err) { setError(err.response?.data?.message || 'Rating failed'); }
  };

  const resetRequest = () => {
    setSubmitStage('idle');
    setSubmittedData(null);
    setForm({ title: '', category: 'other', description: '', location: '', service_id: user?.service_id || '' });
  };

  const statusCounts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    completed: requests.filter(r => r.status === 'completed').length,
    openReports: myReports.filter(r => r.status === 'open').length,
  };

  const tabIcons = { Dashboard:'🏠', 'My Requests': t.myRequests, 'Submit Request': t.submitRequest, 'Report Problem': t.reportProblem, 'My Reports': t.myReports };
  const TABS = ['Dashboard', 'My Requests', 'Submit Request', 'Report Problem', 'My Reports'];
  const TAB_ICONS = { Dashboard:'🏠', 'My Requests':'📋', 'Submit Request':'➕', 'Report Problem':'⚠️', 'My Reports':'📍' };

  const goTab = (t) => { setTab(t); setSubmitStage('idle'); setReportStage('idle'); };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        {TABS.map(tabKey => (
          <div key={tabKey} className={`sidebar-item ${tab === tabKey ? 'active' : ''}`} onClick={() => goTab(tabKey)}>
            {TAB_ICONS[tabKey]} {tabKey === 'Dashboard' ? t.dashboard : tabKey === 'My Requests' ? t.myRequests : tabKey === 'Submit Request' ? t.submitRequest : tabKey === 'Report Problem' ? t.reportProblem : t.myReports}
            {tabKey === 'My Reports' && statusCounts.openReports > 0 && (
              <span style={{marginLeft:'auto', background:'#e65100', color:'white', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem'}}>{statusCounts.openReports}</span>
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
            <div style={{marginBottom:24}}>
              <h2 className="page-title" style={{marginBottom:4}}>Welcome, {user?.name} 👋</h2>
              <p style={{color:'#888', fontSize:'0.9rem'}}>EEU Service ID: {user?.service_id || 'Not set'}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number">{statusCounts.total}</div><div className="stat-label">Total Requests</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#e65100'}}>{statusCounts.pending}</div><div className="stat-label">Pending</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#2e7d32'}}>{statusCounts.completed}</div><div className="stat-label">Completed</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#e65100'}}>{statusCounts.openReports}</div><div className="stat-label">Open Reports</div></div>
            </div>

            {/* Quick actions */}
            <h3 style={{fontSize:'1rem', fontWeight:700, color:'#2e7d32', marginBottom:12}}>Quick Actions</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:12, marginBottom:28}}>
              {[
                { icon:'➕', label:'Submit Service Request', desc:'Report a power or service issue', action:() => goTab('Submit Request'), color:'#2e7d32' },
                { icon:'⚠️', label:'Report Infrastructure', desc:'Report damage, theft or hazard', action:() => goTab('Report Problem'), color:'#e65100' },
                { icon:'📋', label:'Track My Requests', desc:'View status of your requests', action:() => goTab('My Requests'), color:'#1565c0' },
                { icon:'📍', label:'My Reports', desc:'View your infrastructure reports', action:() => goTab('My Reports'), color:'#6a1b9a' },
              ].map(q => (
                <div key={q.label} className="card" style={{cursor:'pointer', borderLeft:`4px solid ${q.color}`, padding:16}}
                  onClick={q.action}>
                  <div style={{fontSize:'1.8rem', marginBottom:6}}>{q.icon}</div>
                  <div style={{fontWeight:700, fontSize:'0.9rem', color:q.color}}>{q.label}</div>
                  <div style={{fontSize:'0.8rem', color:'#888', marginTop:3}}>{q.desc}</div>
                </div>
              ))}
            </div>

            {/* Recent requests */}
            {requests.length > 0 && (
              <>
                <h3 style={{fontSize:'1rem', fontWeight:700, color:'#2e7d32', marginBottom:12}}>Recent Requests</h3>
                {requests.slice(0,3).map(r => (
                  <div className="card" key={r.id} style={{padding:'14px 18px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:600, fontSize:'0.9rem'}}>{r.title}</div>
                        <div style={{fontSize:'0.78rem', color:'#888', marginTop:2}}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
                {requests.length > 3 && (
                  <button className="btn btn-outline btn-sm" style={{marginTop:8}} onClick={() => goTab('My Requests')}>
                    View all {requests.length} requests →
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── My Requests ── */}
        {tab === 'My Requests' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-number">{statusCounts.total}</div><div className="stat-label">Total</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#e65100'}}>{statusCounts.pending}</div><div className="stat-label">Pending</div></div>
              <div className="stat-card"><div className="stat-number" style={{color:'#2e7d32'}}>{statusCounts.completed}</div><div className="stat-label">Completed</div></div>
            </div>
            <h2 className="page-title">{t.myRequests}</h2>
            {requests.length === 0 ? (
              <div className="empty"><div className="empty-icon">📭</div><p>{t.noRequests}</p>
                <button className="btn btn-primary" style={{marginTop:12}} onClick={() => goTab('Submit Request')}>Submit your first request</button>
              </div>
            ) : requests.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">Service ID: {r.service_id} · {new Date(r.created_at).toLocaleDateString()}</div>
                    {r.category && (
                      <span style={{display:'inline-block', marginTop:4, padding:'2px 10px', borderRadius:20, background:'#e3f2fd', color:'#1565c0', fontSize:'0.75rem', fontWeight:600}}>
                        {CAT_LABELS[r.category] || r.category}
                      </span>
                    )}
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
                <p style={{fontSize:'0.88rem', color:'#555', marginBottom:8}}>{r.description}</p>
                {r.location && <p style={{fontSize:'0.82rem', color:'#888'}}>📍 {r.location}</p>}
                {r.rejection_reason && <p style={{fontSize:'0.82rem', color:'#c62828', marginTop:6}}>Reason: {r.rejection_reason}</p>}

                {r.status === 'completed' && !r.rating && (
                  <div style={{marginTop:12, borderTop:'1px solid #eee', paddingTop:12}}>
                    <p style={{fontSize:'0.88rem', fontWeight:600, marginBottom:8}}>{t.rateService}:</p>
                    <div className="stars">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`star ${ratingForm.request_id === r.id && ratingForm.rating >= s ? 'filled' : ''}`}
                          onClick={() => setRatingForm({ ...ratingForm, request_id: r.id, rating: s })}>★</span>
                      ))}
                    </div>
                    {ratingForm.request_id === r.id && ratingForm.rating > 0 && (
                      <div style={{marginTop:8}}>
                        <textarea placeholder={t.optionalFeedback}
                          style={{width:'100%', padding:'8px', borderRadius:6, border:'1px solid #ddd', fontSize:'0.85rem'}}
                          value={ratingForm.feedback}
                          onChange={e => setRatingForm({...ratingForm, feedback: e.target.value})} />
                        <button className="btn btn-orange btn-sm" style={{marginTop:6}} onClick={() => handleRate(r.id)}>{t.submitRating}</button>
                      </div>
                    )}
                  </div>
                )}
                {r.rating && (
                  <div style={{marginTop:8, fontSize:'0.82rem', color:'#555'}}>
                    Your rating: {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                    {r.rating_feedback && <span> · {r.rating_feedback}</span>}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Submit Request ── */}
        {tab === 'Submit Request' && (
          <>
            <h2 className="page-title">{t.submitRequest}</h2>

            {submitStage === 'confirmed' ? (
              <ConfirmationCard data={submittedData} type="request"
                onViewAll={() => { resetRequest(); goTab('My Requests'); }}
                onSubmitAnother={resetRequest} />
            ) : submitStage === 'review' ? (
              <ReviewCard data={form} type="request"
                onConfirm={handleConfirmSubmit}
                onEdit={() => setSubmitStage('idle')}
                loading={submitLoading} />
            ) : (
              <div className="card">
                <form onSubmit={handlePreview}>
                  <div className="form-group"><label>{t.title}</label>
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g. No power for 2 days" />
                  </div>
                  <div className="form-group"><label>{t.category}</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="power_outage">{t.catPowerOutage}</option>
                      <option value="billing">{t.catBilling}</option>
                      <option value="meter">{t.catMeter}</option>
                      <option value="connection">{t.catConnection}</option>
                      <option value="maintenance">{t.catMaintenance}</option>
                      <option value="other">{t.catOther}</option>
                    </select>
                  </div>
                  <div className="form-group"><label>{t.description}</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Describe the issue..." />
                  </div>
                  <div className="form-group"><label>{t.location}</label>
                    <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Bole, Addis Ababa" />
                  </div>
                  <div className="form-group"><label>{t.serviceId}</label>
                    <input value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} required placeholder="EEU-12345" />
                  </div>
                  <button className="btn btn-primary" type="submit">{t.previewSubmit} →</button>
                </form>
              </div>
            )}
          </>
        )}

        {/* ── Report Infrastructure Problem ── */}
        {tab === 'Report Problem' && (
          <ReportInfrastructure
            onBack={() => goTab('My Reports')}
            onDraft={(draft) => { setReportDraft(draft); setReportStage('review'); }}
            reportStage={reportStage}
            reportDraft={reportDraft}
            submittedReport={submittedReport}
            onConfirmReport={async (draft) => {
              setSubmitLoading(true);
              try {
                const res = await api.post('/reports', draft);
                setSubmittedReport({ ...draft, id: res.data.report_id });
                setReportStage('confirmed');
                fetchReports();
              } catch (err) {
                setError(err.response?.data?.message || 'Failed to submit report');
                setReportStage('idle');
              } finally { setSubmitLoading(false); }
            }}
            onEditReport={() => setReportStage('idle')}
            onReportViewAll={() => { setReportStage('idle'); setReportDraft(null); setSubmittedReport(null); goTab('My Reports'); }}
            onReportAnother={() => { setReportStage('idle'); setReportDraft(null); setSubmittedReport(null); }}
            submitLoading={submitLoading}
          />
        )}

        {/* ── My Reports ── */}
        {tab === 'My Reports' && (
          <>
            <h2 className="page-title">{t.myReports}</h2>
            {myReports.length === 0 ? (
              <div className="empty"><div className="empty-icon">📍</div><p>{t.noReports}</p>
                <button className="btn btn-primary" style={{marginTop:12}} onClick={() => goTab('Report Problem')}>Report a problem</button>
              </div>
            ) : myReports.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">Type: {r.report_type} · {new Date(r.created_at).toLocaleDateString()}</div>
                    {r.asset_code && <div className="card-meta">Asset: {r.asset_code} ({r.asset_type})</div>}
                    {r.location_address && <div className="card-meta">📍 {r.location_address}</div>}
                  </div>
                  <span className={`badge badge-${r.status === 'open' ? 'pending' : r.status === 'resolved' ? 'completed' : 'assigned'}`}>{r.status}</span>
                </div>
                <p style={{fontSize:'0.88rem', color:'#555'}}>{r.description}</p>
                {r.latitude && r.longitude && (
                  <div style={{marginTop:10}}>
                    <LocationMap height="150px" single
                      markers={[{ lat: parseFloat(r.latitude), lng: parseFloat(r.longitude), title: r.title, address: r.location_address, status: r.status, type: 'report' }]} />
                  </div>
                )}
                {r.assigned_team && <p style={{fontSize:'0.82rem', color:'#1565c0', marginTop:6}}>👷 Assigned to: {r.assigned_team}</p>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
