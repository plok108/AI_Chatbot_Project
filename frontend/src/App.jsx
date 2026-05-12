import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar"; // 사이드바 불러오기

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
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <section className="hero">
            <p className="badge">AI Food Assistant</p>
            <h1>스마트 식사 추천 챗봇</h1>
            <p className="subtitle">냉장고 재료와 현재 상황을 알려주시면 최적의 식사를 제안해드려요.</p>
          </section>

          <section className="card">
            <label>가지고 있는 재료</label>
            <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="예: 계란, 김치, 밥" />

            <label>현재 상황</label>
            <input value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="예: 다이어트 중, 늦은 밤" />

            <label>현재 기분 / 원하는 방식</label>
            <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="예: 요리하기 싫음, 배달 선호" />

            <label>요청 내용</label>
            <textarea value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="구체적으로 필요한 내용을 적어주세요." />

            <button onClick={handleRecommend} disabled={loading}>
              {loading ? "추천 받는 중..." : "음식 추천받기"}
            </button>
          </section>

          {result && (
            <section className="result-card">
              <div className="result-header">
                <h2>추천 결과</h2>
                {savedId && <span>DB 저장 ID: {savedId}</span>}
              </div>
              <pre>{result}</pre>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;