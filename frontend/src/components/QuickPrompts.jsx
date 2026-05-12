// src/components/QuickPrompts.jsx
import React from 'react';

function QuickPrompts() {
  const promptCards = [
    { title: '오늘 뭐 먹지?', desc: '상황에 맞는 메뉴 추천', icon: '🍽️' },
    { title: '냉장고 파먹기', desc: '남은 재료로 요리하기', icon: '🧊' },
    { title: '다이어트 식단', desc: '건강하고 가벼운 한 끼', icon: '🥗' },
    { title: '간편식 / 배달', desc: '빠르고 편한 식사', icon: '🛵' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '840px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '16px', marginLeft: '4px', textAlign: 'left' }}>
         빠른 메뉴
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', /* 🌟 여기서 1x4 배열로 만듭니다! */
        gap: '12px'
      }}>
        {promptCards.map((card, idx) => (
          <div key={idx} style={{
            backgroundColor: '#f9f9f9',
            border: '1px solid #f0f0f0',
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background-color 0.2s',
            minHeight: '110px',
            justifyContent: 'space-between' /* 위아래 간격을 균일하게 벌려줍니다 */
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f1f1'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '22px' }}>{card.icon}</div>
              <div style={{ color: '#ccc', fontSize: '16px', fontWeight: 'bold' }}>↗</div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '4px', wordBreak: 'keep-all' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '12px', color: '#888', wordBreak: 'keep-all', lineHeight: '1.3' }}>
                {card.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickPrompts;