import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey || !apiSecret || !livekitUrl || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Environment variables are missing' }, { status: 500 });
  }

  // LiveKit RoomService を初期化
  const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. LiveKitから現在アクティブなルーム一覧を取得
    const activeRooms = await roomService.listRooms();
    const activeRoomNames = activeRooms.map(r => r.name);

    // 2. Supabaseから全ルームを取得
    const { data: dbRooms, error: dbError } = await supabase
      .from('rooms')
      .select('id, name');

    if (dbError) throw dbError;

    // 3. LiveKitに存在しないルーム（幽霊ルーム）を特定
    const staleRooms = dbRooms?.filter(room => !activeRoomNames.includes(room.name)) || [];

    if (staleRooms.length > 0) {
      const staleIds = staleRooms.map(r => r.id);
      
      // 4. 幽霊ルームを一括削除
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .in('id', staleIds);

      if (deleteError) throw deleteError;
      
      return NextResponse.json({ 
        success: true, 
        message: `${staleRooms.length} stale rooms cleaned up`,
        cleanedCount: staleRooms.length 
      });
    }

    return NextResponse.json({ success: true, message: 'No stale rooms found' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
