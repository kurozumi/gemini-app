'use client';

import React, { useState } from 'react';
import { 
  LiveKitRoom, 
  AudioConference, 
  RoomAudioRenderer, 
  ControlBar
} from '@livekit/components-react';
import '@livekit/components-styles';

import Logger from '@/lib/logger';

export default function LivePage() {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  // 実際にはサーバーから取得しますが、プロトタイプとして入力フォームを用意します
  const handleConnect = (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const inputToken = formData.get('token') as string;
      const inputUrl = formData.get('url') as string;
      const role = formData.get('role') as string;

      if (!inputToken || !inputUrl) {
        alert('URLとトークンを入力してください');
        return;
      }

      Logger.info('Attempting LiveKit connection', { url: inputUrl, role });
      
      setToken(inputToken);
      setUrl(inputUrl);
      setIsBroadcaster(role === 'host');
      setIsAudioEnabled(false); // Reset on new connection
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Logger.error('Form submission failed', { error: message });
      alert('エラーが発生しました: ' + message);
    }
  };

  const handleStartAudio = async () => {
    try {
      // ユーザーの操作でオーディオコンテキストをアクティブにする
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
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
    // ... (rest of the form remains same)
    return (
      <div style={{ padding: '2rem 0', maxWidth: '400px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>ライブ配信プロトタイプ</h2>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            LiveKit Cloud等のダッシュボードから発行したURLとトークンを入力して、接続テストを行えます。
          </p>
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>WebSocket URL</label>
              <input name="url" placeholder="wss://..." required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Token</label>
              <input name="token" placeholder="eyJ..." required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>役割</label>
              <select name="role" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', color: 'white' }}>
                <option value="listener">リスナー（聴く）</option>
                <option value="host">配信者（喋る）</option>
              </select>
            </div>
            <button type="submit" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>
              接続する
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
        onDisconnected={() => {
          Logger.info('Disconnected from LiveKit');
          setToken(null);
          setUrl(null);
        }}
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
