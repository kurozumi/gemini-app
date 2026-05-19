'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track } from './mockData';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isSample: boolean;
  playTrack: (track: Track, sample?: boolean) => void;
  togglePlay: () => void;
  progress: number;
  duration: number;
  seek: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSample, setIsSample] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      // Sample play limit (e.g., 30 seconds)
      if (isSample && audio.currentTime >= 30) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = 0;
      }
    };
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [isSample]);

  // Handle Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: isSample ? `[試聴] ${currentTrack.title}` : currentTrack.title,
        artist: currentTrack.artist,
        album: 'おやすみASMR',
        artwork: [
          { src: currentTrack.thumbnailUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) audioRef.current.currentTime -= 10;
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (isSample) return; // Disable forward in sample mode
        if (audioRef.current) audioRef.current.currentTime += 10;
      });
    }
  }, [currentTrack, isSample]);

  const playTrack = async (track: Track, sample: boolean = false) => {
    if (!audioRef.current) return;

    const url = sample ? track.sampleUrl : track.audioUrl;
    setIsSample(sample);

    if (currentTrack?.id !== track.id || audioRef.current.src !== url) {
      setCurrentTrack(track);
      audioRef.current.src = url;
      audioRef.current.load();
    }
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Playback failed:", e);
      }
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error("Playback failed:", e);
        }
      }
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      // Don't seek beyond 30s in sample mode
      if (isSample && time > 30) return;
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      isSample,
      playTrack,
      togglePlay,
      progress,
      duration,
      seek
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
