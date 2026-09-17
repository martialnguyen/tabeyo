import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client.js';

function getSessionId() {
  const key = 'anipadVisitSessionId';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const nextId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(key, nextId);
  return nextId;
}

function getTodayKey() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;

    const path = `${location.pathname}${location.search}`;
    const visitKey = `anipadVisit:${getTodayKey()}:${path}`;
    if (sessionStorage.getItem(visitKey)) return;
    sessionStorage.setItem(visitKey, '1');

    api
      .post('/visits', {
        path,
        title: document.title,
        referrer: document.referrer,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        sessionId: getSessionId()
      })
      .catch(() => {
        sessionStorage.removeItem(visitKey);
      });
  }, [location.pathname, location.search]);

  return null;
}
