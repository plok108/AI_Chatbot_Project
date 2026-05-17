// src/pages/FridgePage.jsx
import React, { useState, useRef } from 'react';

function FridgePage() {
  const [ingredients, setIngredients] = useState([
    { id: 1, name: '달걀 한 판 (특란)', date: '2026.05.10' },
    { id: 2, name: '햇양파 3알', date: '2026.05.12' },
    { id: 3, name: '닭가슴살 200g 2팩', date: '2026.05.08' },
    { id: 4, name: '대파 한 단 (손질됨)', date: '2026.05.11' },
    { id: 5, name: '다진 마늘 한 통', date: '2026.05.13' },
    { id: 6, name: '차돌박이 300g (냉동)', date: '2026.05.13' },
    { id: 7, name: '고추장 반 단지', date: '2026.05.13' },
    { id: 8, name: '우유 1L (유통기한 임박)', date: '2026.05.13' },
    { id: 9, name: '파스타 면 (링귀네)', date: '2026.05.13' },
    { id: 10, name: '체다치즈 5장', date: '2026.05.13' },
  ]);

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const addIngredient = () => {
    if (!inputValue.trim()) return;
    const newIngredient = {
      id: Date.now(),
      name: inputValue,
      date: new Date().toLocaleDateString().replace(/\s/g, '').slice(0, -1),
    };
    setIngredients([...ingredients, newIngredient]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const deleteIngredient = (id) => {
    setIngredients(ingredients.filter(item => item.id !== id));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px' }}>
      
      {/* 상단 타이틀 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#333', margin: 0, fontWeight: 'bold' }}>
            🥩 냉장고 재료 관리
          </h2>
          <p style={{ color: '#888', fontSize: '13px', margin: '8px 0 0 0' }}>
            냉장고에 어떤 재료가 있는지 알려주세요! 대화할 때 참고해서 최선의 선택지를 알려드릴게요!
          </p>
        </div>
        <span style={{ fontSize: '13px', color: '#888' }}>
          총 <b style={{ color: '#ff6b6b' }}>{ingredients.length}</b>개의 재료
        </span>
      </div>

      {/* 재료 추가 입력창 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'nowrap',
        alignItems: 'center', 
        justifyContent: 'flex-start',
        gap: '8px', 
        marginBottom: '32px', // 아래 리스트와의 간격 확보
        width: '100%', 
        maxWidth: '660px'
      }}>
        <input 
          ref={inputRef}
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
          placeholder="어떤 재료가 있나요? 구체적일수록 좋아요! (예: 닭가슴살 200g 2팩, 고추장, 냉동 돈까스)"
          style={{
            flex: '1 1 0%',
            minWidth: '0',
            width: '100%',
            height: '44px',
            margin: '0',
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: '14px',
            color: '#333',
            padding: '0 16px',
            borderRadius: '10px',
            backgroundColor: '#fff',
            boxSizing: 'border-box'
          }}
        />
        <button 
          onClick={addIngredient}
          style={{
            flex: 'none',
            width: 'auto',
            height: '44px',
            margin: '0',
            backgroundColor: '#ff6b6b',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '0 24px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          재료 추가
        </button>
      </div>

      {/* 재료 리스트 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px' 
      }}>
        {ingredients.map((item) => (
          <div key={item.id} style={{
            backgroundColor: '#fff',
            border: '1px solid #eee',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '110px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
          }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#222', marginBottom: '6px', lineHeight: '1.4', wordBreak: 'keep-all' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '11px', color: '#bbb' }}>
                등록: {item.date}
              </div>
            </div>
            
            <button 
              onClick={() => deleteIngredient(item.id)}
              style={{
                backgroundColor: 'transparent',
                color: '#bbb',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '5px 0',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%',
                marginTop: '12px',
                transition: 'all 0.2s'
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
              삭제
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default FridgePage;