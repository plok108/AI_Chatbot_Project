// src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { API_BASE, authHeaders } from '../api';

function HistoryPage({ historyItems = [], userId = null }) {

  const [records, setRecords] = useState(() =>
    historyItems.map((item, idx) => ({
      ...item,
      id: item.id || `history-${idx}-${Date.now()}`,
    }))
  );
  const [isLoading, setIsLoading] = useState(!!userId);

  useEffect(() => {
    // 게스트: 로컬 historyItems만 표시
    if (!userId) {
      setRecords(
        historyItems.map((item, idx) => ({
          ...item,
          id: item.id || `history-${idx}-${Date.now()}`,
        }))
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`${API_BASE}/api/chat/history`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const dbItems = (data.history || []).map(item => ({
          id: `api-${item.conversation_id}`,
          category: "냉장고 파먹기",
          title: item.user_message?.length > 20
            ? item.user_message.slice(0, 20) + "..."
            : item.user_message || "AI 추천 요리",
          meta: item.created_at || "",
          tags: "#냉장고파먹기 #AI추천",
          messages: [
            { id: 1, text: item.user_message || "", sender: 'user' },
            { id: 2, text: item.ai_response || "", sender: 'ai' },
          ],
        }));

        // 현재 세션 로컬 기록 중 DB에 없는 것만 위에 추가
        const dbIds = new Set(dbItems.map(d => d.id));
        const localOnly = historyItems
          .map((item, idx) => ({ ...item, id: item.id || `history-${idx}-${Date.now()}` }))
          .filter(local => !dbIds.has(local.id));

        setRecords([...localOnly, ...dbItems]);
      })
      .catch(() => {
        // API 실패 시 로컬 기록만 표시
        setRecords(
          historyItems.map((item, idx) => ({
            ...item,
            id: item.id || `history-${idx}-${Date.now()}`,
          }))
        );
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  // 선택된 기록을 관리하는 상태 (null이면 목록, 값이 있으면 상세 보기)
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [page, setPage] = useState(1);
  const itemsPerPage = 9; 
  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;

  const deleteRecord = (id) => {
    const updatedRecords = records.filter(item => item.id !== id);
    setRecords(updatedRecords);
    
    const newTotalPages = Math.ceil(updatedRecords.length / itemsPerPage) || 1;
    if (page > newTotalPages) {
      setPage(newTotalPages);
    }
  };

  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, page + 2);

  if (page <= 3) {
    endPage = Math.min(5, totalPages);
  } else if (page >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const startIndex = (page - 1) * itemsPerPage;
  const currentItems = records.slice(startIndex, startIndex + itemsPerPage);

  const btnStyle = (isActive, isDisabled) => ({
    width: '36px', height: '36px', borderRadius: '8px',
    border: isActive ? 'none' : '1px solid var(--border-input)',
    backgroundColor: isActive ? '#ff6b6b' : 'var(--bg-card)',
    color: isActive ? '#fff' : isDisabled ? 'var(--text-faint)' : 'var(--text-secondary)',
    fontWeight: isActive ? 'bold' : 'normal',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', fontSize: '14px', padding: 0,
  });

  // 상세 보기 모드 렌더링
  if (selectedRecord) {
    const chatHistory = selectedRecord.messages || [];

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* 상단 헤더 영역 (좌측 콤팩트 버튼, 우측 한 줄 타이틀) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '24px', 
          flexShrink: 0 
        }}>
          {/* 좌측: 텍스트 길이에 딱 맞춘 콤팩트 뒤로가기 버튼 */}
          <button 
            onClick={() => setSelectedRecord(null)}
            style={{ 
              flex: 'none', // 절대 늘어나지 않음
              width: 'auto', // 텍스트 크기에 딱 맞춤
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '10px',
              padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
          >
            <span>←</span> 목록으로
          </button>

          {/* 우측: 길어도 무조건 한 줄로 나오는 타이틀 */}
          <h2 style={{
            fontSize: '20px', color: 'var(--text-heading)', margin: 0, fontWeight: 'bold',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textAlign: 'right', flex: 1,
          }}>
            {selectedRecord.title} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}>의 대화 기록</span>
          </h2>
        </div>

        {/* 대화 내역 표시 영역 */}
        <div style={{
          flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
          padding: '30px', overflowY: 'auto', boxShadow: '0 4px 20px var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
          {chatHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '50px 0' }}>대화 기록이 없습니다.</div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%', padding: '14px 18px',
                  borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  backgroundColor: msg.sender === 'user' ? '#ff6b6b' : 'var(--bg-ai-bubble)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '15px', lineHeight: '1.6', boxShadow: '0 2px 5px var(--shadow-sm)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px', textAlign: 'left' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: 'var(--text-heading)', margin: 0, fontWeight: 'bold' }}>
            🕒 냉털이가 추천해준 기록
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0 0 0' }}>
            지금까지 냉파 AI가 추천해준 메뉴들이에요. 다시 보고 싶은 레시피를 클릭해 보세요!
          </p>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          총 <b style={{ color: '#ff6b6b' }}>{records.length}</b>개의 기록
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {currentItems.map((item) => (
          <div key={item.id} 
            onClick={() => setSelectedRecord(item)} 
            style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
              padding: '20px', boxShadow: '0 4px 15px var(--shadow-sm)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px var(--shadow-sm)';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 'bold', backgroundColor: '#fff0f0', padding: '4px 8px', borderRadius: '8px' }}>
                  {item.category}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.meta}</span>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-heading)' }}>{item.title}</h4>
              <div style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '12px' }}>{item.tags}</div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteRecord(item.id);
              }}
              style={{
                backgroundColor: 'transparent', color: 'var(--text-faint)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '6px 0', fontSize: '12px', fontWeight: '500',
                cursor: 'pointer', width: '100%', marginTop: '8px', transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#ff6b6b';
                e.currentTarget.style.borderColor = '#ff6b6b';
                e.currentTarget.style.backgroundColor = '#fff4f4';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#bbb';
                e.currentTarget.style.borderColor = '#eee';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              기록 삭제
            </button>
          </div>
        ))}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)', fontSize: '15px' }}>
          기록을 불러오는 중입니다...
        </div>
      )}

      {!isLoading && records.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-faint)', fontSize: '15px' }}>
          아직 추천받은 기록이 없습니다. 🏠 홈에서 AI 셰프에게 메뉴를 추천받아 보세요!
        </div>
      )}

      {records.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} style={btnStyle(false, page === 1)}>&lt;</button>
          {pageNumbers.map((pageNum) => (
            <button key={pageNum} onClick={() => setPage(pageNum)} style={btnStyle(page === pageNum, false)}>{pageNum}</button>
          ))}
          <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} style={btnStyle(false, page === totalPages)}>&gt;</button>
        </div>
      )}

    </div>
  );
}

export default HistoryPage;