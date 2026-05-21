'use client';

import LiveRoomList from '@/components/LiveRoomList';
import Link from 'next/link';
import { useMaintenanceMode } from '@/lib/hooks/useMaintenanceMode';

export default function Home() {
  const { isMaintenance, loading } = useMaintenanceMode();

  return (
    <div style={{ padding: '2rem 0' }}>
      <section style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.2rem', background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          声で、つながる。
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          会員登録不要。匿名で誰でもすぐに音声配信を始められます。
        </p>

        {loading ? (
          <div style={{ height: '3.5rem' }}></div>
        ) : isMaintenance ? (
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: 'rgba(255, 75, 75, 0.1)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255, 75, 75, 0.2)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <p style={{ color: '#ff4b4b', fontWeight: 'bold', margin: 0 }}>
              ⚠️ 現在、利用量制限またはメンテナンスのため、新規の配信・参加を停止しています。
            </p>
          </div>
        ) : (
          <Link href="/live?role=host">
            <button style={{ 
              padding: '1rem 2.5rem', 
              borderRadius: '50px', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: '1.1rem',
              border: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              cursor: 'pointer'
            }}>
              🎙️ 今すぐ配信を始める
            </button>
          </Link>
        )}
      </section>

      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#ff4b4b' }}>●</span> ライブ配信中
        </h3>
        {isMaintenance ? (
          <div style={{ 
            padding: '2rem', 
            backgroundColor: 'var(--card-bg)', 
            borderRadius: '16px', 
            textAlign: 'center',
            color: 'var(--text-muted)',
            border: '1px dashed var(--border)'
          }}>
            メンテナンス中のため、ルームリストを表示できません。
          </div>
        ) : (
          <LiveRoomList />
        )}
      </section>
    </div>
  );
}
