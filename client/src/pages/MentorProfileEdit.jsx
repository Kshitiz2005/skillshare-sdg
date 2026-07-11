import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = ['Coding', 'Mathematics', 'English', 'Career Coaching', 'Science', 'Test Prep'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Mandarin', 'Arabic'];

function emptySlot() {
  return { day: 'Mon', startTime: '16:00', endTime: '17:00' };
}

export default function MentorProfileEdit() {
  const { profile, authFetch } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [availability, setAvailability] = useState([emptySlot()]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile && profile.role !== 'mentor') {
      navigate('/mentors');
      return;
    }
    if (profile) {
      setBio(profile.bio || '');
      setExpertise(profile.expertise || []);
      setLanguages(profile.languages || []);
      setTimezone(profile.timezone || timezone);
      setAvailability(profile.availability?.length ? profile.availability : [emptySlot()]);
    }
  }, [profile]);

  function toggleExpertise(subject) {
    setExpertise((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  function toggleLanguage(lang) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function updateSlot(index, field, value) {
    setAvailability((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  }

  function addSlot() {
    setAvailability((prev) => [...prev, emptySlot()]);
  }

  function removeSlot(index) {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('Saving…');

    for (const slot of availability) {
      if (slot.startTime >= slot.endTime) {
        setStatus('');
        setError(`Fix the ${slot.day} slot — start time must be before end time.`);
        return;
      }
    }
    if (expertise.length === 0) {
      setStatus('');
      setError('Pick at least one subject you can help with.');
      return;
    }

    try {
      const res = await authFetch('/mentors/me', {
        method: 'PATCH',
        body: JSON.stringify({ bio, expertise, languages, timezone, availability }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to save profile');
      }
      setStatus('Saved. Your card is live on the board.');
    } catch (err) {
      setStatus('');
      setError(err.message);
    }
  }

  if (!profile) return <main id="main-content"><p>Loading your profile…</p></main>;

  return (
    <main id="main-content" className="mentor-edit-page">
      <h1>Set your office hours</h1>
      <p>
        This is what learners see on the board: the subjects you can help
        with, and the times you're free to meet.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="bio">Short bio</label>
        <textarea
          id="bio"
          maxLength={500}
          rows={5}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A sentence or two about what you can help with and how you teach."
        />
        <p className="char-count">{bio.length}/500</p>

        <fieldset>
          <legend>Subjects you can help with</legend>
          <div className="checkbox-grid">
            {SUBJECTS.map((subject) => (
              <label key={subject} className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={expertise.includes(subject)}
                  onChange={() => toggleExpertise(subject)}
                />
                {subject}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Languages you teach in</legend>
          <div className="checkbox-grid">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={languages.includes(lang)}
                  onChange={() => toggleLanguage(lang)}
                />
                {lang}
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="timezone">Your timezone</label>
        <input
          id="timezone"
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />

        <fieldset>
          <legend>Weekly availability</legend>

          <ul className="slot-editor-list">
            {availability.map((slot, index) => (
              <li key={index} className="slot-editor-row">
                <label className="sr-only" htmlFor={`day-${index}`}>Day</label>
                <select
                  id={`day-${index}`}
                  value={slot.day}
                  onChange={(e) => updateSlot(index, 'day', e.target.value)}
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                <label className="sr-only" htmlFor={`start-${index}`}>Start time</label>
                <input
                  id={`start-${index}`}
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                />

                <span aria-hidden="true">to</span>

                <label className="sr-only" htmlFor={`end-${index}`}>End time</label>
                <input
                  id={`end-${index}`}
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                />

                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => removeSlot(index)}
                  aria-label={`Remove ${slot.day} ${slot.startTime} to ${slot.endTime} slot`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="btn" onClick={addSlot}>
            + Add another slot
          </button>
        </fieldset>

        {error && <p role="alert" className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary">Save office hours</button>
        <div aria-live="polite">{status && <p>{status}</p>}</div>
      </form>
    </main>
  );
}
