// src/components/RecentRecommendations.jsx
import React from 'react';

function RecentRecommendations() {
  // 해시태그를 2개로 줄이고, 메타 정보도 한 줄에 쏙 들어가게 다듬었습니다.
  const recentItems = [
    {
      category: "요리 추천",
      title: "참치김치 덮밥",
      meta: "15분 | 520kcal | 쉬움",
      tags: "#한그릇요리 #초간단"
    },
    {
      category: "초간단 요리",
      title: "전자레인지 계란찜",
      meta: "5분 | 150kcal | 쉬움",
      tags: "#전자레인지 #다이어트"
    },
    {
      category: "사먹기 추천",
      title: "닭가슴살 샐러드",
      meta: "배달 25분 | 320kcal",
      tags: "#건강한한끼 #배달"
    },
    {
      category: "간식 추천",
      title: "초코 브라우니",
      meta: "조리 30분 | 450kcal",
      tags: "#당충전 #홈베이킹"
    }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '840px', marginBottom: '0px' }}>
      
      {/* 타이틀 및 더보기 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
        <h3 style={{ fontSize: '18px', color: '#333', margin: 0, textAlign: 'left', fontWeight: 'bold' }}>
          최근 추천
        </h3>
        <span style={{ fontSize: '13px', color: '#888', cursor: 'pointer', fontWeight: '500' }}>
          더보기 &gt;
        </span>
      </div>
      
      {/* 🌟 1x4 카드 그리드 영역 (4개가 한 줄에!) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', // 4칸으로 나눕니다
        gap: '12px' // 간격을 살짝 좁혀서 오밀조밀하게 배치
      }}>
        {recentItems.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { 
            e.currentTarget.style.borderColor = '#ff6b6b'; 
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(255,107,107,0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => { 
            e.currentTarget.style.borderColor = '#e0e0e0'; 
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            {/* 1. 상단: 이미지 영역 (높이를 140px -> 100px로 대폭 줄였습니다) */}
            <div style={{ 
              width: '100%', 
              height: '100px', 
              backgroundColor: '#f5f5f5', 
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#ddd'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              {/* 왼쪽 상단 카테고리 뱃지 (크기 간소화) */}
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '3px 6px',
                borderRadius: '4px'
              }}>
                {item.category}
              </div>

              {/* 오른쪽 상단 하트 아이콘 (크기 간소화) */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ccc',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                e.currentTarget.style.color = '#ff6b6b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#ccc';
              }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"/>
                </svg>
              </div>
            </div>

            {/* 2. 하단: 텍스트 정보 영역 (패딩과 폰트 사이즈 최적화) */}
            <div style={{ padding: '12px', textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.title}
              </div>
              
              <div style={{ fontSize: '11px', color: '#777', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.meta}
              </div>
              
              <div style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.tags}
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}

export default RecentRecommendations;