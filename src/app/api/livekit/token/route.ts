import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');
  let role = req.nextUrl.searchParams.get('role') || 'listener';

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing room or username' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey || !apiSecret || !wsUrl || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- 配信制限時間 (TTL) の同期計算 ---
  let ttl = 3600; // デフォルト1時間
  let remainingMs = 3600 * 1000;
  try {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('created_at')
      .eq('id', room)
      .single();

    if (!roomError && roomData) {
      const createdAt = new Date(roomData.created_at).getTime();
      const now = Date.now();
      remainingMs = (createdAt + 3600 * 1000) - now;
      
      // TTL（秒単位）の計算
      ttl = Math.floor(remainingMs / 1000);

      if (ttl <= 0) {
        return NextResponse.json({ error: 'この配信は終了しました' }, { status: 403 });
      }
    }
  } catch (err) {
    console.error('Failed to calculate sync TTL:', err);
  }
  // ------------------------------------------

  // --- ホスト固定 (Host Enforcement) ロジック ---
  if (role === 'host') {
    try {
      const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
      const participants = await roomService.listParticipants(room);
      
      // 自分自身（同じusernameを持つ参加者）以外のホストがいるか確認
      const otherHost = participants.find(p => 
        p.identity.endsWith('-host') && !p.identity.startsWith(`${username}-`)
      );
      
      if (otherHost) {
        role = 'listener';
      }
    } catch {
      // エラー時は安全のためそのまま続行
    }
  }
  // ------------------------------------------

  const displayName = role === 'host' ? '配信者' : 'リスナー';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: `${username}-${role}`,
    name: displayName,
    ttl: ttl, // 同期計算された TTL を使用
  });

  at.addGrant({
    roomJoin: true,
    room: room,
    canPublish: role === 'host',
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ 
    token: await at.toJwt(),
    url: wsUrl,
    actualRole: role,
    actualTtl: ttl,
    actualTtlMs: remainingMs // ミリ秒単位の正確な残り時間を伝える
  });
}
