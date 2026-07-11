import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Login() {
  const { register, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('mentee');
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register({ ...form, role });
      } else {
        await login(form.email, form.password);
      }
      navigate('/mentors');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="auth-page">
      <section className="auth-visual" aria-hidden="true">
        <div className="auth-visual-inner">
          <p className="hero-eyebrow">SkillShare SDG</p>
          <h2 className="auth-visual-quote">
            "The best way to learn is to have someone hold the door open for you."
          </h2>
          <ul className="auth-facts">
            <li>Free, always</li>
            <li>1:1 sessions, 30–45 min</li>
            <li>Coding · Math · English · Careers</li>
          </ul>
          <div className="corkboard-swatch">
            <span className="mini-card" />
            <span className="mini-card" />
            <span className="mini-card" />
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h1>{mode === 'login' ? 'Log in' : 'Join the board'}</h1>

          <div className="tab-switch" role="tablist" aria-label="Choose login or register">
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label htmlFor="displayName">Full name</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={form.displayName}
                  onChange={handleChange}
                />

                <fieldset>
                  <legend>I am a…</legend>
                  <div className="role-choice">
                    <label className={`role-card ${role === 'mentee' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="mentee"
                        checked={role === 'mentee'}
                        onChange={() => setRole('mentee')}
                      />
                      <span className="role-title">Learner</span>
                      <span className="role-sub">Looking for mentorship</span>
                    </label>
                    <label className={`role-card ${role === 'mentor' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="mentor"
                        checked={role === 'mentor'}
                        onChange={() => setRole('mentor')}
                      />
                      <span className="role-title">Mentor</span>
                      <span className="role-sub">Offering my time</span>
                    </label>
                  </div>
                </fieldset>
              </>
            )}

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
            />

            {error && <p role="alert" className="form-error">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
            <div style={{ marginTop: '10px' }}>
            <Link to="/forgot-password">Forgot Password?</Link>
  </div>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button type="button" className="btn btn-google" onClick={() => loginWithGoogle(role)}>
            Continue with Google
          </button>
        </div>
      </section>
    </main>
  );
}
