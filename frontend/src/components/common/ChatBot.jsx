import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const s = {
  container: { position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 },
  toggle: { width: 58, height: 58, borderRadius: '50%', background: '#1976d2', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(25,118,210,0.4)', transition: 'transform 0.2s' },
  window: { position: 'absolute', bottom: 70, right: 0, width: 340, height: 480, background: 'white', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { background: '#1976d2', color: 'white', padding: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  closeBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem' },
  messages: { flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  botMsg: { background: '#f0f4ff', padding: '0.7rem 0.9rem', borderRadius: '12px 12px 12px 4px', maxWidth: '80%', fontSize: '0.88rem', color: '#333', alignSelf: 'flex-start' },
  userMsg: { background: '#1976d2', color: 'white', padding: '0.7rem 0.9rem', borderRadius: '12px 12px 4px 12px', maxWidth: '80%', fontSize: '0.88rem', alignSelf: 'flex-end' },
  inputRow: { display: 'flex', padding: '0.8rem', borderTop: '1px solid #eee', gap: '0.5rem' },
  input: { flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #ddd', borderRadius: 20, outline: 'none', fontSize: '0.88rem' },
  sendBtn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.88rem' },
  stub: { background: '#fff3cd', color: '#856404', padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderTop: '1px solid #ffc107', textAlign: 'center' },
};

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "👋 Hi! I'm your AI shopping assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    chatAPI.getStatus().then(res => setAiAvailable(res.data.available)).catch(() => {});
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
      const res = await chatAPI.sendMessage(userText, history);
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble responding right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={s.container}>
      {open && (
        <div style={s.window}>
          <div style={s.header}>
            <span style={s.headerTitle}>🤖 AI Shopping Assistant</span>
            <button style={s.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div style={s.messages}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === 'bot' ? s.botMsg : s.userMsg}>{m.text}</div>
            ))}
            {loading && <div style={s.botMsg}>Typing...</div>}
            <div ref={messagesEndRef} />
          </div>
          {!aiAvailable && <div style={s.stub}>⚠️ AI stub mode — OpenAI API pending configuration</div>}
          <div style={s.inputRow}>
            <input
              style={s.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button style={s.sendBtn} onClick={send}>Send</button>
          </div>
        </div>
      )}
      <button
        style={s.toggle}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={e => (e.target.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.target.style.transform = '')}
        title="AI Shopping Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>
    </div>
  );
}
