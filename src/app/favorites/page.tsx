export default function FavoritesPage() {
  return (
    <div style={{ padding: '2rem 0', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>お気に入り</h2>
      <div style={{ padding: '4rem 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
        <p>お気に入りの音声はまだありません。</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>気になる音声を見つけて、ハートを送ってみましょう。</p>
        <a href="/" style={{ 
          display: 'inline-block', 
          marginTop: '2rem', 
          padding: '0.75rem 1.5rem', 
          backgroundColor: 'var(--primary)', 
          borderRadius: '8px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          ホームに戻る
        </a>
      </div>
    </div>
  );
}
