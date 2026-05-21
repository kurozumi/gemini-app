'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@livekit/components-react';

// チャットメッセージの型定義
export interface ChatMessage {
  message: string;
  from?: {
    isLocal: boolean;
    identity: string;
  };
  timestamp: number;
}

export function ChatUI({ 
  messages, 
  onSendMessage 
}: { 
  messages: ChatMessage[], 
  onSendMessage: (msg: string) => void 
}) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">メッセージはまだありません</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.from?.isLocal ? 'is-me' : ''}`}>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="メッセージを送る..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button" disabled={!message.trim()}>
          🚀
        </button>
      </form>

      <style jsx>{`
        .chat-container {
          width: 100%;
          max-width: 400px;
          height: 350px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-top: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          scrollbar-width: thin;
        }
        .chat-empty {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-top: 4rem;
        }
        .chat-message {
          max-width: 85%;
          align-self: flex-start;
        }
        .chat-message.is-me {
          align-self: flex-end;
        }
        .message-content {
          padding: 0.6rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          font-size: 0.9rem;
          line-height: 1.4;
          color: white;
          word-break: break-all;
        }
        .is-me .message-content {
          background: var(--primary);
          border-radius: 16px;
          border-bottom-right-radius: 4px;
          border-bottom-left-radius: 16px;
        }
        .chat-input-form {
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          gap: 0.5rem;
        }
        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 12px;
          padding: 0.6rem 1rem;
          color: white;
          font-size: 0.9rem;
          outline: none;
        }
        .chat-input:focus {
          background: rgba(255, 255, 255, 0.15);
        }
        .chat-send-button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .chat-send-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .chat-send-button:hover:not(:disabled) {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

// チャットロジックを分離したラッパーコンポーネント
export function Chat({ isOpen }: { isOpen: boolean }) {
  const { send, chatMessages } = useChat();
  
  // デバッグ用: メッセージの受信をログ出力
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      console.log('Chat message received:', lastMsg.message, 'from:', lastMsg.from?.identity);
    }
  }, [chatMessages]);
  
  // チャットUIを表示（isOpenに関わらずフックは実行されるため履歴は保持される）
  if (!isOpen) return null;

  const formattedMessages: ChatMessage[] = chatMessages.map(msg => ({
    message: msg.message,
    from: msg.from ? {
      isLocal: msg.from.isLocal,
      identity: msg.from.identity || 'unknown'
    } : undefined,
    timestamp: msg.timestamp
  }));

  return <ChatUI messages={formattedMessages} onSendMessage={(text) => send?.(text)} />;
}
