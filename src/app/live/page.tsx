'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  LiveKitRoom, 
  AudioConference, 
  RoomAudioRenderer, 
  ControlBar
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

import Logger from '@/lib/logger';

function LivePageContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // ステート管理
  const [roomName, setRoomName] = useState('main-room');
  const [isConnecting, setIsConnecting] = useState(false);

  // URLパラメータや保存された情報からルーム名を初期化
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoomName(roomParam);
    } else if (typeof window !== 'undefined') {
      const storedRoom = localStorage.getItem('livekit_room_name');
      if (storedRoom) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRoomName(storedRoom);
      }
    }
  }, [searchParams]);

  // 配信終了時のクリーンアップ
  const handleDisconnected = useCallback(async () => {
    if (isBroadcaster && currentRoomId && supabase) {
      Logger.info('Broadcaster leaving, removing room from Supabase', { roomId: currentRoomId });
      await supabase.from('rooms').delete().eq('id', currentRoomId);
    }
    setToken(null);
    setUrl(null);
    setCurrentRoomId(null);
    setIsBroadcaster(false);
  }, [isBroadcaster, currentRoomId]);

  const handleConnect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsConnecting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const inputRoom = (formData.get('room') as string) || 'main-room';
      const role = formData.get('role') as string;
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const username = `user-${uuid}`;

      // ルーム名を保存
      localStorage.setItem('livekit_room_name', inputRoom);

      Logger.info('Fetching automated token', { room: inputRoom, role });
      
      const resp = await fetch(`/api/livekit/token?room=${inputRoom}&username=${username}&role=${role}`);
      const data = await resp.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 配信者の場合のみSupabaseにルームを登録
      if (role === 'host' && supabase) {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .insert([{ name: inputRoom, host_name: username }])
          .select()
          .single();

        if (roomError) {
          Logger.error('Supabase room insertion failed', { 
            message: roomError.message, 
            details: roomError.details, 
            hint: roomError.hint 
          });
          throw new Error(`ルームの作成に失敗しました: ${roomError.message}`);
        }
        setCurrentRoomId(roomData.id);
      }

      setToken(data.token);
      setUrl(data.url);
      setIsBroadcaster(role === 'host');
      setIsAudioEnabled(false);
    } catch (err: unknown) {
      let errorMessage = '不明なエラーが発生しました';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }
      
      Logger.error('Connection failed', { error: errorMessage });
      alert(`接続に失敗しました: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartAudio = async () => {
    try {
      // ユーザーの操作でオーディオコンテキストをアクティブにする
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const WinWithAudio = window as any;
      const AudioContextClass = WinWithAudio.AudioContext || WinWithAudio.webkitAudioContext;
      
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        await ctx.resume();
        Logger.info('AudioContext resumed via user gesture');
      }
      setIsAudioEnabled(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Logger.error('Failed to start audio context', { error: message });
    }
  };

  if (!token || !url) {
    return (
      <div style={{ padding: '2rem 0', maxWidth: '400px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>ライブ配信</h2>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            ルーム名を入力して「接続する」を押すだけで、自動的に適切な権限で入室します。
          </p>
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>ルーム名</label>
              <input 
                name="room" 
                defaultValue={roomName} 
                placeholder="例: my-live-show" 
                required 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', color: 'white' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>役割</label>
              <select name="role" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', color: 'white' }}>
                <option value="listener">リスナー（聴く）</option>
                <option value="host">配信者（喋る）</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={isConnecting}
              style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                borderRadius: '8px', 
                backgroundColor: isConnecting ? 'var(--secondary)' : 'var(--primary)', 
                color: 'white', 
                fontWeight: 'bold',
                cursor: isConnecting ? 'not-allowed' : 'pointer'
              }}
            >
              {isConnecting ? '接続中...' : 'ライブに参加する'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0', minHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      <LiveKitRoom
        video={false}
        audio={isBroadcaster}
        token={token}
        serverUrl={url}
        onDisconnected={handleDisconnected}
        onConnected={() => {
          Logger.info('Successfully connected to LiveKit');
        }}
        onError={(error) => {
          Logger.error('LiveKit connection error', { message: error.message });
        }}
        data-lk-theme="default"
        style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}
      >
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{isBroadcaster ? '🎙️' : '🎧'}</div>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            {isBroadcaster ? '配信中' : 'ライブを聴取中'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {isBroadcaster ? 'あなたの声がリスナーに届いています' : '配信者の声を楽しんでいます'}
          </p>

          {!isBroadcaster && !isAudioEnabled ? (
            <button 
              onClick={handleStartAudio}
              style={{ 
                padding: '1.5rem 2.5rem', 
                borderRadius: '50px', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '1.2rem',
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
              <div style={{ width: '100%', maxWidth: '500px', marginBottom: '1.5rem' }}>
                <AudioConference />
              </div>
              
              <RoomAudioRenderer />
            </>
          )}
          
          <div style={{ position: 'sticky', bottom: '0', padding: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ControlBar variation="minimal" controls={{ leave: true, microphone: isBroadcaster, chat: false }} />
          </div>
        </div>
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
