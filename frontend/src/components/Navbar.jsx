import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useNavigate } from 'react-router-dom';
import LangSwitcher from './LangSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img
          src="/eeu-logo.png"
          alt="EEU Logo"
          style={{ height: 36, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
        />
        <span className="navbar-brand-text">{t.appName}</span>
      </div>

      {user && (
        <div className="navbar-user">
          <LangSwitcher />
          <span className="navbar-user-name" style={{ opacity: 0.85 }}>
            {user.name} · <span style={{ color: '#F5A623', textTransform: 'capitalize' }}>{user.role}</span>
          </span>
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      )}
    </nav>
  );
}
