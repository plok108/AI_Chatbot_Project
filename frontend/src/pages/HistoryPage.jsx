// src/pages/HistoryPage.jsx
import React, { useState } from 'react';

function HistoryPage({ historyItems = [] }) {
  
  // 더미 데이터로 이전 추천 기록을 생성합니다.
  const categories = ["냉장고 파먹기", "간단 요리", "건강식", "특별한 날"];
  const dummyItems = Array.from({ length: 15 }, (_, i) => ({
    id: `dummy-${i + 1}`,
    category: categories[i % 4],
    title: `맛있는 추천 요리 ${i + 1} (이름이 아주 긴 경우 테스트를 위한 텍스트입니다)`,
    meta: `${10 + (i % 3) * 5}분 | ${300 + (i % 5) * 50}kcal`,
    tags: i % 2 === 0 ? "#자취요리 #포만감" : "#초간단 #단백질",
    // 과거 대화 내용 모의 데이터
    messages: [
      { id: 1, text: "냉장고에 남은 재료로 뭐 해먹을지 추천해줘.", sender: 'user' },
      { id: 2, text: `네! 요청하신 재료를 바탕으로 '${categories[i % 4]}' 스타일의 레시피를 추천해 드립니다.\n\n[요리명: 맛있는 추천 요리 ${i + 1}]\n\n1. 재료를 손질합니다.\n2. 맛있게 조리합니다.\n3. 완성!`, sender: 'ai' }
    ]
  }));

  const [records, setRecords] = useState(() => {
    if (historyItems && historyItems.length > 0) {
      return historyItems.map((item, idx) => ({
        ...item,
        id: item.id || `history-${idx}-${Date.now()}` 
      }));
    }
    return dummyItems;
  });

  // 선택된 기록을 상세 보기 상태로 관리합니다.
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
    border: isActive ? 'none' : '1px solid #ddd',
    backgroundColor: isActive ? '#ff6b6b' : '#fff',
    color: isActive ? '#fff' : isDisabled ? '#ccc' : '#555',
    fontWeight: isActive ? 'bold' : 'normal',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', fontSize: '14px', padding: 0 
  });

  // 상세 보기 모드 렌더링
  if (selectedRecord) {
    const chatHistory = selectedRecord.messages || [];

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* 상세 보기 헤더 */}
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
              backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', 
              padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', color: '#555',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
          >
            <span>←</span> 목록으로
          </button>

          {/* 우측: 길어도 무조건 한 줄로 나오는 타이틀 */}
          <h2 style={{ 
            fontSize: '20px', color: '#333', margin: 0, fontWeight: 'bold',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', 
            textAlign: 'right', flex: 1 
          }}>
            {selectedRecord.title} <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}>의 대화 기록</span>
          </h2>
        </div>

        {/* 대화 내역 표시 영역 */}
        <div style={{ 
          flex: 1, backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '20px',
          padding: '30px', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
          {chatHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bbb', padding: '50px 0' }}>대화 기록이 없습니다.</div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' 
              }}>
                <div style={{ 
                  maxWidth: '85%', padding: '14px 18px',
                  borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  backgroundColor: msg.sender === 'user' ? '#ff6b6b' : '#f8f9fa',
                  color: msg.sender === 'user' ? '#fff' : '#222',
                  fontSize: '15px', lineHeight: '1.6', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
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

  // 목록 보기 모드 렌더링
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px', textAlign: 'left' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#333', margin: 0, fontWeight: 'bold' }}>
            🕒 냉털이가 추천해준 기록
          </h2>
          <p style={{ color: '#888', fontSize: '13px', margin: '8px 0 0 0' }}>
            지금까지 냉파 AI가 추천해준 메뉴들이에요. 다시 보고 싶은 레시피를 클릭해 보세요!
          </p>
        </div>
        <span style={{ fontSize: '13px', color: '#888' }}>
          총 <b style={{ color: '#ff6b6b' }}>{records.length}</b>개의 기록
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {currentItems.map((item) => (
          <div key={item.id} 
            onClick={() => setSelectedRecord(item)} 
            style={{
              backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px',
              padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 'bold', backgroundColor: '#fff0f0', padding: '4px 8px', borderRadius: '8px' }}>
                  {item.category}
                </span>
                <span style={{ fontSize: '12px', color: '#888' }}>{item.meta}</span>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#222' }}>{item.title}</h4>
              <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>{item.tags}</div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation(); 
                deleteRecord(item.id);
              }}
              style={{
                backgroundColor: 'transparent', color: '#bbb', border: '1px solid #eee',
                borderRadius: '8px', padding: '6px 0', fontSize: '12px', fontWeight: '500',
                cursor: 'pointer', width: '100%', marginTop: '8px', transition: 'all 0.2s'
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

      {records.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#bbb', fontSize: '15px' }}>
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