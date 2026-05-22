import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

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

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

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
    ttl: 120, // テストのため2分に短縮
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
    actualRole: role
  });
}
