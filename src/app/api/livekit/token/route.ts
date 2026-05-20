import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');
  const role = req.nextUrl.searchParams.get('role'); // 'host' or 'listener'

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing room or username' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  console.log(`[token] room=${room} username=${username} role=${role}`);

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    name: username,
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
    url: wsUrl 
  });
}
