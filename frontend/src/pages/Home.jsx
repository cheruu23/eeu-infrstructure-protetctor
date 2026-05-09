import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';

const FEATURES = [
  { icon: '⚡', titleKey: 'submitRequest',   desc: { en: 'Submit electricity service requests online — no queues.', am: 'ያለ ወረፋ የኤሌክትሪክ አገልግሎት ጥያቄ ያስገቡ።', or: "Gaaffii tajaajila elektirikii toora interneetiin galchi." } },
  { icon: '📍', titleKey: 'reportProblem',   desc: { en: 'Report infrastructure damage with GPS or QR code.', am: 'በGPS ወይም QR ኮድ የመሠረተ ልማት ጉዳት ሪፖርት ያድርጉ።', or: "Miidhaa misooma bu'uuraa GPS ykn QR kodiitiin gabaasi." } },
  { icon: '🔍', titleKey: 'overview',        desc: { en: 'Track your request status in real time.', am: 'የጥያቄዎን ሁኔታ በቀጥታ ይከታተሉ።', or: 'Haala gaaffii kee yeroo dhugaa hordofi.' } },
  { icon: '⭐', titleKey: 'completed',       desc: { en: 'Rate completed services and give feedback.', am: 'የተጠናቀቁ አገልግሎቶችን ይገምግሙ።', or: 'Tajaajila xumurame madaali.' } },
];

const STATS = [
  { value: '24/7', label: { en: 'Service Availability', am: 'የአገልግሎት ዝግጁነት', or: 'Argamummaa Tajaajilaa' } },
  { value: '4',    label: { en: 'User Roles',           am: 'የተጠቃሚ ሚናዎች',    or: 'Gahee Fayyadamaa' } },
  { value: '100%', label: { en: 'Digital Process',      am: 'ዲጂታል ሂደት',       or: 'Haala Dijitaalaa' } },
  { value: '🗺️',  label: { en: 'GPS Tracking',         am: 'GPS ክትትል',        or: 'Hordoffii GPS' } },
];

export default function Home() {
  const navigate = useNavigate();
  const { lang, t } = useLang();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* ── Hero section ── */}
      <div style={{ background: 'linear-gradient(160deg, #1b5e20 0%, #2e7d32 55%, #388e3c 100%)', color: 'white', padding: '0 20px' }}>

        {/* Top navigation bar */}
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'white',
              borderRadius: 10,
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}>
              <img src="/eeu-logo.png" alt="EEU" style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>{t.appName}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>{t.appSub}</div>
            </div>
          </div>

          {/* Right: lang + login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LangSwitcher />
            <button
              className="btn"
              style={{ background: '#F5A623', color: 'white', border: 'none', padding: '8px 22px', fontWeight: 700, fontSize: '0.9rem', borderRadius: 8 }}
              onClick={() => navigate('/login')}
            >
              {t.login}
            </button>
          </div>
        </div>

        {/* Hero center content */}
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 0 72px', textAlign: 'center' }}>

          {/* Large centered logo */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: 20,
            padding: '14px 28px',
            marginBottom: 28,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          }}>
            <img
              src="/eeu-logo.png"
              alt="Ethiopian Electric Utility"
              style={{ height: 64, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </div>

          <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            {t.tagline}
          </h1>
          <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
            {lang === 'am'
              ? 'ጥያቄዎችን ያስገቡ፣ ችግሮችን ሪፖርት ያድርጉ እና አገልግሎቶችን ይከታተሉ — ሁሉም በአንድ ቦታ።'
              : lang === 'or'
              ? 'Gaaffii galchi, rakkoo gabaasi, tajaajila hordofi — hundumtuu bakka tokkotti.'
              : 'Submit requests, report problems, and track services — all in one place.'}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              style={{ background: '#F5A623', color: 'white', padding: '12px 32px', fontSize: '1rem', fontWeight: 700, borderRadius: 10, boxShadow: '0 4px 16px rgba(245,166,35,0.4)' }}
              onClick={() => navigate('/login')}
            >
              {t.login} →
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.35)', padding: '12px 32px', fontSize: '1rem', borderRadius: 10 }}
              onClick={() => navigate('/login')}
            >
              {t.register}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ background: '#1b5e20', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.value}>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#F5A623' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{s.label[lang] || s.label.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px' }}>
        <h2 style={{ textAlign: 'center', color: '#2e7d32', fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>
          {lang === 'am' ? 'ዋና ባህሪያት' : lang === 'or' ? 'Amaloota Ijoo' : 'Key Features'}
        </h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 36, fontSize: '0.9rem' }}>
          {lang === 'am' ? 'ስርዓቱ ምን ያቀርባል' : lang === 'or' ? 'Sirni maal dhiyeessa' : 'What the system offers'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {FEATURES.map(f => (
            <div key={f.titleKey} style={{
              background: 'white', borderRadius: 14, padding: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              borderTop: '4px solid #2e7d32',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, color: '#2e7d32', marginBottom: 6, fontSize: '0.95rem' }}>{t[f.titleKey]}</div>
              <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>{f.desc[lang] || f.desc.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roles ── */}
      <div style={{ background: '#e8f5e9', padding: '44px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#2e7d32', fontSize: '1.3rem', fontWeight: 700, marginBottom: 28 }}>
            {lang === 'am' ? 'ለማን ነው?' : lang === 'or' ? 'Eenyuuf?' : 'Who is it for?'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
            {[
              { role: 'citizen',     icon: '👤', color: '#1565c0', desc: { en: 'Submit requests & report infrastructure problems', am: 'ጥያቄ ያስገቡ እና ችግሮችን ሪፖርት ያድርጉ', or: 'Gaaffii galchi, rakkoo gabaasi' } },
              { role: 'approver',    icon: '✅', color: '#2e7d32', desc: { en: 'Review and approve citizen requests',             am: 'የዜጎችን ጥያቄ ይገምግሙ እና ያጸድቁ',       or: 'Gaaffii lammii ilaalii raggaasi' } },
              { role: 'electrician', icon: '⚡', color: '#e65100', desc: { en: 'Handle assigned field work',                     am: 'የተመደቡ የሜዳ ስራዎችን ያከናውኑ',          or: 'Hojii dirree ramadame hojjedhu' } },
              { role: 'admin',       icon: '🛡️', color: '#6a1b9a', desc: { en: 'Manage users, assets and system data',           am: 'ተጠቃሚዎችን፣ ንብረቶችን እና ስርዓቱን ያስተዳድሩ', or: 'Fayyadamtoota, qabeenya fi deetaa bulchi' } },
            ].map(r => (
              <div key={r.role} style={{ background: 'white', borderRadius: 12, padding: 18, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, color: r.color, marginBottom: 5, fontSize: '0.9rem' }}>{t[r.role]}</div>
                <div style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>{r.desc[lang] || r.desc.en}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: '#1b5e20', padding: '20px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'white', borderRadius: 8, padding: '3px 6px' }}>
              <img src="/eeu-logo.png" alt="EEU" style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>{t.appName}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
            © {new Date().getFullYear()} · {t.appSub}
          </div>
        </div>
      </div>
    </div>
  );
}
