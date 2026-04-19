import { useLang } from '../context/LangContext';

const LANGS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'am', label: 'አማ', full: 'አማርኛ' },
  { code: 'or', label: 'OR', full: 'Afaan Oromoo' },
];

export default function LangSwitcher({ dark = false }) {
  const { lang, changeLang } = useLang();
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {LANGS.map(l => (
        <button key={l.code} onClick={() => changeLang(l.code)} title={l.full} style={{
          padding: '4px 10px', borderRadius: 6, border: dark ? '1px solid #ddd' : 'none',
          cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
          background: lang === l.code
            ? (dark ? '#2e7d32' : 'rgba(255,255,255,0.3)')
            : (dark ? '#f5f5f5' : 'rgba(255,255,255,0.1)'),
          color: lang === l.code ? (dark ? 'white' : 'white') : (dark ? '#555' : 'rgba(255,255,255,0.8)'),
        }}>{l.label}</button>
      ))}
    </div>
  );
}
