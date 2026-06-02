// src/components/QuickPrompts.jsx
import React from 'react';

function QuickPrompts({ onSelect }) {
  const promptCards = [
    { title: '오늘 뭐 먹지?', desc: '상황에 맞는 메뉴 추천', icon: '🍽️', prompt: '오늘 뭐 먹을지 추천해줘!' },
    { title: '냉장고 파먹기', desc: '남은 재료로 요리하기', icon: '🧊', prompt: '냉장고에 있는 재료로 만들 수 있는 요리 추천해줘!' },
    { title: '다이어트 식단', desc: '건강하고 가벼운 한 끼', icon: '🥗', prompt: '건강하고 가벼운 다이어트 식단 추천해줘!' },
    { title: '초간단 10분 컷', desc: '바쁠 때 후딱 만드는 요리', icon: '⚡', prompt: '10분 안에 만들 수 있는 초간단 요리 추천해줘!' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '840px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '16px', marginLeft: '4px', textAlign: 'left' }}>
         빠른 메뉴
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px'
      }}>
        {promptCards.map((card, idx) => (
          <div key={idx}
          onClick={() => onSelect && onSelect(card.prompt)}
          style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background-color 0.2s',
            minHeight: '110px',
            justifyContent: 'space-between',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-input)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '22px' }}>{card.icon}</div>
              <div style={{ color: '#ccc', fontSize: '16px', fontWeight: 'bold' }}>↗</div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px', wordBreak: 'keep-all' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'keep-all', lineHeight: '1.3' }}>
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