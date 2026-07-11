import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookingCalendar from '../components/BookingCalendar';

export default function MentorProfile() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`/mentors/${id}`);
        if (!res.ok) throw new Error('Mentor not found');
        setMentor(await res.json());
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [id, authFetch]);

  if (error) return <main id="main-content"><p role="alert">{error}</p></main>;
  if (!mentor) return <main id="main-content"><p>Loading mentor profile…</p></main>;

  return (
    <main id="main-content" className="mentor-profile-page">
      <h1>{mentor.displayName}</h1>
      <ul className="mentor-tags" aria-label="Areas of expertise">
        {mentor.expertise?.map((s) => <li key={s} className="tag">{s}</li>)}
      </ul>
      {mentor.bio && <p>{mentor.bio}</p>}

      <BookingCalendar mentor={mentor} />
    </main>
  );
}
