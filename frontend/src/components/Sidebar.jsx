// src/components/Sidebar.jsx
import React from 'react';

// userNickname 프롭을 추가하여 외부에서 닉네임을 전달받을 수 있게 합니다.
function Sidebar({ currentPage, setCurrentPage, startNewConversation, userNickname }) {
  const menuItems = [
    { icon: '🏠', label: '홈', id: 'home' },
    { icon: '➕', label: '새로운 대화', primary: true, id: 'new' }, 
    { icon: '🥩', label: '냉장고 재료', id: 'fridge' },
    { icon: '🕒', label: '추천 기록', id: 'history' },
    { icon: '⚙️', label: '설정', id: 'settings' },
  ];

  return (
    <aside style={{
      width: '20vw',
      minWidth: '220px',
      maxWidth: '280px',
      height: '100%',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-strong)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}>
      {/* 서비스 로고 */}
      <div style={{ marginBottom: '35px', padding: '0 10px' }}>
        <h2 style={{ color: '#ff6b6b', fontSize: '24px', margin: 0, letterSpacing: '-1px', fontWeight: 'bold' }}>🍳 AI 챗봇 냉털이</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px', fontWeight: '500' }}>개인 상황을 이해하는 스마트 요리 어시스턴트</div>
      </div>

      {/* 메뉴 리스트 */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item, index) => {
          const isActive = currentPage === item.id;

          return (
            <div key={index} 
              onClick={() => {
                if (item.id === 'new') {
                  startNewConversation(); 
                } else {
                  setCurrentPage(item.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 15px',
                borderRadius: '12px',
                fontSize: '15px',
                transition: 'all 0.2s',
                marginBottom: '4px',
                cursor: isActive ? 'default' : 'pointer',
                pointerEvents: isActive ? 'none' : 'auto', 
                backgroundColor: isActive ? '#ff6b6b' : 'transparent',
                color: isActive ? '#fff' : (item.primary ? '#ff6b6b' : 'var(--text-sidebar)'),
                fontWeight: isActive || item.primary ? 'bold' : '500',
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </div>
          );
        })}
      </div>

      {/* 하단: 유저 프로필 카드 */}
      <div style={{ 
        padding: '14px 16px', 
        backgroundColor: 'var(--bg-profile)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* 프로필 아바타 아이콘 */}
        <div style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '50%', 
          backgroundColor: '#ffe3e3', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          fontSize: '18px',
          flexShrink: 0
        }}>
          👤
        </div>
        
        {/* 유저 정보 텍스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', overflow: 'hidden' }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: 'var(--text-heading)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {userNickname || '테스트유저'} 님
          </span>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;