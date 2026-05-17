// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import QuickPrompts from './QuickPrompts';

function ChatPage({ onFirstMessage, messages, setMessages }) { // onFirstMessage 콜백은 첫 메시지 전송 후 페이지 상태를 변경합니다.
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const [isRecording, setIsRecording] = useState(false); 

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

  const handleSend = (text = inputText) => {
    if (!text.trim()) return;

    // 첫 메시지 전송 시 onFirstMessage 콜백을 호출합니다.
    if (messages.length === 0 && onFirstMessage) {
      onFirstMessage();
    }

    const newUserMsg = { id: Date.now(), text: text, sender: 'user' };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setIsLoading(true);

    (async () => {
      try {
        const resp = await fetch('http://127.0.0.1:8000/api/chat/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: [],
            situation: null,
            mood: null,
            user_message: text,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => null);
          throw new Error(err?.detail || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        const aiText = data?.recommendation || data?.recommendation || 'AI 응답이 없습니다.';
        const aiResponse = { id: Date.now() + 1, text: aiText, sender: 'ai' };
        setMessages((prev) => [...prev, aiResponse]);
      } catch (error) {
        const aiResponse = { id: Date.now() + 1, text: `AI 요청 실패: ${error.message}`, sender: 'ai' };
        setMessages((prev) => [...prev, aiResponse]);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const toggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
      
      // 음성 녹음 종료 시 첫 메시지 전송 여부를 처리합니다.
      if (messages.length === 0 && onFirstMessage) {
        onFirstMessage();
      }
      
      console.log("마이크 녹음 종료 및 데이터 처리");
    } else {
      setIsRecording(true);
      console.log("마이크 녹음 시작...");
    }
  };

  const isTyping = inputText.trim().length > 0;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: '#fff',
      alignItems: 'center',
      overflow: 'hidden' 
    }}>
      
      {/* 1. 메인 화면 영역 */}
      <div style={{ 
        flex: 1, 
        width: '100%',
        maxWidth: '800px', 
        overflowY: 'auto', 
        padding: '20px', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: messages.length === 0 ? 'center' : 'flex-start',
        boxSizing: 'border-box'
      }}>
        
        {messages.length === 0 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{ 
                fontSize: '32px', color: '#111', marginBottom: '16px', 
                textAlign: 'left', fontWeight: 'bold', lineHeight: '1.4',
                wordBreak: 'keep-all'
              }}>
                안녕하세요!<br/>오늘은 어떤 식사를 도와드릴까요?
              </h1>
              <p style={{ fontSize: '16px', color: '#666', textAlign: 'left', margin: 0, wordBreak: 'keep-all' }}>
                당신의 상황을 이해하고, 최적의 선택을 제안해드릴게요.
              </p>
            </div>
            <QuickPrompts />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' 
              }}>
                <div style={{ 
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  backgroundColor: msg.sender === 'user' ? '#ff6b6b' : '#f8f9fa',
                  color: msg.sender === 'user' ? '#fff' : '#222',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ padding: '14px 18px', borderRadius: '20px 20px 20px 4px', backgroundColor: '#f8f9fa', color: '#888', fontSize: '14px' }}>
                  AI 셰프가 맛있는 레시피를 고민 중입니다... ⏳
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>
        )}
      </div>

      {/* 2. 하단 고정 채팅 입력창 영역 */}
      <div style={{
        width: '100%', 
        backgroundColor: '#fff', 
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        flexShrink: 0 
      }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <div style={{ 
            display: 'flex', 
            backgroundColor: '#fff', 
            borderRadius: '24px', 
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
            border: '1px solid #e5e5e5',
            alignItems: 'center',
            transition: 'border-color 0.3s'
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
                backgroundColor: 'transparent', color: '#111', caretColor: '#ff6b6b', display: 'block',
                resize: 'none', 
                minHeight: '24px', 
                maxHeight: '120px', 
                overflowY: 'auto',
                lineHeight: '1.5',
                fontFamily: 'inherit' 
              }}
            />
            
            <button 
              onClick={isTyping ? () => { handleSend(); setInputText(''); } : toggleMic}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#e0e0e0' : (isTyping ? '#ff6b6b' : (isRecording ? '#ff4757' : '#f1f3f5')),
                color: isTyping || isRecording ? '#fff' : '#666',
                border: 'none', 
                borderRadius: '50%', 
                width: '38px', 
                height: '38px',
                cursor: isLoading ? 'default' : 'pointer',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                fontSize: '18px', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                flexShrink: 0,
                boxShadow: isRecording ? '0 0 0 4px rgba(255, 71, 87, 0.2)' : 'none',
                alignSelf: 'flex-end', 
                marginBottom: '4px'
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