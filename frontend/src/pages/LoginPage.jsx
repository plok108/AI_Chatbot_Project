// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { API_BASE, setToken } from '../api';

function LoginPage({ onLogin, onGuest }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoginMode) {
      if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");
    } else {
      if (!email || !password || !nickname) return alert("모든 항목을 입력해주세요.");
    }

    setIsLoading(true);
    try {
      if (isLoginMode) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.detail || "로그인에 실패했습니다.");
          return;
        }
        const data = await res.json();
        setToken(data.access_token);
        onLogin(data.nickname, data.id, data.email);
      } else {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, nickname }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.detail || "회원가입에 실패했습니다.");
          return;
        }
        const data = await res.json();
        setToken(data.access_token);
        alert(`${data.nickname}님, 가입을 환영합니다!`);
        onLogin(data.nickname, data.id, data.email);
      }
    } catch {
      alert("서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#f9f9f9',
    transition: 'border-color 0.2s',
    color: '#333',
    caretColor: '#ff6b6b'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#f6f3ee' }}>

      <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '360px', borderRadius: '20px', padding: '32px 24px', boxSizing: 'border-box', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', textAlign: 'center' }}>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🍳</div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#333', letterSpacing: '-0.5px' }}>상황 인식 기반 AI 식사 추천</h1>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#ff6b6b', fontWeight: 'bold' }}>냉털이</h2>
        </div>

        <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: '#f1f3f5', borderRadius: '10px', padding: '4px', boxSizing: 'border-box' }}>
          <button
            onClick={() => setIsLoginMode(true)}
            style={{
              flex: 1, height: '38px', display: 'flex', justifyContent: 'center', alignItems: 'center',
              margin: 0, fontSize: '14px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer',
              transition: 'all 0.2s', border: 'none',
              backgroundColor: isLoginMode ? '#fff' : 'transparent',
              color: isLoginMode ? '#333' : '#888',
              boxShadow: isLoginMode ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            로그인
          </button>
          <button
            onClick={() => setIsLoginMode(false)}
            style={{
              flex: 1, height: '38px', display: 'flex', justifyContent: 'center', alignItems: 'center',
              margin: 0, fontSize: '14px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer',
              transition: 'all 0.2s', border: 'none',
              backgroundColor: !isLoginMode ? '#fff' : 'transparent',
              color: !isLoginMode ? '#333' : '#888',
              boxShadow: !isLoginMode ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#ff6b6b'}
            onBlur={e => e.target.style.borderColor = '#ddd'}
          />
          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#ff6b6b'}
            onBlur={e => e.target.style.borderColor = '#ddd'}
          />
          {!isLoginMode && (
            <input
              type="text"
              placeholder="닉네임 (2~30자)"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#ff6b6b'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: '12px 0',
              backgroundColor: isLoading ? '#ffb3b3' : '#ff6b6b',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 'bold', marginTop: '8px',
              cursor: isLoading ? 'default' : 'pointer', transition: 'background-color 0.2s'
            }}
            onMouseOver={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#fa5252'; }}
            onMouseOut={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#ff6b6b'; }}
          >
            {isLoading ? '처리 중...' : (isLoginMode ? '로그인' : '회원가입')}
          </button>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <button
            onClick={onGuest}
            style={{
              width: '100%', padding: '12px 0', backgroundColor: '#fff', color: '#555',
              border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}
          >
            👀 비회원으로 둘러보기
          </button>
          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#aaa', wordBreak: 'keep-all', lineHeight: '1.4' }}>
            비회원으로 접속 시 추천 기록 및 냉장고 재료가 저장되지 않습니다.
          </p>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
