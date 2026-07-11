import React, { useEffect, useState, useCallback } from 'react';
import MentorCard from '../components/MentorCard';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = ['Coding', 'Mathematics', 'English', 'Career Coaching', 'Science', 'Test Prep'];

export default function MentorList() {
  const { authFetch } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [search, setSearch] = useState('');

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (search) params.set('search', search);

      const res = await authFetch(`/mentors?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load mentors');
      setMentors(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [subject, search, authFetch]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  return (
    <main id="main-content" className="mentor-list-page">
      <h1>Find a Mentor</h1>

      <form
        className="filters"
        role="search"
        aria-label="Filter mentors"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="subject-filter">Subject</label>
        <select
          id="subject-filter"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">All subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label htmlFor="mentor-search">Search</label>
        <input
          id="mentor-search"
          type="search"
          placeholder="Search by name or keyword"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div aria-live="polite">
        {loading && <p>Checking the board…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && mentors.length === 0 && (
          <p>Nothing pinned here yet — try a different subject, or check back soon.</p>
        )}
      </div>

      <div className="mentor-grid">
        {mentors.map((mentor) => (
          <MentorCard key={mentor._id} mentor={mentor} />
        ))}
      </div>
    </main>
  );
}
