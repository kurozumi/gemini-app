import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Chat } from './page';

// LiveKit hooks をモック化
vi.mock('@livekit/components-react', () => ({
  useChat: () => ({
    send: vi.fn(),
    chatMessages: [
      { message: 'Hello from listener', from: { isLocal: false } },
      { message: 'Hi from me', from: { isLocal: true } },
    ],
  }),
}));

describe('Chat Component', () => {
  it('should display messages from others and self', () => {
    render(<Chat />);
    
    expect(screen.getByText('Hello from listener')).toBeDefined();
    expect(screen.getByText('Hi from me')).toBeDefined();
  });

  it('should have an input field and send button', () => {
    render(<Chat />);
    
    expect(screen.getByPlaceholderText('メッセージを送る...')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });
});
