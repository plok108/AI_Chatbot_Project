import React from 'react';

function Sidebar() {
  const menuItems = [
    { icon: '🏠', label: '홈' },
    { icon: '➕', label: '새로운 대화', primary: true }, // 새로운 대화 추가
    { icon: '🥩', label: '냉장고 재료' },
    { icon: '🎛️', label: '상황 설정' },
    { icon: '🕒', label: '추천 기록' },
    { icon: '⭐', label: '즐겨찾기' },
    { icon: '⚙️', label: '설정' },
  ];

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* 서비스 로고 */}
      <div style={{ marginBottom: '35px', padding: '0 10px' }}>
        <h2 style={{ color: '#ff6b6b', fontSize: '24px', margin: 0, letterSpacing: '-1px' }}>🍳 식사 의사결정 AI 챗봇</h2>
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
            // '새로운 대화'인 경우 글씨를 좀 더 굵게 표현
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

      {/* 하단 프로필 */}
      <div style={{ 
        paddingTop: '20px', 
        borderTop: '1px solid #f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px' 
      }}>
        <div style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '50%', 
          backgroundColor: '#ffe3e3',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '18px'
        }}>
          🧑‍🍳
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>사용자님</span>
          <span style={{ fontSize: '11px', color: '#999' }}>Premium Plan</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;