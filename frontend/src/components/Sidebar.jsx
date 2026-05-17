// src/components/Sidebar.jsx
import React from 'react';

// userNickname 프롭으로 외부에서 닉네임을 전달받습니다.
function Sidebar({ currentPage, setCurrentPage, startNewConversation, userNickname, user, onLogout }) {
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
        <h2 style={{ color: '#ff6b6b', fontSize: '24px', margin: 0, letterSpacing: '-1px', fontWeight: 'bold' }}>🍳 AI 챗봇 냉털이</h2>
        <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px', fontWeight: '500' }}>개인 상황을 이해하는 스마트 요리 어시스턴트</div>
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
                color: isActive ? '#fff' : (item.primary ? '#ff6b6b' : '#444'), 
                fontWeight: isActive || item.primary ? 'bold' : '500',
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#f8f9fa';
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

      {/* 유저 프로필 카드 */}
      <button
        type="button"
        onClick={() => !user && setCurrentPage('login')}
        style={{ 
          width: '100%',
          textAlign: 'left',
          padding: '14px 16px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #eee',
          borderRadius: '16px',
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          cursor: !user ? 'pointer' : 'default',
          outline: 'none',
          borderColor: !user ? '#eee' : '#eee'
        }}
      >
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
            color: '#222',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {user ? `${userNickname} 님` : '게스트'}
          </span>
          <span style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            {user ? '로그인 상태입니다.' : '게스트입니다. 클릭하면 로그인 페이지로 이동합니다.'}
          </span>
        </div>
      </button>
      {user && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              borderRadius: '14px',
              backgroundColor: '#ff6b6b',
              color: '#fff',
              border: 'none',
              padding: '12px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >로그아웃</button>
        </div>
      )}

    </aside>
  );
}

export default Sidebar;