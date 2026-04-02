'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFollowedTrains } from '@/context/FollowedTrainsContext';
import { useLocale } from '@/context/LocaleContext';

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
}

const BOT_DELAY = 1000; // ms

export default function FrecciaLenta() {
  const { lang, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', text: t('ai.greeting') },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { followedTrains, followTrain, unfollowTrain, isFollowed } = useFollowedTrains();
  const searchResultsRef = useRef<any[]>([]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, open]);

  const sendMessage = async (overrideText?: string, hideUserMsg = false) => {
    const text = overrideText || input.trim();
    if (!text || isTyping) return;
    if (!overrideText) setInput('');
    
    let currentHistory = messages.map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text
    }));

    if (!hideUserMsg) {
      const userMsg: Message = { id: Date.now(), role: 'user', text };
      setMessages((prev) => [...prev, userMsg]);
      currentHistory.push({ role: 'user', content: text });
    } else {
      // If it's a hidden system message (like search results), we still need it in history
      currentHistory.push({ role: 'user', content: text });
    }

    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: currentHistory,
          followedTrains: followedTrains,
          lang: lang
        }),
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      let reply = data.message || t('ai.errorConnection');

      // 1. Handle SEARCH Tool
      const searchMatch = reply.match(/\[SEARCH:(.*?):(.*?)\]/i);
      if (searchMatch) {
        const from = searchMatch[1].trim();
        const to = searchMatch[2].trim();
        
        try {
          const sRes = await fetch(`/api/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
          const sData = await sRes.json();
          
          let resultsMsg = "";
          if (sData.solutions && sData.solutions.length > 0) {
            // Flatten all trains from all legs to store in searchResultsRef
            const allTrains = sData.solutions.flatMap((s: any) => s.legs);
            searchResultsRef.current = allTrains;

            resultsMsg = `Ecco le soluzioni trovate da ${from} a ${to}:\n` + 
                         sData.solutions.map((s: any, i: number) => {
                           const legInfo = s.legs.map((l: any) => 
                             `- Treno ${l.numeroTreno} (${l.categoria}), da ${l.origine} (p. ${l.partenza}) a ${l.destinazione} (a. ${l.arrivo})`
                           ).join('\n');
                           return `Opzione ${i+1} (Durata: ${s.durata}, Cambi: ${s.cambi}):\n${legInfo}`;
                         }).join('\n\n');
          } else {
            resultsMsg = `Non ho trovato soluzioni di viaggio da ${from} a ${to} per l'orario richiesto.`;
          }

          // We don't add the search results to the visible messages, 
          // just a "searching" placeholder, then we re-call sendMessage.
          setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: `🐢 ${t('ai.searching', { from, to })}` }]);
          
          // Re-call sendMessage with the search results as a hidden system message
          setTimeout(() => {
             sendMessage(`SYSTEM: Search results for ${from} to ${to}:\n${resultsMsg}`, true);
          }, 600);
          return; 
        } catch (sErr) {
          console.error('Search tool error:', sErr);
        }
      }

      // 2. NanoClaw-style Intent Parsing (FOLLOW/UNFOLLOW)
      // Stricter regex: must contain at least one digit to be a valid train number
      // Matches both [FOLLOW:...] and (FOLLOW:...)
      const followMatch = reply.match(/[\[\(]FOLLOW:([A-Z0-9/-]*\d+[A-Z0-9/-]*)[\]\)]/i);
      const unfollowMatch = reply.match(/[\[\(]UNFOLLOW:([A-Z0-9/-]*\d+[A-Z0-9/-]*)[\]\)]/i);

      if (followMatch) {
        const numero = followMatch[1];
        if (numero.toUpperCase() !== 'NUMBER' && !isFollowed(numero)) {
          // Try to enrich from searchResultsRef
          const enriched = searchResultsRef.current.find(t => t.numeroTreno === numero);
          followTrain({
            numeroTreno: numero,
            origine: enriched?.origine || '—',
            destinazione: enriched?.destinazione || '—',
            categoriaDescrizione: enriched?.categoria || 'Treno',
          });
        }
        reply = reply.replace(/\[FOLLOW:([\w/-]+)\]/ig, '').trim();
      }

      if (unfollowMatch) {
        const numero = unfollowMatch[1];
        unfollowTrain(numero);
        reply = reply.replace(/\[UNFOLLOW:([\w/-]+)\]/ig, '').trim();
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: t('ai.errorService') }]);
    } finally {
      setIsTyping(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('ai.tooltip')}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #c00000 0%, #ff3b3b 100%)',
          boxShadow: open
            ? '0 0 0 4px rgba(192,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          transform: open ? 'rotate(10deg) scale(1.08)' : 'scale(1)',
        }}
      >
        🐢
      </button>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            zIndex: 1000,
            width: '340px',
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            background: 'var(--bg-secondary, #1a1a2e)',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'fl-slideUp 0.25s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #8b0000 0%, #c00000 60%, #e00 100%)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '22px' }}>🐢</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', letterSpacing: '0.01em' }}>
                Freccia Lenta
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                {t('ai.subtitle')}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: 1,
                padding: '0 4px',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
              aria-label={t('ai.close')}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background:
                      m.role === 'user'
                        ? 'linear-gradient(135deg, #c00000, #e00)'
                        : 'rgba(255,255,255,0.07)',
                    color: '#f0f0f0',
                    fontSize: '13px',
                    lineHeight: '1.55',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    border: m.role === 'bot' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '18px',
                    letterSpacing: '3px',
                  }}
                >
                  <span className="fl-dot" style={{ animationDelay: '0s' }}>·</span>
                  <span className="fl-dot" style={{ animationDelay: '0.2s' }}>·</span>
                  <span className="fl-dot" style={{ animationDelay: '0.4s' }}>·</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '10px 12px 14px',
              display: 'flex',
              gap: '8px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.placeholder')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#f0f0f0',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background:
                  !input.trim() || isTyping
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, #c00000, #e00)',
                color: !input.trim() || isTyping ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: !input.trim() || isTyping ? 'default' : 'pointer',
                fontSize: '16px',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fl-slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .fl-dot {
          display: inline-block;
          animation: fl-blink 1s infinite;
        }
        @keyframes fl-blink {
          0%, 80%  { opacity: 1; }
          40%      { opacity: 0; }
        }
      `}</style>
    </>
  );
}
