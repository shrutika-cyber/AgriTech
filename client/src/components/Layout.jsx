import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const APP_LINKS = [
  ['/dashboard', 'Dashboard'], ['/farms', 'Farms'], ['/crops', 'Crops'], ['/soil', 'Soil'], ['/advisor', 'Crop advisor'],
  ['/alerts', 'Alerts & pests'], ['/weather', 'Weather'], ['/market', 'Marketplace'], ['/community', 'Community'], ['/profile', 'Profile'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  async function doLogout() { await logout(); close(); navigate('/'); }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to={user ? '/dashboard' : '/'} className="brand" onClick={close}><span aria-hidden="true">🌱</span> AgriSmart</Link>
          <button className="menu-btn" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
          <nav id="nav" className={open ? 'open' : ''} aria-label="Main">
            {user ? APP_LINKS.map(([to, label]) => <NavLink key={to} to={to} onClick={close}>{label}</NavLink>) : (
              <>
                <NavLink to="/about" onClick={close}>About</NavLink>
                <NavLink to="/login" onClick={close}>Log in</NavLink>
                <NavLink to="/register" className="btn btn-primary nav-cta" onClick={close}>Register</NavLink>
              </>
            )}
            {user && <button className="btn btn-secondary btn-small" onClick={doLogout}>Log out</button>}
          </nav>
        </div>
      </header>
      <main id="main"><Outlet /></main>
      <footer className="footer">
        <p><strong>AgriSmart</strong>: a student demo project. Weather, marketplace orders and expert consultation are simulated; soil and crop guidance is educational and rule-based.</p>
        <p><Link to="/about">About, privacy &amp; responsible use</Link></p>
      </footer>
    </>
  );
}
