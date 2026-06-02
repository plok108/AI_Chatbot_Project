// src/App.jsx
import { useState, useEffect } from "react";
import { API_BASE, authHeaders, clearToken } from "./api";
import "./App.css";
import Sidebar from "./components/Sidebar";
import ChatPage from "./components/ChatPage";
import HistoryPage from "./pages/HistoryPage";
import FridgePage from "./pages/FridgePage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";

function App() {
  const [currentPage, setCurrentPage] = useState("intro");
  const [isGuest, setIsGuest] = useState(false);
  const [chatKey, setChatKey] = useState(Date.now());
  const [historyItems, setHistoryItems] = useState([]);
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const [dislikedFoods, setDislikedFoods] = useState([]);
  const [theme, setTheme] = useState('light');

  // 로그인 시 DB에서 기피음식 불러오기 (user_id는 토큰에서 추출)
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/preferences/disliked`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setDislikedFoods(data.foods || []))
      .catch(() => {});
  }, [userId]);

  // 로그인 — 게스트 세션이었을 때만 로컬 기록 초기화
  const handleLogin = (userName, id = null, email = "") => {
    setNickname(userName);
    setUserId(id);
    setUserEmail(email);
    setIsGuest(false);
    setDislikedFoods([]);   // useEffect가 userId 변경을 감지해 DB에서 불러옴
    if (isGuest) {
      // 게스트 세션 데이터만 초기화, 로그인 계정 DB 기록은 HistoryPage가 불러옴
      setHistoryItems([]);
      setChatMessages([]);
    }
    setChatKey(Date.now());
    setCurrentPage("home");
  };

  const handleGuestLogin = () => {
    setNickname("게스트");
    setUserId(null);
    setUserEmail("");
    setIsGuest(true);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    clearToken();
    setNickname("");
    setUserId(null);
    setUserEmail("");
    setIsGuest(false);
    setDislikedFoods([]);
    setChatMessages([]);
    setHistoryItems([]);
    setChatKey(Date.now());
    setCurrentPage("intro");
  };

  // 게스트가 설정에서 로그인/회원가입 버튼을 눌렀을 때
  const handleGoToLogin = () => {
    setCurrentPage("intro");
  };

  const startNewConversation = () => {
    if (chatMessages.length > 0) {
      const firstUserMsg = chatMessages.find(m => m.sender === 'user')?.text || "";
      const truncatedTitle = firstUserMsg.length > 15 ? firstUserMsg.slice(0, 15) + "..." : firstUserMsg;

      const newRecord = {
        id: `history-${Date.now()}`,
        category: "냉장고 파먹기",
        title: truncatedTitle || "AI 추천 요리",
        meta: "추천 완료",
        tags: "#기록됨 #자취요리",
        messages: chatMessages,
      };
      setHistoryItems([newRecord, ...historyItems]);
    }

    setChatMessages([]);
    setChatKey(Date.now());
    setCurrentPage("new");
  };

  if (currentPage === "intro") {
    return <LoginPage onLogin={handleLogin} onGuest={handleGuestLogin} />;
  }

  return (
    <div data-theme={theme} style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--bg-page)', overflow: 'hidden' }}>

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        startNewConversation={startNewConversation}
        userNickname={nickname}
      />

      <main style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>

        {(currentPage === "home" || currentPage === "new") && (
          <ChatPage
            key={chatKey}
            onFirstMessage={() => setCurrentPage("home")}
            messages={chatMessages}
            setMessages={setChatMessages}
            userId={userId}
            dislikedFoods={dislikedFoods}
          />
        )}

        {currentPage === "history" && (
          <HistoryPage historyItems={historyItems} userId={userId} />
        )}
        {currentPage === "fridge" && <FridgePage userId={userId} />}
        {currentPage === "settings" && (
          <SettingsPage
            userEmail={userEmail}
            userNickname={nickname}
            userId={userId}
            isGuest={isGuest}
            onLogout={handleLogout}
            onGoToLogin={handleGoToLogin}
            dislikedFoods={dislikedFoods}
            setDislikedFoods={setDislikedFoods}
            theme={theme}
            setTheme={setTheme}
          />
        )}

      </main>
    </div>
  );
}

export default App;
