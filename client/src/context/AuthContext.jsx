import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const API_URL = process.env.REACT_APP_API_URL;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // Mongo user document
  const [loading, setLoading] = useState(true);

  // Fetch the Mongo profile for the current Firebase session
  async function loadProfile(fbUser) {
    if (!fbUser) {
      setProfile(null);
      return;
    }
    const token = await fbUser.getIdToken();
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProfile(await res.json());
    } else {
      setProfile(null); // not yet registered in Mongo (needs role selection)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await loadProfile(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function register({ email, password, role, displayName }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        role,
        displayName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const newProfile = await res.json();
    setProfile(newProfile);
    return newProfile;
  }

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle(role) {
    const cred = await signInWithPopup(auth, googleProvider);
    const token = await cred.user.getIdToken();
    // Try registering (idempotent server-side) so first-time Google users get a profile too
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        role: role || 'mentee',
        displayName: cred.user.displayName || cred.user.email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    if (res.ok) setProfile(await res.json());
  }

  async function logout() {
    await signOut(auth);
    setProfile(null);
  }

  async function authFetch(path, options = {}) {
    const token = await auth.currentUser?.getIdToken();
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  const value = {
    firebaseUser,
    profile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
