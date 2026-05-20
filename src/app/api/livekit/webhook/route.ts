import { WebhookReceiver } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const authorization = req.headers.get('Authorization') ?? '';

  let event;
  try {
    event = await receiver.receive(body, authorization);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  if (event.event === 'room_finished' || event.event === 'participant_left') {
    const roomName = event.room?.name;
    const isHost = event.participant?.identity?.endsWith('-host');

    // room_finished の場合、またはホストが退出した（participant_left）場合にルームを削除
    if (roomName && (event.event === 'room_finished' || isHost)) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.from('rooms').delete().eq('name', roomName);
    }
  }

  return NextResponse.json({ received: true });
}
