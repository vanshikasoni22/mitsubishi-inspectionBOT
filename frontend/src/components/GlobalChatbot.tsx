'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Loader2, User } from 'lucide-react';
import { inspectionApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function GlobalChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Hello! I am your AutoInspect AI Assistant. You can ask me questions about parts, defects, OEM specifications, or how to use the dashboard.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract inspection ID if the user is currently viewing a report page
  const match = pathname ? pathname.match(/\/inspection\/([a-f0-9-]{36})/) : null;
  const inspectionId = match ? match[1] : undefined;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText, timestamp: new Date() }]);
    setLoading(true);

    try {
      // Call contextual chat endpoint
      const res = await inspectionApi.chat(userText, inspectionId);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: res.data.answer, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'I apologize, I experienced a minor network issue. Please check your connection and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Preset quick questions
  const quickQuestions = [
    { label: 'Defect causes?', q: 'What usually causes transportation damages?' },
    { label: 'OEM negotiation?', q: 'How should I negotiate with OEMs about defects?' },
    { label: 'Blurry photos?', q: 'Why does the camera check say my photo is blurry?' },
    { label: 'Audit process?', q: 'Where do audit logs get recorded?' },
  ];

  const handleQuickQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000, fontFamily: 'var(--font-sans)' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 380,
              height: 520,
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fff',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>AutoInspect Assistant</div>
                  <div style={{ fontSize: 10, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                    {inspectionId ? 'Context: Active Inspection' : 'Context: General'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  opacity: 0.8,
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                padding: 16,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      background: m.role === 'user' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                      color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: 12,
                      fontSize: 13,
                      lineHeight: 1.5,
                      border: m.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                  <Loader2 size={14} className="animate-spin-slow" />
                  <span>AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions suggestion */}
            {messages.length === 1 && (
              <div style={{ padding: '0 16px 8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {quickQuestions.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => handleQuickQuestion(q.q)}
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 20,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div
              style={{
                padding: 12,
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <input
                type="text"
                placeholder="Ask about parts or reports..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: !input.trim() || loading ? 0.5 : 1,
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 102, 204, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          float: 'right',
        }}
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
}
