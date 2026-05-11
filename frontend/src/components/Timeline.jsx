import React, { useEffect, useRef, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { getAnalysis } from '../api/client';

export default function Timeline({ videoId, onTimestampClick, isProcessing = false }) {
  const [timestamps, setTimestamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!videoId) return;

    const requestId = ++requestSeq.current;
    let stopped = false;
    setTimestamps([]);

    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const data = await getAnalysis(videoId);
        if (stopped || requestSeq.current !== requestId) return;
        if (data && data.timestamps) {
          setTimestamps(data.timestamps);
        }
      } catch (err) {
        if (stopped || requestSeq.current !== requestId) return;
        console.error("Failed to fetch timeline", err);
      } finally {
        if (!stopped && requestSeq.current === requestId) {
          setLoading(false);
        }
      }
    };

    fetchTimeline();
    const interval = isProcessing
      ? window.setInterval(() => {
          void fetchTimeline();
        }, 1500)
      : null;

    return () => {
      stopped = true;
      if (interval) window.clearInterval(interval);
      requestSeq.current += 1;
    };
  }, [videoId, isProcessing]);

  if (!videoId) {
    return null; // Don't show timeline if no video or no timestamps
  }

  if (isProcessing && timestamps.length === 0) {
    return (
      <div className="glass-panel" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.25rem', fontFamily: 'Literata, serif', color: 'var(--primary)' }}>
          <Clock size={18} color="var(--primary)" /> Video Chapters
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Building chapters as the transcript finishes processing...</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
          <div className="skeleton-card" style={{ padding: '0.85rem', minHeight: '72px' }}>
            <div className="skeleton skeleton-line" style={{ width: '48%', marginBottom: '0.6rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '86%' }} />
          </div>
          <div className="skeleton-card" style={{ padding: '0.85rem', minHeight: '72px' }}>
            <div className="skeleton skeleton-line" style={{ width: '42%', marginBottom: '0.6rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '78%' }} />
          </div>
          <div className="skeleton-card" style={{ padding: '0.85rem', minHeight: '72px' }}>
            <div className="skeleton skeleton-line" style={{ width: '52%', marginBottom: '0.6rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '68%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (timestamps.length === 0) {
    return null; // Don't show timeline if no video or no timestamps
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'Literata, serif', color: 'var(--primary)' }}>
        <Clock size={18} color="var(--primary)" /> Video Chapters
      </h3>
      
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading chapters...</p>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {timestamps.map((ts, idx) => (
            <button
              key={idx}
              onClick={() => onTimestampClick && onTimestampClick(ts.time)}
              style={{
                flexShrink: 0,
                background: 'var(--surface-container)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.5rem 1rem',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--on-primary-fixed-variant)', marginBottom: '0.25rem', fontWeight: 600 }}>
                {formatTime(ts.time)}
              </span>
              <span style={{ fontSize: '0.9rem', textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ts.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
