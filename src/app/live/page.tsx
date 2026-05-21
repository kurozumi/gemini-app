'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  useTracks,
  DisconnectButton,
  TrackToggle,
  useParticipants,
  useRoomContext
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Track } from 'livekit-client';
import { getPersistentUserId } from '@/lib/utils';
import { Chat } from '@/components/Chat';

import Logger from '@/lib/logger';

export function AudioOutputToggle() {
  const room = useRoomContext();
  const [isSpeaker, setIsSpeaker] = useState(false); // デフォルトをイヤースピーカー（スピーカーOFF）に
  const [canSwitch, setCanSwitch] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaDevices = navigator.mediaDevices as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isSupported = !!mediaDevices.selectAudioOutput || !!(HTMLAudioElement.prototype as any).setSinkId;
      setCanSwitch(isSupported);
      
      if (isSupported) {
        // 初回入室時にイヤースピーカーへの切り替えを試みる
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const earpiece = devices.find(d => 
            d.kind === 'audiooutput' && 
            (d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('receiver') || d.label.includes('受話'))
          );
          if (earpiece) {
            await room.setAudioOutput(earpiece.deviceId);
            Logger.info('Defaulted to earpiece', { label: earpiece.label });
          }
        } catch (err) {
          console.warn('Failed to set default audio output:', err);
        }
      }
    };
    checkSupport();
  }, [room]);

  const toggleOutput = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      
      // スピーカーとイヤースピーカーを判別するロジック
      // 注: ブラウザやOSによってデバイス名のラベルは異なります
      const speaker = audioOutputs.find(d => d.label.toLowerCase().includes('speaker') || d.label.includes('スピーカー'));
      const earpiece = audioOutputs.find(d => d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('receiver') || d.label.includes('受話'));

      const nextMode = !isSpeaker;
      const targetDevice = nextMode ? (speaker || audioOutputs[0]) : (earpiece || audioOutputs[0]);

      if (targetDevice) {
        await room.setAudioOutput(targetDevice.deviceId);
        setIsSpeaker(nextMode);
        Logger.info('Audio output switched', { mode: nextMode ? 'speaker' : 'earpiece', label: targetDevice.label });
      }
    } catch (err) {
      Logger.error('Failed to switch audio output', { error: err });
    }
  };

  if (!canSwitch) return null;

  return (
    <button
      onClick={toggleOutput}
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
      title={isSpeaker ? 'イヤースピーカーに切り替え' : 'スピーカーに切り替え'}
    >
      <span>{isSpeaker ? '📢 スピーカー' : '👂 イヤースピーカー'}</span>
    </button>
  );
}

