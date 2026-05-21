'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  host_name: string;
  created_at: string;
}

export default function LiveRoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回ロード
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRooms(data as Room[]);
      }
      setLoading(false);
    };

    fetchRooms();

    // 背景でLiveKitの実態と同期（幽霊ルームの削除）
    fetch('/api/live/sync').catch(err => console.error('Sync failed:', err));

    // リアルタイム更新の購読
    if (!supabase) return;

    const subscription = supabase
      .channel('public:rooms')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any, 
        { event: '*', table: 'rooms', schema: 'public' }, 
        (payload: unknown) => {
          const p = payload as { eventType: string; new: Room; old: { id: string } };
          if (p.eventType === 'INSERT') {
            setRooms((prev) => [p.new, ...prev]);
          } else if (p.eventType === 'DELETE') {
            setRooms((prev) => prev.filter((room) => room.id !== p.old.id));
          } else if (p.eventType === 'UPDATE') {
            setRooms((prev) => prev.map((room) => (room.id === p.new.id ? p.new : room)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>読み込み中...</div>;
  }

  if (rooms.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        backgroundColor: 'var(--card-bg)', 
        borderRadius: '16px', 
        textAlign: 'center',
        border: '1px dashed var(--border)',
        color: 'var(--text-muted)'
      }}>
        現在配信中のルームはありません。
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {rooms.map((room) => (
        <Link 
          key={room.id} 
          href={`/live?room=${encodeURIComponent(room.name)}&role=listener`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--card-bg)', 
            borderRadius: '20px', 
            border: '1px solid var(--border)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🎙️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {room.name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ライブ配信中
                </p>
              </div>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                backgroundColor: '#ff4b4b', 
                borderRadius: '50%',
                boxShadow: '0 0 8px #ff4b4b'
              }}></div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
