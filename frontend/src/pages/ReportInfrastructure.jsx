import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';
import LocationMap from '../components/LocationMap';

const REPORT_TYPES = ['damage', 'theft', 'hazard', 'outage', 'other'];

export default function ReportInfrastructure({
  onBack, onDraft,
  reportStage, reportDraft, submittedReport,
  onConfirmReport, onEditReport, onReportViewAll, onReportAnother, submitLoading
}) {
  const [mode, setMode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    infrastructure_id: '', asset_code: '',
    report_type: 'damage', title: '', description: '',
    latitude: '', longitude: '', location_address: '', photo_url: ''
  });
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  const detectLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, latitude, longitude }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          setForm(f => ({ ...f, location_address: data.display_name || `${latitude}, ${longitude}` }));
        } catch {
          setForm(f => ({ ...f, location_address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
        }
        setLocating(false);
      },
      () => { setError('Could not get location. Enter manually.'); setLocating(false); }
    );
  };

  useEffect(() => {
    if (mode === 'qr' && scanning) {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false);
      scanner.render(
        async (decodedText) => {
          scanner.clear(); setScanning(false);
          try {
            const data = JSON.parse(decodedText);
            setScannedAsset(data);
            setForm(f => ({ ...f, asset_code: data.asset_code, location_address: data.location || f.location_address, latitude: data.latitude || f.latitude, longitude: data.longitude || f.longitude }));
            try { const res = await api.get(`/reports/infrastructure/lookup/${data.asset_code}`); setForm(f => ({ ...f, infrastructure_id: res.data.asset.id })); } catch {}
          } catch {
            setForm(f => ({ ...f, asset_code: decodedText }));
            try { const res = await api.get(`/reports/infrastructure/lookup/${decodedText}`); setScannedAsset(res.data.asset); setForm(f => ({ ...f, infrastructure_id: res.data.asset.id, location_address: res.data.asset.location || f.location_address })); } catch {}
          }
        }, () => {}
      );
      scannerRef.current = scanner;
      return () => { try { scanner.clear(); } catch {} };
    }
  }, [mode, scanning]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (onDraft) onDraft(form); // pass to parent for review stage
  };

  // ── Confirmed ──
  if (reportStage === 'confirmed' && submittedReport) {
    return (
      <div style={{maxWidth:560}}>
        <div style={{background:'linear-gradient(135deg,#2e7d32,#4CAF50)', borderRadius:14, padding:'28px 24px', color:'white', textAlign:'center', marginBottom:16}}>
          <div style={{fontSize:'3rem', marginBottom:8}}>✅</div>
          <div style={{fontSize:'1.2rem', fontWeight:700}}>Report Submitted!</div>
          <div style={{fontSize:'0.85rem', opacity:0.85, marginTop:6}}>Thank you for protecting EEU infrastructure.</div>
          {submittedReport.id && <div style={{marginTop:10, background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'5px 14px', display:'inline-block', fontSize:'0.85rem'}}>Reference #{submittedReport.id}</div>}
        </div>
        <div className="card">
          {[
            { label: 'Problem Type', value: submittedReport.report_type?.charAt(0).toUpperCase() + submittedReport.report_type?.slice(1) },
            { label: 'Title', value: submittedReport.title },
            { label: 'Description', value: submittedReport.description },
            submittedReport.asset_code && { label: 'Asset Code', value: submittedReport.asset_code },
            submittedReport.location_address && { label: 'Location', value: submittedReport.location_address },
            submittedReport.latitude && { label: 'GPS', value: `${parseFloat(submittedReport.latitude).toFixed(5)}, ${parseFloat(submittedReport.longitude).toFixed(5)}` },
            { label: 'Status', value: 'Open' },
            { label: 'Submitted', value: new Date().toLocaleString() },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} style={{display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid #f5f5f5', fontSize:'0.88rem'}}>
              <span style={{color:'#888', minWidth:110, flexShrink:0}}>{label}</span>
              <span style={{color:'#212121', fontWeight: label === 'Status' ? 600 : 400}}>{value}</span>
            </div>
          ))}
        </div>
        {submittedReport.latitude && submittedReport.longitude && (
          <div style={{marginTop:12}}>
            <LocationMap height="180px" single markers={[{ lat: parseFloat(submittedReport.latitude), lng: parseFloat(submittedReport.longitude), title: submittedReport.title, type: 'report' }]} />
          </div>
        )}
        <div style={{display:'flex', gap:10, marginTop:14}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={onReportViewAll}>📍 View My Reports</button>
          <button className="btn btn-outline" style={{flex:1}} onClick={onReportAnother}>⚠️ Report Another</button>
        </div>
      </div>
    );
  }

  // ── Review ──
  if (reportStage === 'review' && reportDraft) {
    return (
      <div style={{maxWidth:560}}>
        <div style={{background:'linear-gradient(135deg,#1565c0,#1976d2)', borderRadius:14, padding:'20px 24px', color:'white', marginBottom:16}}>
          <div style={{fontSize:'1.1rem', fontWeight:700}}>⚠️ Review Your Report</div>
          <div style={{fontSize:'0.85rem', opacity:0.85, marginTop:4}}>Please confirm before submitting.</div>
        </div>
        <div className="card">
          {[
            { label: 'Problem Type', value: reportDraft.report_type?.charAt(0).toUpperCase() + reportDraft.report_type?.slice(1) },
            { label: 'Title', value: reportDraft.title },
            { label: 'Description', value: reportDraft.description },
            reportDraft.asset_code && { label: 'Asset Code', value: reportDraft.asset_code },
            reportDraft.location_address && { label: 'Location', value: reportDraft.location_address },
            reportDraft.latitude && { label: 'GPS', value: `${parseFloat(reportDraft.latitude).toFixed(5)}, ${parseFloat(reportDraft.longitude).toFixed(5)}` },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} style={{display:'flex', gap:12, padding:'9px 0', borderBottom:'1px solid #f5f5f5', fontSize:'0.88rem'}}>
              <span style={{color:'#888', minWidth:110, flexShrink:0}}>{label}</span>
              <span style={{color:'#212121'}}>{value}</span>
            </div>
          ))}
        </div>
        {reportDraft.latitude && reportDraft.longitude && (
          <div style={{marginTop:12}}>
            <LocationMap height="160px" single markers={[{ lat: parseFloat(reportDraft.latitude), lng: parseFloat(reportDraft.longitude), title: reportDraft.title, type: 'report' }]} />
          </div>
        )}
        <div style={{display:'flex', gap:10, marginTop:14}}>
          <button className="btn btn-primary" style={{flex:2}} onClick={() => onConfirmReport(reportDraft)} disabled={submitLoading}>
            {submitLoading ? 'Submitting...' : '✓ Confirm & Submit'}
          </button>
          <button className="btn btn-outline" style={{flex:1}} onClick={onEditReport}>✏️ Edit</button>
        </div>
      </div>
    );
  }

  // ── Mode selection ──
  if (!mode) return (
    <div>
      <h2 className="page-title">Report Infrastructure Problem</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <p style={{color:'#555', marginBottom:24, fontSize:'0.95rem'}}>Help protect EEU infrastructure. Report damage, theft, hazards, or outages.</p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:500}}>
        <div className="card" style={{textAlign:'center', cursor:'pointer', border:'2px solid #4CAF50'}} onClick={() => { setMode('qr'); setScanning(true); }}>
          <div style={{fontSize:'3rem', marginBottom:8}}>📷</div>
          <div style={{fontWeight:700, color:'#2e7d32'}}>Scan QR Code</div>
          <div style={{fontSize:'0.82rem', color:'#888', marginTop:4}}>Scan the QR code on the infrastructure</div>
        </div>
        <div className="card" style={{textAlign:'center', cursor:'pointer', border:'2px solid #F5A623'}} onClick={() => { setMode('manual'); detectLocation(); }}>
          <div style={{fontSize:'3rem', marginBottom:8}}>✏️</div>
          <div style={{fontWeight:700, color:'#e65100'}}>Manual Report</div>
          <div style={{fontSize:'0.82rem', color:'#888', marginTop:4}}>No QR code? Report manually</div>
        </div>
      </div>
    </div>
  );

  // ── Form ──
  return (
    <div>
      <button className="btn btn-outline btn-sm" style={{marginBottom:16}} onClick={() => { setMode(null); setScannedAsset(null); setScanning(false); }}>← Back</button>
      <h2 className="page-title">{mode === 'qr' ? '📷 QR Code Report' : '✏️ Manual Report'}</h2>
      {error && <div className="alert alert-error">{error}</div>}

      {mode === 'qr' && scanning && (
        <div className="card" style={{marginBottom:16}}>
          <p style={{marginBottom:12, fontSize:'0.9rem', color:'#555'}}>Point your camera at the QR code:</p>
          <div id="qr-reader" style={{width:'100%'}} />
          <button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={() => { setScanning(false); setMode('manual'); }}>No QR? Switch to manual</button>
        </div>
      )}

      {scannedAsset && (
        <div className="card" style={{background:'#e8f5e9', border:'1px solid #a5d6a7', marginBottom:16}}>
          <div style={{fontWeight:700, color:'#2e7d32', marginBottom:4}}>✅ Asset Identified</div>
          <div style={{fontSize:'0.88rem'}}>Code: <b>{scannedAsset.asset_code}</b> · Type: <b>{scannedAsset.asset_type}</b></div>
          {scannedAsset.location && <div style={{fontSize:'0.88rem'}}>📍 {scannedAsset.location}</div>}
        </div>
      )}

      {(mode === 'manual' || scannedAsset || (mode === 'qr' && !scanning)) && (
        <div className="card">
          <form onSubmit={handleFormSubmit}>
            {mode === 'manual' && (
              <div className="form-group">
                <label>Asset Code (optional)</label>
                <input name="asset_code" value={form.asset_code} onChange={handle} placeholder="e.g. EEU-POLE-001" />
              </div>
            )}
            <div className="form-group">
              <label>Problem Type</label>
              <select name="report_type" value={form.report_type} onChange={handle}>
                {REPORT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input name="title" value={form.title} onChange={handle} required placeholder="e.g. Broken electric pole" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handle} required placeholder="Describe the problem in detail..." />
            </div>
            <div className="form-group">
              <label>Location</label>
              <div style={{display:'flex', gap:8}}>
                <input name="location_address" value={form.location_address} onChange={handle} placeholder="Address or landmark..." style={{flex:1}} />
                <button type="button" className="btn btn-outline btn-sm" onClick={detectLocation} disabled={locating}>{locating ? '...' : '📍 GPS'}</button>
              </div>
              {form.latitude && <div style={{fontSize:'0.78rem', color:'#888', marginTop:4}}>GPS: {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}</div>}
            </div>
            {form.latitude && form.longitude && (
              <div style={{marginBottom:16}}>
                <LocationMap height="160px" single markers={[{ lat: parseFloat(form.latitude), lng: parseFloat(form.longitude), title: 'Report location', type: 'report' }]} />
              </div>
            )}
            <div className="form-group">
              <label>Photo URL (optional)</label>
              <input name="photo_url" value={form.photo_url} onChange={handle} placeholder="https://..." />
            </div>
            <button className="btn btn-primary" type="submit">Preview Before Submit →</button>
          </form>
        </div>
      )}
    </div>
  );
}
