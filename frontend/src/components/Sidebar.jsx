// src/components/Sidebar.jsx
import React from 'react';

function Sidebar() {
  const menuItems = [
    { icon: '🏠', label: '홈' },
    { icon: '➕', label: '새로운 대화', primary: true },
    { icon: '🥩', label: '냉장고 재료' },
    { icon: '🎛️', label: '상황 설정' },
    { icon: '🕒', label: '추천 기록' },
    { icon: '⭐', label: '즐겨찾기' },
    { icon: '⚙️', label: '설정' },
  ];

  return (
    <aside style={{
      width: '20vw',          // 🌟 브라우저 가로 너비의 20%를 차지하도록 설정 (반응형)
      minWidth: '220px',      // 🌟 창이 아무리 작아져도 220px 이하로는 안 찌그러짐
      maxWidth: '280px',      // 🌟 창이 아무리 커져도 280px 이상으로는 안 늘어남
      height: '100%',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box',
      flexShrink: 0
    }}>
      {/* 서비스 로고 */}
      <div style={{ marginBottom: '35px', padding: '0 10px' }}>
        <h2 style={{ color: '#ff6b6b', fontSize: '24px', margin: 0, letterSpacing: '-1px', fontWeight: 'bold' }}>🍳 식사 의사결정 AI 챗봇</h2>
        <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px', fontWeight: '500' }}>개인 상황을 이해하는 스마트 요리 어시스턴트</div>
      </div>

      {/* 메뉴 리스트 */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 15px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: item.primary ? 'bold' : '500',
            color: item.primary ? '#ff6b6b' : '#444',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* 🌟 하단: 오늘의 한 줄 추천 */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fff4f4', // 브랜드 컬러에 맞춘 아주 연한 배경
        border: '1px solid #ffe3e3',
        borderRadius: '12px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(255, 107, 107, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px' }}>💡</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff6b6b' }}>오늘의 한 줄 추천</span>
        </div>
        <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', wordBreak: 'keep-all', textAlign: 'left' }}>
          비 오는 날엔 역시 따끈한 국물이죠! 
          냉장고 속 <b>자투리 채소로 만드는 전골</b> 어떠세요?
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;