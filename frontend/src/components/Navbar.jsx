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
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #F5A623 40%, #4CAF50 40%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 4, height: 24, background: 'white', borderRadius: 2 }} />
        </div>
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
