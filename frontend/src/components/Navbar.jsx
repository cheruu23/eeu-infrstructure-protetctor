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
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F5A623 40%, #4CAF50 40%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <div style={{ width: 4, height: 28, background: 'white', borderRadius: 2 }} />
        </div>
        {t.appName}
      </div>
      {user && (
        <div className="navbar-user">
          <LangSwitcher />
          <span style={{ opacity: 0.85 }}>{user.name} · <span style={{ color: '#F5A623', textTransform: 'capitalize' }}>{user.role}</span></span>
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      )}
    </nav>
  );
}
