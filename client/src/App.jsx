import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BandwidthProvider } from './context/BandwidthContext';
import LowBandwidthToggle from './components/LowBandwidthToggle';
import Login from './pages/Login';
import MentorList from './pages/MentorList';
import MentorProfile from './pages/MentorProfile';
import Dashboard from './pages/Dashboard';
import MentorProfileEdit from './pages/MentorProfileEdit';
import './styles/main.css';

function RequireAuth({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  const { firebaseUser, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();

  // Close the mobile menu automatically whenever the route changes
  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="app-header">
      <div className="app-header-row">
        <Link to="/" className="brand">SkillShare SDG</Link>
        <button
          type="button"
          className="hamburger-btn"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className={`hamburger-icon ${menuOpen ? 'open' : ''}`} aria-hidden="true">
            <span /><span /><span />
          </span>
        </button>
      </div>

      <nav id="primary-nav" aria-label="Main navigation" className={menuOpen ? 'nav-open' : ''}>
        <Link to="/mentors">Find a Mentor</Link>
        {firebaseUser && <Link to="/dashboard">My Sessions</Link>}
        {firebaseUser && profile?.role === 'mentor' && (
          <Link to="/mentor/profile">Set My Availability</Link>
        )}
        {firebaseUser ? (
          <button className="btn-link" onClick={logout}>
            Log out {profile ? `(${profile.displayName})` : ''}
          </button>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </nav>

      <div className={`app-header-toggle ${menuOpen ? 'nav-open' : ''}`}>
        <LowBandwidthToggle />
      </div>
    </header>
  );
}

function Home() {
  return (
    <main id="main-content">
      <section className="hero">
        <p className="hero-eyebrow">Office hours, for anyone</p>
        <h1>Pin your question to the board.</h1>
        <p className="hero-sub">
          SkillShare SDG connects students and professionals with learners
          from underfunded communities for free academic mentoring, resume
          reviews, and technical skill sharing — no cost, no gatekeeping.
        </p>
        <div className="hero-actions">
          <Link to="/mentors" className="btn btn-primary">Browse mentors</Link>
          <Link to="/login" className="btn btn-secondary">Become a mentor</Link>
        </div>
        <div className="sdg-tags">
          <span className="sdg-tag">SDG 4 · Quality Education</span>
          <span className="sdg-tag">SDG 10 · Reduced Inequalities</span>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BandwidthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mentors" element={<MentorList />} />
            <Route path="/mentors/:id" element={<MentorProfile />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/mentor/profile"
              element={
                <RequireAuth>
                  <MentorProfileEdit />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </BandwidthProvider>
  );
}
