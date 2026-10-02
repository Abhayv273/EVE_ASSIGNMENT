
import { useNavigate } from 'react-router-dom';
import '../styles/navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('auth_user') || 'null');

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand"> 
         EVE Healthcare</div>
      <div>
        {user ? (
          <div className="navbar-user-box">
            <span className="user-info">
              <strong>{user.name}</strong> ({user.role})
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not Authenticated</span>
        )}
      </div>
    </nav>
  );
}