import { WebhookReceiver, RoomServiceClient } from 'livekit-server-sdk';
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
    const roomId = event.room?.name; // LiveKitのルーム名 = SupabaseのルームID (UUID)
    const isHost = event.participant?.identity?.endsWith('-host');

    // room_finished の場合、またはホストが退出した（participant_left）場合にルームを削除
    if (roomId && (event.event === 'room_finished' || isHost)) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      
      // ホストが退出した場合、LiveKitのルームも明示的に削除してリスナーをキックする
      if (isHost && apiKey && apiSecret && livekitUrl) {
        try {
          const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
          await roomService.deleteRoom(roomId);
        } catch (lkErr) {
          console.error('Failed to delete LiveKit room from webhook:', lkErr);
        }
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('rooms').delete().eq('id', roomId);
    }
  }

  return NextResponse.json({ received: true });
}
