import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AudioOutputToggle } from './page';

// LiveKit context のモック化
vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useRoomContext: () => ({
      setAudioOutput: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

describe('AudioOutputToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // navigator.mediaDevices のモック（初期状態はサポートなし）
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });
    // HTMLAudioElement のモック
    Object.defineProperty(HTMLAudioElement.prototype, 'setSinkId', {
      writable: true,
      value: undefined,
    });
  });

  it('should not render if audio output switching is not supported', async () => {
    render(<AudioOutputToggle />);
    const button = screen.queryByRole('button');
    expect(button).toBeNull();
  });

  it('should render if setSinkId is supported', async () => {
    // setSinkId が存在する場合をシミュレート
    Object.defineProperty(HTMLAudioElement.prototype, 'setSinkId', {
      writable: true,
      value: vi.fn(),
    });

    render(<AudioOutputToggle />);
    
    // useEffect の完了を待つ（jsdom環境では即時）
    const button = await screen.findByRole('button');
    expect(button).toBeDefined();
    // デフォルト（isSpeaker: false）のテキストを確認
    expect(screen.getByText('👂 イヤースピーカー')).toBeDefined();
  });
});
