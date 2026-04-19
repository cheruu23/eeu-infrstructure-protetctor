import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import LangSwitcher from '../components/LangSwitcher';

const FEATURES = [
  { icon: '⚡', titleKey: 'submitRequest',   desc: { en: 'Submit electricity service requests online — no queues.', am: 'ያለ ወረፋ የኤሌክትሪክ አገልግሎት ጥያቄ ያስገቡ።', or: 'Gaaffii tajaajila elektirikii toora interneetiin galchi.' } },
  { icon: '📍', titleKey: 'reportProblem',   desc: { en: 'Report infrastructure damage with GPS or QR code.', am: 'በGPS ወይም QR ኮድ የመሠረተ ልማት ጉዳት ሪፖርት ያድርጉ።', or: 'Miidhaa misooma bu\'uuraa GPS ykn QR kodiitiin gabaasi.' } },
  { icon: '🔍', titleKey: 'overview',        desc: { en: 'Track your request status in real time.', am: 'የጥያቄዎን ሁኔታ በቀጥታ ይከታተሉ።', or: 'Haala gaaffii kee yeroo dhugaa hordofi.' } },
  { icon: '⭐', titleKey: 'completed',       desc: { en: 'Rate completed services and give feedback.', am: 'የተጠናቀቁ አገልግሎቶችን ይገምግሙ።', or: 'Tajaajila xumurame madaali.' } },
];

const STATS = [
  { value: '24/7', label: { en: 'Service Availability', am: 'የአገልግሎት ዝግጁነት', or: 'Argamummaa Tajaajilaa' } },
  { value: '4', label: { en: 'User Roles', am: 'የተጠቃሚ ሚናዎች', or: 'Gahee Fayyadamaa' } },
  { value: '100%', label: { en: 'Digital Process', am: 'ዲጂታል ሂደት', or: 'Haala Dijitaalaa' } },
  { value: '🗺️', label: { en: 'GPS Tracking', am: 'GPS ክትትል', or: 'Hordoffii GPS' } },
];

export default function Home() {
  const navigate = useNavigate();
  const { lang, t } = useLang();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)',
        color: 'white', padding: '0 24px',
      }}>
        {/* Top bar */}
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #F5A623 45%, #4CAF50 45%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <div style={{ width: 4, height: 28, background: 'white', borderRadius: 2 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t.appName}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{t.appSub}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LangSwitcher />
            <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 20px' }}
              onClick={() => navigate('/login')}>{t.login}</button>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 0 80px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', background: 'rgba(245,166,35,0.25)', color: '#F5A623', display: 'inline-block', padding: '4px 16px', borderRadius: 20, marginBottom: 20, fontWeight: 600 }}>
            🇪🇹 {t.appName}
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>
            {t.tagline}
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.85, maxWidth: 560, margin: '0 auto 36px' }}>
            {lang === 'am'
              ? 'ጥያቄዎችን ያስገቡ፣ ችግሮችን ሪፖርት ያድርጉ እና አገልግሎቶችን ይከታተሉ — ሁሉም በአንድ ቦታ።'
              : lang === 'or'
              ? 'Gaaffii galchi, rakkoo gabaasi, tajaajila hordofi — hundumtuu bakka tokkotti.'
              : 'Submit requests, report problems, and track services — all in one place.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" style={{ background: '#F5A623', color: 'white', padding: '12px 32px', fontSize: '1rem' }}
              onClick={() => navigate('/login')}>{t.login} →</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '12px 32px', fontSize: '1rem' }}
              onClick={() => navigate('/login')}>{t.register}</button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ background: '#2e7d32', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.value}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F5A623' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{s.label[lang] || s.label.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', color: '#2e7d32', fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
          {lang === 'am' ? 'ዋና ባህሪያት' : lang === 'or' ? 'Amaloota Ijoo' : 'Key Features'}
        </h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 40 }}>
          {lang === 'am' ? 'ስርዓቱ ምን ያቀርባል' : lang === 'or' ? 'Sirni maal dhiyeessa' : 'What the system offers'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.titleKey} style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderTop: '4px solid #2e7d32' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, color: '#2e7d32', marginBottom: 8, fontSize: '1rem' }}>{t[f.titleKey]}</div>
              <div style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6 }}>{f.desc[lang] || f.desc.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roles section ── */}
      <div style={{ background: '#e8f5e9', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#2e7d32', fontSize: '1.4rem', fontWeight: 700, marginBottom: 32 }}>
            {lang === 'am' ? 'ለማን ነው?' : lang === 'or' ? 'Eenyuuf?' : 'Who is it for?'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { role: 'citizen', icon: '👤', color: '#1565c0', desc: { en: 'Submit requests & report infrastructure problems', am: 'ጥያቄ ያስገቡ እና ችግሮችን ሪፖርት ያድርጉ', or: 'Gaaffii galchi, rakkoo gabaasi' } },
              { role: 'approver', icon: '✅', color: '#2e7d32', desc: { en: 'Review and approve citizen requests', am: 'የዜጎችን ጥያቄ ይገምግሙ እና ያጸድቁ', or: 'Gaaffii lammii ilaalii raggaasi' } },
              { role: 'electrician', icon: '⚡', color: '#F5A623', desc: { en: 'Handle assigned field work', am: 'የተመደቡ የሜዳ ስራዎችን ያከናውኑ', or: 'Hojii dirree ramadame hojjedhu' } },
              { role: 'admin', icon: '🛡️', color: '#6a1b9a', desc: { en: 'Manage users, assets and system data', am: 'ተጠቃሚዎችን፣ ንብረቶችን እና ስርዓቱን ያስተዳድሩ', or: 'Fayyadamtoota, qabeenya fi deetaa bulchi' } },
            ].map(r => (
              <div key={r.role} style={{ background: 'white', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, color: r.color, marginBottom: 6 }}>{t[r.role]}</div>
                <div style={{ fontSize: '0.82rem', color: '#666' }}>{r.desc[lang] || r.desc.en}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: '#1b5e20', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '24px', fontSize: '0.82rem' }}>
        © {new Date().getFullYear()} {t.appName} · {t.appSub}
      </div>
    </div>
  );
}
