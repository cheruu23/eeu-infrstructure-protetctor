import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../api/axios';
import UserModal from '../components/UserModal';
import LocationMap from '../components/LocationMap';
import { useToast } from '../components/Toast';
import { useLang } from '../context/LangContext';

const TABS_KEYS = ['Overview', 'Infrastructure', 'Reports', 'Service Requests', 'Users', 'Groups'];
const ROLES = ['all', 'citizen', 'approver', 'electrician', 'admin'];
const ROLE_COLORS = { admin: 'completed', approver: 'approved', electrician: 'assigned', citizen: 'pending' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const toast = useToast();
  const { t } = useLang();
  const [stats, setStats] = useState({});
  const [infrastructure, setInfrastructure] = useState([]);
  const [reports, setReports] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [qrAsset, setQrAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({ asset_code: '', asset_type: 'pole', description: '', location: '', latitude: '', longitude: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [assignReport, setAssignReport] = useState({ id: null, team_id: '' });

  // User management state
  const [userModal, setUserModal] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Groups state
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState({});
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [electricians, setElectricians] = useState([]);
  const [addMemberForm, setAddMemberForm] = useState({ group_id: null, user_id: '' });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
      setElectricians(res.data.users.filter(u => u.role === 'electrician'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data.groups);
    } catch {}
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/members`);
      setGroupMembers(prev => ({ ...prev, [groupId]: res.data.members }));
    } catch {}
  };

  const fetchAll = async () => {
    const safe = async (fn, fallback) => { try { return await fn(); } catch { return fallback; } };

    const [s, i, r, sr, g] = await Promise.all([
      safe(() => api.get('/admin/stats'),            { data: {} }),
      safe(() => api.get('/admin/infrastructure'),   { data: { assets: [] } }),
      safe(() => api.get('/admin/reports'),          { data: { reports: [] } }),
      safe(() => api.get('/admin/service-requests'), { data: { requests: [] } }),
      safe(() => api.get('/groups'),                 { data: { groups: [] } }),
    ]);

    setStats(s.data);
    setInfrastructure(i.data.assets || []);
    setReports(r.data.reports || []);
    setServiceRequests(sr.data.requests || []);
    // use groups as teams for report assignment
    setTeams((g.data.groups || []).map(grp => ({ id: grp.id, team_name: grp.name })));

    fetchUsers();
    fetchGroups();
  };

  useEffect(() => { fetchAll(); }, []);

  const createAsset = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    try {
      await api.post('/admin/infrastructure', newAsset);
      setMsg('Asset created!');
      setNewAsset({ asset_code: '', asset_type: 'pole', description: '', location: '', latitude: '', longitude: '' });
      fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const updateAssetStatus = async (id, status) => {
    try { await api.put(`/admin/infrastructure/${id}/status`, { status }); fetchAll(); } catch {}
  };

  const resolveReport = async (id) => {
    try { await api.put(`/admin/reports/${id}/resolve`); setMsg('Report resolved!'); fetchAll(); } catch {}
  };

  const assignReportTeam = async (id) => {
    if (!assignReport.team_id) return setError('Select a team');
    try {
      await api.put(`/admin/reports/${id}/assign`, { team_id: assignReport.team_id });
      setMsg('Team assigned!'); setAssignReport({ id: null, team_id: '' }); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setMsg(''); setError('');
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id)); // instant UI update
      setMsg('User deleted.');
      fetchUsers(); // re-sync with DB
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const createGroup = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    try {
      await api.post('/groups', newGroup);
      setMsg('Group created!');
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    try { await api.delete(`/groups/${id}`); fetchGroups(); } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const addMember = async (groupId) => {
    if (!addMemberForm.user_id) return setError('Select an electrician');
    try {
      await api.post(`/groups/${groupId}/members`, { user_id: addMemberForm.user_id });
      setMsg('Electrician added to group!');
      setAddMemberForm({ group_id: null, user_id: '' });
      fetchGroupMembers(groupId);
      fetchGroups();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const removeMember = async (groupId, userId) => {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      fetchGroupMembers(groupId);
      fetchGroups();
    } catch {}
  };

  const openCreate = () => { setModalError(''); setEditingUser(null); setUserModal('create'); };
  const openEdit = (user) => { setModalError(''); setEditingUser(user); setUserModal('edit'); };
  const closeModal = () => { setUserModal(null); setEditingUser(null); setModalError(''); };

  const handleSaveUser = async (formData) => {
    setModalLoading(true); setModalError('');
    try {
      if (userModal === 'create') {
        const res = await api.post('/admin/users', formData);
        // Optimistically append the new user immediately, then re-fetch to confirm
        setUsers(prev => [res.data.user ? { ...res.data.user, created_at: new Date().toISOString() } : {}, ...prev]);
        setMsg('User created successfully.');
      } else {
        await api.put(`/admin/users/${editingUser.id}`, formData);
        setMsg('User updated successfully.');
      }
      closeModal();
      // Always re-fetch to get the full accurate list from DB
      fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  // Client-side filter (search + role) on top of server data
  const filteredUsers = users.filter(u => {
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const q = userSearch.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.service_id || '').toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  // Role breakdown counts
  const roleCounts = ROLES.slice(1).reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  const tabIcons = { Overview:'📊', Infrastructure:'🏗️', Reports:'⚠️', 'Service Requests':'📋', Users:'👥', Groups:'⚡' };
  const tabLabels = { Overview: t.overview, Infrastructure: t.infraManagement, Reports: t.infraReports, 'Service Requests': t.serviceRequests, Users: t.systemUsers, Groups: t.electricianGroups };

  const CHART_COLORS = ['#2e7d32','#F5A623','#1565c0','#c62828','#6a1b9a','#00838f'];
  const charts = stats.charts || {};

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        {TABS_KEYS.map(k => (
          <div key={k} className={`sidebar-item ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {tabIcons[k]} {tabLabels[k] || k}
          </div>
        ))}
      </div>

      <div className="main-content">
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Overview ── */}
        {tab === 'Overview' && (
          <>
            <h2 className="page-title">{t.systemOverview}</h2>
            <div className="stats-grid">
              {[
                { label: t.totalUsers, value: stats.users, color: '#2e7d32' },
                { label: t.serviceRequests, value: stats.requests, color: '#1565c0' },
                { label: t.infraReports, value: stats.reports, color: '#e65100' },
                { label: t.infraAssets, value: stats.infrastructure, color: '#6a1b9a' },
                { label: t.pendingRequests, value: stats.pending_requests, color: '#e65100' },
                { label: t.openReports, value: stats.open_reports, color: '#c62828' },
                { label: t.damagedAssets, value: stats.damaged_assets, color: '#c62828' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-number" style={{color: s.color}}>{s.value ?? '—'}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts row 1 */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
              {/* Requests by status - Bar */}
              <div className="card">
                <div className="card-title" style={{marginBottom:16}}>{t.requestsByStatus}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(charts.byStatus||[]).map(d=>({name:d.status, count:Number(d.count)}))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize:11}} />
                    <YAxis tick={{fontSize:11}} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2e7d32" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Users by role - Pie */}
              <div className="card">
                <div className="card-title" style={{marginBottom:16}}>{t.usersByRole}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={(charts.usersByRole||[]).map(d=>({name:d.role, value:Number(d.count)}))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {(charts.usersByRole||[]).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts row 2 */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
              {/* Requests by category - Bar */}
              <div className="card">
                <div className="card-title" style={{marginBottom:16}}>{t.requestsByCategory}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(charts.byCategory||[]).map(d=>({name:d.category?.replace('_',' '), count:Number(d.count)}))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize:10}} />
                    <YAxis tick={{fontSize:11}} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F5A623" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reports by type - Pie */}
              <div className="card">
                <div className="card-title" style={{marginBottom:16}}>{t.reportsByType}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={(charts.reportsByType||[]).map(d=>({name:d.report_type, value:Number(d.count)}))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {(charts.reportsByType||[]).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Requests over time - Line */}
            <div className="card">
              <div className="card-title" style={{marginBottom:16}}>{t.requestsOverTime}</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={(charts.requestsPerMonth||[]).map(d=>({month:d.month, count:Number(d.count)}))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#2e7d32" strokeWidth={2} dot={{r:4}} name="Requests" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Map of all reported locations */}
            <div className="card">
              <div className="card-title" style={{marginBottom:12}}>📍 {t.reportLocations}</div>
              <LocationMap
                height="360px"
                markers={reports
                  .filter(r => r.latitude && r.longitude)
                  .map(r => ({
                    lat: parseFloat(r.latitude), lng: parseFloat(r.longitude),
                    title: r.title, description: r.description,
                    address: r.location_address, status: r.status, type: 'report'
                  }))}
              />
              {reports.filter(r => r.latitude && r.longitude).length === 0 && (
                <p style={{fontSize:'0.82rem', color:'#aaa', marginTop:8, textAlign:'center'}}>{t.noGpsReports}</p>
              )}
            </div>
          </>
        )}

        {/* ── Infrastructure ── */}
        {tab === 'Infrastructure' && (
          <>
            <h2 className="page-title">{t.infraManagement}</h2>

            {/* Add new asset */}
            <div className="card" style={{marginBottom:24}}>
              <div className="card-title" style={{marginBottom:16}}>➕ {t.addAsset}</div>
              <form onSubmit={createAsset} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div className="form-group" style={{margin:0}}>
                  <label>{t.assetCode}</label>
                  <input value={newAsset.asset_code} onChange={e => setNewAsset({...newAsset, asset_code: e.target.value})} required placeholder="EEU-POLE-003" />
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label>{t.assetType}</label>
                  <select value={newAsset.asset_type} onChange={e => setNewAsset({...newAsset, asset_type: e.target.value})}>
                    {['pole','transformer','cable','substation','meter','other'].map(tp => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{margin:0, gridColumn:'1/-1'}}>
                  <label>{t.description}</label>
                  <input value={newAsset.description} onChange={e => setNewAsset({...newAsset, description: e.target.value})} placeholder="Brief description" />
                </div>
                <div className="form-group" style={{margin:0, gridColumn:'1/-1'}}>
                  <label>{t.location}</label>
                  <input value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})} placeholder="e.g. Bole, Addis Ababa" />
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label>Latitude</label>
                  <input type="number" step="any" value={newAsset.latitude} onChange={e => setNewAsset({...newAsset, latitude: e.target.value})} placeholder="9.0192" />
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label>Longitude</label>
                  <input type="number" step="any" value={newAsset.longitude} onChange={e => setNewAsset({...newAsset, longitude: e.target.value})} placeholder="38.7525" />
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <button className="btn btn-primary" type="submit">{t.create} {t.assetCode}</button>
                </div>
              </form>
            </div>

            {/* Assets list */}
            {infrastructure.map(asset => (
              <div className="card" key={asset.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{asset.asset_code} — {asset.asset_type}</div>
                    <div className="card-meta">{asset.description}</div>
                    {asset.location && <div className="card-meta">📍 {asset.location}</div>}
                    {asset.latitude && <div className="card-meta" style={{fontSize:'0.78rem'}}>GPS: {asset.latitude}, {asset.longitude}</div>}
                  </div>
                  <span className={`badge badge-${asset.status === 'active' ? 'approved' : asset.status === 'damaged' ? 'rejected' : 'assigned'}`}>{asset.status}</span>
                </div>

                <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                  <button className="btn btn-outline btn-sm" onClick={() => setQrAsset(qrAsset?.id === asset.id ? null : asset)}>
                    {qrAsset?.id === asset.id ? t.hideQR : `🔲 ${t.showQR}`}
                  </button>
                  {asset.status !== 'active' && (
                    <button className="btn btn-primary btn-sm" onClick={() => updateAssetStatus(asset.id, 'active')}>{t.markActive}</button>
                  )}
                  {asset.status === 'active' && (
                    <button className="btn btn-danger btn-sm" onClick={() => updateAssetStatus(asset.id, 'damaged')}>{t.markDamaged}</button>
                  )}
                  {asset.status === 'damaged' && (
                    <button className="btn btn-orange btn-sm" onClick={() => updateAssetStatus(asset.id, 'under_repair')}>{t.underRepair}</button>
                  )}
                </div>

                {/* QR Code display */}
                {qrAsset?.id === asset.id && (
                  <div style={{marginTop:16, textAlign:'center', padding:16, background:'#f9f9f9', borderRadius:8}}>
                    <QRCodeCanvas
                      value={JSON.stringify({
                        asset_code: asset.asset_code, asset_type: asset.asset_type,
                        description: asset.description, location: asset.location,
                        latitude: asset.latitude, longitude: asset.longitude
                      })}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#2e7d32"
                      level="H"
                    />
                    <div style={{fontSize:'0.82rem', color:'#555', marginTop:8}}>{asset.asset_code}</div>
                    <button className="btn btn-outline btn-sm" style={{marginTop:8}}
                      onClick={() => {
                        const canvas = document.querySelector('canvas');
                        const link = document.createElement('a');
                        link.download = `${asset.asset_code}-qr.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                      }}>⬇ {t.downloadQR}</button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Reports ── */}
        {tab === 'Reports' && (
          <>
            <h2 className="page-title">{t.infraReports}</h2>
            {reports.length === 0 ? (
              <div className="empty"><div className="empty-icon">✅</div><p>No reports yet</p></div>
            ) : reports.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">👤 {r.citizen_name} · Type: {r.report_type} · {new Date(r.created_at).toLocaleDateString()}</div>
                    {r.asset_code && <div className="card-meta">Asset: {r.asset_code} ({r.asset_type})</div>}
                    {r.location_address && <div className="card-meta">📍 {r.location_address}</div>}
                    {r.latitude && <div className="card-meta" style={{fontSize:'0.78rem'}}>GPS: {r.latitude}, {r.longitude}</div>}
                  </div>
                  <span className={`badge badge-${r.status === 'open' ? 'pending' : r.status === 'resolved' ? 'completed' : 'assigned'}`}>{r.status}</span>
                </div>
                <p style={{fontSize:'0.88rem', color:'#555', marginBottom:10}}>{r.description}</p>

                {r.latitude && r.longitude && (
                  <div style={{marginBottom:10}}>
                    <LocationMap height="150px" single
                      markers={[{ lat: parseFloat(r.latitude), lng: parseFloat(r.longitude), title: r.title, address: r.location_address, status: r.status, type: 'report' }]} />
                  </div>
                )}

                {r.assigned_team && <p style={{fontSize:'0.82rem', color:'#1565c0', marginBottom:8}}>👷 {r.assigned_team}</p>}

                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {r.status !== 'resolved' && (
                    <button className="btn btn-primary btn-sm" onClick={() => resolveReport(r.id)}>✓ Resolve</button>
                  )}
                  {r.status === 'open' && (
                    assignReport.id === r.id ? (
                      <div style={{display:'flex', gap:6}}>
                        <select style={{padding:'5px 8px', borderRadius:6, border:'1px solid #ddd'}}
                          value={assignReport.team_id} onChange={e => setAssignReport({...assignReport, team_id: e.target.value})}>
                          <option value="">Select team...</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                        </select>
                        <button className="btn btn-orange btn-sm" onClick={() => assignReportTeam(r.id)}>Assign</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setAssignReport({id:null, team_id:''})}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-orange btn-sm" onClick={() => setAssignReport({ id: r.id, team_id: '' })}>👷 Assign Team</button>
                    )
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Service Requests ── */}
        {tab === 'Service Requests' && (
          <>
            <h2 className="page-title">{t.allRequests}</h2>
            {serviceRequests.map(r => (
              <div className="card" key={r.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{r.title}</div>
                    <div className="card-meta">👤 {r.citizen_name} · {new Date(r.created_at).toLocaleDateString()}</div>
                    {r.team_name && <div className="card-meta">👷 {r.team_name}</div>}
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Users ── */}
        {tab === 'Users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="page-title" style={{ margin: 0 }}>{t.systemUsers}</h2>
              <button className="btn btn-primary" onClick={openCreate}>➕ {t.createUser}</button>
            </div>

            {/* Role breakdown */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
              {ROLES.slice(1).map(r => (
                <div className="stat-card" key={r} style={{ cursor: 'pointer', border: userRoleFilter === r ? '2px solid #2e7d32' : '2px solid transparent' }}
                  onClick={() => setUserRoleFilter(userRoleFilter === r ? 'all' : r)}>
                  <div className="stat-number" style={{ fontSize: '1.5rem' }}>{roleCounts[r] ?? 0}</div>
                  <div className="stat-label">{r.charAt(0).toUpperCase() + r.slice(1)}s</div>
                </div>
              ))}
            </div>

            {/* Search + filter bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}
                placeholder={t.searchUsers}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <select
                style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
              >
                {ROLES.map(r => <option key={r} value={r}>{r === 'all' ? t.allRoles : t[r] || r}</option>)}
              </select>
              {(userSearch || userRoleFilter !== 'all') && (
                <button className="btn btn-outline btn-sm" onClick={() => { setUserSearch(''); setUserRoleFilter('all'); }}>{t.clear}</button>
              )}
            </div>

            <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: 12 }}>
              {t.showing} {filteredUsers.length} {t.of} {users.length} {t.users}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="empty"><div className="empty-icon">👤</div><p>{t.noUsersFound}</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>{t.email}</th><th>{t.role}</th><th>{t.phone}</th><th>{t.serviceId}</th><th>{t.joined}</th><th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td style={{ color: '#aaa', fontSize: '0.8rem' }}>{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge badge-${ROLE_COLORS[u.role]}`}>{u.role}</span>
                        </td>
                        <td>{u.phone || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {u.service_id ? `🪪 ${u.service_id}` : u.team_name ? `👷 ${u.team_name}` : '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#888' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>✏️ {t.edit}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Groups ── */}
        {tab === 'Groups' && (
          <>
            <h2 className="page-title">{t.electricianGroups}</h2>
            <div className="card" style={{marginBottom:24}}>
              <div className="card-title" style={{marginBottom:14}}>➕ {t.createGroup}</div>
              <form onSubmit={createGroup} style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                <input style={{flex:1, minWidth:160, padding:'9px 14px', borderRadius:8, border:'1px solid #ddd'}}
                  placeholder={`${t.groupName} *`} value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})} required />
                <input style={{flex:2, minWidth:200, padding:'9px 14px', borderRadius:8, border:'1px solid #ddd'}}
                  placeholder={t.groupDesc} value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})} />
                <button className="btn btn-primary" type="submit">{t.create}</button>
              </form>
            </div>

            {groups.length === 0 ? (
              <div className="empty"><div className="empty-icon">⚡</div><p>No groups yet</p></div>
            ) : groups.map(g => (
              <div className="card" key={g.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">⚡ {g.name}</div>
                    {g.description && <div className="card-meta">{g.description}</div>}
                    <div className="card-meta">{g.member_count} electrician{g.member_count !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{display:'flex', gap:6}}>
                    <button className="btn btn-outline btn-sm"
                      onClick={() => { fetchGroupMembers(g.id); setAddMemberForm(f => f.group_id === g.id ? {group_id:null,user_id:''} : {group_id:g.id,user_id:''}); }}>
                      {addMemberForm.group_id === g.id ? 'Close' : '👤 Manage Members'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteGroup(g.id)}>🗑</button>
                  </div>
                </div>

                {addMemberForm.group_id === g.id && (
                  <div style={{marginTop:12, borderTop:'1px solid #eee', paddingTop:12}}>
                    {/* Members list */}
                    {(groupMembers[g.id] || []).length > 0 ? (
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:'0.85rem', fontWeight:600, marginBottom:8, color:'#555'}}>Current Members:</div>
                        {(groupMembers[g.id] || []).map(m => (
                          <div key={m.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f5f5f5'}}>
                            <span style={{fontSize:'0.88rem'}}>⚡ {m.name} — {m.email}</span>
                            <button className="btn btn-danger btn-sm" onClick={() => removeMember(g.id, m.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{fontSize:'0.85rem', color:'#aaa', marginBottom:10}}>No members yet</p>}

                    {/* Add member */}
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <select style={{flex:1, padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:'0.88rem'}}
                        value={addMemberForm.user_id}
                        onChange={e => setAddMemberForm({...addMemberForm, user_id: e.target.value})}>
                        <option value="">Select electrician to add...</option>
                        {electricians
                          .filter(e => !(groupMembers[g.id]||[]).find(m => m.id === e.id))
                          .map(e => <option key={e.id} value={e.id}>{e.name} — {e.email}</option>)}
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => addMember(g.id)}>Add</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* User create/edit modal */}
        {userModal && (
          <UserModal
            mode={userModal}
            user={editingUser}
            onSave={handleSaveUser}
            onClose={closeModal}
            loading={modalLoading}
            error={modalError}
          />
        )}
      </div>
    </div>
  );
}
