import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * BookingCalendar renders a week-view availability grid.
 *
 * Per project requirements this grid is built and updated with direct
 * DOM manipulation (createElement/appendChild/classList) rather than
 * React state + JSX for each cell. This keeps re-renders cheap on
 * low-end devices when a mentor has many slots, and demonstrates the
 * "DOM manipulation" requirement explicitly. React still owns the
 * container's lifecycle via a ref.
 */
export default function BookingCalendar({ mentor, onBook }) {
  const gridRef = useRef(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const { authFetch } = useAuth();
  const [status, setStatus] = useState('');

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Clear any previous render before rebuilding
    grid.innerHTML = '';

    // Group availability by day for quick lookup
    const byDay = {};
    (mentor.availability || []).forEach((slot) => {
      byDay[slot.day] = byDay[slot.day] || [];
      byDay[slot.day].push(slot);
    });

    DAY_ORDER.forEach((day) => {
      const col = document.createElement('div');
      col.className = 'calendar-col';
      col.setAttribute('role', 'group');
      col.setAttribute('aria-label', day);

      const heading = document.createElement('h4');
      heading.textContent = day;
      heading.className = 'calendar-day-heading';
      col.appendChild(heading);

      const slots = byDay[day] || [];
      if (slots.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'calendar-empty';
        empty.textContent = 'No slots';
        col.appendChild(empty);
      }

      slots.forEach((slot) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendar-slot';
        btn.textContent = `${slot.startTime}–${slot.endTime}`;
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute(
          'aria-label',
          `Book ${day} ${slot.startTime} to ${slot.endTime} with ${mentor.displayName}`
        );

        btn.addEventListener('click', () => {
          // Clear "selected" styling from any previously-selected button
          grid.querySelectorAll('.calendar-slot.selected').forEach((el) => {
            el.classList.remove('selected');
            el.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('selected');
          btn.setAttribute('aria-pressed', 'true');
          setSelectedSlot({ day, ...slot });
        });

        col.appendChild(btn);
      });

      grid.appendChild(col);
    });
  }, [mentor]);

  async function handleConfirmBooking(e) {
    e.preventDefault();
    if (!selectedSlot) return;

    const form = e.target;
    const subject = form.subject.value;
    const sessionType = form.sessionType.value;

    // Translate the chosen weekday/time slot into a concrete upcoming Date.
    // (Simplified: books the next occurrence of that weekday.)
    const startTime = nextDateForDay(selectedSlot.day, selectedSlot.startTime);
    const endTime = nextDateForDay(selectedSlot.day, selectedSlot.endTime);

    setStatus('Booking…');
    try {
      const res = await authFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: mentor._id,
          subject,
          sessionType,
          startTime,
          endTime,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Booking failed');
      }
      setStatus('Session requested! The mentor will confirm shortly.');
      onBook && onBook();
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <section aria-labelledby="calendar-heading">
      <h2 id="calendar-heading">Weekly availability</h2>
      <p className="calendar-hint">Times shown in mentor's timezone: {mentor.timezone}</p>

      {/* This container is populated imperatively via DOM manipulation, see useEffect above */}
      <div className="calendar-grid" ref={gridRef} />

      {selectedSlot && (
        <form className="booking-form" onSubmit={handleConfirmBooking}>
          <h3>Confirm your session</h3>
          <p>
            Selected: <strong>{selectedSlot.day}, {selectedSlot.startTime}–{selectedSlot.endTime}</strong>
          </p>

          <label htmlFor="subject">Topic</label>
          <select id="subject" name="subject" required>
            {mentor.expertise?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <fieldset>
            <legend>Session format</legend>
            <label>
              <input type="radio" name="sessionType" value="video" defaultChecked /> Video call
            </label>
            <label>
              <input type="radio" name="sessionType" value="text" /> Text-based (low-bandwidth)
            </label>
          </fieldset>

          <button type="submit" className="btn btn-primary">Request session</button>
          <div aria-live="polite">{status && <p>{status}</p>}</div>
        </form>
      )}
    </section>
  );
}

// Returns an ISO string for the next upcoming occurrence of `dayName` at `time` ("HH:mm")
function nextDateForDay(dayName, time) {
  const targetIdx = DAY_ORDER.indexOf(dayName);
  const [hours, minutes] = time.split(':').map(Number);

  const now = new Date();
  const result = new Date(now);
  const diff = (targetIdx + 7 - now.getDay()) % 7;
  result.setDate(now.getDate() + (diff === 0 ? 7 : diff)); // next occurrence, not today
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}
