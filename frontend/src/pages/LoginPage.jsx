import React, { useState } from 'react';

function LoginPage({ onLogin, onContinueAsGuest }) {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    setIsSubmitting(true);

    const endpoint = authMode === 'login' ? 'login' : 'register';
    const body = authMode === 'login'
      ? { email, password }
      : { email, password, nickname };

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `${authMode === 'login' ? '로그인' : '회원가입'}에 실패했습니다.`);
      }

      const data = await response.json();
      onLogin({ email: data.email, nickname: data.nickname });
    } catch (error) {
      setStatusMessage(
        error.message || '요청에 실패했습니다. 백엔드가 실행 중인지 확인하거나 입력 정보를 다시 확인해 주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = () => {
    setStatusMessage('게스트로 계속합니다. 로그인 없이도 서비스를 사용할 수 있습니다.');
    onContinueAsGuest();
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f6f3ee',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#fff',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        padding: '36px',
      }}>
        <h2 style={{ margin: 0, fontSize: '28px', color: '#222' }}>{authMode === 'login' ? '로그인' : '회원가입'}</h2>
        <p style={{ margin: '12px 0 28px', color: '#666', fontSize: '15px', lineHeight: '1.6' }}>
          {authMode === 'login'
            ? '이 서비스는 로그인 없이도 사용할 수 있습니다. 로그인하면 닉네임이 저장되고, 개인화된 경험을 더 쉽게 관리할 수 있어요.'
            : '새 계정을 만들어 보세요. 로그인 후 닉네임과 설정이 저장됩니다.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px' }}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: '1px solid #ddd',
                padding: '0 16px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: authMode === 'signup' ? '18px' : '22px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px' }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: '1px solid #ddd',
                padding: '0 16px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {authMode === 'signup' && (
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px' }}>닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="사용할 닉네임"
                required
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '14px',
                  border: '1px solid #ddd',
                  padding: '0 16px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {statusMessage && (
            <div style={{ marginBottom: '20px', color: '#d64545', fontSize: '14px', lineHeight: '1.5' }}>
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: '#ff6b6b',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '14px'
            }}
          >
            {isSubmitting ? (authMode === 'login' ? '로그인 중...' : '회원가입 중...') : (authMode === 'login' ? '로그인' : '회원가입')}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '10px' }}>
          <button
            onClick={handleGuest}
            style={{
              flex: 1,
              height: '50px',
              borderRadius: '16px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              color: '#555',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            로그인 없이 계속하기
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setStatusMessage('');
            }}
            style={{
              flex: 1,
              height: '50px',
              borderRadius: '16px',
              border: '1px solid #ff6b6b',
              backgroundColor: authMode === 'login' ? '#fff' : '#ff6b6b',
              color: authMode === 'login' ? '#ff6b6b' : '#fff',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            {authMode === 'login' ? '회원가입으로 이동' : '로그인으로 이동'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
