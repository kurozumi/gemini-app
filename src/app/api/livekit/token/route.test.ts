import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// livekit-server-sdk を完全にモック化
vi.mock('livekit-server-sdk', () => {
  return {
    AccessToken: vi.fn().mockImplementation(function() {
      return {
        addGrant: vi.fn(),
        toJwt: vi.fn().mockResolvedValue('mock-jwt-token'),
      };
    }),
    RoomServiceClient: vi.fn().mockImplementation(function() {
      return {
        listParticipants: vi.fn().mockResolvedValue([]),
      };
    }),
  };
});

describe('Token API (Host Enforcement)', () => {
  const mockUrl = 'http://localhost/api/livekit/token';
  
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_LIVEKIT_URL = 'wss://test.livekit.cloud';
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
