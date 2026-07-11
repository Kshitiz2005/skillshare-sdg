import React from 'react';
import { useBandwidth } from '../context/BandwidthContext';

/**
 * Accessible toggle switch. Uses a real <button> with aria-pressed
 * so screen readers announce state changes, and is fully keyboard
 * operable (Enter/Space) without any extra JS.
 */
export default function LowBandwidthToggle() {
  const { lowBandwidth, setLowBandwidth } = useBandwidth();

  return (
    <button
      type="button"
      className="bandwidth-toggle"
      aria-pressed={lowBandwidth}
      onClick={() => setLowBandwidth((prev) => !prev)}
    >
      <span aria-hidden="true" className={`toggle-track ${lowBandwidth ? 'on' : ''}`}>
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">
        {lowBandwidth ? 'Low-bandwidth mode: On' : 'Low-bandwidth mode: Off'}
      </span>
    </button>
  );
}
