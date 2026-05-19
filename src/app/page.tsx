import { MOCK_TRACKS } from '@/lib/mockData';
import { TrackCard } from '@/components/TrackCard';

export default function Home() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <section style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          今夜も、心地よい眠りを。
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          厳選されたASMRとシチュエーションボイスで、あなたの心と体を癒します。
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem' }}>新着の音声</h3>
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
