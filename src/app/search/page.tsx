import { MOCK_TRACKS } from '@/lib/mockData';
import { TrackCard } from '@/components/TrackCard';

export default function SearchPage() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>音声を探す</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="キーワードで検索..." 
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            fontSize: '1rem'
          }}
        />
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
    </div>
  );
}
