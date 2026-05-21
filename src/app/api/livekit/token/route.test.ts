import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

// livekit-server-sdk をモック化
vi.mock('livekit-server-sdk', async () => {
  const actual = await vi.importActual('livekit-server-sdk');
  return {
    ...actual,
    RoomServiceClient: vi.fn(),
    AccessToken: vi.fn().mockImplementation(() => ({
      addGrant: vi.fn(),
      toJwt: vi.fn().mockResolvedValue('mock-jwt-token'),
    })),
  };
});

describe('Token API (Host Enforcement)', () => {
  const mockUrl = 'http://localhost/api/livekit/token';
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_LIVEKIT_URL = 'wss://test.livekit.cloud';
  });

  it('should allow joining as host if no host exists', async () => {
    // 参加者リストが空（ホストなし）の状態をシミュレート
    const listParticipantsMock = vi.fn().mockResolvedValue([]);
    (RoomServiceClient as any).mockImplementation(() => ({
      listParticipants: listParticipantsMock,
    }));

    const req = new NextRequest(`${mockUrl}?room=test-room&username=user1&role=host`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.actualRole).toBe('host');
    expect(listParticipantsMock).toHaveBeenCalledWith('test-room');
  });

  it('should downgrade to listener if a host already exists', async () => {
    // すでにホスト（-hostサフィックス持ち）がいる状態をシミュレート
    const listParticipantsMock = vi.fn().mockResolvedValue([
      { identity: 'other-user-host' }
    ]);
    (RoomServiceClient as any).mockImplementation(() => ({
      listParticipants: listParticipantsMock,
    }));

    const req = new NextRequest(`${mockUrl}?room=test-room&username=user2&role=host`);
    const res = await GET(req);
    const data = await res.json();

    // 役割が listener に変更されていることを確認
    expect(data.actualRole).toBe('listener');
  });

  it('should allow joining as listener regardless of host existence', async () => {
    const listParticipantsMock = vi.fn();
    (RoomServiceClient as any).mockImplementation(() => ({
      listParticipants: listParticipantsMock,
    }));

    const req = new NextRequest(`${mockUrl}?room=test-room&username=user3&role=listener`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.actualRole).toBe('listener');
    // listener の場合はリスト確認をスキップするはず
    expect(listParticipantsMock).not.toHaveBeenCalled();
  });
});
