import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getChatHistory, sendChatMessage } from '../api';

const POLL_INTERVAL_MS = 3500;

const ChatWindow = ({ listingId, receiverId, otherUserName, listingTitle, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = useCallback(async () => {
    if (!listingId) return;

    const response = await getChatHistory(listingId);
    if (response.success) {
      setMessages(response.data.messages || []);
      setCurrentUserId(response.data.current_user_id);
      setError('');
    } else {
      console.error('[Chat] Failed to load history:', response.error);
      setError(
        response.errorMessage ||
          response.error?.error ||
          response.error?.detail ||
          'Failed to load chat history.'
      );
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const intervalId = setInterval(fetchHistory, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending || !receiverId) return;

    setSending(true);
    setError('');

    const response = await sendChatMessage(receiverId, listingId, text);
    if (response.success) {
      setMessages((prev) => [...prev, response.data]);
      setInputText('');
    } else {
      console.error('[Chat] Failed to send message:', response.error);
      setError(
        response.errorMessage ||
          response.error?.error ||
          response.error?.detail ||
          'Failed to send message.'
      );
    }
    setSending(false);
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const displayName = otherUserName || 'Chat Partner';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[min(600px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4 text-white">
          <div>
            <h3 className="text-base font-bold">💬 Chat</h3>
            <p className="text-xs text-emerald-100">
              {displayName}
              {listingTitle ? ` · ${listingTitle}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/30"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4"
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-500">
              <span className="mb-2 text-3xl">💬</span>
              <p>No messages yet. Say hello to coordinate pickup!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => {
                const isOwn = currentUserId && msg.sender?.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isOwn
                          ? 'rounded-br-md bg-emerald-600 text-white'
                          : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      {!isOwn && (
                        <p className="mb-0.5 text-xs font-semibold text-emerald-600">
                          {msg.sender?.profile?.full_name || msg.sender?.email || 'User'}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.message_text}
                      </p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          isOwn ? 'text-emerald-100' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
