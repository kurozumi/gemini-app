'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  useTracks,
  DisconnectButton,
  TrackToggle
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Track } from 'livekit-client';

import Logger from '@/lib/logger';

function CustomConference({ isBroadcaster }: { isBroadcaster: boolean }) {
  const tracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: true },
  ]);

  // リスナーの場合はホストのトラックのみを表示
  const filteredTracks = isBroadcaster 
    ? tracks 
    : tracks.filter(t => t.participant.identity.endsWith('-host'));

  return (
    <div className="custom-conference">
      <GridLayout tracks={filteredTracks}>
        <ParticipantTile />
      </GridLayout>
      
      <style jsx global>{`
        .custom-conference {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
        }
        .custom-conference .lk-grid-layout {
          display: flex !important;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          background: transparent;
          border: none;
        }
        .custom-conference .lk-participant-tile {
          width: 280px !important;
          height: 280px !important;
          flex: none !important;
          border-radius: 32px;
          background: rgba(15, 15, 25, 0.8) !important;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }
        @media (max-height: 800px) {
          .custom-conference .lk-participant-tile {
            width: 200px !important;
            height: 200px !important;
            border-radius: 24px;
          }
          .custom-conference .lk-grid-layout {
            gap: 1rem;
          }
        }
        @media (max-width: 480px) {
          .custom-conference .lk-participant-tile {
            width: 160px !important;
            height: 160px !important;
            border-radius: 20px;
          }
        }
        .custom-conference .lk-participant-tile:hover {
          transform: translateY(-5px);
          border-color: var(--primary) !important;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6), 0 0 15px rgba(var(--primary-rgb), 0.3);
        }
        .custom-conference .lk-participant-name {
          font-weight: 600;
          font-size: 0.9rem;
          bottom: 16px;
          left: 16px;
          background: rgba(0, 0, 0, 0.6);
          padding: 6px 12px;
          border-radius: 10px;
        }
        .custom-conference .lk-audio-visualizer {
          opacity: 0.8;
        }
        .lk-disconnect-button {
          background-color: #ff4b4b !important;
          color: white !important;
          border-radius: 50px !important;
          padding: 0.8rem 2rem !important;
          font-weight: bold !important;
          border: none !important;
          transition: transform 0.2s, background-color 0.2s !important;
          cursor: pointer !important;
        }
        .lk-disconnect-button:hover {
          background-color: #ff3333 !important;
          transform: scale(1.05);
        }
        /* マイクボタンのテキストを消す */
        .lk-button.lk-track-toggle {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .lk-button.lk-track-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .lk-button.lk-track-toggle > span {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

function LivePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // ステート管理
  const [roomName, setRoomName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasAutoConnected, setHasAutoConnected] = useState(false);

  // 接続処理
  const connectToRoom = useCallback(async (inputRoom: string, role: string) => {
    if (!inputRoom) return;
    setIsConnecting(true);
    try {
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const username = `user-${uuid}`;

      localStorage.setItem('livekit_room_name', inputRoom);
      Logger.info('Connecting to room', { room: inputRoom, role });
      
      const resp = await fetch(`/api/livekit/token?room=${encodeURIComponent(inputRoom)}&username=${username}&role=${role}`);
      const data = await resp.json();

      if (data.error) throw new Error(data.error);

      if (role === 'host' && supabase) {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .insert([{ name: inputRoom, host_name: username }])
          .select()
          .single();

        if (roomError) throw new Error(`ルームの作成に失敗しました: ${roomError.message}`);
        setCurrentRoomId(roomData.id);
      }

      setToken(data.token);
      setUrl(data.url);
      setIsBroadcaster(role === 'host');
      setIsAudioEnabled(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '不明なエラーが発生しました';
      Logger.error('Connection failed', { error: msg });
      alert(`接続に失敗しました: ${msg}`);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // URLパラメータからの自動接続と初期化
  useEffect(() => {
    const roomParam = searchParams.get('room');
    const roleParam = searchParams.get('role');

    if (roomParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoomName(roomParam);
    }

    // roleとroomが両方揃っている場合のみ自動接続（リスナーやリンク共有時）
    if (roleParam && roomParam && !hasAutoConnected) {
      setHasAutoConnected(true);
      connectToRoom(roomParam, roleParam);
    }
  }, [searchParams, hasAutoConnected, connectToRoom]);

  // クリーンアップ処理
  const cleanupRoom = useCallback((roomId: string) => {
    fetch('/api/live/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
      keepalive: true,
    }).catch(err => console.error('Cleanup fetch failed:', err));
  }, []);

  useEffect(() => {
    return () => {
      if (isBroadcaster && currentRoomId) {
        cleanupRoom(currentRoomId);
      }
    };
  }, [isBroadcaster, currentRoomId, cleanupRoom]);

  useEffect(() => {
    if (!isBroadcaster || !currentRoomId) return;
    const handlePageHide = () => cleanupRoom(currentRoomId);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isBroadcaster, currentRoomId, cleanupRoom]);

  const handleDisconnected = useCallback(async () => {
    if (isBroadcaster && currentRoomId) cleanupRoom(currentRoomId);
    setToken(null);
    setUrl(null);
    setCurrentRoomId(null);
    setIsBroadcaster(false);
    router.push('/');
  }, [isBroadcaster, currentRoomId, router, cleanupRoom]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inputRoom = formData.get('room') as string;
    const role = searchParams.get('role') || 'host'; // デフォルトは配信者
    connectToRoom(inputRoom, role);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `コエトバ - ${roomName}`, url: shareUrl });
      } catch { /* cancel */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleStartAudio = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const WinWithAudio = window as any;
      const AudioContextClass = WinWithAudio.AudioContext || WinWithAudio.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        await ctx.resume();
      }
      setIsAudioEnabled(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Logger.error('Failed to start audio context', { error: message });
    }
  };

  if (!token || !url) {
    const isHostInit = searchParams.get('role') === 'host' && !searchParams.get('room');
    
    return (
      <div style={{ padding: '4rem 0', maxWidth: '450px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎙️</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            {isHostInit ? '配信を準備する' : 'ライブに参加'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {isHostInit ? '配信ルームの名前を決めて始めましょう' : 'ルーム名を入力して参加します'}
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                ルーム名
              </label>
              <input 
                name="room" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="例: 深夜の雑談ラジオ" 
                required 
                autoFocus
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  border: '2px solid var(--border)', 
                  color: 'white',
                  fontSize: '1.1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isConnecting || !roomName}
              style={{ 
                marginTop: '0.5rem', 
                padding: '1.1rem', 
                borderRadius: '12px', 
                backgroundColor: (isConnecting || !roomName) ? 'var(--secondary)' : 'var(--primary)', 
                color: 'white', 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: (isConnecting || !roomName) ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'transform 0.1s, opacity 0.2s'
              }}
              onMouseDown={(e) => !isConnecting && roomName && (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !isConnecting && roomName && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isConnecting ? '接続中...' : (isHostInit ? '配信を開始する' : 'ライブに参加する')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0', minHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <LiveKitRoom
        video={false}
        audio={isBroadcaster}
        token={token}
        serverUrl={url}
        onDisconnected={handleDisconnected}
        onConnected={() => Logger.info('Successfully connected to LiveKit')}
        onError={(error) => Logger.error('LiveKit connection error', { message: error.message })}
        data-lk-theme="default"
        style={{ 
          flex: 1, 
          width: '100%',
          maxWidth: '800px',
          borderRadius: '16px', 
          overflow: 'hidden', 
          border: '1px solid var(--border)', 
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="live-container" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
          {(isBroadcaster || !isAudioEnabled) && (
            <div className="live-header" style={{ textAlign: 'center' }}>
              <div className="live-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>{isBroadcaster ? '🎙️' : '🎧'}</div>
              <h2 className="live-title" style={{ marginBottom: '0.5rem', fontSize: '1.8rem' }}>
                {isBroadcaster ? '配信中' : 'ライブを聴取中'}
              </h2>
              <p className="live-description" style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1rem' }}>
                {isBroadcaster ? 'あなたの声がリスナーに届いています' : '配信者の声を楽しんでいます'}
              </p>
            </div>
          )}

          {!isBroadcaster && !isAudioEnabled ? (
            <button 
              onClick={handleStartAudio}
              style={{ 
                padding: '1.5rem 3rem', 
                borderRadius: '50px', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '1.3rem',
                border: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                marginBottom: '2rem'
              }}
            >
              🔊 ライブを聴く
            </button>
          ) : (
            <>
              <CustomConference isBroadcaster={isBroadcaster} />
              <RoomAudioRenderer />
              
              <div className="live-controls" style={{ 
                marginTop: '2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {isBroadcaster && (
                  <TrackToggle source={Track.Source.Microphone} />
                )}

                <button
                  onClick={handleShare}
                  className="share-button"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: '50px',
                    padding: '0.8rem 1.5rem',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                >
                  <span>{isCopied ? 'コピーしました！' : '🔗 共有する'}</span>
                </button>

                <DisconnectButton>退出する</DisconnectButton>
              </div>
            </>
          )}
        </div>
        <style jsx>{`
          @media (max-height: 750px) {
            .live-container { padding: 1rem !important; }
            .live-icon { fontSize: 2.5rem !important; margin-bottom: 0.5rem !important; }
            .live-title { font-size: 1.4rem !important; margin-bottom: 0.25rem !important; }
            .live-description { margin-bottom: 1rem !important; font-size: 0.9rem !important; }
            .live-controls { margin-top: 1.5rem !important; }
          }
        `}</style>
      </LiveKitRoom>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LivePageContent />
    </Suspense>
  );
}
