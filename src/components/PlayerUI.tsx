'use client';

import React from 'react';
import { usePlayer } from '@/lib/PlayerContext';

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PlayerUI: React.FC = () => {
  const { currentTrack, isPlaying, isSample, togglePlay, progress, duration, seek } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="container" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      height: '100%',
      width: '100%'
    }}>
      <img 
        src={currentTrack.thumbnailUrl} 
        alt={currentTrack.title} 
        style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }}
      />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '0.85rem', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isSample && (
            <span style={{ 
              fontSize: '0.6rem', 
              backgroundColor: 'var(--accent)', 
              color: 'white', 
              padding: '1px 4px', 
              borderRadius: '2px' 
            }}>
              試聴
            </span>
          )}
          {currentTrack.title}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          {currentTrack.artist}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 2, gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={togglePlay} style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '30px' }}>
            {formatTime(progress)}
          </span>
          <input 
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={(e) => seek(parseFloat(e.target.value))}
            style={{
              flex: 1,
              height: '4px',
              accentColor: 'var(--primary)',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '30px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
