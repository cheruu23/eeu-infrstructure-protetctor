import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * QRScanner — camera-based QR code scanner with front/back toggle
 *
 * Props:
 *   onScan(decodedText) — called when a QR is successfully decoded
 *   onError(msg)        — called on camera/permission error
 *   onClose()           — called when user dismisses the scanner
 */
export default function QRScanner({ onScan, onError, onClose }) {
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back, 'user' = front
  const [starting, setStarting] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef(null);
  const containerId = 'qr-scanner-container';

  const startScanner = async (facing) => {
    setStarting(true);
    try {
      // Stop existing scanner if running
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: facing },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // Stop scanner after successful scan
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {} // ignore per-frame errors
      );
      setStarting(false);
    } catch (err) {
      setStarting(false);
      if (err.toString().includes('Permission') || err.toString().includes('NotAllowed')) {
        setPermissionDenied(true);
        if (onError) onError('Camera permission denied. Please allow camera access.');
      } else if (facing === 'environment') {
        // Back camera not available — try front
        setFacingMode('user');
      } else {
        if (onError) onError('Could not start camera: ' + err.toString());
      }
    }
  };

  useEffect(() => {
    startScanner(facingMode);
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [facingMode]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (permissionDenied) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📷</div>
        <p style={{ color: '#c62828', marginBottom: 16, fontSize: '0.9rem' }}>
          Camera access denied. Please allow camera permission in your browser settings.
        </p>
        <button className="btn btn-outline btn-sm" onClick={onClose}>← Go Back</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: '0.88rem', color: '#555' }}>
          {starting ? 'Starting camera...' : 'Point at the QR code on the infrastructure'}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Camera switch button */}
          <button
            onClick={switchCamera}
            title={facingMode === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
            style={{
              background: '#2e7d32', color: 'white', border: 'none',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
              fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5
            }}
          >
            {facingMode === 'environment' ? '🤳 Front' : '📷 Back'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#f5f5f5', color: '#555', border: '1px solid #ddd',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem'
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Scanner viewport */}
      <div
        id={containerId}
        style={{
          width: '100%', borderRadius: 10, overflow: 'hidden',
          background: '#000', minHeight: 260,
          border: '2px solid #2e7d32'
        }}
      />

      <p style={{ fontSize: '0.78rem', color: '#aaa', textAlign: 'center', marginTop: 8 }}>
        {facingMode === 'environment' ? '📷 Using back camera' : '🤳 Using front camera'}
      </p>
    </div>
  );
}
