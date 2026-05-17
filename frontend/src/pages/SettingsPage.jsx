// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';

function SettingsPage({ user, onLogout, onUpdateUser, onDeleteUser }) {
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [password, setPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [theme, setTheme] = useState('light');
  const [statusMessage, setStatusMessage] = useState('');
  
  const [aiStyles, setAiStyles] = useState(['다이어트 중심', '가성비 중심']);

  const aiStyleOptions = [
    '간단한 요리 우선',
    '어려운 요리 포함',
    '다이어트 중심',
    '고단백 중심',
    '가성비 중심'
  ];

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
    }
  }, [user]);

  const toggleStyle = (style) => {
    if (aiStyles.includes(style)) {
      setAiStyles(aiStyles.filter(s => s !== style));
    } else {
      setAiStyles([...aiStyles, style]);
    }
  };

  const saveNickname = () => {
    if (!user) return;
    setStatusMessage('닉네임이 저장되었습니다.');
    onUpdateUser?.({ ...user, nickname: nickname.trim() || user.nickname });
  };

  const savePassword = () => {
    setStatusMessage('비밀번호 변경 기능은 백엔드 연동이 필요합니다.');
    setPassword('');
  };

  const beginDeleteAccount = () => {
    const confirmed = window.confirm('회원탈퇴를 하시겠습니까?');
    if (confirmed) {
      setIsDeleteMode(true);
      setStatusMessage('회원 탈퇴를 진행하려면 비밀번호를 입력해주세요.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!deletePassword.trim()) {
      setStatusMessage('회원 탈퇴를 진행하려면 비밀번호를 입력해 주세요.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: deletePassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || '회원 탈퇴에 실패했습니다.');
      }

      setStatusMessage('회원 탈퇴가 완료되었습니다. 로그인 페이지로 이동합니다.');
      setDeletePassword('');
      onDeleteUser?.();
    } catch (error) {
      setStatusMessage(error.message || '회원 탈퇴 요청에 실패했습니다.');
    }
  };

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      paddingTop: '20px', 
      paddingBottom: '40px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      
      {/* 상단 타이틀 영역 */}
      <div style={{ marginBottom: '32px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '24px', color: '#333', margin: 0, fontWeight: 'bold' }}>
          ⚙️ 설정
        </h2>
        <p style={{ color: '#888', fontSize: '13px', margin: '8px 0 0 0' }}>
          계정 정보를 관리하고 나에게 딱 맞는 AI 셰프를 세팅해 보세요!
        </p>
      </div>

      {/* 설정 리스트 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        
        {/* 계정 설정 */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px',
          padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '18px', color: '#222', margin: '0 0 20px 0' }}>👤 계정 설정</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 이메일 (왼쪽 정렬) */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#555', width: '120px', flexShrink: 0 }}>이메일</span>
              <div style={{ fontSize: '14px', color: '#888' }}>
                {user?.email || '등록된 이메일이 없습니다.'}
              </div>
            </div>

            {/* 닉네임 입력 및 변경 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#555', width: '120px', flexShrink: 0 }}>닉네임</span>
              <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
                <input 
                  type="text" 
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)}
                  style={{ 
                    flex: '1 1 0%',
                    minWidth: '0',
                    width: '100%',
                    height: '44px',
                    margin: '0',
                    border: '1px solid #ddd',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#333',
                    padding: '0 16px',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={saveNickname}
                  style={{ 
                    flex: 'none',
                    width: 'auto',
                    height: '44px',
                    margin: '0',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  변경
                </button>
              </div>
            </div>

            {/* 비밀번호 입력 및 변경 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#555', width: '120px', flexShrink: 0 }}>비밀번호</span>
              <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="새 비밀번호 입력"
                  style={{ 
                    flex: '1 1 0%',
                    minWidth: '0',
                    width: '100%',
                    height: '44px',
                    margin: '0',
                    border: '1px solid #ddd',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#333',
                    padding: '0 16px',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={savePassword}
                  style={{ 
                    flex: 'none',
                    width: 'auto',
                    height: '44px',
                    margin: '0',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  변경
                </button>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div style={{ marginTop: '16px', color: '#4a4a4a', fontSize: '14px', lineHeight: '1.6' }}>
              {statusMessage}
            </div>
          )}

          <div style={{ borderTop: '1px solid #eee', marginTop: '24px', paddingTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onLogout}
              style={{ flex: '1 1 0%', minWidth: '140px', height: '44px', backgroundColor: '#fff', border: '1px solid #ddd', padding: '0 16px', borderRadius: '10px', color: '#555', fontSize: '14px', cursor: 'pointer', boxSizing: 'border-box' }}>
              로그아웃
            </button>
            <button
              type="button"
              onClick={beginDeleteAccount}
              style={{
                flex: '1 1 0%',
                minWidth: '140px',
                height: '44px',
                backgroundColor: '#fff',
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}>
              회원 탈퇴
            </button>
          </div>

          {isDeleteMode && (
            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="회원 탈퇴 비밀번호"
                style={{
                  flex: '1 1 0%',
                  minWidth: '0',
                  height: '44px',
                  borderRadius: '10px',
                  border: '1px solid #ddd',
                  padding: '0 16px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleDeleteAccount}
                style={{
                  flex: 'none',
                  width: 'auto',
                  height: '44px',
                  minWidth: '140px',
                  margin: '0',
                  backgroundColor: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 18px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                탈퇴 진행
              </button>
            </div>
          )}
        </div>

        {/* 2. 테마 변경 영역 */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px',
          padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '18px', color: '#222', margin: '0 0 20px 0' }}>🎨 테마 변경</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setTheme('light')}
              style={{
                flex: 1, height: '80px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', transition: 'all 0.2s', cursor: 'pointer',
                backgroundColor: theme === 'light' ? '#fff4f4' : '#f8f9fa',
                border: theme === 'light' ? '2px solid #ff6b6b' : '1px solid #eee',
                color: theme === 'light' ? '#ff6b6b' : '#888'
              }}
            >
              ☀️ 라이트 모드
            </button>
            <button 
              onClick={() => setTheme('dark')}
              style={{
                flex: 1, height: '80px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', transition: 'all 0.2s', cursor: 'pointer',
                backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
                border: theme === 'dark' ? '2px solid #333' : '1px solid #eee',
                color: theme === 'dark' ? '#fff' : '#888'
              }}
            >
              🌙 다크 모드 (준비 중)
            </button>
          </div>
        </div>

        {/* 3. AI 추천 스타일 설정 영역 */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px',
          padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', color: '#222', margin: '0 0 6px 0' }}>🤖 AI 추천 스타일 설정</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>선택하신 스타일은 AI 셰프가 레시피를 추천할 때 최우선으로 반영됩니다.</p>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {aiStyleOptions.map((style, idx) => {
              const isActive = aiStyles.includes(style);
              return (
                <button
                  key={idx}
                  onClick={() => toggleStyle(style)}
                  style={{
                    padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: isActive ? '#ff6b6b' : '#f8f9fa',
                    border: isActive ? '1px solid #ff6b6b' : '1px solid #ddd',
                    color: isActive ? '#fff' : '#555'
                  }}
                >
                  {isActive ? '✓ ' : '+ '}{style}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsPage;