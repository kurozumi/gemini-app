import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

const { mockDeleteRoom } = vi.hoisted(() => ({
  mockDeleteRoom: vi.fn().mockResolvedValue(undefined),
}));

// モックの設定
vi.mock('livekit-server-sdk', () => ({
  RoomServiceClient: vi.fn().mockImplementation(function() {
    return {
      deleteRoom: mockDeleteRoom,
    };
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

describe('POST /api/live/cleanup', () => {
  const mockEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    LIVEKIT_API_KEY: 'lk-key',
    LIVEKIT_API_SECRET: 'lk-secret',
    NEXT_PUBLIC_LIVEKIT_URL: 'https://test.livekit.cloud',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...process.env, ...mockEnv };
  });

  it('should delete both LiveKit room and Supabase entry', async () => {
    const roomId = 'test-room-id';
    const req = new NextRequest('http://localhost/api/live/cleanup', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // LiveKitの削除が呼ばれたか
    expect(RoomServiceClient).toHaveBeenCalledWith(
      mockEnv.NEXT_PUBLIC_LIVEKIT_URL,
      mockEnv.LIVEKIT_API_KEY,
      mockEnv.LIVEKIT_API_SECRET
    );
    expect(mockDeleteRoom).toHaveBeenCalledWith(roomId);

    // Supabaseの削除が呼ばれたか
    expect(createClient).toHaveBeenCalledWith(
      mockEnv.NEXT_PUBLIC_SUPABASE_URL,
      mockEnv.SUPABASE_SERVICE_ROLE_KEY
    );
  });

  it('should return 400 if roomId is missing', async () => {
    const req = new NextRequest('http://localhost/api/live/cleanup', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
