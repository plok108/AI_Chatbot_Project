// src/App.jsx
import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar"; // 사이드바 불러오기
import ChatPage from "./components/ChatPage"; // 새로 추가!

function App() {
  const [ingredients, setIngredients] = useState("");
  const [situation, setSituation] = useState("");
  const [mood, setMood] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [result, setResult] = useState("");
  const [savedId, setSavedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    setResult("");
    setSavedId(null);

    const ingredientList = ingredients
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredientList,
          situation,
          mood,
          user_message: userMessage,
        }),
      });

      const data = await response.json();
      setResult(data.recommendation);
      setSavedId(data.id);
    } catch (error) {
      setResult("백엔드 서버 연결에 실패했습니다. FastAPI 서버가 켜져 있는지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 전체 레이아웃을 flex로 설정하여 사이드바와 메인을 나눕니다.
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f6f3ee' }}>
      
      {/* 왼쪽 사이드바 영역 */}
      <Sidebar />

      {/* 오른쪽 메인 콘텐츠 영역 */}
      <main style={{ flex: 1, padding: '48px 20px', overflowY: 'auto' }}>
        <ChatPage />
      </main>
    </div>
  );
}

export default App;