function CustomConference() {
  const tracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: true },
  ]);

  // 配信者（ホスト）のトラックのみを表示
  const filteredTracks = tracks.filter(t => t.participant.identity.endsWith('-host'));

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
          border-radius: 40px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .custom-conference .lk-participant-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.15), transparent 70%);
          pointer-events: none;
        }
        @media (max-height: 800px) {
          .custom-conference .lk-participant-tile {
            width: 220px !important;
            height: 220px !important;
            border-radius: 32px;
          }
          .custom-conference .lk-grid-layout {
            gap: 1.5rem;
          }
        }
        @media (max-width: 480px) {
          .custom-conference .lk-participant-tile {
            width: 180px !important;
            height: 180px !important;
            border-radius: 28px;
          }
        }
        .custom-conference .lk-participant-tile:hover {
          transform: translateY(-10px) scale(1.02);
          border-color: rgba(var(--primary-rgb), 0.5) !important;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(var(--primary-rgb), 0.2);
        }
        /* ユーザー名を非表示にする */
        .custom-conference .lk-participant-name {
          display: none !important;
        }
        .custom-conference .lk-audio-visualizer {
          opacity: 0.6;
          filter: drop-shadow(0 0 8px var(--primary));
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

function AudienceCount() {
  const participants = useParticipants();
  // ホスト（配信者）以外の参加者をリスナーとしてカウント
  const listenerCount = participants.filter(p => !p.identity.endsWith('-host')).length;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      padding: '0.5rem 1rem', 
      borderRadius: '50px', 
      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '0.9rem',
      fontWeight: '600',
      color: 'var(--text-muted)'
    }}>
      <span style={{ color: '#ff4b4b' }}>●</span>
      <span>{listenerCount} 人が視聴中</span>
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ステート管理
  const [roomName, setRoomName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const autoConnectedRef = useRef(false);

  // 接続処理
  const connectToRoom = useCallback(async (inputRoomName: string, role: string, existingRoomId?: string) => {
    if (!inputRoomName && !existingRoomId) return;
    setIsConnecting(true);
    try {
      const username = getPersistentUserId();
      let roomId = existingRoomId;

      // 配信者の場合、まずSupabaseに登録してIDを取得
      if (role === 'host' && !roomId && supabase) {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .insert([{ name: inputRoomName, host_name: username }])
          .select()
          .single();

        if (roomError) throw new Error(`ルームの作成に失敗しました: ${roomError.message}`);
        roomId = roomData.id;
        setCurrentRoomId(roomId);
        
        // URLをユニークなID付きに更新
        const newUrl = `${window.location.pathname}?room=${roomId}&role=host`;
        window.history.replaceState(null, '', newUrl);
      } else if (roomId) {
        // IDが既にある場合（リスナーなど）、ルーム情報を取得
        if (supabase) {
          const { data, error } = await supabase
            .from('rooms')
            .select('name')
            .eq('id', roomId)
            .single();
          
          if (!error && data) {
            setRoomName(data.name);
          }
        }
        setCurrentRoomId(roomId);
      }

      const roomToJoin = roomId || inputRoomName;
      Logger.info('Connecting to room', { room: roomToJoin, role });
      
      const resp = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomToJoin)}&username=${username}&role=${role}`);
      const data = await resp.json();

      if (data.error) throw new Error(data.error);

      // 1. まず権限とURLをセット
      const finalIsBroadcaster = data.actualRole === 'host';
      setIsBroadcaster(finalIsBroadcaster);
      setIsAudioEnabled(false);
      setUrl(data.url);
      
      // 2. 最後にトークンをセットしてコンポーネントをマウント
      setToken(data.token);
      
      Logger.info('Connection state established', { 
        room: roomToJoin, 
        actualRole: data.actualRole,
        isBroadcaster: finalIsBroadcaster 
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '不明なエラーが発生しました';
      Logger.error('Connection failed', { error: msg });
      alert(`接続に失敗しました: ${msg}`);
      setToken(null);
      setUrl(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // URLパラメータからの自動接続と初期化
  useEffect(() => {
    const roomParam = searchParams.get('room');
    const roleParam = searchParams.get('role');

    if (roleParam && roomParam && !autoConnectedRef.current) {
      autoConnectedRef.current = true;
      connectToRoom('', roleParam, roomParam);
    }
  }, [searchParams, connectToRoom]);

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
    const role = searchParams.get('role') || 'host';
    connectToRoom(inputRoom, role);
  };

  const handleShare = async () => {
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.set('role', 'listener');
    if (currentRoomId) {
      urlObj.searchParams.set('room', currentRoomId);
    }
    const shareUrl = urlObj.toString();

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
    const isAutoJoining = searchParams.get('room') && searchParams.get('role');

    if (isAutoJoining || isConnecting) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>接続中...</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>ライブルームに入室しています</p>
        </div>
      );
    }
    
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
        onConnected={() => {
          Logger.info('Successfully connected to LiveKit', { isBroadcaster });
        }}
        onError={(error) => {
          Logger.error('LiveKit connection error', { message: error.message });
        }}
        onMediaDeviceError={(e) => {
          Logger.error('Media device error', { message: e.message });
          if (isBroadcaster) {
            alert('マイクの起動に失敗しました。ブラウザのマイク許可設定を確認してください。');
          }
        }}
        onTrackPublished={(publication) => {
          Logger.info('Track published', { kind: publication.kind, source: publication.source });
        }}
        onTrackSubscribed={(track) => {
          Logger.info('Track subscribed', { kind: track.kind, source: track.source });
        }}
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
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <AudienceCount />
              </div>

              <CustomConference />
              <RoomAudioRenderer />

              {/* チャットロジックを常にバックグラウンドで動作させ、表示のみ制御 */}
              <Chat isOpen={isChatOpen} />
              
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
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  style={{
                    backgroundColor: isChatOpen ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    padding: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '1.2rem'
                  }}
                  title="チャット"
                >
                  💬
                </button>

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
                >
                  <span>{isCopied ? 'コピーしました！' : '🔗 共有する'}</span>
                </button>

                {!isBroadcaster && <AudioOutputToggle />}

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
