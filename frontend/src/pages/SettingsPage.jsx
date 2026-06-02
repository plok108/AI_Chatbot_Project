// src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import { API_BASE, authHeaders } from '../api';

const PREF_BASE = `${API_BASE}/api/preferences`;

const cardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 2px 8px var(--shadow-sm)',
};

const inputStyle = {
  flex: '1 1 0%', minWidth: '0', width: '100%', height: '44px', margin: '0',
  border: '1px solid var(--border-input)', outline: 'none', fontSize: '14px',
  color: 'var(--text-primary)', padding: '0 16px', borderRadius: '10px',
  backgroundColor: 'var(--bg-input)', boxSizing: 'border-box',
};

const btnDarkStyle = {
  flex: 'none', width: 'auto', height: '44px', margin: '0',
  backgroundColor: 'var(--text-primary)',
  color: 'var(--bg-card)', border: 'none', borderRadius: '10px', padding: '0 24px',
  fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap',
  boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function SettingsPage({
  userEmail = '',
  userNickname = '',
  userId = null,
  isGuest = false,
  onLogout,
  onGoToLogin,
  dislikedFoods = [],
  setDislikedFoods,
  theme = 'light',
  setTheme,
}) {
  const [nickname, setNickname] = useState(userNickname);
  const [aiStyles, setAiStyles] = useState([]);
  const [foodInput, setFoodInput] = useState('');
  const foodInputRef = React.useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const aiStyleOptions = [
    '간단한 요리 우선',
    '어려운 요리 포함',
    '다이어트 중심',
    '고단백 중심',
    '가성비 중심',
  ];

  const toggleStyle = (style) => {
    setAiStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const addDislikedFood = async () => {
    const food = foodInput.trim();
    if (!food || dislikedFoods.includes(food)) {
      setFoodInput('');
      return;
    }
    if (userId) {
      try {
        await fetch(`${PREF_BASE}/disliked`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ food }),
        });
      } catch {
        alert('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
    }
    setDislikedFoods(prev => [...prev, food]);
    setFoodInput('');
    foodInputRef.current?.focus();
  };

  const removeDislikedFood = async (food) => {
    if (userId) {
      try {
        await fetch(`${PREF_BASE}/disliked/${encodeURIComponent(food)}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      } catch {
        alert('삭제에 실패했습니다.');
        return;
      }
    }
    setDislikedFoods(prev => prev.filter(f => f !== food));
  };


  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      onLogout();
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: deletePassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || '회원 탈퇴에 실패했습니다. 비밀번호를 확인해주세요.');
        return;
      }
      alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
      setShowDeleteModal(false);
      onLogout();
    } catch {
      alert('서버에 연결할 수 없습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1000px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px',
      height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
    }}>

      {/* 상단 타이틀 */}
      <div style={{ marginBottom: '32px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '24px', color: 'var(--text-heading)', margin: 0, fontWeight: 'bold' }}>⚙️ 설정</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0 0 0' }}>
          {isGuest
            ? '비회원으로 사용 중입니다. 로그인하시면 모든 기능을 이용할 수 있어요!'
            : '계정 정보를 관리하고 나에게 딱 맞는 AI 셰프를 세팅해 보세요!'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>

        {/* ── 게스트: 로그인/회원가입 안내 ── */}
        {isGuest ? (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-heading)', margin: '0 0 12px 0' }}>👤 로그인 / 회원가입</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.7', wordBreak: 'keep-all' }}>
              로그인하시면 추천 기록과 냉장고 재료가 저장되고,<br />
              더 정확한 AI 추천을 받을 수 있어요.
            </p>
            <button
              onClick={onGoToLogin}
              style={{
                width: '100%', maxWidth: '340px', height: '48px',
                backgroundColor: '#ff6b6b', color: '#fff', border: 'none',
                borderRadius: '12px', fontSize: '15px', fontWeight: 'bold',
                cursor: 'pointer', transition: 'background-color 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fa5252'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#ff6b6b'; }}
            >
              로그인 / 회원가입 하러 가기 →
            </button>
          </div>

        ) : (
          /* ── 로그인 사용자: 계정 설정 ── */
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-heading)', margin: '0 0 20px 0' }}>👤 계정 설정</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 이메일 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', width: '120px', flexShrink: 0 }}>이메일</span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {userEmail || '(이메일 정보 없음)'}
                </span>
              </div>

              {/* 닉네임 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', width: '120px', flexShrink: 0 }}>닉네임</span>
                <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    style={inputStyle}
                  />
                  <button
                    style={btnDarkStyle}
                    onClick={() => alert('닉네임 변경 기능은 준비 중입니다.')}
                  >
                    변경
                  </button>
                </div>
              </div>

              {/* 비밀번호 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', width: '120px', flexShrink: 0 }}>비밀번호</span>
                <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
                  <input
                    type="password"
                    placeholder="새 비밀번호 입력"
                    style={inputStyle}
                    readOnly
                    onFocus={() => alert('비밀번호 변경 기능은 준비 중입니다.')}
                  />
                  <button
                    style={btnDarkStyle}
                    onClick={() => alert('비밀번호 변경 기능은 준비 중입니다.')}
                  >
                    변경
                  </button>
                </div>
              </div>
            </div>

            {/* 로그아웃 / 회원탈퇴 */}
            <div style={{ borderTop: '1px solid #eee', marginTop: '24px', paddingTop: '20px', display: 'flex', gap: '16px' }}>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent', border: '1px solid #ddd',
                  padding: '8px 16px', borderRadius: '8px', color: '#555',
                  fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                로그아웃
              </button>
              <button
                onClick={() => { setDeletePassword(''); setShowDeleteModal(true); }}
                style={{
                  backgroundColor: 'transparent', border: 'none', color: '#bbb',
                  fontSize: '13px', cursor: 'pointer', textDecoration: 'underline',
                  transition: 'color 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#ff4757'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#bbb'; }}
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        )}

        {/* ── 기피 음식 및 알러지 (게스트/로그인 모두) ── */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-heading)', margin: '0 0 6px 0' }}>🚫 기피 음식 및 알러지</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>입력하신 재료나 음식은 AI가 추천에서 제외합니다.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px', marginBottom: '16px' }}>
            <input
              ref={foodInputRef}
              type="text"
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDislikedFood()}
              placeholder="예: 오이, 가지, 견과류"
              style={{ ...inputStyle, caretColor: '#ff6b6b' }}
              onFocus={e => e.target.style.borderColor = '#ff6b6b'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
            <button
              onClick={addDislikedFood}
              style={{
                flex: 'none', width: 'auto', height: '44px', margin: '0',
                backgroundColor: '#ff6b6b', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '0 24px', fontSize: '14px', fontWeight: 'bold',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              추가
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {dislikedFoods.length === 0 && (
              <span style={{ fontSize: '13px', color: '#bbb' }}>등록된 항목이 없습니다.</span>
            )}
            {dislikedFoods.map((food, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff4f4',
                border: '1px solid #ffe3e3', padding: '6px 12px', borderRadius: '20px',
                fontSize: '13px', color: '#ff6b6b', fontWeight: '500',
              }}>
                {food}
                <button
                  onClick={() => removeDislikedFood(food)}
                  style={{
                    background: 'none', border: 'none', color: '#ff9999', fontSize: '14px',
                    cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%',
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#ff6b6b'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ff9999'; }}
                >×</button>
              </div>
            ))}
          </div>
        </div>

        {/* ── 테마 변경 (게스트/로그인 모두) ── */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-heading)', margin: '0 0 20px 0' }}>🎨 테마 변경</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1, height: '80px', borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold',
                transition: 'all 0.2s', cursor: 'pointer',
                backgroundColor: theme === 'light' ? '#fff4f4' : 'var(--bg-card-hover)',
                border: theme === 'light' ? '2px solid #ff6b6b' : '1px solid var(--border)',
                color: theme === 'light' ? '#ff6b6b' : 'var(--text-muted)',
              }}
            >
              ☀️ 라이트 모드
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1, height: '80px', borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold',
                transition: 'all 0.2s', cursor: 'pointer',
                backgroundColor: theme === 'dark' ? '#3f3f46' : 'var(--bg-card-hover)',
                border: theme === 'dark' ? '2px solid #a1a1aa' : '1px solid var(--border)',
                color: theme === 'dark' ? '#f4f4f5' : 'var(--text-muted)',
              }}
            >
              🌙 다크 모드
            </button>
          </div>
        </div>

        {/* ── AI 추천 스타일 (게스트/로그인 모두) ── */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-heading)', margin: '0 0 6px 0' }}>🤖 AI 추천 스타일 설정</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>선택하신 스타일은 AI 셰프가 레시피를 추천할 때 최우선으로 반영됩니다.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {aiStyleOptions.map((style, idx) => {
              const isActive = aiStyles.includes(style);
              return (
                <button
                  key={idx}
                  onClick={() => toggleStyle(style)}
                  style={{
                    padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold',
                    cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: isActive ? '#ff6b6b' : '#f8f9fa',
                    border: isActive ? '1px solid #ff6b6b' : '1px solid #ddd',
                    color: isActive ? '#fff' : '#555',
                  }}
                >
                  {isActive ? '✓ ' : '+ '}{style}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── 회원탈퇴 확인 모달 ── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '20px', padding: '32px 28px',
            width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#222' }}>정말 탈퇴하시겠습니까?</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#888', lineHeight: '1.6' }}>
              탈퇴 시 모든 대화 기록과 냉장고 재료가 영구 삭제됩니다.<br />
              계속하려면 비밀번호를 입력해주세요.
            </p>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
              autoFocus
              style={{
                width: '100%', height: '44px', padding: '0 16px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', marginBottom: '16px', caretColor: '#ff6b6b',
              }}
              onFocus={e => e.target.style.borderColor = '#ff6b6b'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1, height: '44px', borderRadius: '10px', border: '1px solid #ddd',
                  backgroundColor: '#fff', color: '#555', fontSize: '14px', fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  flex: 1, height: '44px', borderRadius: '10px', border: 'none',
                  backgroundColor: isDeleting ? '#ffb3b3' : '#ff4757', color: '#fff',
                  fontSize: '14px', fontWeight: 'bold', cursor: isDeleting ? 'default' : 'pointer',
                }}
              >
                {isDeleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SettingsPage;
