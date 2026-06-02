// src/pages/FridgePage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { API_BASE, authHeaders } from '../api';

function FridgePage({ userId }) {
  const [ingredients, setIngredients] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/ingredients`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setIngredients(data.ingredients || []))
      .catch(() => {});
  }, [userId]);

  const addIngredient = async () => {
    if (!inputValue.trim()) return;

    if (userId) {
      try {
        const res = await fetch(`${API_BASE}/api/ingredients`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ name: inputValue.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setIngredients(prev => [data, ...prev]);
        }
      } catch {
        alert("재료 추가에 실패했습니다.");
        return;
      }
    } else {
      const newItem = {
        id: Date.now(),
        name: inputValue.trim(),
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, ''),
      };
      setIngredients(prev => [newItem, ...prev]);
    }

    setInputValue('');
    inputRef.current?.focus();
  };

  const deleteIngredient = async (id) => {
    if (userId) {
      try {
        await fetch(`${API_BASE}/api/ingredients/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      } catch {
        alert("재료 삭제에 실패했습니다.");
        return;
      }
    }
    setIngredients(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: 'var(--text-heading)', margin: 0, fontWeight: 'bold' }}>
            🥩 냉장고 재료 관리
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0 0 0' }}>
            냉장고에 어떤 재료가 있는지 알려주세요! 대화할 때 참고해서 최선의 선택지를 알려드릴게요!
          </p>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          총 <b style={{ color: '#ff6b6b' }}>{ingredients.length}</b>개의 재료
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '8px',
        marginBottom: '32px',
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
            flex: '1 1 0%', minWidth: '0', width: '100%', height: '44px', margin: '0',
            border: '1px solid var(--border-input)', outline: 'none', fontSize: '14px', color: 'var(--text-primary)',
            padding: '0 16px', borderRadius: '10px', backgroundColor: 'var(--bg-input)', boxSizing: 'border-box'
          }}
        />
        <button
          onClick={addIngredient}
          style={{
            flex: 'none', width: 'auto', height: '44px', margin: '0',
            backgroundColor: '#ff6b6b', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '0 24px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          재료 추가
        </button>
      </div>

      {ingredients.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)', fontSize: '15px' }}>
          아직 등록된 재료가 없어요. 냉장고에 있는 재료를 추가해 보세요!
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px'
      }}>
        {ingredients.map((item) => (
          <div key={item.id} style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
            padding: '20px', boxShadow: '0 2px 8px var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: '110px', transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 6px 15px var(--shadow-md)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-sm)';
          }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-heading)', marginBottom: '6px', lineHeight: '1.4', wordBreak: 'keep-all' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                등록: {item.date}
              </div>
            </div>

            <button
              onClick={() => deleteIngredient(item.id)}
              style={{
                backgroundColor: 'transparent', color: 'var(--text-faint)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '5px 0', fontSize: '11px', fontWeight: '500',
                cursor: 'pointer', width: '100%', marginTop: '12px', transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#ff6b6b';
                e.currentTarget.style.borderColor = '#ff6b6b';
                e.currentTarget.style.backgroundColor = '#fff4f4';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--text-faint)';
                e.currentTarget.style.borderColor = 'var(--border)';
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
