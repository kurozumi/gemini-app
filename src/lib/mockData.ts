export interface Track {
  id: string;
  title: string;
  artist: string;
  description: string;
  category: 'ASMR' | '添い寝' | '耳かき' | '吐息';
  thumbnailUrl: string;
  audioUrl: string;
  sampleUrl: string;
  duration: number; // in seconds
  tags: string[];
  isPremium: boolean;
}

export const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: '隣で眠る夜。君へのささやき',
    artist: 'ひなた',
    description: '疲れたあなたを癒す、優しい添い寝ボイス。ゆっくりと眠りにつけるよう、隣で寄り添います。',
    category: '添い寝',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Mock MP3
    sampleUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 300,
    tags: ['ささやき', '癒やし', '新人'],
    isPremium: false,
  },
  {
    id: '2',
    title: '極上の耳かきタイム。奥まで届く音',
    artist: '月詠',
    description: '最高品質のバイノーラルマイクで録音された、リアルな耳かき音。',
    category: '耳かき',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    sampleUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 600,
    tags: ['ASMR', '耳かき', '睡眠導入'],
    isPremium: false,
  },
  {
    id: '3',
    title: '雨音と吐息。二人だけの秘密',
    artist: '雨音',
    description: '外は雨。温かい部屋で、二人だけの時間を過ごしましょう。',
    category: '吐息',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    sampleUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 450,
    tags: ['吐息', '雨音', 'リラックス'],
    isPremium: true,
  },
  {
    id: '4',
    title: 'お姉さんの膝枕。たっぷり癒やしてあげる',
    artist: '美波',
    description: '今日は頑張ったね。私の膝で、ゆっくり休んでいいんだよ。',
    category: '添い寝',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544161515-4ae6ce6fe858?auto=format&fit=crop&q=80&w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    sampleUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 900,
    tags: ['膝枕', '甘々', 'お姉さん'],
    isPremium: false,
  },
];
