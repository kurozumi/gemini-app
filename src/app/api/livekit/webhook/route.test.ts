import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

const { mockDeleteRoom, mockReceive } = vi.hoisted(() => ({
  mockDeleteRoom: vi.fn().mockResolvedValue(undefined),
  mockReceive: vi.fn(),
}));

vi.mock('livekit-server-sdk', () => ({
  RoomServiceClient: vi.fn().mockImplementation(function() {
    return {
      deleteRoom: mockDeleteRoom,
    };
  }),
  WebhookReceiver: vi.fn().mockImplementation(function() {
    return {
      receive: mockReceive,
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

describe('POST /api/livekit/webhook', () => {
  const mockEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    LIVEKIT_API_KEY: 'lk-key',
    LIVEKIT_API_SECRET: 'lk-secret',
    NEXT_PUBLIC_LIVEKIT_URL: 'https://test.livekit.cloud',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...process.env, ...mockEnv };
  });

  it('should delete LiveKit room and Supabase entry when host leaves', async () => {
    const roomId = 'test-room-uuid';
    mockReceive.mockResolvedValue({
      event: 'participant_left',
      room: { name: roomId },
      participant: { identity: 'user1-host' },
    });

    const req = new NextRequest('http://localhost/api/livekit/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Authorization': 'valid-sig' },
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);

    // LiveKitの強制削除が呼ばれたか
    expect(mockDeleteRoom).toHaveBeenCalledWith(roomId);
    
    // Supabaseの削除が呼ばれたか
    expect(createClient).toHaveBeenCalled();
  });

  it('should NOT delete LiveKit room when listener leaves', async () => {
    const roomId = 'test-room-uuid';
    mockReceive.mockResolvedValue({
      event: 'participant_left',
      room: { name: roomId },
      participant: { identity: 'user2-listener' },
    });

    const req = new NextRequest('http://localhost/api/livekit/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Authorization': 'valid-sig' },
    });

    const response = await POST(req);
    
    expect(response.status).toBe(200);
    // LiveKitの強制削除は呼ばれないはず
    expect(mockDeleteRoom).not.toHaveBeenCalled();
    // Supabaseの削除も呼ばれないはず（ホストではないため）
    expect(createClient).not.toHaveBeenCalled();
  });
});
