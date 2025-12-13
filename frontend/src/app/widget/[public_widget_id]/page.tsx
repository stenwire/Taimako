'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

// Types
interface WidgetConfig {
  public_widget_id: string;
  theme: string;
  primary_color: string;
  icon_url?: string;
  welcome_message?: string;
  initial_ai_message?: string;
}

interface Message {
  id: string;
  sender: 'guest' | 'ai';
  message_text: string;
  created_at: string;
}

interface GuestStartResponse {
  guest_id: string;
  widget_owner_id: string;
  status: string;
}

interface SessionHistory {
  id: string;
  created_at: string;
  last_message_at: string;
  origin: string;
  summary?: string;
}

const BACKEND_URL = 'http://localhost:8000';

export default function WidgetPage() {
  const params = useParams();
  const publicWidgetId = params.public_widget_id as string;

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [view, setView] = useState<'loading' | 'form' | 'chat'>('loading');
  const [showMenu, setShowMenu] = useState(false);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [viewingHistory, setViewingHistory] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // === CRITICAL: Listen for focus command from parent (widget.js) ===
  useEffect(() => {
    const handleFocusMessage = (event: MessageEvent) => {
      if (event.data.type === "STEN_WIDGET_FOCUS") {
        if (view === 'form' && nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        } else if (view === 'chat' && inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener("message", handleFocusMessage);
    return () => window.removeEventListener("message", handleFocusMessage);
  }, [view]);

  // Re-focus chat input when clicking background
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (view === 'chat' && inputRef.current && !target.closest('button, input, textarea, a')) {
      inputRef.current.focus();
    }
  };

  // Load Config
  useEffect(() => {
    if (!publicWidgetId) return;

    fetch(`${BACKEND_URL}/widgets/config/${publicWidgetId}`)
      .then(res => {
        if (!res.ok) throw new Error('Config load failed');
        return res.json();
      })
      .then(data => {
        setConfig(data);
        const storedGuestId = localStorage.getItem(`sten_guest_${publicWidgetId}`);
        if (storedGuestId) {
          setGuestId(storedGuestId);
          // On refresh, start FRESH (Clean Slate) even if we know the guest
          // So we do NOT load stored session or fetch messages.
          // Just go to 'chat' view with empty list.
          setView('chat');
        } else {
          setView('form');
        }
      })
      .catch(err => {
        console.error(err);
        setView('form');
      });
  }, [publicWidgetId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.email && !formData.phone)) {
      setError("Please provide name and either email or phone.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
      };

      const res = await fetch(`${BACKEND_URL}/widgets/guest/start/${publicWidgetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to start chat');

      const data: GuestStartResponse = await res.json();
      setGuestId(data.guest_id);
      localStorage.setItem(`sten_guest_${publicWidgetId}`, data.guest_id);
      setView('chat');
      setSessionId(null); // Explicitly no session yet
      setMessages([]); // Clear messages
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (err) {
      console.error(err);
      setError("Error starting chat. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !guestId || sending) return;

    const userMsg: Message = {
      id: "temp-" + Date.now(),
      sender: 'guest',
      message_text: inputText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSending(true);
    scrollToBottom();

    try {
      let res;
      if (!sessionId) {
        // Start NEW session
        res = await fetch(`${BACKEND_URL}/widgets/guest/session/init/${publicWidgetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guest_id: guestId,
            message: userMsg.message_text,
            origin: viewingHistory ? "resumed" : "auto-start" // If sending from history view without ID (weird case), or clean slate
            // Logic fix: "When user manually clicks New Chat -> origin=manual" 
            // But here we don't track the 'trigger' unless we store it.
            // For now, let's default to "auto-start" if fresh, or "manual" if we had a flag.
            // Let's rely on backend defaults for now or update component state to track "nextOrigin".
          })
        });
      } else {
        // Continue existing session
        res = await fetch(`${BACKEND_URL}/widgets/chat/${publicWidgetId}/session/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg.message_text })
        });
      }

      if (!res.ok) throw new Error("Send failed");

      const data = await res.json();

      // If we got a session back (from init), store it
      // How do we get the session ID from init response? 
      // Checking backend... `process_chat_message` returns `WidgetChatResponse`.
      // `WidgetChatResponse` contains `message` (GuestMessageSchema) which has `session_id`!
      if (data.message && data.message.session_id) {
        setSessionId(data.message.session_id);
      }

      setMessages(prev => {
        const clean = prev.filter(m => m.id !== userMsg.id);
        return [...clean, data.message, data.response];
      });
      scrollToBottom();
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setViewingHistory(false);
    setShowMenu(false);
    // NOTE: We could track 'origin' here in a ref if needed to send 'manual'
    // For now, next message creates session.
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleHistoryClick = async () => {
    if (!guestId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/widgets/sessions/${guestId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setViewingHistory(true);
        setShowMenu(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResumeSession = async (sid: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/widgets/session/${sid}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setSessionId(sid);
        setViewingHistory(false);
        scrollToBottom();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const primaryColor = config?.primary_color || '#000000';

  if (!config && view === 'loading') {
    return <div className="p-4 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div
      className="flex flex-col bg-white relative overflow-hidden"
      style={{
        height: '100dvh',
        touchAction: 'manipulation',
        transform: 'translateZ(0)',
        WebkitFontSmoothing: 'antialiased',
        '--primary-color': primaryColor,
      } as React.CSSProperties}
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div className="bg-[var(--primary-color)] text-white p-4 flex items-center justify-between shadow-md shrink-0 z-10">
        <h1 className="text-lg font-semibold">Chat Support</h1>
        {view === 'chat' && (
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-white/10 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        )}
      </div>

      {/* Menu / Sidebar Overlay */}
      {showMenu && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowMenu(false)}>
          <div
            className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="font-semibold text-gray-700">Menu</span>
              <button onClick={() => setShowMenu(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={handleNewChat}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
              >
                <span>🆕</span> New Chat
              </button>
              <button
                onClick={handleHistoryClick}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
              >
                <span>🕒</span> History
              </button>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="px-4 py-2 text-xs text-gray-400">Settings</div>
              {/* Settings items can go here */}
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute top-16 left-4 right-4 bg-red-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse pointer-events-none">
          {error}
        </div>
      )}

      {/* Form View */}
      {view === 'form' && (
        <div className="flex-1 p-6 flex flex-col justify-center overflow-y-auto">
          <div className="flex justify-start mb-6">
            <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm text-sm border border-gray-200 max-w-[80%]">
              {config?.welcome_message || "Hi there!"}
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4 text-gray-800">Start a Conversation</h2>
          <p className="text-gray-600 mb-6">Please tell us a bit about yourself to get started.</p>

          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                ref={nameInputRef}
                type="text"
                required
                autoFocus
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none sm:text-sm transition-colors"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none sm:text-sm transition-colors"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="text-center text-sm text-gray-500">- OR -</div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none sm:text-sm transition-colors"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:brightness-90 focus:outline-none focus:ring-4 focus:ring-[var(--primary-color)]/30 transition-all"
            >
              Start Chat
            </button>
          </form>
        </div>
      )}

      {/* History View */}
      {view === 'chat' && viewingHistory && (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setViewingHistory(false)} className="text-gray-500 hover:text-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <h2 className="font-semibold text-gray-800">History</h2>
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">No past conversations.</div>
            ) : (
              history.map(session => (
                <div
                  key={session.id}
                  onClick={() => handleResumeSession(session.id)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-[var(--primary-color)] transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-gray-800 text-sm truncate max-w-[70%]">
                      {session.summary || "Conversation"}
                      {/* Fallback to date if no summary */}
                      {!session.summary && new Date(session.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span className={`px-1.5 py-0.5 rounded bg-gray-100 ${session.origin === 'manual' ? 'text-blue-600' : 'text-gray-600'}`}>
                      {session.origin}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat View */}
      {view === 'chat' && !viewingHistory && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8 text-sm">
                Start a new conversation...
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${msg.sender === 'guest'
                    ? 'bg-[var(--primary-color)] text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                >
                  {msg.message_text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 text-xs text-gray-500 italic animate-pulse">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-200 p-4 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/30 focus:outline-none text-black transition-all"
                placeholder="Type a message..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
                disabled={sending}
                autoComplete="off"
                autoFocus
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || sending}
                className="bg-[var(--primary-color)] text-white rounded-full p-3 hover:brightness-90 disabled:opacity-50 transition-all shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className="text-center mt-2 text-xs text-gray-400">
              Powered by Sten
            </div>
          </div>
        </>
      )}
    </div>
  );
}