import React, { useState } from 'react';

function ChatWindow() {
  // 1. 대화 기록을 담아두는 '상태(State)' 입니다.
  const [messages, setMessages] = useState([
    { id: 1, text: "안녕하세요! 냉장고에 어떤 재료가 있나요? (예: 양파 반 개, 계란 2개)", sender: "ai" }
  ]);
  
  // 2. 사용자가 입력 중인 글자를 담아두는 '상태' 입니다.
  const [inputText, setInputText] = useState("");

  // 전송 버튼을 눌렀을 때 실행되는 함수
  const handleSend = () => {
    if (inputText.trim() === "") return; // 빈칸이면 무시

    // 내 메시지를 화면에 추가합니다.
    const newMessage = { id: Date.now(), text: inputText, sender: "user" };
    setMessages([...messages, newMessage]);
    setInputText(""); // 입력창 비우기

    // (나중에 여기에 백엔드/OpenAI 연동 코드가 들어갑니다!)
    setTimeout(() => {
      const aiResponse = { id: Date.now(), text: "아직 백엔드 연결 전이라 앵무새 모드입니다: " + inputText, sender: "ai" };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' }}>
      {/* 채팅창 헤더 */}
      <div style={{ padding: '15px', backgroundColor: '#ff6b6b', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
        👨‍🍳 냉파 AI 셰프
      </div>

      {/* 말풍선들이 보이는 대화 영역 */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#f8f9fa' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.sender === 'user' ? '#ff6b6b' : '#e9ecef',
            color: msg.sender === 'user' ? 'white' : 'black',
            padding: '10px 15px', borderRadius: '15px', maxWidth: '80%'
          }}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* 입력창 영역 */}
      <div style={{ padding: '15px', borderTop: '1px solid #dee2e6', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()} // 엔터키 지원
          placeholder="재료나 상황을 입력하세요..."
          style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
        />
        <button 
          onClick={handleSend}
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;