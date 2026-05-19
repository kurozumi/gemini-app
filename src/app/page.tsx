import { MOCK_TRACKS } from '@/lib/mockData';
import { TrackCard } from '@/components/TrackCard';
import LiveRoomList from '@/components/LiveRoomList';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <section style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.2rem', background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          声で、つながる。
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          会員登録不要。匿名で誰でもすぐに音声配信を始められます。
        </p>
        <Link href="/live">
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
      </section>

      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#ff4b4b' }}>●</span> ライブ配信中
        </h3>
        <LiveRoomList />
      </section>

      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem' }}>新着の音声コンテンツ</h3>
          <a href="/search" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>すべて見る</a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1.5rem'
        }}>
          {MOCK_TRACKS.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>カテゴリで探す</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['添い寝', 'ASMR', '耳かき', '吐息', 'お姉さん', '癒やし'].map((cat) => (
            <div key={cat} style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--secondary)',
              borderRadius: '20px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: '1px solid var(--border)'
            }}>
              {cat}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
