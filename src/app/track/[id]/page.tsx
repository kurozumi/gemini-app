'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { MOCK_TRACKS } from '@/lib/mockData';
import { usePlayer } from '@/lib/PlayerContext';

export default function TrackDetailPage() {
  const { id } = useParams();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  
  const track = MOCK_TRACKS.find(t => t.id === id);
  const isCurrent = currentTrack?.id === track?.id;

  if (!track) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>コンテンツが見つかりませんでした。</div>;
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Artwork */}
        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <img 
            src={track.thumbnailUrl} 
            alt={track.title} 
            style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 60%, rgba(15, 23, 42, 0.9))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '2rem'
          }}>
            <button 
              onClick={() => isCurrent ? togglePlay() : playTrack(track)}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                fontSize: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 8px 16px rgba(139, 92, 246, 0.4)',
                marginBottom: '1rem'
              }}
            >
              {isCurrent && isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div>
          <span style={{ 
            backgroundColor: 'var(--primary)', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '0.8rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            {track.category}
          </span>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>{track.title}</h2>
          <div style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '2rem' }}>
            {track.artist}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => playTrack(track, false)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'var(--primary)',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                fontSize: '1.1rem'
              }}
            >
              🚀 本編を再生する
            </button>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => playTrack(track, true)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--secondary)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔊 試聴 (30秒)
              </button>
              <button style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'var(--secondary)',
                border: '1px solid var(--border)',
                fontWeight: 'bold'
              }}>
                ⭐ お気に入り
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>概要</h3>
            <p style={{ lineHeight: '1.6' }}>{track.description}</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {track.tags.map(tag => (
              <span key={tag} style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.85rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '4px 10px',
                borderRadius: '4px'
              }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
