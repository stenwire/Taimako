'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { chatWithAgent } from '@/lib/api';
import type { Message } from '@/lib/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chatWithAgent(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: response.response,
          sources: response.sources
        }
      ]);
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: 'Sorry, I encountered an error processing your request.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[var(--brand-accent)]/10 rounded-[var(--radius-squircle)]">
            <MessageSquare className="w-8 h-8 text-[var(--brand-accent)]" />
          </div>
          <div>
            <h1 className="text-h1 text-[var(--text-primary)]">AI Chat</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Ask questions about your documents
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[calc(100vh-280px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-[var(--brand-accent)]/10 rounded-full mb-4">
                  <Sparkles className="w-12 h-12 text-[var(--brand-accent)]" />
                </div>
                <h3 className="text-h2 text-[var(--text-primary)] mb-2">Start a Conversation</h3>
                <p className="text-small text-[var(--text-secondary)] max-w-md">
                  Ask questions about your uploaded documents and get instant, accurate answers from your AI assistant
                </p>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                        ? 'bg-[var(--brand-primary)]'
                        : 'bg-[var(--brand-accent)]'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] rounded-[var(--radius-lg)] p-4 ${msg.role === 'user'
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                  >
                    <p className="text-body leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                        <p className="text-[12px] font-semibold text-[var(--text-tertiary)] mb-2">
                          Sources:
                        </p>
                        <div className="space-y-2">
                          {msg.sources.map((source, idx) => (
                            <div
                              key={idx}
                              className="text-[12px] text-[var(--text-secondary)] bg-[var(--bg-primary)] p-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]"
                            >
                              {source.slice(0, 150)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--brand-accent)] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] p-4 border border-[var(--border-subtle)] flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce delay-200" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--bg-secondary)]">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something about your documents..."
                className="flex-1 px-4 py-3 text-body bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] placeholder:text-[var(--text-tertiary)] focus-ring transition-all duration-200"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!input.trim() || loading}
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
