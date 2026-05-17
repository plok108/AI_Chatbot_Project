// src/App.jsx
import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar"; 
import ChatPage from "./components/ChatPage"; 
import HistoryPage from "./pages/HistoryPage"; 
import FridgePage from "./pages/FridgePage"; 
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";

function App() {
  // 처음 접속 시에는 'home'으로 시작
  const [currentPage, setCurrentPage] = useState("home");
  
  // ChatPage 리셋을 위한 고유 키
  const [chatKey, setChatKey] = useState(Date.now());
  
  // 로그인된 사용자 정보
  const [user, setUser] = useState(null);

  const [historyItems, setHistoryItems] = useState([]);

  // ChatPage의 메시지 상태를 상위 컴포넌트에서 관리합니다.
  const [chatMessages, setChatMessages] = useState([]);

  // --- 기존의 API 연동용 상태들 (유지) ---
  const [ingredients, setIngredients] = useState("");
  const [situation, setSituation] = useState("");
  const [mood, setMood] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [result, setResult] = useState("");
  const [savedId, setSavedId] = useState(null);
  const [loading, setLoading] = useState(false);

  // '새로운 대화' 시작 로직
  const startNewConversation = () => {
    // 대화 내역이 있으면 히스토리 항목으로 저장합니다.
    if (chatMessages.length > 0) {
      // 첫 번째 사용자 질문을 카드 제목에 사용합니다.
      const firstUserMsg = chatMessages.find(m => m.sender === 'user')?.text || "";
      const truncatedTitle = firstUserMsg.length > 15 ? firstUserMsg.slice(0, 15) + "..." : firstUserMsg;

      const newRecord = {
        id: `history-${Date.now()}`,
        category: "냉장고 파먹기",
        title: truncatedTitle || "AI 추천 요리",
        meta: "추천 완료",
        tags: "#기록됨 #자취요리",
        messages: chatMessages // 대화 메시지 전체를 기록에 포함합니다.
      };
      setHistoryItems([newRecord, ...historyItems]);
    }

    // 상태 초기화
    setIngredients("");
    setSituation("");
    setMood("");
    setUserMessage("");
    setResult("");
    setSavedId(null);
    
    // 대화 상태를 초기화합니다.
    setChatMessages([]);

    // 새로운 대화 클릭 시 상태를 'new'로 변경 (사이드바 하이라이트용)
    setChatKey(Date.now()); 
    setCurrentPage("new"); 
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("login");
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#f6f3ee', overflow: 'hidden' }}>
      
      {/* 사이드바 컴포넌트에 userNickname 프롭으로 nickname 상태를 넘겨줍니다 */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        startNewConversation={startNewConversation} 
        userNickname={user?.nickname || '게스트'} 
        user={user}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
        
        {(currentPage === 'login' || (currentPage === 'settings' && !user)) ? (
          <LoginPage
            onLogin={handleLogin}
            onContinueAsGuest={() => setCurrentPage('home')}
          />
        ) : (
          <>
            {/* 'home' 또는 'new' 상태일 때 ChatPage를 보여줌 */}
            {(currentPage === "home" || currentPage === "new") && (
              <ChatPage 
                key={chatKey} 
                // ChatPage에서 첫 메시지 전송 시 홈으로 전환합니다.
                onFirstMessage={() => setCurrentPage("home")} 
                // ChatPage에 메시지 상태와 상태 업데이트 함수를 전달합니다.
                messages={chatMessages}
                setMessages={setChatMessages}
              />
            )}

            {currentPage === "history" && <HistoryPage historyItems={historyItems} />}
            {currentPage === "fridge" && <FridgePage />}
            {currentPage === "settings" && <SettingsPage user={user} onLogout={handleLogout} onUpdateUser={(updatedUser) => setUser(updatedUser)} onDeleteUser={() => { setUser(null); setCurrentPage('login'); }} />}
          </>
        )}

      </main>
    </div>
  );
}

export default App;