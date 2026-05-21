import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ChatUI } from '@/components/Chat';

describe('ChatUI Component', () => {
  const mockMessages = [
    { message: 'Hello from listener', from: { isLocal: false, identity: 'user-1-listener' }, timestamp: Date.now() },
    { message: 'Hi from me', from: { isLocal: true, identity: 'user-2-host' }, timestamp: Date.now() },
  ];

  it('should display messages from others and self', () => {
    render(<ChatUI messages={mockMessages} onSendMessage={vi.fn()} />);
    
    expect(screen.getByText('Hello from listener')).toBeDefined();
    expect(screen.getByText('Hi from me')).toBeDefined();
  });

  it('should have an input field and send button', () => {
    render(<ChatUI messages={[]} onSendMessage={vi.fn()} />);
    
    expect(screen.getByPlaceholderText('メッセージを送る...')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });
});
