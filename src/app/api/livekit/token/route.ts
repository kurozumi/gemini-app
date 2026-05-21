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
      
      // すでに '-host' サフィックスを持つ参加者がいるか確認
      const hasHost = participants.some(p => p.identity.endsWith('-host'));
      
      if (hasHost) {
        // すでにホストがいる場合は、リスナーに強制変更
        console.log(`Room ${room} already has a host. Downgrading ${username} to listener.`);
        role = 'listener';
      }
    } catch (err) {
      // ルームが存在しない場合などはエラーになるが、その場合は最初のホストとして許可
      console.log(`Room ${room} does not exist or other error. Proceeding as host.`);
    }
  }
  // ------------------------------------------

  const displayName = role === 'host' ? '配信者' : 'リスナー';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: `${username}-${role}`,
    name: displayName,
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
    actualRole: role // 最終的な役割をクライアントに伝える
  });
}
