'use client';

import React from 'react';
import { Track } from '@/lib/mockData';
import { usePlayer } from '@/lib/PlayerContext';

import Link from 'next/link';

interface TrackCardProps {
  track: Track;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack(track);
  };

  return (
    <Link href={`/track/${track.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div 
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'transform 0.2s, background-color 0.2s',
          border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border)',
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1/1',
        }}>
          <img 
            src={track.thumbnailUrl} 
            alt={track.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div 
            onClick={handlePlayClick}
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: isCurrent && isPlaying ? 'var(--accent)' : 'var(--primary)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              zIndex: 10,
              fontSize: '1.2rem'
            }}
          >
            {isCurrent && isPlaying ? '⏸️' : '▶️'}
          </div>
        </div>
        <div style={{ padding: '0.75rem' }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '0.9rem', 
            marginBottom: '0.25rem', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            color: isCurrent ? 'var(--primary)' : 'inherit'
          }}>
            {track.title}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{track.artist}</span>
            <span>{track.category}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
