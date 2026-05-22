import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

const { mockAccessTokenConstructor } = vi.hoisted(() => ({
  mockAccessTokenConstructor: vi.fn().mockImplementation(function() {
    return {
      addGrant: vi.fn(),
      toJwt: vi.fn().mockResolvedValue('mock-jwt-token'),
    };
  }),
}));

// livekit-server-sdk を完全にモック化
vi.mock('livekit-server-sdk', () => {
  return {
    AccessToken: mockAccessTokenConstructor,
    RoomServiceClient: vi.fn().mockImplementation(function() {
      return {
        listParticipants: vi.fn().mockResolvedValue([]),
      };
    }),
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { created_at: new Date().toISOString() },
      error: null,
    }),
  })),
}));

describe('Token API (Host Enforcement)', () => {
  const mockUrl = 'http://localhost/api/livekit/token';

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_LIVEKIT_URL = 'wss://test.livekit.cloud';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('should have nearly 1 hour TTL set on AccessToken and return actualTtlMs', async () => {
    const req = new NextRequest(`${mockUrl}?room=test-room&username=user1&role=host`);
    const res = await GET(req);
    const data = await res.json();

    expect(mockAccessTokenConstructor).toHaveBeenCalledWith(
      'test-key',
      'test-secret',
      expect.objectContaining({
        ttl: expect.any(Number),
      })
    );
    
    // TTLは3600以下であるはず
    const ttlCall = mockAccessTokenConstructor.mock.calls[0][2].ttl;
    expect(ttlCall).toBeLessThanOrEqual(3600);
    expect(ttlCall).toBeGreaterThan(3590);

    expect(data.actualTtlMs).toBeDefined();
    expect(data.actualTtlMs).toBeLessThanOrEqual(3600 * 1000);
  });

  it('should allow joining as host if no host exists', async () => {

    const { RoomServiceClient } = await import('livekit-server-sdk');
    const mockListParticipants = vi.fn().mockResolvedValue([]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RoomServiceClient as unknown as { mockImplementation: (cb: any) => void }).mockImplementation(function() {
      return { listParticipants: mockListParticipants };
    });

    const req = new NextRequest(`${mockUrl}?room=test-room&username=user1&role=host`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.actualRole).toBe('host');
    expect(mockListParticipants).toHaveBeenCalledWith('test-room');
  });

  it('should downgrade to listener if another host already exists', async () => {
    const { RoomServiceClient } = await import('livekit-server-sdk');
    const mockListParticipants = vi.fn().mockResolvedValue([
      { identity: 'other-user-host' }
    ]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RoomServiceClient as unknown as { mockImplementation: (cb: any) => void }).mockImplementation(function() {
      return { listParticipants: mockListParticipants };
    });

    const req = new NextRequest(`${mockUrl}?room=test-room&username=user2&role=host`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.actualRole).toBe('listener');
  });

  it('should allow joining as host if the existing host is yourself', async () => {
    const { RoomServiceClient } = await import('livekit-server-sdk');
    const mockListParticipants = vi.fn().mockResolvedValue([
      { identity: 'user1-host' }
    ]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RoomServiceClient as unknown as { mockImplementation: (cb: any) => void }).mockImplementation(function() {
      return { listParticipants: mockListParticipants };
    });

    const req = new NextRequest(`${mockUrl}?room=test-room&username=user1&role=host`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.actualRole).toBe('host');
  });
});
