'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

// Types
interface WidgetConfig {
  public_widget_id: string;
  theme: string;
  primary_color: string;
  icon_url?: string;
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

const BACKEND_URL = 'http://localhost:8000'; // Should use env var

export default function WidgetPage() {
  const params = useParams();
  const publicWidgetId = params.public_widget_id as string;

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [view, setView] = useState<'loading' | 'form' | 'chat'>('loading');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus helper - ensures input maintains focus when DevTools steals it
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only refocus if clicking on the background, not on interactive elements
    const target = e.target as HTMLElement;
    if (view === 'chat' && inputRef.current && !target.closest('button, input, a')) {
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
        // Check localStorage for existing session
        const storedGuestId = localStorage.getItem(`sten_guest_${publicWidgetId}`);
        if (storedGuestId) {
          setGuestId(storedGuestId);
          setView('chat');
          fetchMessages(storedGuestId);
        } else {
          setView('form');
        }
      })
      .catch(err => {
        console.error(err);
        // Provide some fallback or error state
        setView('form');
      });
  }, [publicWidgetId]);

  // Fetch Messages
  const fetchMessages = async (gid: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/widgets/messages/${gid}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.email && !formData.phone)) {
      alert("Please provide name and either email or phone.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/widgets/guest/start/${publicWidgetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to start chat');

      const data: GuestStartResponse = await res.json();
      setGuestId(data.guest_id);
      localStorage.setItem(`sten_guest_${publicWidgetId}`, data.guest_id);
      setView('chat');
    } catch (err) {
      console.error(err);
      alert("Error starting chat. Please try again.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !guestId) return;

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
      const res = await fetch(`${BACKEND_URL}/widgets/chat/${publicWidgetId}/${guestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.message_text })
      });

      if (!res.ok) throw new Error("Send failed");

      const data = await res.json();
      // Replace temp message with real one and add AI response
      setMessages(prev => {
        const clean = prev.filter(m => m.id !== userMsg.id);
        return [...clean, data.message, data.response];
      });
      scrollToBottom();
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const primaryColor = config?.primary_color || '#000000';

  if (!config && view === 'loading') return <div className="p-4">Loading...</div>;

  return (
    <div
      className="flex flex-col h-screen bg-white"
      style={{ '--primary-color': primaryColor } as React.CSSProperties}
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div className="bg-[var(--primary-color)] text-white p-4 flex items-center shadow-md shrink-0">
        <h1 className="text-lg font-semibold">Chat Support</h1>
      </div>

      {view === 'form' && (
        <div className="flex-1 p-6 flex flex-col justify-center">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Welcome!</h2>
          <p className="text-gray-600 mb-6">Please tell us a bit about yourself to get started.</p>
          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="text-center text-sm text-gray-500">- OR -</div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] cursor-pointer"
            >
              Start Chat
            </button>
          </form>
        </div>
      )}

      {view === 'chat' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] focus:outline-none text-black"
                placeholder="Type a message..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={sending}
                autoComplete="off"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="bg-[var(--primary-color)] text-white rounded-full p-2 hover:brightness-90 disabled:opacity-50 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
            <div className="text-center mt-2 text-xs text-gray-400">
              Powered by Sten
            </div>
          </div>
        </>
      )}
    </div>
  );
}
