// src/components/ChatPage.jsx
import React, { useState } from 'react';
import QuickPrompts from './QuickPrompts';
import SituationExamples from './SituationExamples';
import RecentRecommendations from './RecentRecommendations';

function ChatPage() {
  const [inputText, setInputText] = useState("");

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', // 🌟 부모(App.jsx)의 높이에 100% 딱 맞춤!
      alignItems: 'center', 
      justifyContent: 'center', // 🌟 전체 내용을 상하 정중앙으로 배치
      padding: '0 20px',
      boxSizing: 'border-box',
      overflow: 'hidden' // 🌟 불필요한 스크롤바 원천 차단
    }}>
      
      {/* 내용물들이 흩어지지 않게 하나의 박스로 묶어줍니다 */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        
        {/* 1. 중앙 인사말 영역 (위쪽 강제 마진 제거) */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            color: '#111', 
            marginBottom: '16px', 
            textAlign: 'left', 
            fontWeight: 'bold',
            lineHeight: '1.4'
          }}>
            안녕하세요!<br/>오늘은 어떤 식사를 도와드릴까요?
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#666', 
            textAlign: 'left',
            margin: 0
          }}>
            당신의 상황을 이해하고, 최적의 선택을 제안해드릴게요.
          </p>
        </div>

        {/* 2. 채팅 입력창 영역 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            backgroundColor: '#fff', 
            borderRadius: '24px', 
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #e5e5e5',
            alignItems: 'center'
          }}>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="지금 어떤 상황인가요? (예: 배고파요, 다이어트 중이에요, 너무 피곤해요...)"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', padding: '8px 12px', backgroundColor: 'transparent' }}
            />
            <button style={{
              backgroundColor: inputText.trim() ? '#ff6b6b' : '#e0e0e0',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              cursor: inputText.trim() ? 'pointer' : 'default',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '18px',
              transition: 'background-color 0.2s',
              flexShrink: 0
            }}>
              ↑
            </button>
          </div>
        </div>

        {/* 3. 빠른 메뉴 영역 */}
        <QuickPrompts />

        {/* 4. 상황 예시 영역 */}
        <SituationExamples />

        {/* 5. 최근 추천 영역 */}
        <RecentRecommendations />
        
      </div>
    </div>
  );
}

export default ChatPage;