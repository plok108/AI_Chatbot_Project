// src/components/ChatPage.jsx
import React, { useEffect, useRef } from 'react';
import QuickPrompts from './QuickPrompts';
import { API_BASE, authHeaders } from '../api';

function ChatPage({ onFirstMessage, messages, setMessages, userId, dislikedFoods = [] }) {
  const [inputText, setInputText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  // 사용자가 직접 고르는 날씨 (시간은 디바이스에서 자동)
  const [weatherFeel, setWeatherFeel] = React.useState(null); // 'cold' | 'normal' | 'hot'
  const [weatherWet, setWeatherWet] = React.useState(false);  // 비·눈 여부

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && !isRecording) {
      inputRef.current?.focus();
    }
  }, [isLoading, isRecording]);

  // ── 1단계: 메뉴 후보 추천 ────────────────────────────────
  const handleSend = async (text = inputText) => {
    if (!text.trim()) return;

    if (messages.length === 0 && onFirstMessage) {
      onFirstMessage();
    }

    const newUserMsg = { id: Date.now(), type: 'user', text, sender: 'user' };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat/recommend`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          user_message: text,
          ingredients: [],
          disliked_foods: dislikedFoods,
          client_hour: new Date().getHours(),   // 디바이스 로컬 시각
          weather_feel: weatherFeel,             // 사용자 선택 날씨
          weather_wet: weatherWet,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // 히스토리 표시용 text 필드 포함
      const summaryLine = data.summary ? `${data.summary}\n\n` : '';
      const candidateLines = (data.candidates || [])
        .map(c => `• ${c.name} (활용률 ${c.usage_rate}%, 추가비용 ${c.extra_cost === 0 ? '없음' : `약 ${c.extra_cost.toLocaleString()}원`})`)
        .join('\n');

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'recommendation',
        sender: 'ai',
        text: `${summaryLine}추천 메뉴:\n${candidateLines}`,  // 히스토리 fallback 용
        conversation_id: data.conversation_id,
        candidates: data.candidates || [],
        summary: data.summary || '',
        selectedMenu: null,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: '죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        sender: 'ai',
      }]);
    }

    setIsLoading(false);
  };

  // ── 2단계: 메뉴 선택 → 레시피 요청 ──────────────────────
  const handleSelectMenu = async (conversationId, candidate, messageId) => {
    // 선택 즉시 UI 반영
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, selectedMenu: candidate.name } : msg
    ));
    setIsLoading(true);

    // 선택 저장 → 성공 확인 후 레시피 생성 (선호도 분석 핵심 데이터)
    if (userId) {
      try {
        const selectRes = await fetch(`${API_BASE}/api/chat/select`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            food_name: candidate.name,
            conversation_id: conversationId,
          }),
        });
        if (!selectRes.ok) throw new Error(`HTTP ${selectRes.status}`);
      } catch {
        setMessages(prev => [
          ...prev.map(msg =>
            msg.id === messageId ? { ...msg, selectedMenu: null } : msg
          ),
          {
            id: Date.now(),
            type: 'ai',
            text: '선택 기록 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            sender: 'ai',
          },
        ]);
        setIsLoading(false);
        return;
      }
    }

    // 레시피 생성
    try {
      const res = await fetch(`${API_BASE}/api/chat/recipe`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          food_name: candidate.name,
          conversation_id: conversationId,
          ingredients: [],
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: `📖 ${data.food_name} 레시피\n\n${data.recipe}`,
        sender: 'ai',
      }]);
    } catch {
      setMessages(prev => [
        ...prev.map(msg =>
          msg.id === messageId ? { ...msg, selectedMenu: null } : msg
        ),
        {
          id: Date.now(),
          type: 'ai',
          text: '레시피를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.',
          sender: 'ai',
        },
      ]);
    }

    setIsLoading(false);
  };

  // ── 추천 카드 렌더링 ─────────────────────────────────────
  const renderRecommendationMessage = (msg) => {
    const hasSelection = !!msg.selectedMenu;

    return (
      <div style={{
        maxWidth: '90%',
        backgroundColor: 'var(--bg-ai-bubble)',
        borderRadius: '20px 20px 20px 4px',
        padding: '16px 18px',
        boxShadow: '0 2px 5px var(--shadow-sm)',
      }}>
        {msg.summary && (
          <p style={{
            fontSize: '14px', color: 'var(--text-secondary)',
            margin: '0 0 12px 0', lineHeight: '1.5',
          }}>
            {msg.summary}
          </p>
        )}
        <p style={{
          fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)',
          margin: '0 0 12px 0',
        }}>
          🍽️ 아래 메뉴 중 원하시는 것을 선택해주세요!
        </p>

        {msg.candidates.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            추천 메뉴를 불러오지 못했습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {msg.candidates.map(candidate => {
              const isSelected = msg.selectedMenu === candidate.name;
              const rate = candidate.usage_rate;
              const usageColor = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
              const usageBg   = rate >= 80 ? '#f0fdf4' : rate >= 50 ? '#fffbeb' : '#fef2f2';

              return (
                <div key={candidate.name} style={{
                  backgroundColor: isSelected ? '#fff4f4' : 'var(--bg-card)',
                  border: isSelected ? '2px solid #ff6b6b' : '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  opacity: hasSelection && !isSelected ? 0.45 : 1,
                  transition: 'all 0.2s',
                }}>
                  {/* 헤더: 이름 + 활용률 뱃지 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '6px',
                  }}>
                    <h4 style={{
                      margin: 0, fontSize: '16px',
                      color: 'var(--text-heading)', fontWeight: 'bold',
                    }}>
                      {isSelected ? '✅ ' : ''}{candidate.name}
                    </h4>
                    <span style={{
                      fontSize: '12px', fontWeight: 'bold',
                      color: usageColor, backgroundColor: usageBg,
                      padding: '2px 8px', borderRadius: '20px',
                      flexShrink: 0, marginLeft: '8px',
                    }}>
                      📦 {rate}%
                    </span>
                  </div>

                  {/* 추천 이유 */}
                  <p style={{
                    fontSize: '13px', color: 'var(--text-secondary)',
                    margin: '0 0 8px 0', lineHeight: '1.4',
                  }}>
                    {candidate.reason}
                  </p>

                  {/* 전체 재료 (투명성) */}
                  {candidate.ingredients && candidate.ingredients.length > 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px 0', lineHeight: '1.5' }}>
                      🧂 재료: {candidate.ingredients.join(', ')}
                    </p>
                  )}

                  {/* 안전 경고 (재료 검증 불가 시) */}
                  {candidate.safety_note && (
                    <p style={{ fontSize: '12px', color: '#f59e0b', margin: '0 0 6px 0', lineHeight: '1.4', fontWeight: 'bold' }}>
                      ⚠️ {candidate.safety_note}
                    </p>
                  )}

                  {/* 재료·비용 정보 */}
                  <div style={{
                    fontSize: '12px', color: 'var(--text-muted)',
                    lineHeight: '1.8', marginBottom: hasSelection ? 0 : '10px',
                  }}>
                    {candidate.missing_ingredients.length > 0 ? (
                      <div>
                        🛒 추가 재료:{' '}
                        {candidate.missing_ingredients
                          .map(m => `${m.name} (약 ${m.cost.toLocaleString()}원)`)
                          .join(', ')}
                      </div>
                    ) : (
                      <div style={{ color: '#22c55e' }}>✨ 추가 재료 없음!</div>
                    )}
                    <div>
                      💰{' '}
                      {candidate.extra_cost === 0
                        ? '추가 비용 없음'
                        : `예상 추가 비용: 약 ${candidate.extra_cost.toLocaleString()}원`}
                    </div>
                  </div>

                  {/* 선택 버튼 또는 선택 완료 표시 */}
                  {!hasSelection && (
                    <button
                      onClick={() => handleSelectMenu(msg.conversation_id, candidate, msg.id)}
                      disabled={isLoading}
                      style={{
                        width: '100%', height: '36px', marginTop: '10px',
                        backgroundColor: isLoading ? '#ffb3b3' : '#ff6b6b',
                        color: '#fff', border: 'none', borderRadius: '8px',
                        fontSize: '14px', fontWeight: 'bold',
                        cursor: isLoading ? 'default' : 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseOver={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#fa5252'; }}
                      onMouseOut={e => { if (!isLoading) e.currentTarget.style.backgroundColor = isLoading ? '#ffb3b3' : '#ff6b6b'; }}
                    >
                      {candidate.name} 선택
                    </button>
                  )}
                  {isSelected && (
                    <div style={{
                      textAlign: 'center', color: '#ff6b6b',
                      fontSize: '13px', fontWeight: 'bold', marginTop: '8px',
                    }}>
                      ✅ 선택 완료 — 레시피를 준비하고 있습니다...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 면책 문구 (의학적 안전 미보장) */}
        <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '12px 0 0 0', lineHeight: '1.4' }}>
          ※ 알러지 안전을 완벽히 보장하지 않습니다. 드시기 전 재료를 꼭 확인하세요.
        </p>
      </div>
    );
  };

  const toggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
      if (messages.length === 0 && onFirstMessage) onFirstMessage();
    } else {
      setIsRecording(true);
    }
  };

  const isTyping = inputText.trim().length > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: 'var(--bg-chat)', alignItems: 'center', overflow: 'hidden',
    }}>

      {/* 메인 채팅 영역 */}
      <div style={{
        flex: 1, width: '100%', maxWidth: '800px', overflowY: 'auto',
        padding: '20px', display: 'flex', flexDirection: 'column',
        justifyContent: messages.length === 0 ? 'center' : 'flex-start',
        boxSizing: 'border-box',
      }}>

        {messages.length === 0 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{
                fontSize: '32px', color: 'var(--text-heading)', marginBottom: '16px',
                textAlign: 'left', fontWeight: 'bold', lineHeight: '1.4', wordBreak: 'keep-all',
              }}>
                안녕하세요!<br />오늘은 어떤 식사를 도와드릴까요?
              </h1>
              <p style={{
                fontSize: '16px', color: 'var(--text-muted)',
                textAlign: 'left', margin: 0, wordBreak: 'keep-all',
              }}>
                당신의 상황을 이해하고, 최적의 선택을 제안해드릴게요.
              </p>
            </div>
            <QuickPrompts onSelect={handleSend} />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.type === 'recommendation' ? (
                  renderRecommendationMessage(msg)
                ) : (
                  <div style={{
                    maxWidth: '85%', padding: '14px 18px',
                    borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    backgroundColor: msg.sender === 'user' ? '#ff6b6b' : 'var(--bg-ai-bubble)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                    fontSize: '15px', lineHeight: '1.6',
                    boxShadow: '0 2px 5px var(--shadow-sm)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '14px 18px', borderRadius: '20px 20px 20px 4px',
                  backgroundColor: 'var(--bg-ai-bubble)', color: 'var(--text-muted)', fontSize: '14px',
                }}>
                  AI 셰프가 맛있는 레시피를 고민 중입니다... ⏳
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>
        )}
      </div>

      {/* 하단 입력창 */}
      <div style={{
        width: '100%', backgroundColor: 'var(--bg-chat)', padding: '20px',
        display: 'flex', justifyContent: 'center',
        borderTop: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          {/* 날씨 선택 (시간은 디바이스에서 자동 인식) — 빠른메뉴처럼 가로로 나란히 */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', marginLeft: '4px' }}>
              🌤️ 오늘 날씨
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['cold', '추움'], ['normal', '보통'], ['hot', '더움']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setWeatherFeel(weatherFeel === val ? null : val)}
                  style={{
                    flex: 1, height: '40px', borderRadius: '12px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s',
                    border: weatherFeel === val ? '1px solid #ff6b6b' : '1px solid var(--border-input)',
                    backgroundColor: weatherFeel === val ? '#ff6b6b' : 'var(--bg-card)',
                    color: weatherFeel === val ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setWeatherWet(w => !w)}
                style={{
                  flex: 1, height: '40px', borderRadius: '12px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s',
                  border: weatherWet ? '1px solid #4dabf7' : '1px solid var(--border-input)',
                  backgroundColor: weatherWet ? '#4dabf7' : 'var(--bg-card)',
                  color: weatherWet ? '#fff' : 'var(--text-secondary)',
                }}
              >
                ☔ 비·눈
              </button>
            </div>
          </div>
          <div style={{
            display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '24px',
            padding: '12px 16px', boxShadow: '0 4px 20px var(--shadow-md)',
            border: '1px solid var(--border-input)', alignItems: 'center',
            transition: 'border-color 0.3s',
          }}>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend();
                  e.target.style.height = 'auto';
                }
              }}
              placeholder={isRecording ? "말씀해 주세요. 듣고 있습니다..." : "지금 어떤 상황인지 자유롭게 적어주세요! (Shift+Enter로 줄바꿈)"}
              disabled={isLoading || isRecording}
              rows={1}
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: '16px', padding: '8px 12px',
                backgroundColor: 'transparent', color: 'var(--text-primary)',
                caretColor: '#ff6b6b', display: 'block', resize: 'none',
                minHeight: '24px', maxHeight: '120px', overflowY: 'auto',
                lineHeight: '1.5', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={isTyping ? () => { handleSend(); setInputText(''); } : toggleMic}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#e0e0e0' : (isTyping ? '#ff6b6b' : (isRecording ? '#ff4757' : '#f1f3f5')),
                color: isTyping || isRecording ? '#fff' : '#666',
                border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                cursor: isLoading ? 'default' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: '18px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                boxShadow: isRecording ? '0 0 0 4px rgba(255, 71, 87, 0.2)' : 'none',
                alignSelf: 'flex-end', marginBottom: '4px',
              }}
            >
              {isTyping ? '↑' : (isRecording ? '■' : '🎤')}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ChatPage;
