import React from 'react';
import { Link } from 'react-router-dom';
import { useBandwidth } from '../context/BandwidthContext';

export default function MentorCard({ mentor }) {
  const { lowBandwidth } = useBandwidth();

  return (
    <article className="mentor-card" aria-label={`Mentor: ${mentor.displayName}`}>
      {}
      {!lowBandwidth && mentor.photoURL && (
        <img
          className="mentor-photo"
          src={mentor.photoURL}
          alt={`Photo of ${mentor.displayName}`}
          loading="lazy"
          width="64"
          height="64"
        />
      )}

      <div className="mentor-info">
        <h3 className="mentor-name">{mentor.displayName}</h3>

        <ul className="mentor-tags" aria-label="Areas of expertise">
          {mentor.expertise?.map((skill) => (
            <li key={skill} className="tag">
              {skill}
            </li>
          ))}
        </ul>

        {mentor.bio && <p className="mentor-bio">{mentor.bio}</p>}

        <p className="mentor-meta">
          <span aria-label={`Rating: ${mentor.rating || 'not yet rated'}`}>
            {mentor.ratingCount > 0 ? `★ ${mentor.rating.toFixed(1)} (${mentor.ratingCount})` : 'New mentor'}
          </span>
          {mentor.languages?.length > 0 && <span> · Speaks {mentor.languages.join(', ')}</span>}
        </p>

        <Link className="btn btn-primary" to={`/mentors/${mentor._id}`}>
          View availability & book
        </Link>
      </div>
    </article>
  );
}
