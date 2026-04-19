import { useState } from 'react';

/**
 * Full-screen feedback modal shown after service completion.
 * Props:
 *   request  — the completed service_request object
 *   onSubmit(rating, feedback) — called when citizen submits
 *   onClose() — called when citizen dismisses (skips)
 *   loading   — bool
 *   error     — string
 */
export default function FeedbackModal({ request, onSubmit, onClose, loading, error }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState('');

  const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit(rating, feedback);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 36,
        width: '100%', maxWidth: 460,
        boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
        <h2 style={{ color: '#2e7d32', fontSize: '1.3rem', marginBottom: 6 }}>Service Completed!</h2>
        <p style={{ color: '#757575', fontSize: '0.9rem', marginBottom: 4 }}>
          Your request has been resolved.
        </p>
        <div style={{
          background: '#f5f5f5', borderRadius: 8, padding: '10px 16px',
          marginBottom: 24, fontSize: '0.88rem', color: '#333'
        }}>
          <strong>{request.title}</strong>
          {request.team_name && <div style={{ color: '#1565c0', marginTop: 4 }}>⚡ Handled by: {request.team_name}</div>}
        </div>

        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: '#212121' }}>
          How would you rate this service?
        </p>

        {/* Star rating */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <span
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              style={{
                fontSize: '2.4rem', cursor: 'pointer', transition: 'transform 0.1s',
                transform: (hovered || rating) >= s ? 'scale(1.15)' : 'scale(1)',
                color: (hovered || rating) >= s ? '#F5A623' : '#ddd',
                userSelect: 'none'
              }}
            >★</span>
          ))}
        </div>

        {/* Rating label */}
        <div style={{
          height: 24, marginBottom: 20, fontSize: '0.9rem', fontWeight: 600,
          color: '#F5A623', transition: 'opacity 0.2s',
          opacity: (hovered || rating) ? 1 : 0
        }}>
          {LABELS[hovered || rating]}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12, textAlign: 'left' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Share your experience (optional)..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e0e0e0', fontSize: '0.9rem',
              resize: 'vertical', minHeight: 80, marginBottom: 16,
              outline: 'none', fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={rating === 0 || loading}
              className="btn btn-orange"
              style={{ flex: 1, opacity: rating === 0 ? 0.5 : 1 }}
            >
              {loading ? 'Submitting...' : '⭐ Submit Rating'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
