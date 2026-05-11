import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * QRScanner — camera QR scanner with front/back toggle
 * Uses a stable unique container ID to avoid DOM conflicts on re-render
 */
export default function QRScanner({ onScan, onError, onClose }) {
  const [facingMode, setFacingMode] = useState('environment');
  const [status, setStatus] = useState('starting'); // 'starting' | 'running' | 'error'
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef(null);
  // Unique ID per mount so React never reuses a dirty container
  const containerIdRef = useRef(`qr-box-${Date.now()}`);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const state = scannerRef.current.getState?.();
      if (state === 2 || state === 3) await scannerRef.current.stop();
    } catch {}
    try { scannerRef.current.clear(); } catch {}
    scannerRef.current = null;
  }, []);

  const startScanner = useCallback(async (facing) => {
    await stopScanner();
    setStatus('starting');

    // Wait one tick for the DOM container to be ready
    await new Promise(r => setTimeout(r, 80));

    const container = document.getElementById(containerIdRef.current);
    if (!container) { setStatus('error'); return; }

    try {
      const scanner = new Html5Qrcode(containerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: facing },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (decodedText) => {
          stopScanner().then(() => onScan(decodedText));
        },
        () => {} // ignore per-frame errors
      );
      setStatus('running');
    } catch (err) {
      setStatus('error');
      const msg = String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
        setPermissionDenied(true);
        if (onError) onError('Camera permission denied. Please allow camera access.');
      } else if (facing === 'environment') {
        // Back camera unavailable — try front
        setFacingMode('user');
      } else {
        if (onError) onError('Could not start camera. Use manual entry instead.');
      }
    }
  }, [stopScanner, onScan, onError]);

  useEffect(() => {
    startScanner(facingMode);
    return () => { stopScanner(); };
  }, [facingMode]); // eslint-disable-line

  const handleClose = () => { stopScanner(); onClose(); };

  if (permissionDenied) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📷</div>
        <p style={{ color: '#c62828', marginBottom: 14, fontSize: '0.88rem' }}>
          Camera access denied. Allow camera permission in your browser settings and reload.
        </p>
        <button className="btn btn-outline btn-sm" onClick={handleClose}>← Go Back</button>
      </div>
    );
  }

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.82rem', color: '#555' }}>
          {status === 'starting' ? '⏳ Starting camera...' : '📷 Point at the QR code'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Front / Back toggle */}
          <button
            onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
            style={{
              background: '#2e7d32', color: 'white', border: 'none',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem',
            }}
          >
            {facingMode === 'environment' ? '🤳 Front' : '📷 Back'}
          </button>
          <button
            onClick={handleClose}
            style={{
              background: '#f5f5f5', color: '#555', border: '1px solid #ddd',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem',
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Scanner viewport — stable unique ID, never reused */}
      <div
        id={containerIdRef.current}
        style={{
          width: '100%', minHeight: 260, borderRadius: 10,
          overflow: 'hidden', background: '#111',
          border: '2px solid #2e7d32',
        }}
      />

      <p style={{ fontSize: '0.72rem', color: '#aaa', textAlign: 'center', marginTop: 6 }}>
        {facingMode === 'environment' ? '📷 Back camera' : '🤳 Front camera'}
        {status === 'running' ? ' · Scanning' : ''}
      </p>
    </div>
  );
}
