import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { profile, authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  const needsSetup =
    profile?.role === 'mentor' &&
    (!profile.expertise?.length || !profile.availability?.length);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/bookings/me');
        if (!res.ok) throw new Error('Failed to load sessions');
        setBookings(await res.json());
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [authFetch]);

  async function updateStatus(bookingId, status) {
    const res = await authFetch(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBookings((prev) => prev.map((b) => (b._id === updated._id ? { ...b, status } : b)));
    }
  }

  const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status));
  const past = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));

  return (
    <main id="main-content" className="dashboard-page">
      <h1>My Sessions</h1>
      {error && <p role="alert">{error}</p>}

      {needsSetup && (
        <div className="setup-banner">
          <p>
            <strong>Your card isn't on the board yet.</strong> Add your
            subjects and weekly availability so learners can find and book you.
          </p>
          <Link to="/mentor/profile" className="btn btn-primary">Set my office hours</Link>
        </div>
      )}

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">Upcoming</h2>
        {upcoming.length === 0 && <p>Nothing on the calendar yet — head to Find a Mentor to book one.</p>}
        <ul className="session-list">
          {upcoming.map((b) => (
            <li key={b._id} className="session-card">
              <p>
                <strong>{b.subject}</strong> with{' '}
                {profile.role === 'mentor' ? b.mentee.displayName : b.mentor.displayName}
              </p>
              <p>{new Date(b.startTime).toLocaleString()}</p>
              <p>Status: {b.status}</p>

              {b.sessionType === 'video' && b.status === 'confirmed' && (
                b.meetingLink ? (
                  <a
                    className="btn btn-primary btn-small"
                    href={b.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Zoom
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => updateStatus(b._id, 'confirmed')}
                  >
                    Zoom link not ready — retry
                  </button>
                )
              )}

              {profile.role === 'mentor' && b.status === 'pending' && (
                <div className="session-actions">
                  <button className="btn" onClick={() => updateStatus(b._id, 'confirmed')}>Confirm</button>
                  <button className="btn btn-secondary" onClick={() => updateStatus(b._id, 'cancelled')}>Decline</button>
                </div>
              )}
              {b.status === 'confirmed' && (
                <button className="btn btn-secondary" onClick={() => updateStatus(b._id, 'cancelled')}>
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="past-heading">
        <h2 id="past-heading">Past</h2>
        {past.length === 0 && <p>No past sessions.</p>}
        <ul className="session-list">
          {past.map((b) => (
            <li key={b._id} className="session-card">
              <p><strong>{b.subject}</strong> — {b.status}</p>
              <p>{new Date(b.startTime).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
