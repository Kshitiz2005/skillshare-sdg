import React, { createContext, useContext, useState, useEffect } from 'react';

const BandwidthContext = createContext(null);
const STORAGE_KEY = 'skillshare_low_bandwidth';

export function BandwidthProvider({ children }) {
  const [lowBandwidth, setLowBandwidth] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(lowBandwidth));
    } catch {
      /* localStorage unavailable, ignore */
    }
    // Toggle a body class so plain CSS can hide heavy assets globally too
    document.body.classList.toggle('low-bandwidth', lowBandwidth);
  }, [lowBandwidth]);

  return (
    <BandwidthContext.Provider value={{ lowBandwidth, setLowBandwidth }}>
      {children}
    </BandwidthContext.Provider>
  );
}

export function useBandwidth() {
  const ctx = useContext(BandwidthContext);
  if (!ctx) throw new Error('useBandwidth must be used within BandwidthProvider');
  return ctx;
}
